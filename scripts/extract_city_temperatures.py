"""Rebuild city temperature CSV from public World Bank NetCDF ranges.
Requires Python, NumPy and SciPy for preprocessing only; the website uses local CSV.
Run: python3 scripts/extract_city_temperatures.py
"""
import urllib.request, ssl, struct, io, json, csv, datetime, concurrent.futures, time
from pathlib import Path
from scipy.io import netcdf_file
CTX=ssl.create_default_context(cafile='/etc/ssl/cert.pem')
BASE='https://wbg-cckp.s3.amazonaws.com/data/cmip6-x0.25/tas/'
OUT=Path(__file__).resolve().parents[1]
CACHE=Path('/tmp/city-climate-ranges');CACHE.mkdir(exist_ok=True)
CITIES={'Shanghai':(31.2304,121.4737),'Los Angeles':(34.0522,-118.2437),'Reykjavík':(64.1466,-21.9426)}
# Read only the NetCDF header; the global rasters stay on the source server.
class Header(netcdf_file):
 def _read_var_array(self):
  self.fp.read(4); self.__dict__['entries']=[self._read_var() for _ in range(self._unpack_int())]
def read(url,start,length):
 key=CACHE/(url.split('/')[-1]+f'.{start}.{length}')
 if key.exists():return key.read_bytes()
 for attempt in range(3):
  try:
   req=urllib.request.Request(url,headers={'Range':f'bytes={start}-{start+length-1}'})
   with urllib.request.urlopen(req,context=CTX,timeout=30) as r:
    if r.status!=206 or r.headers.get('Content-Range','').split('/')[0]!=f'bytes {start}-{start+length-1}':raise ValueError(f'Unexpected range: {r.status} {r.headers.get("Content-Range")}')
    data=r.read()
   if len(data)!=length:raise ValueError('Incomplete range')
   key.write_bytes(data);return data
  except Exception:
   if attempt==2:raise
   time.sleep(1)
rows=[];metadata={'provider':'World Bank Climate Change Knowledge Portal','collection':'cmip6-x0.25','product':'timeseries-tas-annual-mean','ensemble_statistic':'median','retrieved':datetime.datetime.now(datetime.UTC).date().isoformat(),'units':'degC','extraction':'Nearest coordinate-grid cell, no interpolation, un-smoothed annual series','scenarios':{}}
for scenario,label in [('ssp126','SSP1-2.6'),('ssp245','SSP2-4.5'),('ssp585','SSP5-8.5')]:
 url=BASE+f'ensemble-all-{scenario}/timeseries-tas-annual-mean_cmip6-x0.25_ensemble-all-{scenario}_timeseries_median_2015-2100.nc'
 head=read(url,0,65536);f=Header(io.BytesIO(head),mmap=False)
 entries={v[0]:v for v in f.entries};v=entries['timeseries-tas-annual-mean'];tv=entries['time']
 assert f._recs==86 and v[1]==('time','lat','lon') and v[3]['units']==b'degC'
 assert f._attributes['wb_scenario_label'].decode()==scenario
 assert f._attributes['wb_percentile_label']==b'median' and f._attributes['wb_aggregation_label']==b'annual'
 coords={}
 for name in ['lat','lon']:
  ent=entries[name];coords[name]=struct.unpack('>'+str(ent[2][0])+'f',head[ent[7]:ent[7]+ent[8]])
 stride=sum(e[8] for e in entries.values() if e[2] and e[2][0] is None)
 locations={}
 for city,(lat,lon) in CITIES.items():
  i=min(range(len(coords['lat'])),key=lambda i:abs(coords['lat'][i]-lat));j=min(range(len(coords['lon'])),key=lambda j:abs(coords['lon'][j]-lon))
  locations[city]={'requested_latitude':lat,'requested_longitude':lon,'grid_latitude':coords['lat'][i],'grid_longitude':coords['lon'][j],'i':i,'j':j}
 jobs=[]
 for yr in range(86):
  jobs.append(('time',yr,tv[7]+yr*stride,8))
  for city,d in locations.items():jobs.append((city,yr,v[7]+yr*stride+(d['i']*len(coords['lon'])+d['j'])*4,4))
 def fetch(job):
  city,k,offset,n=job;return city,k,struct.unpack('>d' if city=='time' else '>f',read(url,offset,n))[0]
 results={}
 with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
  for city,k,value in pool.map(fetch,jobs):results[city,k]=value
 for k in range(86):
  year=(datetime.datetime(1850,1,1)+datetime.timedelta(days=results['time',k])).year
  assert year==2015+k,(year,k)
  for city,d in locations.items():
   value=results[city,k];assert -60<value<60,(city,year,value)
   rows.append({'location':city,'year':year,'scenario':label,'temperature_c':f'{value:.2f}','grid_latitude':d['grid_latitude'],'grid_longitude':d['grid_longitude']})
 metadata['scenarios'][label]={'url':url,'units':v[3]['units'].decode(),'models':v[3]['models_in_ensemble'].decode().split(','),'locations':locations}
 print(scenario,'complete',len(rows),'rows',flush=True)
with (OUT/'city_temperatures.csv').open('w',newline='') as f:
 writer=csv.DictWriter(f,fieldnames=list(rows[0]),lineterminator='\n');writer.writeheader();writer.writerows(rows)
(OUT/'city_temperature_sources.json').write_text(json.dumps(metadata,indent=2,ensure_ascii=False)+'\n')
print('DONE',len(rows),flush=True)

# Data sources

## City PM2.5 — city_pm25.csv

Provider: IQAir, 2023 World Air Quality Report and its historical city tables. Metric: reported annual mean PM2.5 concentration in µg/m³. Period: calendar year 2023 for all three cities. Accessed November 18, 2026.

| City | Country | 2023 PM2.5 (µg/m³) | Verification |
|---|---|---:|---|
| Shanghai | China | 28.7 | Report: China Mainland table, 2023 column |
| Los Angeles | USA | 9.5 | Report: United States table, 2023 column |
| Reykjavík | Iceland | 3.9 | Report: 2023 capital city ranking (listed as Reykjavik) |

- Report: https://www.iqair.com/dl/2023_World_Air_Quality_Report.pdf
- Shanghai historical table: https://www.iqair.com/world-most-polluted-cities?cities=R6kPWmwE4Nts3vq3k
- Los Angeles historical table: https://www.iqair.com/world-most-polluted-cities?cities=xwJyTC4tyag4svdTe
- Reykjavík historical table: https://www.iqair.com/world-most-polluted-cities?page=183 (row location/pagination may change; use the report’s capital-city ranking as a stable reference).

The three facts were transcribed from the 2023 columns and cross-checked against the report. No values were interpolated, converted from AQI, or inferred from country averages. The report uses ground monitoring, including regulatory monitors and low-cost sensors, and a minimum 60% annual hourly-data availability criterion. City coverage and site composition differ. These are reported city aggregates, not identical monitoring experiments, personal exposure estimates, current conditions, or established global ranks. Annual means hide short-term peaks and neighborhood differences. PM2.5 does not directly measure greenhouse-gas emissions or predict local temperature.

## Existing global scenarios — all_scenarios.csv

This file is preserved byte-for-byte from the original repository. It contains 258 rows: 86 annual values per scenario for 2015–2100, labeled SSP1-2.6, SSP2-4.5, SSP5-8.5. The original provider, model/ensemble, aggregation method, and temperature baseline were not supplied. The page explicitly discloses this gap. Do not relabel these values as city forecasts or interpret them as warming above a historical baseline without verifying the original source. The sourced city-grid series below are stored separately and are not generated from this global file.

## City temperature projections — city_temperatures.csv

Provider: World Bank Climate Change Knowledge Portal (CCKP), CMIP6 0.25-degree collection. Product: unsmoothed `timeseries-tas-annual-mean`, multi-model ensemble median, SSP1-2.6 / SSP2-4.5 / SSP5-8.5, calendar years 2015–2100. Units are **degrees Celsius**, verified from each NetCDF variable’s `units=degC` metadata; no offset or Kelvin conversion was applied. Retrieved November 18, 2026.

- Official collection documentation: https://worldbank.github.io/climateknowledgeportal/README.html
- Dataset catalog: https://datacatalog.worldbank.org/infrastructure-data/search/dataset/0042297/climate-change-knowledge-portal-projected-climate-data-cmip6-0-25-degree
- Terms: https://www.worldbank.org/en/about/legal/terms-of-use-for-datasets
- Exact source-file URLs, model lists, and grid coordinates: `city_temperature_sources.json`.

The World Bank: Climate Change Knowledge Portal CMIP6 0.25-degree data; source CMIP6 modeling groups, WCRP and ESGF. We acknowledge the World Climate Research Programme’s CMIP6 coordination, participating modeling groups, and Earth System Grid Federation archive. Original files identify a Creative Commons Attribution-ShareAlike 4.0 license; retain source attribution and applicable share-alike terms when redistributing this derived subset.

| Location | Requested latitude, longitude | Selected grid latitude, longitude |
|---|---|---|
| Shanghai | 31.2304, 121.4737 | 31.25, 121.50 |
| Los Angeles | 34.0522, -118.2437 | 34.00, -118.25 |
| Reykjavík | 64.1466, -21.9426 | 64.25, -22.00 |

Method: choose the nearest latitude and longitude coordinates in each source NetCDF, then copy the annual value for each city, scenario and year. Verify the file’s scenario, annual aggregation, median statistic, degrees-Celsius units, and all 86 time-coordinate years. Store 774 records (3 × 3 × 86) in a small local CSV. The source product is already annual; no averaging across months or dates was needed. Values are rounded to the source’s two-decimal precision. `scripts/extract_city_temperatures.py` reproduces extraction with HTTP byte ranges and SciPy’s NetCDF header reader, without downloading entire global rasters. NumPy/SciPy are preprocessing tools only; no browser dependencies were added.

These are projections for a climate-grid cell near each location, not city-boundary averages, neighborhood forecasts, observations or urban heat-island estimates. The ensemble includes 28 models for SSP1-2.6 and SSP2-4.5 and 29 for SSP5-8.5; cross-scenario membership differs. Median lines do not display the source’s model spread or imply certainty. The original Global Average series remains a separate, unchanged project dataset with its previously undocumented provenance; it is not used to generate city data. PM2.5 measurements are separate and have no role in the temperature extraction.

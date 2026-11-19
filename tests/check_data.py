"""Run with python3 tests/check_data.py; no extra packages required."""
import csv
from pathlib import Path

root = Path(__file__).resolve().parents[1]
with (root / 'city_pm25.csv').open() as source:
    cities = list(csv.DictReader(source))
expected = {'Shanghai': 28.7, 'Los Angeles': 9.5, 'Reykjavík': 3.9}
assert len(cities) == 3
assert {row['city']: float(row['pm25_ug_m3']) for row in cities} == expected
assert all(row['year'] == '2023' and row['source_url'].startswith('https://www.iqair.com/') for row in cities)
with (root / 'all_scenarios.csv').open() as source:
    global_rows = list(csv.DictReader(source))
assert len(global_rows) == 258
for scenario in ['SSP1-2.6', 'SSP2-4.5', 'SSP5-8.5']:
    years = [int(row['year']) for row in global_rows if row['scenario'] == scenario]
    assert sorted(years) == list(range(2015, 2101))
assert len({(row['scenario'], row['year']) for row in global_rows}) == 258
print('PASS: cited city values/year/source and complete global scenario years.')

# The prototype must never label global temperatures as city projections.
import re
from html.parser import HTMLParser

class LocationOptions(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_location = False
        self.options = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'select':
            self.in_location = attrs.get('id') == 'temperature-location'
        if tag == 'option' and self.in_location:
            self.options.append(attrs)
    def handle_endtag(self, tag):
        if tag == 'select':
            self.in_location = False

html = (root / 'index.html').read_text()
parser = LocationOptions()
parser.feed(html)
assert [option['value'] for option in parser.options] == ['global', 'shanghai', 'los-angeles', 'reykjavik']
assert 'selected' in parser.options[0] and 'disabled' not in parser.options[0]
assert all('disabled' in option for option in parser.options[1:])
for heading in ['progress-heading', 'challenges-heading']:
    paragraph = re.search(r'id="' + heading + r'"[^>]*>.*?</h3>\s*<p>(.*?)</p>', html, re.S).group(1)
    assert len(re.findall(r'[.!?](?:\s|$)', paragraph)) >= 4
print('PASS: honest location options and both four-sentence prototype answers.')

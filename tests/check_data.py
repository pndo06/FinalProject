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

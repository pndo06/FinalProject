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

This file is preserved byte-for-byte from the original repository. It contains 258 rows: 86 annual values per scenario for 2015–2100, labeled SSP1-2.6, SSP2-4.5, SSP5-8.5. The original provider, model/ensemble, aggregation method, and temperature baseline were not supplied. The page explicitly discloses this gap. Do not relabel these values as city forecasts or interpret them as warming above a historical baseline without verifying the original source. No city temperature projections were created.

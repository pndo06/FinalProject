import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const container = document.querySelector('#city-chart');
const selector = d3.select('#city-select');
const expectedCities = ['Shanghai', 'Los Angeles', 'Reykjavík'];

try {
  const cities = await d3.csv('city_pm25.csv', row => ({
    ...row,
    year: +row.year,
    pm25: row.pm25_ug_m3?.trim() ? +row.pm25_ug_m3 : NaN,
  }));
  if (cities.length !== 3 || new Set(cities.map(d => d.city)).size !== 3 ||
      cities.some(d => !expectedCities.includes(d.city) || d.year !== 2023 || !Number.isFinite(d.pm25) || d.pm25 < 0)) {
    throw new Error('Invalid city data');
  }
  const svg = d3.select(container).append('svg').attr('role', 'img')
    .attr('aria-label', `2023 annual PM2.5 in micrograms per cubic meter: ${cities.map(d => `${d.city} ${d.pm25.toFixed(1)}`).join(', ')}. Highlight a city using the selector.`);
  const y = d3.scaleBand().domain(cities.map(d => d.city)).range([20, 190]).padding(0.4);
  let selected = cities[0].city;

  function render() {
    const width = container.clientWidth || 720;
    const x = d3.scaleLinear().domain([0, d3.max(cities, d => d.pm25)]).nice().range([110, width - 45]);
    svg.attr('viewBox', `0 0 ${width} 250`);
    svg.selectAll('g.axis').data([null]).join('g').attr('class', 'axis').attr('transform', 'translate(0,195)')
      .call(d3.axisBottom(x).ticks(width < 500 ? 3 : 6));
    svg.selectAll('text.axis-label').data([null]).join('text').attr('class', 'axis-label')
      .attr('x', (110 + width - 45) / 2).attr('y', 240).attr('text-anchor', 'middle')
      .text('Annual PM2.5 (µg/m³)');
    svg.selectAll('rect.city-bar').data(cities, d => d.city).join('rect').attr('class', 'city-bar')
      .classed('selected', d => d.city === selected).attr('x', x(0)).attr('y', d => y(d.city))
      .attr('width', d => x(d.pm25) - x(0)).attr('height', y.bandwidth());
    svg.selectAll('text.city-name').data(cities, d => d.city).join('text').attr('class', 'city-name')
      .attr('x', 100).attr('y', d => y(d.city) + y.bandwidth() / 2).attr('dy', '.35em')
      .attr('text-anchor', 'end').text(d => d.city);
    svg.selectAll('text.city-value').data(cities, d => d.city).join('text').attr('class', 'city-value')
      .attr('x', d => x(d.pm25) + 7).attr('y', d => y(d.city) + y.bandwidth() / 2)
      .attr('dy', '.35em').text(d => d.pm25.toFixed(1));
    svg.selectAll('text').style('font-size', '13px');
    const city = cities.find(d => d.city === selected);
    d3.select('#city-detail').text(`${city.city}, ${city.country}: ${city.pm25.toFixed(1)} µg/m³ reported annual PM2.5 in ${city.year}. This is a city-level annual average from IQAir, not a neighborhood reading or a temperature forecast.`);
  }
  selector.property('disabled', false).on('change', event => { selected = event.target.value; render(); });
  d3.select('#city-status').text('All three cities remain visible. Select a city to highlight its reported annual average.');
  render();
  new ResizeObserver(render).observe(container);
} catch {
  d3.select(container).selectAll('*').remove();
  selector.property('disabled', true);
  d3.select('#city-status').attr('role', 'alert').text('Comparable city data could not be loaded or validated. A 2023 annual mean PM2.5 value in µg/m³ for each of Shanghai, Los Angeles, and Reykjavík from the same source is required; no substitute values are shown.');
}

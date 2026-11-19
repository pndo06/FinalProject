import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Vis settings
const colors = {
  "SSP1-2.6": "#32966f",
  "SSP2-4.5": "#e0a633",
  "SSP5-8.5": "#de4321"
};

const names = {
  "SSP1-2.6": "Low Emissions",
  "SSP2-4.5": "Moderate Emissions",
  "SSP5-8.5": "High Emissions"
};

let data = [];
let active = new Set(Object.keys(names));
let selectedYear = 2100;

const margin = { top: 25, right: 30, bottom: 60, left: 75 };
let width = 1050 - margin.left - margin.right;
let height = 600 - margin.top - margin.bottom;

// Create SVG
const svg = d3.select("#chart")
  .append("svg")
  .attr("viewBox", `0 0 1050 600`)
  .attr("role", "img")
  .attr("aria-label", "Annual temperature values for three emissions scenarios. Use the scenario buttons and year slider for detailed values.");

const chart = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Scales
const x = d3.scaleLinear()
  .domain([2015, 2100])
  .range([0, width]);

const y = d3.scaleLinear()
  .range([height, 0]);

// Axes
const xAxis = chart.append("g")
  .attr("transform", `translate(0,${height})`);

const yAxis = chart.append("g");

chart.append("text").attr("class", "x-label")
  .attr("x", width / 2)
  .attr("y", height + 45)
  .attr("text-anchor", "middle")
  .text("Year");

chart.append("text").attr("class", "y-label")
  .attr("transform", "rotate(-90)")
  .attr("x", -height / 2)
  .attr("y", -50)
  .attr("text-anchor", "middle")
  .text("Global Temperature (°C)");

// Grid
const grid = chart.append("g").attr("class", "grid");

// Lines
const line = d3.line()
  .x(d => x(d.year))
  .y(d => y(d.global_temp_c));

const lines = chart.append("g");

const hoverLine = chart.append("line")
  .attr("stroke", "#333")
  .attr("stroke-dasharray", "4,4")
  .style("display", "none");

const infoBox = chart.append("g")
  .style("display", "none")
  .attr("pointer-events", "none")
  .attr("transform", `translate(${width - 220}, 10)`);

infoBox.append("rect")
  .attr("width", 210)
  .attr("height", 100)
  .attr("rx", 8)
  .attr("fill", "#484747")
  .attr("opacity", 0.95);

const infoText = infoBox.append("text")
  .attr("x", 12)
  .attr("y", 22)
  .attr("fill", "white")
  .style("font-size", "12px");

// Update vis based on filtering
function updateChart() {
  const visible = data.filter(d => active.has(d.scenario));

  d3.select('#chart-status').text(visible.length ? 'Choose scenarios to compare. The axes use the same scale for every selection.' : 'Select at least one emissions scenario.');
  hoverLine.style('display', 'none');
  infoBox.style('display', 'none');
  xAxis.call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(width < 500 ? 4 : 10));
  yAxis.call(d3.axisLeft(y));
  grid.call(d3.axisLeft(y).tickSize(-width).tickFormat(""));

  const paths = lines.selectAll("path")
    .data([...active], d => d);

  paths.exit().remove();

  paths.enter()
    .append("path")
    .merge(paths)
    .attr("fill", "none")
    .attr("stroke", d => colors[d])
    .attr("stroke-width", 2.5)
    .attr("stroke-dasharray", d => d === "SSP2-4.5" ? "8,4" : d === "SSP5-8.5" ? "2,4" : null)
    .attr("d", scenario =>
      line(data.filter(d => d.scenario === scenario)
        .sort((a, b) => a.year - b.year))
    );

  inspectYear(selectedYear);
}

// Hover
const overlay = chart.append("rect")
  .attr("width", width)
  .attr("height", height)
  .attr("fill", "transparent");

function inspectYear(year, showTooltip = false) {
  selectedYear = year;
  d3.select('#inspect-year').property('value', year);
  d3.select('#selected-year').text(year);
  const points = data.filter(d => active.has(d.scenario) && d.year === year);
  d3.select('#year-values').selectAll('li').data(points, d => d.scenario).join('li')
    .style('--scenario-color', d => colors[d.scenario])
    .text(d => `${names[d.scenario]} (${d.scenario}): ${d.global_temp_c.toFixed(2)} °C`);
  hoverLine.style('display', points.length ? null : 'none')
    .attr('x1', x(year)).attr('x2', x(year)).attr('y1', 0).attr('y2', height);
  infoBox.style('display', showTooltip && points.length ? null : 'none');
  infoText.selectAll('tspan').data([`Year: ${year}`, ...points.map(d => `${names[d.scenario]}: ${d.global_temp_c.toFixed(2)} °C`)])
    .join('tspan').attr('x', 12).attr('dy', (d, i) => i === 0 ? 0 : 20).text(d => d);
  infoBox.select('rect').attr('height', 35 + points.length * 20);
}

overlay.on('pointermove pointerdown', event => {
  if (!data.length) return;
  const [mouseX, mouseY] = d3.pointer(event, chart.node());
  const year = Math.max(x.domain()[0], Math.min(x.domain()[1], Math.round(x.invert(mouseX))));
  infoBox.attr('transform', `translate(${Math.max(0, Math.min(width - 210, mouseX + 15))},${Math.max(0, Math.min(height - 100, mouseY + 15))})`);
  inspectYear(year, true);
}).on('pointerleave', () => infoBox.style('display', 'none'));

d3.select('#inspect-year').on('input', event => inspectYear(+event.target.value));

// Scenario filters
d3.selectAll(".scenario-button").on("click", function() {
  const scenario = this.dataset.scenario;

  if (active.has(scenario)) {
    active.delete(scenario);
    this.classList.remove("active");
  } else {
    active.add(scenario);
    this.classList.add("active");
  }

  this.setAttribute("aria-pressed", active.has(scenario));
  updateChart();
});

function resizeChart() {
  const outerWidth = document.querySelector('#chart').clientWidth || 1050;
  const outerHeight = outerWidth < 600 ? 340 : 560;
  width = Math.max(180, outerWidth - margin.left - margin.right);
  height = outerHeight - margin.top - margin.bottom;
  svg.attr('viewBox', `0 0 ${width + margin.left + margin.right} ${outerHeight}`);
  x.range([0, width]);
  y.range([height, 0]);
  xAxis.attr('transform', `translate(0,${height})`);
  chart.select('.x-label').attr('x', width / 2).attr('y', height + 45);
  chart.select('.y-label').attr('x', -height / 2);
  overlay.attr('width', width).attr('height', height);
  updateChart();
}

// Reject malformed data rather than silently dropping scenario values.
try {
  data = await d3.csv('all_scenarios.csv', d => ({
    year: d.year?.trim() ? +d.year : NaN,
    global_temp_c: d.global_temp_c?.trim() ? +d.global_temp_c : NaN,
    scenario: d.scenario?.trim(),
  }));
  if (!data.length || data.some(d => !Number.isInteger(d.year) || !Number.isFinite(d.global_temp_c) || !Object.hasOwn(names, d.scenario)) ||
      new Set(data.map(d => `${d.scenario}:${d.year}`)).size !== data.length ||
      Object.keys(names).some(scenario => !data.some(d => d.scenario === scenario))) {
    throw new Error('Invalid scenario data');
  }
  const years = d3.extent(data, d => d.year);
  if (years[0] === years[1]) throw new Error('A multi-year dataset is required');
  x.domain(years);
  const [minTemp, maxTemp] = d3.extent(data, d => d.global_temp_c);
  const padding = Math.max((maxTemp - minTemp) * 0.12, 0.1);
  y.domain([minTemp - padding, maxTemp + padding]).nice();
  selectedYear = years[1];
  d3.select('#inspect-year').attr('min', years[0]).attr('max', years[1]).property('disabled', false);
  const endpoints = data.filter(d => d.year === years[1]);
  const low = endpoints.find(d => d.scenario === 'SSP1-2.6');
  const high = endpoints.find(d => d.scenario === 'SSP5-8.5');
  if (low && high) d3.select('#takeaway').text(`In the supplied table, the high-emissions value is ${(high.global_temp_c - low.global_temp_c).toFixed(2)} °C above the low-emissions value in ${years[1]}. This is a difference between scenarios, not warming relative to a historical baseline.`);
  resizeChart();
  new ResizeObserver(resizeChart).observe(document.querySelector('#chart'));
} catch {
  data = [];
  lines.selectAll('path').remove();
  hoverLine.style('display', 'none');
  infoBox.style('display', 'none');
  d3.select('#chart-status').attr('role', 'alert').text('Temperature data could not be loaded or validated. Please reload the page; if this persists, check all_scenarios.csv.');
  d3.select('#inspect-year').property('disabled', true);
  d3.selectAll('.scenario-button').property('disabled', true);
}

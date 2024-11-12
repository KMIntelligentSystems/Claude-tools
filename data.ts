export const svgHeading = `
The mappings of SVG elements are mapped to the four categories below\n
`;

export const viewBox = `
#1. SVG viewBox:
This maps to the height and width of a SVG viewing area.
 Look at the specific values below when questioned about the "view_box":\n
`
export const path_1 = `
#2. SVG path:
There are two mappings for the path element:
2.1. The "<path>" element of svg  with class "domain" maps the x-y axes of a graph. 
The paths will be in a grouping element "<g...></g>". The "d" attributes are mapped as:\n
`

export const path_2 = `
2.2. The "<path>" element of svg  with class "line" maps the lines for a line chart. \n
`

export const svgPathText_1 = `
#3. SVG text for axes:
The text of interest is for the x-y axes labelling.
3.1 The text on the x-axis with "tick" lines descending from the x-axis:\n
`

export const svgPathText_2 = `
3.1 The text on the y-axis with "tick" lines horizontally aligned on the y-axis:\n
`
export const rect = `
#4. SVG rect.
In this case the rects form a legend at the bottom of the graph. They have text and color values:\n
`
export const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Industry Values by Year</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    .line {
      fill: none;
      stroke-width: 2px;
    }
  </style>
</head>
<body>
  <div id="chart"></div>
  
  <script>
    // Set the dimensions and margins of the graph
    const margin = {top: 20, right: 20, bottom: 50, left: 70},
          width = 800 - margin.left - margin.right,
          height = 400 - margin.top - margin.bottom;

    // Append the svg object to the chart div
    const svg = d3.select("#chart")
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform");

    // Parse the data
    const data = "";

    // List of groups (industries)
    const industries = data.map(d => d.Industry);

    // List of years 
    const years = data.columns.slice(1);

    // Add X axis
    const x = d3.scalePoint()
      .domain(years)
      .range([0, width]);
    svg.append("g")
      .attr("transform")
      .call(d3.axisBottom(x));

    // Add Y axis
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d3.max(years, year => +d[year]))])
      .range([height, 0]);
    svg.append("g")
      .call(d3.axisLeft(y));

    // Color scale
    const color = d3.scaleOrdinal()
      .domain(industries)
      .range(d3.schemeCategory10);

    // Draw the lines
    svg.selectAll(".line")
      .data(data)
      .join("path")
        .attr("class", "line")
        .attr("d", d => d3.line()(years.map(year => [x(year), y(d[year])])))
        .attr("stroke", d => color(d.Industry));

    // Add labels
    svg.append("text")
      .attr("x", width/2)
      .attr("y", height + margin.bottom)
      .style("text-anchor", "middle")
      .text("Year");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height/2)
      .attr("y", -margin.left)
      .attr("dy", "1em")
      .style("text-anchor", "middle") 
      .text("Value");

    // Add legend
    const legend = svg.append("g")
      .attr("transform");

    industries.forEach((industry, i) => {
      const legendRow = legend.append("g")
        .attr("transform");
        
      legendRow.append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", color(industry));

      legendRow.append("text")
        .attr("x", 18)
        .attr("y", 10)
        .text(industry);
    });
  </script>
</body>
</html>

`
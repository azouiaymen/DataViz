var margin = { top: 10, right: 30, bottom: 30, left: 60 },
width = 1000 - margin.left - margin.right,
height = 600 - margin.top - margin.bottom;

var svg = d3.select("#line_chart")
.append("svg")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom)
.append("g")
.attr("transform",
  "translate(" + margin.left + "," + margin.top + ")");


var parseTime = d3.timeParse("%Y/%m/%d");
var data = d3.csv("./../data/corse.csv").then(function (d) {
  return d
  .filter(function(elem){
    return elem[" pm25"] != " ";
  })
  .map(function(val){
    var fefe = {date: parseTime(val.date), value: parseInt(val[" pm25"])};
    return fefe;
  });
}).then(function (deez) {
  console.table(deez)
  return deez;
});


data.then(function (data) {
// Add X axis --> it is a date format
var x = d3.scaleTime()
  .domain(d3.extent(data, d => d.date))
  .range([0, width])

// Add Y axis
var y = d3.scaleLinear()
  .domain([0, d3.max(data, d => d.value)])
  .range([height, 0]);


yAxis = (g) => g
  .call(d3.axisLeft(y))
  .call(g => g.select(".tick:last-of-type text").clone()
    .attr("x", 3)
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .text(data.y));

xAxis = g => g
  .attr("transform", "translate(0," + height + ")")
  .call(d3.axisBottom(x));

line = d3.line()
  .defined(d => !isNaN(d.value))
  .x(d => x(d.date))
  .y(d => y(d.value))


svg.append("g")
  .call(xAxis);

svg.append("g")
  .call(yAxis);

svg.append("path")
  .datum(data)
  .attr("fill", "none")
  .attr("stroke", "steelblue")
  .attr("stroke-width", 1.5)
  .attr("stroke-linejoin", "round")
  .attr("stroke-linecap", "round")
  .attr("d", line);

})


console.log('ca arrive jusqua ici')  
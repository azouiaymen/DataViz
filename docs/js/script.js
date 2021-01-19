
$("#polluantContainer").change(function () {
    console.log("tmnyik");
    getProperData($(this).val(), $("#regionButtContainerSelect").val())
        .then(displayGraph);
});

$("#regionButtContainerSelect").change(function () {
    getProperData($("#polluantContainer").val(), $(this).val())
        .then(displayGraph);
})


getRegions().then(displayRegions);


function getRegions() {
    return d3.csv(/*"./../data/resultat_final.csv"*/"https://raw.githubusercontent.com/azouiaymen/DataViz/main/data/resultat_final.csv").then(function (d) {
        return d;
    }).then(function (deez) {
        return new Set(deez.map(item => item["region"]))
    });
}
function displayRegions(regions) {
    regions.forEach((reg) => {
        $("#regionButtContainerSelect").append(`<option id="rb${reg}" value="${reg}">${reg}</option>`)
    });

}
function getProperData(poluant, region) {
    console.log(poluant);
    return d3.csv(/*"./../data/resultat_final.csv"*/"https://raw.githubusercontent.com/azouiaymen/DataViz/main/data/resultat_final.csv").then(function (d) {
        return d.filter((a) => a["region"] == region)
            .map(function (val) {
                return { date: parseTime(val.date), value: parseInt(val[` ${poluant}`]) };
            })
            .sort((a, b) => a.date > b.date);
    }).then(function (deez) {
        console.log(deez);
        return deez;
    });
}

function refresh(domain, entry) {
    let svg = d3.select("#line_chart");

    const t = svg.transition().duration(750);
    // zx.domain(domain);
    gx.transition(t).call(xAxis, zx);
    path.transition(t).attr("d", line(entry));
}

var parseTime = d3.timeParse("%Y/%m/%d");
var data = getProperData("pm25", "alpes-cote-dazur-est");

function displayGraph(entry) {
    d3.select("#line_chart > *").remove();
    var margin = { top: 10, right: 30, bottom: 30, left: 60 },
        width = 2000 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    var svg3 = d3.select("#line_chart")
        .append("svg")
        .attr("viewBox", [-margin.left, -margin.top, width + margin.left + margin.right, height + margin.top + margin.bottom])
    // .attr("width", width + margin.left + margin.right)
    // .attr("height", height + margin.top + margin.bottom)
    // .attr("transform", function (d, i) { return "translate(500,0)"; })
    // .append("g")
    // .attr("transform",
    //     "translate(" + margin.left + "," + margin.top + ")");
    // Add X axis --> it is a date format
    var x = d3.scaleTime()
        .domain(d3.extent(entry, function (d) { return d.date; }))
        .range([0, width])

    // Add Y axis
    var y = d3.scaleLinear()
        .domain([0, d3.max(entry, d => d.value)])
        .range([height, 0]);

    zx = x.copy(); // x, but with a new domain.

    // yAxis = (g) => g
    //     .call(d3.axisLeft(y))
    //     .call(g => g.select(".tick:last-of-type text").clone()
    //         .attr("x", 3)
    //         .attr("text-anchor", "start")
    //         .attr("font-weight", "bold")
    //         .text(entry.y));

    yAxis = (g, scale = y) => g
        .attr("transform", `translate(0,0)`)
        .call(d3.axisLeft(scale).ticks(height / 40))
        .call(g => g.select(".domain").remove())

    // xAxis = g => g
    //     .attr("transform", "translate(0," + height + ")")
    //     .call(d3.axisBottom(x));
    xAxis = (g, scale = x) => g
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(scale).ticks(width / 80).tickSizeOuter(0))

    line = d3.line()
        .defined(d => !isNaN(d.value))
        .x(d => x(d.date))
        .y(d => y(d.value))


    gx = svg3.append("g")
        .call(xAxis);

    gy = svg3.append("g")
        .call(yAxis);

    path = svg3.append("path")
        .datum(entry)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", line(entry));


}
data.then(displayGraph)


console.log('ca arrive jusqua ici')  
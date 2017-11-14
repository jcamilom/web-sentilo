var url = 'http://localhost:4000/data/provider1/sensor1?limit=30&from=14/11/2017T00:00:00';
var token = '5a4a0c470418d5b97c71d266c35097ef678e09caab63d135978085b90ef251bf';

var svg = d3.select("svg"),
    margin = {top: 20, right: 20, bottom: 90, left: 80},
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom,
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var timeParse = d3.timeParse("%d/%m/%YT%H:%M:%S");   // example 10/11/2017T21:52:08
// the value is being incremented by +5h. I suppose it is because UTC-5

var x = d3.scaleTime()
    .rangeRound([0, width]);

var y = d3.scaleLinear()
    .rangeRound([height, 0]);

var line = d3.line()
    .x(function(d) { return x(d.timestamp); })
    .y(function(d) { return y(d.value); });

/* Initialize tooltip */
tip = d3.tip().attr('class', 'd3-tip').html(function(d) { return 'Temp: ' + d.value; });

/* Invoke the tip in the context of the visualization */
svg.call(tip);

d3.request(url)
    .header('IDENTITY_KEY', token)
    .response(function(xhr) {
        return JSON.parse(xhr.responseText, (key, value) => 
            key == 'timestamp'
                ? timeParse(value)  // return the parsed date
                : value             // return everything else unchanged
        );
    })
    .get(processData);

function processData(data) {

    x.domain(d3.extent(data.observations, function(d) { return d.timestamp; }));
    //y.domain(d3.extent(data.observations, function(d) { return d.value; }));
    y.domain([0, 35]);

    // Add the X Axis
    g.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x)
            //.tickSize(6,0)
            //.ticks(3)
            .tickFormat(d3.timeFormat('%b %d - %H:%M')))
        .selectAll("text")	
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-45)");

    g.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y))
      .append("text")
        .attr("fill", "#000")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left + 6)
        .attr("x", 0 - (height / 2))
        .attr("dy", "0.71em")
        .attr("text-anchor", "middle")
        .text("Temperature (°C)");

    g.append("path")
        .datum(data.observations)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5)
        .attr("d", line);

    // Add the scatterplot
    g.selectAll(".dot")
        .data(data.observations)
      .enter().append("circle")
        .attr("class", "dot")
        .attr("r", 5)
        .attr("cx", function(d) { return x(d.timestamp); })
        .attr("cy", function(d) { return y(d.value); })
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);
}

function loadDoc() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            document.getElementById("demo").innerHTML = this.responseText;
        }
    };
    xhttp.open("GET", "http://localhost:4000/data/provider1/sensor1?limit=30&from=10/11/2017T00:00:00", true);
    // Huge security risk
    xhttp.setRequestHeader('IDENTITY_KEY', '5a4a0c470418d5b97c71d266c35097ef678e09caab63d135978085b90ef251bf');
    xhttp.send();
}
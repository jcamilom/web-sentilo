var host = 'http://sistemic.udea.edu.co',
    port = '4000',
    path = '/data/provider1/sensor1',
    request = '?limit=150&from=';

var url = host + ':' + port + path + request;
var token = '5a4a0c470418d5b97c71d266c35097ef678e09caab63d135978085b90ef251bf';

var yPadding = 0.2  // vertical "padding" for the y axe

// Date Parser and Formater
var utcParse = d3.utcParse("%d/%m/%YT%H:%M:%S");   // example 10/11/2017T21:52:08
var utcFormat = d3.utcFormat("%d/%m/%YT%H:%M:%S");
var utcFormatPrint = d3.utcFormat("%H:%M");

var svg = d3.select("svg"),
    margin = {top: 20, right: 20, bottom: 90, left: 80},
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom,
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var x = d3.scaleTime()
    .rangeRound([0, width]);

var y = d3.scaleLinear()
    .rangeRound([height, 0]);

var line = d3.line()
    .x(function(d) { return x(d.timestamp); })
    .y(function(d) { return y(d.value); });

/* Initialize tooltip */
tip = d3.tip().attr('class', 'd3-tip').html(function(d) {
    return 'Temp: ' + d.value + "°C<br/> Time: " + utcFormatPrint(d.timestamp); 
});

/* Invoke the tip in the context of the visualization */
svg.call(tip);

timeIntSelected();



// ======================================== FUNCTIONS SECTION ======================================== //

function requestData(urlRequest) {
    d3.request(urlRequest)
        .header('IDENTITY_KEY', token)
        .response(function(xhr) {
            return JSON.parse(xhr.responseText, (key, value) => {
                if(key == 'timestamp') return utcParse(value);     // return the parsed date
                else if(key == 'value' && !isNaN(Number(value))) return Number(value);  // return value type Number
                else return value;  // return value unchanged
            });
        })
        .get(processData);
}

function processData(data) {

    x.domain(d3.extent(data.observations, function(d) { return d.timestamp; }));
    var yDomainArr = (d3.extent(data.observations, function(d) { return d.value; }));
    var yDomainVal = yDomainArr[1] - yDomainArr[0];
    yDomainArr[0] = yDomainArr[0] - (yDomainVal * yPadding);
    yDomainArr[1] = yDomainArr[1] + (yDomainVal * yPadding);
    y.domain(yDomainArr);   

    // Add the X Axis
    g.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x)
            //.tickSize(6,0)
            //.ticks(3)
            .tickFormat(d3.utcFormat('%b %d - %H:%M')))
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

function timeIntSelected(radioSelected = true) {
    var today = new Date();      // current date
    var dateRequest;

    // First time
    if(radioSelected === true) {
        radioSelected = {value: 'lastday'};
    }

    // Update the request
    switch(radioSelected.value) {
        case 'today':
            dateRequest = utcFormat(today.setHours(0,0,0));            
            break;
        case 'lastday':
            dateRequest = utcFormat(today.setHours(today.getHours() - 24));
            break;
        case 'custom':
            alert("under construction");
            break;
        default:
            alert("radio button error");
            break;
    }
    requestData(url + dateRequest);
}
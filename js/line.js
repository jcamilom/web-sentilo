var host = 'http://sistemic.udea.edu.co',
    port = '4000',
    path = '/data/provider1/sensor1',
    request = '?limit=150&from=';

var url = host + ':' + port + path + request;
var token = '5a4a0c470418d5b97c71d266c35097ef678e09caab63d135978085b90ef251bf';

var yPadding = 0.2  // vertical "padding" for the y axe

// Variables
duration = 1000;        // Transition's duration
var init = false;       // Flag to initialize the graph
var data;               // Variable that holds the data
var focus;              // For the mouseover

// Date Parser and Formater
var utcParse = d3.utcParse("%d/%m/%YT%H:%M:%S");   // example 10/11/2017T21:52:08
var utcFormat = d3.utcFormat("%d/%m/%YT%H:%M:%S");
var utcFormatPrint = d3.utcFormat("%H:%M");

// Date Bisector
var bisectDate = d3.bisector(function(d) { return d.timestamp; }).left;

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

// Define the x axis
var xAxis = d3.axisBottom(x)
    //.tickSize(6,0)
    .ticks(3)
    .tickFormat(d3.utcFormat('%b %d - %H:%M'))

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

function processData(responseData) {

    data = responseData;

    // Sort the data by date
    data.observations.sort(function(a, b) {
        return a.timestamp - b.timestamp;
    });

    // Scale the range of the data
    x.domain(d3.extent(data.observations, function(d) { return d.timestamp; }));
    var yDomainArr = (d3.extent(data.observations, function(d) { return d.value; }));
    var yDomainVal = yDomainArr[1] - yDomainArr[0];
    yDomainArr[0] = yDomainArr[0] - (yDomainVal * yPadding);
    yDomainArr[1] = yDomainArr[1] + (yDomainVal * yPadding);
    y.domain(yDomainArr);
    
    // Create axes if don't exist
    if(!init)  {
        initGraph();
        init = true;
    }

    // ==================== Line ==================== //
    // Update valueline path.
    g.select(".line")
        .datum(data.observations)
        .transition()
            .duration(duration / 2)
            .style('opacity', 0)          
            .on('end', function() { d3.select(this).attr("d", line); })
        .transition()
            .duration(duration / 2)
            .style('opacity', 1);

    // ==================== Axes ==================== //
    // Update the X Axis
    g.select('.x.axis')
        .transition()
            .duration(duration)        
            .call(xAxis);
/*           .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-45)"); */

    // Update the Y Axis
    g.select(".y.axis")
        .transition()
            .duration(duration)
            .call(d3.axisLeft(y));
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

function initGraph(){
    // Add the X axis
    g.append('g')
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
/*       .selectAll("text")	
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)"); */

    // Add the Y Axis
    g.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(y))
      .append("text")
        .attr("fill", "#000")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left + 6)
        .attr("x", 0 - (height / 2))
        .attr("dy", "0.71em")
        .attr("text-anchor", "middle")
        .text("Temperature (°C)");

    // Add the valueline path.
    g.append("path")
        .datum(data.observations)
        .attr('class', 'line')
        .attr("d", line);

    // Add the focus container
    focus = g.append("g")
        .attr("class", "focus")
        .style("display", "none");
  
    focus.append("circle")
        .attr("r", 5);
  
    focus.append("text")
        .attr("x", 9)
        .attr("dy", ".35em");

    g.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .on("mouseover", function() { focus.style("display", null); })
        .on("mouseout", function() { focus.style("display", "none"); })
        .on("mousemove", mousemove);
}

function mousemove() {
    console.log(x.invert(d3.mouse(this)[0]));
    var x0 = x.invert(d3.mouse(this)[0]),
        i = bisectDate(data.observations, x0, 1),
        d0 = data.observations[i - 1],
        d1 = data.observations[i],
        d = x0 - d0.timestamp > d1.timestamp - x0 ? d1 : d0;
    focus.attr("transform", "translate(" + x(d.timestamp) + "," + y(d.value) + ")");
    focus.select("text").text(d.value);
  }
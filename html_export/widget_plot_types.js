// contains various plotting functions using d3.js
// with variables to select in which html div to insert the figures & sliders

// responsive SVG : https://medium.com/@louisemoxy/a-simple-way-to-make-d3-js-charts-svgs-responsive-7afb04bc2e4b 

function write_widget(id_figure, id_parameter, param_data, switch_data, algebraic_eq, plot_type){
	
	document.getElementById(id_parameter).innerHTML='';
	//console.log(param_data);
	
	// write parameter sliders
	var html_txt = '<p>Click on the parameters to change their values. Expand all. Collapse all. </p>'
	html_txt += '<div class="listParam">';
	html_txt += write_sliders(id_figure, id_parameter, param_data, switch_data, algebraic_eq, plot_type);
	html_txt += '</div>';
	document.getElementById(id_parameter).innerHTML= html_txt ;
	

	// initialise figure
	// a for loop to define global variables for each param	
	var algebraic_values = algebraic_equation_f(); // recalculate algebraic equation
	//console.log(algebraic_values);
	
	switch(plot_type){
		case 'waterfall':
			plot_waterfall(id_figure, algebraic_values)
			break;
		case 'stackedbar':
			plot_stackedbar(id_figure, algebraic_values)
			break;
		default:
			console.log("Plot type not recognised");
	}
}

function write_sliders(id_figure, id_parameter, param_data, switch_data, algebraic_eq, plot_type){
	var html_txt = '';

	// V1: collapsible
	// CSS3 https://codepen.io/markcaron/pen/RVvmaz (see their styling)
	html_txt = '';
	for(i in context[param_data]['name']){
		
		var name = ( (context["parameter_data"].hasOwnProperty("prettyName")) ? context[param_data]['prettyName'][i] : context[param_data]['name'][i] ); // bw2 name or prettyName if it exists and is not null 
		var nameID = context[param_data]['name'][i];
		var description = ( (context["parameter_data"].hasOwnProperty("description")) ? context[param_data]['description'][i] : '' );
		var unit = ( (context["parameter_data"].hasOwnProperty("unit")) ? context[param_data]['unit'][i] : '' );

		html_txt += ' <section class="accordion"> ' ;
		html_txt += ' <input type="checkbox" name="collapse" id="handle_'+nameID+'" > ';
		html_txt += ' <h5 class="handle"> <label for="handle_'+nameID+'"> '+name; // prettyName if it exists
		    
		html_txt += ' <a class="glossary-tooltip" title="'+description+'" data-toggle="tooltip" data-placement="top" aria-label="'+description+'"> &#x24D8; </a>'; // tooltip description in the info symbolo
		html_txt += ' </label></h5>'; 
		html_txt += ' <div class="content">';
		
		if(context[param_data]['uncertainty type'][i] == 'switch'){
			var nbOptions = context[switch_data][nameID]['options'].length
			html_txt += ' <select name="select_'+nameID+'" onchange="updateWidget(this.value, this.name, \''+id_figure+'\', algebraic_equation_f, \''+plot_type+'\', \''+switch_data+'\');" >' ;
			for(let j=0; j < nbOptions; j++){
				html_txt += ' <option value='+j+'>'+context[switch_data][nameID]['options'][j]+'</option> ';
			}
			html_txt += '</select>' ;						
		}else{
			// html_txt += '  Minimum: '+ context[param_data]['minimum'][i]+' ';
			html_txt += ' <input type="range" name="range_'+nameID+'" min="'+context[param_data]['minimum'][i]+'" max="'+context[param_data]['maximum'][i]+'" step = "'+(context[param_data]['maximum'][i] - context[param_data]['minimum'][i])/100+'"  ';
			html_txt += ' onchange="updateWidget(this.value, this.name, \''+id_figure+'\', algebraic_equation_f, \''+plot_type+'\', \''+switch_data+'\');" >' ;
			html_txt += ' <input type="text" id="txt_'+nameID+'" value="'+context[param_data]['amount'][i]+'" maxlength="4" size="4" onchange="updateWidget(this.value, this.id, \''+id_figure+'\', algebraic_equation_f, \''+plot_type+'\', \''+switch_data+'\');" >' ;			
			html_txt += ' in: <i>' + unit+'</i>';
		}
		html_txt += ' </div> </section>';			
	}
	return html_txt
}

function updateWidget(val, NameOrId, id_figure, algebraic_eq, plot_type, switch_data){
	console.log("triggered")
	document.getElementById(id_figure).innerHTML=''; // reset figure div
	// update text input area with updated value (if update was made by range slider)
	paramType = NameOrId.split(/_(.+)/)[0];
	console.log(paramType);
	paramName = NameOrId.split(/_(.+)/)[1];
	console.log(context[switch_data]);
	// update global variable global, depending on if it is a switch or not
	if(paramType == 'select'){ // it's a switch param, update multiple values
		var nbOptions = context[switch_data][paramName]['options'].length
		for(let j = 0; j<nbOptions; j++){
			console.log(paramName+'_'+j.toString());
			console.log(context[switch_data][paramName]['values'][val][j]);
			window[paramName+'_'+(j+1).toString()]= context[switch_data][paramName]['values'][val][j];
		}
		
	}else{
		document.getElementById('txt_'+paramName).value=val;
		window[paramName]=val;
	}
	// recalculate algebraic equation
	var algebraic_values = context['algebraic_equation_f'].apply(); // dynamic call to function - to pass as argument to the update function
	
	// plotting, according to type
	switch(plot_type){
		case 'waterfall':
			plot_waterfall(id_figure, algebraic_values);
			//plot_stackedbar(id_figure, algebraic_values);
			break;
		case 'stackedbar':
			plot_stackedbar(id_figure, algebraic_values)
			break;
		default:
			console.log("Plot type not recognised");
	}	
}

/* 
	Variables useful across document
*/

var nb2txt_2c = d3.format(",.2r"),
	nb2txt_3c = d3.format(",.3r");

/*
	Plotting functions: stackedbar, waterfall
*/

function plot_stackedbar(id_figure, algebraic_values){
	// https://www.d3-graph-gallery.com/graph/barplot_stacked_highlight.html
	// https://www.d3-graph-gallery.com/graph/custom_legend.html 

	// diverging stack https://bl.ocks.org/mbostock/b5935342c6d21928111928401e2c8608
	// https://observablehq.com/@d3/diverging-stacked-bar-chart 

	console.log("algebraic values", algebraic_values);
	
	// set the dimensions and margins of the graph
	var margin = {top: 10, right: 30, bottom: 20, left: 50},
    legend_width = 150,
    width = 500 - margin.left - margin.right - legend_width,
    height = 325 - margin.top - margin.bottom;
    legend_height = height + margin.top + margin.bottom;
	
	var xoffset_legend = width-margin.left-margin.right;
	var yoffset_legend = -8*margin.top;

	var svgWidth = width + margin.left + margin.right + legend_width,
		svgHeight = height + margin.top + margin.bottom;
	
	// append the svg object to the body of the page
	var svg = d3.select("#"+id_figure)
	  .append("svg")
		//.attr("width", width + margin.left + margin.right)
		//.attr("height", height + margin.top + margin.bottom)
		.attr("viewBox", "0 0 "+svgWidth+" "+svgHeight+"")
	  .append("g")
		.attr("transform",
			  "translate(" + margin.left + "," + margin.top + ")");

	var stages = Object.keys(algebraic_values[0]) ; // the keys of the data
	stages = stages.filter(function(item) {return item !== 'group' }) // remove the col name "group"
	console.log("stages", stages);	
	var stackedData= d3.stack()
						.keys(stages) // which keys to consider
						.offset(d3.stackOffsetDiverging) // strategy for negative/positive values
						(algebraic_values); 	// apply to the stack generator to the data

	console.log("stackedData", stackedData);	
	function calcNet(obj) {
		var sum = 0;
		for( var el in obj ) {
		  if( obj.hasOwnProperty( el ) && el != "group" ) { sum += parseFloat( obj[el] ); }
		}
		return sum;
	  }
	var netValues = algebraic_values.map(x => [x.group, calcNet(x)] );
	console.log("NetValues", netValues);

	// Add X axis
	var x = d3.scaleBand()
	.domain(algebraic_values.map(function(d) { return d.group; }) ) 
	.range([0, width])
	.padding([0.2])

	svg.append("g")
	.attr("transform", "translate(0," + height + ")")
	.call(d3.axisBottom(x).tickSizeOuter(0));

	function stackMin(serie) {
	return d3.min(serie, function(d) { return d[0]; });
	}
		
	function stackMax(serie) {
	return d3.max(serie, function(d) { return d[1]; });
	}

	// Add Y axis
	var y = d3.scaleLinear()
	.domain([ 1.2*d3.min(stackedData, stackMin), 1.2*d3.max(stackedData, stackMax) ])
	.range([ height, 0 ]);

	svg.append("g")
	.call(d3.axisLeft(y));
	  // Add 0 line
	  var y0 = y(0);
	  svg.append("line")
			.attr("class", "starting-line")
			.attr("x1", 0)
			.attr("y1", y0)
			.attr("x2", width)
			.attr("y2", y0)
			.style("stroke", "black")

	// color palette = one color per subgroup
	var color = d3.scaleOrdinal()
	.domain(stages)
	.range(d3.schemeSet2);

  // What happens when user hover a bar
  var mouseover = function(d) {
    // what subgroup are we hovering?
    var subgroupName = d3.select(this.parentNode).datum().key; // the name of the currently highlighted thing
	subgroupName = subgroupName.replace(/ /g, '');
    // var subgroupValue = d.data[subgroupName];
	// IF subgroupName has a SPACE the class change will not work : str.replace(/ /g, '');
	console.log("CategoryHighlighted is:", subgroupName);
    // Reduce opacity of all rect to 0.2
    d3.selectAll(".myRect").style("opacity", 0.2)
    // Highlight all rects of this subgroup with opacity 0.8. It is possible to select them since they have a specific class = their name.
    d3.selectAll("."+subgroupName)
      .style("opacity", 1)
    }

  // When user do not hover anymore
  var mouseleave = function(d) {
    // Back to normal opacity: 0.8
    d3.selectAll(".myRect")
      .style("opacity",0.8)
    }

  // Show the bars
  svg.append("g")
    .selectAll("g")
    // Enter in the stack data = loop key per key = group per group
    .data(stackedData)
    .enter().append("g")
      .attr("fill", function(d) { return color(d.key); })
      .attr("class", function(d){ return "myRect " + d.key.replace(/ /g, '') }) // Add a class to each subgroup: their name
      .selectAll("rect")
      // enter a second time = loop subgroup per subgroup to add all rectangles
      .data(function(d) { return d; })
      .enter().append("rect")
        .attr("x", function(d) { return x(d.data.group); })
        .attr("y", function(d) { return y(d[1]); })
        .attr("height", function(d) { return y(d[0]) - y(d[1]); })
        .attr("width", x.bandwidth())
        .attr("stroke", "grey")
      .on("mouseover", mouseover)
      .on("mouseleave", mouseleave)

	// show net value symbol & text
	var netSymbol = d3.symbol().type(d3.symbolSquare).size(10);

	svg.append("g")
		.selectAll("g")
		.data(netValues)
		.enter()
			.append("path")
				.attr("d", netSymbol)
				.attr("transform", function(d) {
									var xoffset = x(d[0])+x.bandwidth()/2;
									return "translate("+xoffset+","+y(d[1])+")"; 
									})

	svg.append("g")
		.selectAll("g")
		.data(netValues)
		.enter()
			.append("text")
			.attr("fill", "black")  
			.attr("font-size", "0.7em")
			.attr("x", function(d) {
						var xoffset = x(d[0])+x.bandwidth()/2 - 11;
						return xoffset; 
					})
			.attr("y", function(d,i){ return y(d[1])- 9 }) // 100 is where the first dot appears. 25 is the distance between dots
			.text(function(d){ return nb2txt_3c(d[1]) })	

	// show legend
	  var legendHolder = svg.append('g')
		  .attr("width", legend_width)
		  .attr("height", legend_height)
		// translate the holder to the right side of the graph
		  .attr('transform', "translate("+ xoffset_legend + ", "+ yoffset_legend +")")
	  // Add one dot in the legend for each name.
	  
	  var reversedSubgroups = stages.reverse();
	  
	  var legend = legendHolder.selectAll("mydots")
		.data(reversedSubgroups) // name of categories, in reverse order for stacked legend
		.enter()
		.append("circle")
		  .attr("cx", 100)
		  .attr("cy", function(d,i){ return 100 + i*25}) // 100 is where the first dot appears. 25 is the distance between dots
		  .attr("r", 7)
		  .style("fill", function(d){ return color(d)})
	  // Add one dot in the legend for each name.
		legend = legendHolder.selectAll("mylabels")
			.data(reversedSubgroups)
			.enter()
			.append("text")
			  .attr("x", 120)
			  .attr("y", function(d,i){ return 100 + i*25}) // 100 is where the first dot appears. 25 is the distance between dots
			  .style("fill", function(d){ return color(d)})
			  .text(function(d){ return d})
			  .attr("text-anchor", "left")
			  .style("alignment-baseline", "middle")
	  

}

function plot_waterfall(id_figure, algebraic_values){
	
		function process_data(data){
			// previously, data format: [ {'name':'', 'value':0}, {'name':'', 'value':0}, ]
			// currently, data format: { 'categorie_1': [0], 'categorie_2': [0] }
			// new data format: [ {'group':'willow', categorie_1': 0, 'categorie_2': 0}]
			
			data = data[0]; // first element only, it's a waterfall, cannot plot multiple fus
			delete data.group; // remove the key 'group'
			console.log("pre-pro data", data);

			var prev_end = 0;
			var new_data = [];
			var stages = [];
			for(d in data){
				name = d; 
				value =  data[d]
				start = prev_end;
				end = prev_end + value;
				left = Math.min(start, end);
				right = Math.max(start, end)
				this_line = {name: name, value: value, start:start, end: end, left:left, right:right}
				prev_end += value
				new_data.push(this_line);
				stages.push(name)
			};
			return [new_data, stages];
		}
		
		var processed = process_data(algebraic_values);
		
		var segments = processed[0],
			stages = processed[1];
		var margin = {left:20, right:70, top:20, bottom:20},
			yAxisWidth = 110,
			xAxisHeight = 21,
			chartWidth = 500,
			xScale = d3.scaleLinear(),
			yScale = d3.scaleBand(),
			segmentHeight = 44,
			segmentPadding = segmentHeight/4,
			svg = null,
			colour_plus = 'pink'//'#f0f8ff',
			colour_minus = 'lightgreen',
			labelFormat = d3.format(",.3r"), //d3.format("^.2g")
			unit="kgCO2-eq";
		var chartHeight = (segmentHeight + segmentPadding) * segments.length;
		var minVal = d3.min(segments, function (d) {
				return d.left;
			}),
			maxVal = d3.max(segments, function (d) {
				return d.right;
			});
		xScale.range([0, chartWidth]).nice();
		xScale.domain([minVal, maxVal]);
		//console.log(stages);
		yScale.domain(stages);
		yScale.rangeRound([0, chartHeight]).padding(0.3);
		
		function setGraphicAttributes(seg, index) {
			seg.x = xScale(seg.left); //Math.min(seg.startVal, seg.endVal)
			seg.y = (segmentPadding + segmentHeight) * index;
			seg.width = Math.abs(xScale(seg.value) - xScale(0));
			seg.endX = xScale(seg.end);
			if (Math.abs(seg.value)/Math.abs(maxVal-minVal) > 0.15){
				seg.labelX = xScale(seg.right - Math.abs(seg.value/2));
				seg.labelAnchor = "middle";
			}else{
				seg.labelX = xScale(seg.right) + 5;
				seg.labelAnchor = "right";
			}
			
		}
		for(i=0; i<segments.length; i++){
		  setGraphicAttributes(segments[i], i);
		  console.log("graphic atributes are set for", segments[i].labelX);
		}

		function createSvg(parentElement) {
			svg = d3.select(parentElement).append("svg");
			svg.append("g")
				.attr("class", "chart-group")
				.attr("transform", "translate(" + (margin.left + yAxisWidth) + "," + margin.top + ")");
			// setSvgSize
			//svg.attr("width", chartWidth + yAxisWidth + margin.left + margin.right);
			//svg.attr("height", xAxisHeight + chartHeight + margin.top + margin.bottom);
			console.log("width", chartWidth + yAxisWidth + margin.left + margin.right);
			var svgWidth = chartWidth + yAxisWidth + margin.left + margin.right,
				svgHeight = xAxisHeight + chartHeight + margin.top + margin.bottom;
			svg.attr("viewBox", "0 0 "+svgWidth+" "+svgHeight+"");
		}
		function wrap(text, width) {
			text.each(function() {
				var text = d3.select(this),
					words = text.text().split(/\s+/).reverse(),
					word,
					line = [],
					lineNumber = 0,
					lineHeight = 1.1, // ems
					x = text.attr("x"),
					y = text.attr("y"),
					dy = parseFloat(text.attr("dy")),
					tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
				while (word = words.pop()) {
					line.push(word);
					tspan.text(line.join(" "));
					if (tspan.node().getComputedTextLength() > width) {
						line.pop();
						tspan.text(line.join(" "));
						line = [word];
						tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
					}
				}
			});
		}
		function drawXAxis() {
			var tickValues = [], maxTickVal;
			svg.select(".x.axis").remove();
			if (chartHeight > 0 && segments && segments.length > 0) {
				var xAxis = d3.axisBottom()
						.scale(xScale),
					minVal = d3.min(segments, function (d) {
						return d.end;
					}),
					maxVal = d3.max(segments, function (d) {
						return d.end;
					});
				var lastVal = segments[segments.length-1].end;
				if (minVal > 0) {
					minVal = 0;
				}
				else if (maxVal < 0) {
					maxVal = 0;
				}
				tickValues = [lastVal];
				if (lastVal !== 0 ) {
					addTick(0, tickValues);
				}
				if (maxVal !== 0) {
					addTick(maxVal, tickValues);
				}
				if (minVal !== 0) {
					addTick(minVal, tickValues);
				}
				maxTickVal = d3.max(tickValues);
				xAxis.tickValues(tickValues)
					.tickFormat(function (d) {
						var formatted;
						switch(d) {
							case maxTickVal :
								formatted =  labelFormat(d) + " " + unit;
								break;
							case 0 :
								formatted = "0";
								break;
							default :
								formatted = labelFormat(d);
						}
						return formatted;
					});
				svg.select(".chart-group")
					.append("g")
					.attr("class", "x axis")
					.attr("transform", "translate(0," + chartHeight + ")")
					.call(xAxis);
			}
		}
		// checks to see if the tick values are too close together - very smart!
		function addTick( val, tickValues) {
			if ( tickValues.every( function (tv) {
				return (Math.abs(xScale(tv) - xScale(val)) > 50 );
			}) ) {
				tickValues.push(val);
			}
		}
		function drawYAxis() {
			var padding = -15;
			svg.select(".y.axis").remove();
			if ( chartHeight > 0 ) {
				var yAxis = d3.axisLeft()
						.scale(yScale);
						//.tickSize(1);
				svg.select(".chart-group")
					.append("g")
					.attr("class", "y axis")
					.attr("transform", "translate(" + padding + ",0)")
					.call(yAxis)
					.selectAll(".tick text")
					.attr("font-size", "1.2em")
					.call(wrap, yAxisWidth - 10);
			}
		}
		function defineEndMarker() {
			// Define marker as red triangle
			svg.append("defs").append("marker")
				.attr("id", "arrowhead")
				.attr("viewBox", "0 0 10 10")
				.attr("refX", 10)
				.attr("refY", 5)
				.attr("markerWidth", 6)
				.attr("markerHeight", 6)
				.attr("orient", "auto")
				.append("path")
				.attr("d", "M 0 0 L 10 5 L 0 10 z")
				.style("fill", d3.rgb(colour_plus).darker(2));
		}
		function drawStartingLine() {
			var lineColor = d3.rgb(colour_plus).darker(2);
			svg.select(".top.axis").remove();
			svg.select(".starting-line").remove();
			if (chartHeight > 0) {
				var xAxis = d3.axisTop()
					.scale(xScale)
					.tickValues([0])
					.tickFormat(d3.format("d")),
					x0 = xScale(0),
					chartGroup = svg.select(".chart-group");
				chartGroup.append("g")
					.attr("class", "top axis")
					.call(xAxis);
				chartGroup.append("line")
					.attr("class", "starting-line")
					.attr("x1", x0)
					.attr("y1", 0)
					.attr("x2", x0)
					.attr("y2", chartHeight);
				// add 0 line (vertical)
				chartGroup.append("line")
					.attr("class", "starting-line")
					.attr("x1", x0)
					.attr("y1", 0)
					.attr("x2", x0)
					.attr("y2", chartHeight)
					.style("stroke", lineColor)
			}
		}
		function drawWaterfall() {
			var chartGroup, barGroup,
				lineColor = d3.rgb(colour_plus).darker(2);
			chartGroup = svg.select(".chart-group");

			if (segments && segments.length > 0) {
				console.log("in the draw if");
				// Draw bars
				barGroup = chartGroup.selectAll(".bar.g")
					.data(segments);
				barGroup.enter().append("g")
					.attr("class", "bar g");
				barGroup.exit().remove();
				
				barGroup.enter().append("rect") // v3 to v4 >> add an enter...
					.merge(barGroup)
					.attr("class", "bar rect")
					.attr("height", segmentHeight)
					.attr("x", function (d) {
						console.log("d.x", d.x);
						return d.x;
					})
					.attr("y", function (d) {
						console.log("d.y", d.y);
						return d.y;
					})
					.attr("width", function (d) {
						console.log("d.width", d.width);
						return d.width > 0 ? d.width : 0.1;
					})
					.style("fill", function(d){return d.value>0 ? colour_plus : colour_minus})//color)
					.style("stroke", function(d){return d.value>0 ? d3.rgb(colour_plus).darker(2) : d3.rgb(colour_minus).darker(2)})
					;//lineColor);
				
					// Label bars
				barGroup.enter().append("text") // v3 to v4 >> add an enter...
					.merge(barGroup) // not needed
					.attr("class", "bar text")
					.attr("font-size", "1.0em")
					.attr("x", function (d) {
						return d.labelX;
					})
					.style("text-anchor", function (d) {
						return d.labelAnchor;
					})
					.attr("y", function (d) {
						return d.y + (segmentHeight / 2);
					})
					.attr("dy", ".5em")
					.text(function (d) {
						return labelFormat(d.value);
					});
				// Connect bars
				barGroup.enter().append("line")
					.attr("class", "bar line")
					.attr("x1", function (d) {
						return d.endX;
					})
					.attr("y1", function (d) {
						return d.y + segmentHeight;
					})
					.attr("x2", function (d) {
						return d.endX;
					})
					.attr("y2", function (d) {
						return d.y + segmentHeight + segmentPadding;
					})
					.style("stroke", lineColor);
			}
		}

		function drawEndMarker() {
			var connectors = svg.selectAll(".bar.line");
			if (connectors.size() > 0) {
				var lastIndex = connectors.size() - 1;
				//console.log(connectors);
				connectors.filter(function(d, i) { return i === lastIndex; })
							.attr("marker-end", "url(#arrowhead)");
			}
		}

	createSvg("#"+id_figure);
	drawXAxis();
	drawYAxis();
	drawStartingLine();
	drawWaterfall();
	defineEndMarker();
	drawEndMarker();	
}
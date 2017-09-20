/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


var current_feature = null;
var current_feature_interval=null;

var feature_scores = [];


var coloursRainbow = ["#2c7bb6", "#00a6ca","#00ccbc","#90eb9d","#ffff8c","#f9d057","#f29e2e","#e76818","#d7191c"];
var colourRangeRainbow = d3.range(0, 1, 1.0 / (coloursRainbow.length - 1));
colourRangeRainbow.push(1);

//Create color gradient
var colorScaleRainbow = d3.scale.linear()
    .domain(colourRangeRainbow)
    .range(coloursRainbow)
    .interpolate(d3.interpolateHcl);

//Needed to map the values of the dataset to the color scale
var colorInterpolateRainbow = d3.scale.linear()
    .domain(d3.extent(feature_scores))
    .range([0,1]);



function runDataMining() {
    
    //request_feature_application_status();
    
	document.getElementById('tab3').click();
    highlight_support_panel()
    
    // If the target selection hasn't changed, then use previously obtained driving features to display
    if(selection_changed == false && mined_features != null){
		display_drivingFeatures(all_features);
		return;
	}
    
    // Remove all highlights in the scatter plot (retain target solutions)
    cancelDotSelections('remove_highlighted');

    var selectedArchs = d3.selectAll(".dot.archPlot.selected:not(.hidden)")[0];
    var nonSelectedArchs =  d3.selectAll(".dot.archPlot:not(.selected):not(.hidden)")[0];
    
    var numOfSelectedArchs = selectedArchs.length;
    var numOfNonSelectedArchs = nonSelectedArchs.length;
    
    if (numOfSelectedArchs==0){
    	alert("First select target solutions!");
    }else{        
        // Experiment: Store information
        buttonClickCount_drivingFeatures += 1;
        getDrivingFeatures_numOfArchs.push({numOfSelectedArchs,numOfNonSelectedArchs});
        getDrivingFeatures_thresholds.push({supp:support_threshold,lift:lift_threshold,conf:confidence_threshold});
        
        // Store the id's all all dots
        var selected = [];
        var non_selected = [];
        selected.length = 0;
        non_selected.length=0;

        for (var i = 0; i < numOfSelectedArchs; i++) {
            var id = selectedArchs[i].__data__.id;
            selected.push(id);
        }
        for (var i = 0; i < numOfNonSelectedArchs; i++) {
            var id = nonSelectedArchs[i].__data__.id;
            non_selected.push(id);
        }

		
		var build_classification_tree = false;

        
        mined_features = generateDrivingFeatures(selected,non_selected,support_threshold,confidence_threshold,lift_threshold,userdef_features,"lift",build_classification_tree);
        
        all_features = mined_features.concat(added_features);

        if(all_features.length==0){
        	return;
        }
        display_drivingFeatures(all_features);
        

        selection_changed = false;
        update_feature_application_status('', 'create_placeholder');
    }
}




function generateDrivingFeatures(selected,non_selected,
		support_threshold,confidence_threshold,lift_threshold,
		userdef_features,sortBy,build_classification_tree){
	
	var output;
    $.ajax({
        url: "/api/data-mining/get-driving-features/",
        type: "POST",
        data: {ID: "get_driving_features",
        	selected: JSON.stringify(selected),
        	non_selected:JSON.stringify(non_selected),
        	supp:support_threshold,
        	conf:confidence_threshold,
        	lift:lift_threshold,
        	userDefFilters:JSON.stringify(userdef_features),
        	sortBy:sortBy,
        	apriori:turn_on_apriori,
			build_classification_tree:build_classification_tree},
        async: false,
        success: function (data, textStatus, jqXHR)
        {
        	if(data=="[]"){
        		alert("No driving feature mined. Please try modifying the selection. (Try selecting more designs)");
        	}
        	output = data;
        },
        error: function (jqXHR, textStatus, errorThrown)
        {alert("error");}
    });
    
    return output;
}


function sortDrivingFeatures(drivingFeatures,sortBy){
	
	var newlySorted = [];
	newlySorted.length=0;
	
	for (var i=0;i<drivingFeatures.length;i++){
		
		var thisDF = drivingFeatures[i];
		var value=0;
		var maxval = 1000000000;
		var minval = -1;
		
		if(newlySorted.length==0){
			newlySorted.push(thisDF);
			continue;
		}
		
		var metrics = thisDF.metrics;
	       
        if(sortBy=="lift"){
            value = thisDF.metrics[1];
            maxval = newlySorted[0].metrics[1];
            minval = newlySorted[newlySorted.length-1].metrics[1];
        } else if(sortBy=="supp"){
            value = thisDF.metrics[0];
            maxval = newlySorted[0].metrics[0];
            minval = newlySorted[newlySorted.length-1].metrics[0];
        } else if(sortBy=="confave"){
            value = (thisDF.metrics[2] + thisDF.metrics[3])/2;
            maxval = (newlySorted[0].metrics[2] + newlySorted[0].metrics[3])/2;
            minval = (newlySorted[newlySorted.length-1].metrics[2]+newlySorted[newlySorted.length-1].metrics[3])/2;
        } else if(sortBy=="conf1"){
            value = thisDF.metrics[2];
            maxval = newlySorted[0].metrics[2];
            minval = newlySorted[newlySorted.length-1].metrics[2];
        } else if(sortBy=="conf2"){
            value = thisDF.metrics[3];
            maxval = newlySorted[0].metrics[3];
            minval = newlySorted[newlySorted.length-1].metrics[3];
        }
		
		if(value>=maxval){
			newlySorted.splice(0,0,thisDF);
		} else if (value<=minval){
			newlySorted.push(thisDF);
		} else {
			for (var j=0;j<newlySorted.length;j++){
				var refval=0; var refval2=0;
				
				if(sortBy=="lift"){
					refval=newlySorted[j].metrics[1];
					refval2=newlySorted[j+1].metrics[1];
				} else if(sortBy=="supp"){
					refval=newlySorted[j].metrics[0];
					refval2=newlySorted[j+1].metrics[0];
				} else if(sortBy=="confave"){
					refval=(newlySorted[j].metrics[2]+newlySorted[j].metrics[3])/2
					refval2=(newlySorted[j+1].metrics[2]+newlySorted[j+1].metrics[3])/2
				} else if(sortBy=="conf1"){
					refval=newlySorted[j].metrics[2];
					refval2=newlySorted[j+1].metrics[2];
				} else if(sortBy=="conf2"){
					refval=newlySorted[j].metrics[3];
					refval2=newlySorted[j+1].metrics[3];
				}
				if(value <=refval && value > refval2){
					newlySorted.splice(j+1,0,thisDF); break;
				}
		
			}
		}
	}         
	return newlySorted;
}





function display_drivingFeatures(source){
    
    // Set variables
    var margin = DrivingFeaturePlot_margin;
    var width = DrivingFeaturePlot_width;
    var height = DrivingFeaturePlot_height;
    
    var xScale = DrivingFeaturePlot_xScale;
    var yScale = DrivingFeaturePlot_yScale;
    var xAxis = DrivingFeaturePlot_xAxis;
    var yAxis = DrivingFeaturePlot_yAxis;
    
    // Remove previous plot
    d3.select("#view3").select("g").remove();
    
    var tab = d3.select('#view3').append('g');
    
    // Create plot div's
    tab.append('div')
        .attr('id','dfplot_div')
        .style('width', width + margin.left + margin.right)
        .style('height', height + margin.top + margin.bottom);
    
    tab.append('div')
        .attr('id','dfplot_venn_diagram')
        .append('div')
        .text('Total number of designs: ' + numOfArchs());
    
    // Create a new svg
    var svg = d3.select("#dfplot_div")
        .append("svg")
        .attr('id','dfplot_svg')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    update_drivingFeatures(source);
    
}





function update_drivingFeatures(source){
    
    // Set variables
    var margin = DrivingFeaturePlot_margin;
    var width = DrivingFeaturePlot_width;
    var height = DrivingFeaturePlot_height;
    
    var xScale = DrivingFeaturePlot_xScale;
    var yScale = DrivingFeaturePlot_yScale;
    var xAxis = DrivingFeaturePlot_xAxis;
    var yAxis = DrivingFeaturePlot_yAxis;    
    
    
    var duration = d3.event && d3.event.altKey ? 5000 : 500;
    
    

    
    
    
    // Store driving features information
    var drivingFeatures = source;
    var drivingFeatureTypes = [];
    
    var df_i=0;
    var lifts = [];
    var supps = [];
    var conf1s=[];
    var conf2s=[];
    var scores=[];    
    var maxScore = -1;
    var bestFeatureIndex = 0;
    
    for (var i=0;i<source.length;i++){
        lifts.push(source[i].metrics[1]);
        supps.push(source[i].metrics[0]);
        conf1s.push(source[i].metrics[2]);
        conf2s.push(source[i].metrics[3]);
        
        var score = 1-Math.sqrt(Math.pow(1-conf1s[i],2)+Math.pow(1-conf2s[i],2));
        scores.push(score);
        
        if(score > maxScore){
            maxScore = score;
            bestFeatureIndex = i;
        }
        drivingFeatureTypes.push(pp_feature_type(source[i].name));
    }
    
    // Add utopia point to the list
    var max_conf1 = Math.max.apply(null, conf1s);
    var max_conf2 = Math.max.apply(null, conf2s);
    var max_conf = Math.max(max_conf1, max_conf2);
    
    source.push({id:"NA",name:"utopiaPoint",expression:"NA",metrics:[Math.max.apply(null, lifts),Math.max.apply(null, supps),max_conf,max_conf]});
    
    
    
    
    
    // Set the axis to be Conf(F->S) and Conf(S->F)
    var x = 2;
    var y = 3;
    
    // setup x
    // data -> value
    xValue = function (d) {
        return d.metrics[x];
    }; 
    // value -> display
    xScale = d3.scale.linear().range([0, width]); 
    
    // don't want dots overlapping axis, so add in buffer to data domain 
    xBuffer = (d3.max(source, xValue) - d3.min(source, xValue)) * 0.05;
    
    xScale.domain([d3.min(source, xValue) - xBuffer, d3.max(source, xValue) + xBuffer]);

    // data -> display
    xMap = function (d) {
        return xScale(xValue(d));
    }; 
    xAxis = d3.svg.axis().scale(xScale).orient("bottom");


    // setup y
    // data -> value
    yValue = function (d) {
        return d.metrics[y];
    };
    // value -> display
    yScale = d3.scale.linear().range([height, 0]); 

    yBuffer = (d3.max(source, yValue) - d3.min(source, yValue)) * 0.05;
    yScale.domain([d3.min(source, yValue) - yBuffer, d3.max(source, yValue) + yBuffer]);
    // data -> display
    yMap = function (d) {
        return yScale(yValue(d));
    }; 
    yAxis = d3.svg.axis().scale(yScale).orient("left");
    
    

    
    for(var i=0;i<source.length;i++){
        source[i].x = xMap(source[i]);
        source[i].y = yMap(source[i]);
    }
    
    


    
//    feature_scores = scores;
//    feature_scores.push(Math.max.apply(null,feature_scores)+0.2); // Set color for the utopia point
//    
//    
//    
//    ///////////////////////////////////////////////////////////////////////////
//    //////////// Get continuous color scale for the Rainbow ///////////////////
//    ///////////////////////////////////////////////////////////////////////////
//
//    //Needed to map the values of the dataset to the color scale
//    colorInterpolateRainbow = d3.scale.linear()
//        .domain(d3.extent(feature_scores))
//        .range([0,1]);


    
//
//    // Set zoom
//    d3.select('#dfplot_svg').call(
//            d3.behavior.zoom()
//            .x(xScale)
//            .y(yScale)
//            .scaleExtent([0.5, 30])
//            .on("zoom", function (d) {
//
//                var scale = d3.event.scale;
//
//                d3.select('#dfplot_svg').select(".x.axis").call(xAxis);
//                d3.select('#dfplot_svg').select(".y.axis").call(yAxis);
//                
//                d3.selectAll('.dot.dfplot')
//                    .attr("transform", function (d) {
//                        var xCoord = xMap(d);
//                        var yCoord = yMap(d);
//                        return "translate(" + xCoord + "," + yCoord + ")";
//                    });
//                
//                
////                svg.selectAll("[class=bar]")
////                        .attr("transform",function(d){
////                            var xCoord = xScale_df(d.id);
////                            return "translate(" + xCoord + "," + 0 + ")";
////                        })
////                        .attr("width", function(d){
////                            return dfbar_width*scale;
////                        });
////                })
////        
////                objects.select(".hAxisLine").attr("transform", "translate(0," + yScale(0) + ")");
////                objects.select(".vAxisLine").attr("transform", "translate(" + xScale(0) + ",0)");
//
//        
//            })
//        )
//            .append("g")        
//            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

     
                
    // x-axis
    svg.append("g")
            .attr("class", "x axis dfplot")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .append("text")
            .attr("class", "label")
            .attr("x", width)
            .attr("y", -6)
            .style("text-anchor", "end")
            .text('Confidence(F->S)')
            .style('font-size','15px');

    // y-axis
    svg.append("g")
            .attr("class", "y axis dfplot")
            .call(yAxis)
            .append("text")
            .attr("class", "label")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text('Confidence(S->F)')
            .style('font-size','15px');

                


    var objects = svg.append("svg")
            .attr("class", "objects dfplot")
            .attr("width", width)
            .attr("height", height)
            .style('margin-bottom','30px');


    //Create main 0,0 axis lines:
    objects.append("svg:line")
            //.attr("class", "axisLine hAxisLine")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", width)
            .attr("y2", 0)
            .attr("transform", "translate(0," + (yScale(0)) + ")");
    objects.append("svg:line")
            //.attr("class", "axisLine vAxisLine")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 0)
            .attr("y2", height)
            .attr("transform", "translate(" + (xScale(0)) + ",0)");
    
    // Create dots
    objects.selectAll(".dot.dfplot")
            .data(source, function(d){return (d.id = df_i++);})
            .enter()
            .append('path')
            .attr('class','point dot dfplot')
            .attr("d", d3.svg.symbol().type('triangle-up').size(120))
            .attr("transform", function (d) {
                var xCoord = xMap(d);
                var yCoord = yMap(d);
                return "translate(" + xCoord + "," + yCoord + ")";
            })
            .style("stroke-width",1);
    
    var dots = d3.selectAll('.dot.dfplot');
    
    // Utopia point
    get_utopia_point().attr('d',d3.symbol().type(d3.symbolStar).size(120));
       
    // The current feature
    current_feature = get_current_feature();
    current_feature.attr('d',d3.symbol().type(d3.symbolCross).size(120))
                .style('fill',"#66F8A8");
    
    current_feature.shown=true;
    
    function blink() {
        if(current_feature.shown) {
            current_feature.style("opacity",0);
            current_feature.shown = false;
        } else {
            current_feature.style("opacity",1);
            current_feature.shown = true;
        }
    }

    if(current_feature_interval != null){
       clearInterval(current_feature_interval);
    }
    current_feature_interval = setInterval(blink, 500);
    

    // Update color scale
    //updateDrivingFeatureColorScale(color_drivingFeatures4);
    
    
    dots.filter(function(d,i){
        if(d.name=="utopiaPoint"){
            return false;
        }
        return true;
    }).on("mouseover", feature_mouseover)
        .on('mouseout', feature_mouseout)
        .on('click', feature_click);   
    
    // Best feature so far
//    d3.selectAll('.dot.dfplot')[0].forEach(function(d,i){
//        if(bestFeatureIndex==i){
//            d3.select(d).style('fill','blue');
//        } 
//    });
    
    
    
//    var legend = svg.selectAll(".legend")
//      .data(color.domain())
//    .enter().append("g")
//      .attr("class", "legend")
//      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
//
//    legend.append("rect")
//      .attr("x", width - 18)
//      .attr("width", 18)
//      .attr("height", 18)
//      .style("fill", color);
//
//    legend.append("text")
//      .attr("x", width - 24)
//      .attr("y", 9)
//      .attr("dy", ".35em")
//      .style("text-anchor", "end")
//      .text(function(d) { return d; });
    
    

///////////////////////////////////////////////////////////////////////////
//////////////////// Create the Rainbow color gradient ////////////////////
///////////////////////////////////////////////////////////////////////////


    ////Calculate the gradient	
    //d3.select('#view3').select('#dfplot_div').select('svg').append("linearGradient")
    //	.attr("id", "gradient-rainbow-colors")
    //	.attr("x1", "0%").attr("y1", "0%")
    //	.attr("x2", "100%").attr("y2", "0%")
    //	.selectAll("stop") 
    //	.data(coloursRainbow)                  
    //	.enter().append("stop") 
    //	.attr("offset", function(d,i) { return i/(coloursRainbow.length-1); })   
    //	.attr("stop-color", function(d) { return d; });

    //Transition the colors to a rainbow
    function updateRainbow() {
        //Fill the legend rectangle
    //	svg.select(".legendRect")
    //		.style("fill", "url(#gradient-rainbow-colors)");

        //Transition the colors
        d3.selectAll(".dot.dfplot")
            //.transition().duration(0)
            .style("fill", function (d,i) { return colorScaleRainbow(colorInterpolateRainbow(feature_scores[i])); })
    }//updateRainbow
    
    updateRainbow();

    
    source.splice(source.length-1,1);
    
    // The current feature
    get_current_feature().style('fill',"black");
    
    
    
    
    
    
    
}
            



function linspace(start, end, n) {
    var out = [];
    var delta = (end - start) / (n - 1);
    var i = 0;
    while(i < (n - 1)) {
        out.push(start + (i * delta));
        i++;
    }
    out.push(end);
    return out;
}

//function updateDrivingFeatureColorScale(scale){
//    
//    var num = added_features.length;
//    if(num==0) num = 1;
//    
//    // Create color scale
//    DrivingFeaturePlot_colorScale = d3.scale.linear()
//                .domain(linspace(num,0,scale.length))
//                .range(scale);
//    
//    d3.selectAll('.dot.dfplot')[0].forEach(function(d){
//        
//        var added = +d.__data__.added;
//        var utopia = d.__data__.name=="utopiaPoint";
//        
//        if(added==null || isNaN(added)){
//            added = "0";
//        }
//        d3.select(d).style('fill',function(d){
//            if(utopia){
//                return "#FFDF00";
//            }else{
//                return DrivingFeaturePlot_colorScale(added);
//            }
//        });
//        
//    })
//}



























function feature_click(d){
    // Replaces the current feature expression with the stashed expression
    update_feature_application_status('', 'replace_placeholder');
    
}
            


function feature_mouseover(d){
    
    numOfDrivingFeatureViewed = numOfDrivingFeatureViewed+1;
    
    var id= d.id; 
    var expression = d.expression;
    var metrics = d.metrics;
    var conf = d.metrics[2];
    var conf2 = d.metrics[3];
    
//    d3.selectAll('.dot.dfplot')[0].forEach(function(d){
//        if(d.__data__.id==id){
//            d3.select(d).style("fill", highlightedColor_mouseover);
//        }
//    });
    

    // Set variables
    var margin = DrivingFeaturePlot_margin;
    var width = DrivingFeaturePlot_width;
    var height = DrivingFeaturePlot_height;
                	
    var mouseLoc_x = d3.mouse(d3.select(".objects.dfplot")[0][0])[0];
    var mouseLoc_y = d3.mouse(d3.select(".objects.dfplot")[0][0])[1];
    
    var tooltip_location = {x:0,y:0};
    var tooltip_width = 360;
    var tooltip_height = 200;
    
    var h_threshold = (width + margin.left + margin.right)*0.5;
    var v_threshold = (height + margin.top + margin.bottom)*0.55;
    

    if(mouseLoc_x >= h_threshold){
        tooltip_location.x = -10 - tooltip_width;
    } else{
        tooltip_location.x = 10;
    }
    if(mouseLoc_y < v_threshold){
        tooltip_location.y = 10;
    } else{
        tooltip_location.y = -10 -tooltip_height;
    }
    
    var svg = d3.select(".objects.dfplot");
    var tooltip = svg.append("g")
                    .attr("id","tooltip_g");
    
    tooltip.append("rect")
                .attr("id","tooltip_rect")
                .attr("transform", function(){
                    var x = mouseLoc_x + tooltip_location.x;
                    var y = mouseLoc_y + tooltip_location.y;
                    return "translate(" + x + "," + y + ")";
                 })
                .attr("width",tooltip_width)
                .attr("height",tooltip_height)
                .style("fill","#4B4B4B")
                .style("opacity", 0.92);    
    
    var fo = tooltip
                    .append("foreignObject")
                    .attr('id','tooltip_foreignObject')
                    .attr("x",function(){
                        return mouseLoc_x + tooltip_location.x;
                    })
                    .attr("y",function(){
                       return mouseLoc_y + tooltip_location.y; 
                    })
                    .attr({
                        'width':tooltip_width,
                        'height':tooltip_height  
                    })
                    .data([{id:id, expression:expression, metrics:metrics}]) 
                    .html(function(d){
                        var output= "" + pp_feature(d.expression) + "<br><br> lift: " + round_num_fourth_dec(d.metrics[1]) + 
                        "<br> Support: " + round_num_fourth_dec(d.metrics[0]) + 
                        "<br> Confidence(F->S): " + round_num_fourth_dec(d.metrics[2]) + 
                        "<br> Confidence(S->F): " + round_num_fourth_dec(d.metrics[3]) +"";
                        return output;
                    }).style("padding","8px")
                    .style('color','#F7FF55')
                    .style('word-wrap','break-word');   
    
    
    // Update the placeholder with the driving feature and stash the expression
    update_feature_application_status(expression,'update_placeholder');
    
    applyComplexFilter(get_feature_application_expression(stashed_feature_application));
    draw_venn_diagram();           
    
}


function feature_mouseout(d){
    
    var id = d.id;
    
//    // Changing the color back to what it was
//    d3.selectAll('.dot.dfplot')[0].forEach(function(d){
//        
//        if(d.__data__.id==id){
//            var added = + d.__data__.added;
//            if(added==null || isNaN(added)) added="0";
//            
//            d3.select(d).style('fill',function(d){
//                return DrivingFeaturePlot_colorScale(added);
//            });
//        }
//    });
    
    // Remove the tooltip
    d3.selectAll("#tooltip_g").remove();
    
    // Remove all the features created temporarily
    d3.selectAll('.applied_feature').remove();
    
    // Bring back the previously stored feature expression
    update_feature_application_status('','update_placeholder');
    
    applyComplexFilter(get_feature_application_expression());
    draw_venn_diagram();
}



function draw_venn_diagram(){

    var venn_diagram_container = d3.select('#dfplot_venn_diagram').select('div');
    if(venn_diagram_container[0][0]==null) return;
    
    
	venn_diagram_container.select("svg").remove();
	var svg_venn_diag = venn_diagram_container
								.append("svg")
					    		.style('width','320px')  			
								.style('border-width','3px')
								.style('height','305px')
								.style('border-style','solid')
								.style('border-color','black')
								.style('border-radius','40px')
								.style('margin-top','10px')
								.style('margin-bottom','10px'); 
    
    var total = numOfArchs();
    var intersection = d3.selectAll('.dot.archPlot.selected.highlighted')[0].length;
    var selected = d3.selectAll('.dot.archPlot.selected')[0].length;
    var highlighted = d3.selectAll('.dot.archPlot.highlighted')[0].length;
    
    
    var left_margin = 50;
    var c1x = 110;
    // Selection has a fixed radius
    var r1 = 70;
    var S_size = selected;
    
	svg_venn_diag
		.append("circle")
		.attr("id","venn_diag_c1")
	    .attr("cx", c1x)
	    .attr("cy", 180-30)
	    .attr("r", r1)
	    .style("fill", "steelblue")
	    .style("fill-opacity", ".5");
    
	svg_venn_diag
		.append("text")
        .attr("id","venn_diag_c1_text")
		.attr("x",c1x-90)
		.attr("y",180+r1+50-30)
		.attr("font-family","sans-serif")
		.attr("font-size","18px")
		.attr("fill","steelblue")
		.text("Selected:" + S_size );
    
    var supp, conf, conf2, lift;
    
    if(intersection==0){
        var supp = 0;
        var F_size = highlighted;
    }else if(highlighted==0){
        var supp = 0;
        var F_size = 0;
    }else{
        
        var p_snf = intersection/total;
        var p_s = selected/total;
        var p_f = highlighted/total;

        supp = p_snf;
        conf = supp / p_f;
        conf2 = supp / p_s;
        lift = p_snf/(p_f*p_s); 

        var F_size = supp * 1/conf * total;
        var S_size = supp * 1/conf2 * total;


        // Feature 
        var	r2 = Math.sqrt(F_size/S_size)*r1;
        var a1 = Math.PI * Math.pow(r1,2);
        var a2 = Math.PI * Math.pow(r2,2);
        // Conf(F->S) * |F| = P(FnS)
        var intersection = supp * numOfArchs() * a1 / S_size;
        
        var c2x;
        if (conf2 > 0.999){
            c2x = c1x + r2 - r1;
        }else{
            var dist;
            $.ajax({
                url: "/api/ifeed/venn-diagram-distance/",
                type: "POST",
                data: {a1: a1,
                       a2: a2,
                       intersection: intersection},
                async: false,
                success: function (data, textStatus, jqXHR)
                {
                    dist = + data;
                },
                error: function (jqXHR, textStatus, errorThrown)
                {alert("error");}
            });
            c2x = c1x + dist;
        }
        
        svg_venn_diag
            .append("circle")
            .attr("id","venn_diag_c2")
            .attr("cx", c2x)
            .attr("cy", 180-30)
            .attr("r", r2)
            .style("fill", "brown")
            .style("fill-opacity", ".5");
        
    }
	
	
	svg_venn_diag
		.append("text")
        .attr("id","venn_diag_int_text")
		.attr("x",left_margin-10)
		.attr("y",70-30)
		.attr("font-family","sans-serif")
		.attr("font-size","18px")
		.attr("fill","black")
		.text("Intersection: " + Math.round(supp * total));
	

	svg_venn_diag
		.append("text")
        .attr("id","venn_diag_c2_text")
		.attr("x",c1x+60)
		.attr("y",180+r1+50-30)
		.attr("font-family","sans-serif")
		.attr("font-size","18px")
		.attr("fill","brown")
		.text("Features:" + Math.round(F_size) );
}




function add_current_feature_to_DF_plot(expression){
    
    if(!selection_changed && all_features.length!=0){

        var id = all_features.length;
        var total = numOfArchs();
        var intersection = d3.selectAll('.dot.archPlot.selected.highlighted')[0].length;
        var selected = d3.selectAll('.dot.archPlot.selected')[0].length;
        var highlighted = d3.selectAll('.dot.archPlot.highlighted')[0].length;

        var p_snf = intersection/total;
        var p_s = selected/total;
        var p_f = highlighted/total;

        var supp = p_snf;
        var conf = supp / p_f;
        var conf2 = supp / p_s;
        var lift = p_snf/(p_f*p_s); 
        var metrics = [supp, lift, conf, conf2];
        
        // Remove the last element from the array
        //last_added_feature = added_features.slice(-1)[0]
        last_added_feature = added_features[added_features.length-1];
        
        
        // If added_features is not an empty array
        if(last_added_feature != null){
            // If no change was made to the feature in terms of the metrics
            if(Math.abs(last_added_feature.metrics[2]-conf) < 0.001 && Math.abs(last_added_feature.metrics[3] - conf2) < 0.001){
               return;
            }
        }
        
        
        var this_feature = {id:id,name:expression,expression:expression,metrics:metrics,added:"0"};
        
        // Remove the first element if there are already 2 features added
//        if(added_features.length >= 2){
//           added_features.splice(0,1);
//        }
    
        
        // Add new feature to the list of added features
        if(expression!=""){
            added_features.push(this_feature);
        }
        
        // Assign new indices for the added features
        for(var i=0;i<added_features.length;i++){
            added_features[i].added = ""+added_features.length-1-i;
        }
        
        all_features = mined_features.concat(added_features);
        
        document.getElementById('tab3').click();
        highlight_support_panel()
        
        // Display the driving features with newly added feature
        display_drivingFeatures(all_features);
    }
}





function get_utopia_point(){
    
    // Utopia point
    return d3.selectAll('.dot.dfplot').filter(function(d){
        if(d.name=="utopiaPoint"){
           return true;
        }
        return false;
    });
}


function get_current_feature(){
    
    // The current feature
    return d3.selectAll('.dot.dfplot').filter(function(d){
        if(d.added=="0"){
           return true;
        }
        return false;
    });
    
}





function check_dominance(metrics1,metrics2){
    
    if(
        (metrics1[2] >= metrics2[2] && metrics1[3] > metrics2[3]) || 
        (metrics1[2] > metrics2[2] && metrics1[3] >= metrics2[3]) 
    ){
        return true; // feature 1 dominates feature 2
    }
    return false;
}


function get_non_dominated_features(){

    var non_dominated = [];
    
    for(var i=0;i<all_features.length;i++){
        
        var dominated = false;
        
        for(var j=0;j<all_features.length;j++){
            
            if(i==j){
                continue;
                
            }else if(check_dominance(all_features[j].metrics,all_features[i].metrics)){
                // all_features[j] dominates all_features[i]. i.e. features[i] is dominated
                dominated=true;
                break;
            }
        }
        
        if(dominated==false){
           non_dominated.push(i);
        }
    }
    
    return non_dominated;
}







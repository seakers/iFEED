

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */





function runDataMining() {
    
    //request_feature_application_status();
    
	document.getElementById('tab3').click();
    highlight_support_panel()
    
    // If the target selection hasn't changed, then use previously obtained driving features to display
    if(selection_changed == false && sortedDFs != null){
		display_drivingFeatures(sortedDFs,"lift");
		return;
	}
    
    // Remove all highlights in the scatter plot (retain target solutions)
    cancelDotSelections('remove_highlighted');
	
    var selectedArchs = d3.selectAll(".dot.archPlot.selected")[0];
    var nonSelectedArchs =  d3.selectAll(".dot.archPlot:not(.selected)")[0];
    
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
//        if(testType=="3" && turn_on_apriori==false){
//			build_classification_tree = true;
//           //jsonObj_tree = buildClassificationTree();
//        }
        
        
        sortedDFs = generateDrivingFeatures(selected,non_selected,support_threshold,confidence_threshold,lift_threshold,userdef_features,"lift",build_classification_tree);
        
        sortedDFs = sortedDFs.concat(added_features);

        
        if(sortedDFs.length==0){
        	return;
        }
        
        
        display_drivingFeatures(sortedDFs,"lift");
        

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
    
    var numFeatures = source.length;
    

    // Store driving features information
    var drivingFeatures = source;
    var drivingFeatureTypes = [];
    
    
    var df_i=0;
    var lifts = [];
    var supps = [];
    var conf1s=[];
    var conf2s=[];
    
    for (var i=0;i<numFeatures;i++){
        lifts.push(source[i].metrics[1]);
        supps.push(source[i].metrics[0]);
        conf1s.push(source[i].metrics[2]);
        conf2s.push(source[i].metrics[3]);
        drivingFeatureTypes.push(pp_feature_type(source[i].name));
    }

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

    
    
    // Remove previous plot
    d3.select("#view3").select("g").remove();
    
    var tab = d3.select('#view3').append('g')
    
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
    
    
    // Set zoom
    d3.select('#dfplot_svg').call(
            d3.behavior.zoom()
            .x(xScale)
            .y(yScale)
            .scaleExtent([0.5, 30])
            .on("zoom", function (d) {

                var scale = d3.event.scale;

                d3.select('#dfplot_svg').select(".x.axis").call(xAxis);
                d3.select('#dfplot_svg').select(".y.axis").call(yAxis);
                
                d3.selectAll('.dot.dfplot')
                    .attr("transform", function (d) {
                        var xCoord = xMap(d);
                        var yCoord = yMap(d);
                        return "translate(" + xCoord + "," + yCoord + ")";
                    });
                
                
//                svg.selectAll("[class=bar]")
//                        .attr("transform",function(d){
//                            var xCoord = xScale_df(d.id);
//                            return "translate(" + xCoord + "," + 0 + ")";
//                        })
//                        .attr("width", function(d){
//                            return dfbar_width*scale;
//                        });
//                })
//        
//                objects.select(".hAxisLine").attr("transform", "translate(0," + yScale(0) + ")");
//                objects.select(".vAxisLine").attr("transform", "translate(" + xScale(0) + ",0)");

        
            })
        )
            .append("g")        
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

     
                
    
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
    var dots = objects.selectAll(".dot.dfplot")
            .data(source, function(d){return (d.id = df_i++);})
            .enter()
            .append('path')
            .attr('class','point dot dfplot')
            .attr("d", d3.svg.symbol().type('triangle-up').size(120))
            //.append("circle")
            //.attr("class", "dot dfplot")
            //.attr("r", 5.5)
            .attr("transform", function (d) {
                var xCoord = xMap(d);
                var yCoord = yMap(d);
                return "translate(" + xCoord + "," + yCoord + ")";
            })
            .style("stroke-width",1);
    
    // Update color scale
    updateDrivingFeatureColorScale(color_drivingFeatures3);

    dots.on("mouseover", feature_mouseover)
        .on('mouseout', feature_mouseout)
        .on('click', feature_click);     


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





function updateDrivingFeatureColorScale(scale){
    
    var num = added_features.length;
    if(num==0) num = 1;
    
    // Create color scale
    DrivingFeaturePlot_colorScale = d3.scale.linear()
                .domain(linspace(num,0,scale.length))
                .range(scale);
    
    d3.selectAll('.dot.dfplot')[0].forEach(function(d){
        
        var added = +d.__data__.added;
        if(added==null || isNaN(added)){
            added = 0;
        }
        
        d3.select(d).style('fill',function(d){
            return DrivingFeaturePlot_colorScale(added);
        });
        
    })
}

     

function feature_click(d){
    var id = d.id;
    var expression = d.expression;
    var option;

//    var was_selected = false;
//    for(var i=0;i<selected_features.length;i++){
//        if(selected_features[i]===id){
//            selected_features.splice(i,1);
//            selected_features_expressions.splice(i,1);
//            was_selected = true;
//        }
//    }
//    if(was_selected){
//        d3.selectAll("[class=bar]").filter(function(d){
//            if(d.id===id){
//                return true;
//            }else{
//                return false;
//            }
//        }).style("stroke-width",0);
//        option='remove';
//    }else{
//        d3.selectAll("[class=bar]").filter(function(d){
//            if(d.id===id){
//                return true;
//            }else{
//                return false;
//            }
//        }).style("stroke-width",3); 
//        selected_features.push(id);
//        selected_features_expressions.push(expression);
//        option='within';
//    }

    update_feature_application_status(expression, 'update_placeholder');    
}
            



function feature_mouseover(d){
    
    numOfDrivingFeatureViewed = numOfDrivingFeatureViewed+1;
    
    var id= d.id; 
    var expression = d.expression;
    var metrics = d.metrics;
    var conf = d.metrics[2];
    var conf2 = d.metrics[3];
    
    d3.selectAll('.dot.dfplot')[0].forEach(function(d){
        if(d.__data__.id==id){
            d3.select(d).style("fill", highlightedColor_mouseover);
        }
    });
    

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
    
    // If the placeholder is not included in the current feature expression, create one
    if(current_feature_expression.indexOf('tempFeature')==-1){
       update_feature_application_status('', 'create_placeholder');
    }
    
    applyComplexFilter(current_feature_expression.replace('{tempFeature}','('+expression+')'));
    
    draw_venn_diagram();           
}


function feature_mouseout(d){
    
    var id = d.id;
    
    d3.selectAll('.dot.dfplot')[0].forEach(function(d){
        
        if(d.__data__.id==id){
            var added = + d.__data__.added;
            if(added==null || isNaN(added)) added=0;
            
            d3.select(d).style('fill',function(d){
                return DrivingFeaturePlot_colorScale(added);
            });
        
        }
    });
    
    d3.selectAll("#tooltip_g").remove();
    
    applyComplexFilter(current_feature_expression);
    
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




function add_current_feature_to_DF_plot(){
    
    if(!selection_changed && sortedDFs.length!=0){
        var id = sortedDFs.length;
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
        
        for(var i=0;i<sortedDFs.length;i++){
            var matchFound = false;
            if(sortedDFs[i].expression==current_feature_expression){
                matchFound = true;
            }
        }
        if(matchFound) return;
        
        var current_feature = {id:id,name:current_feature_expression,expression:current_feature_expression,metrics:metrics,added:added_features.length+1};
        
        sortedDFs.push(current_feature);
        added_features.push(current_feature);
        
        document.getElementById('tab3').click();
        highlight_support_panel()
        
        // Display the driving features with newly added feature
        display_drivingFeatures(sortedDFs,'lift');
    }
}



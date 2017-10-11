/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var current_feature = {id:null,name:null,expression:null,metrics:null,added:"0",x0:-1,y0:-1,x:-1,y:-1};
var current_feature_blink_interval=null;
var utopia_point = {id:null,name:'utopiaPoint',expression:null,metrics:null,x0:-1,y0:-1,x:-1,y:-1};

var df_i=0;

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
    .domain(d3.extent([]))
    .range([0,1]);





function runDataMining() {
        
	document.getElementById('tab3').click();
    highlight_support_panel();
    
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
        //update_feature_application_status('', 'create_placeholder');
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






function display_drivingFeatures(source){
    
    // Set variables
    var margin = DrivingFeaturePlot_margin;
    var width = DrivingFeaturePlot_width;
    var height = DrivingFeaturePlot_height;
    df_i=0;
    
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
    
    var objects = svg.append("svg")
            .attr("class", "objects dfplot")
            .attr("width", width)
            .attr("height", height)
            .style('margin-bottom','30px');

    // Initialize
    for(var i=0;i<source.length;i++){
        source[i].x0 = -1;
        source[i].y0 = -1;
        source[i].id = df_i++;
    }
    
    update_drivingFeatures(source);
}





function update_drivingFeatures(source, remove_last_feature){
    

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


    // Set variables
    var margin = DrivingFeaturePlot_margin;
    var width = DrivingFeaturePlot_width;
    var height = DrivingFeaturePlot_height;
    
    var xScale = DrivingFeaturePlot_xScale;
    var yScale = DrivingFeaturePlot_yScale;
    var xAxis = DrivingFeaturePlot_xAxis;
    var yAxis = DrivingFeaturePlot_yAxis;    
    
    var duration = 500;
    
    var lifts = [];
    var supps = [];
    var conf1s=[];
    var conf2s=[];
    
    var scores=[];   
    var maxScore = -1;


    
    for (var i=0;i<all_features.length;i++){
        lifts.push(all_features[i].metrics[1]);
        supps.push(all_features[i].metrics[0]);
        conf1s.push(all_features[i].metrics[2]);
        conf2s.push(all_features[i].metrics[3]);
        var score = 1-Math.sqrt(Math.pow(1-conf1s[i],2)+Math.pow(1-conf2s[i],2));
        scores.push(score);
        
        if(score > maxScore){
            maxScore = score;
        }
    }
    
    // Add utopia point to the list
    var max_conf1 = Math.max.apply(null, conf1s);
    var max_conf2 = Math.max.apply(null, conf2s);
    var max_conf = Math.max(max_conf1, max_conf2);
    
    // Add utopia point
    utopia_point.metrics=[Math.max.apply(null, lifts),Math.max.apply(null, supps),max_conf,max_conf];
    
    // Insert the utopia point to the list of features
    all_features.splice(0, 0, utopia_point);
    
    // Add score for the utopia point (0.2 more than the best score found so far)
    scores.splice(0,0,Math.max.apply(null,scores)+0.2); 
    
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
    xBuffer = (d3.max(all_features, xValue) - d3.min(all_features, xValue)) * 0.05;
    
    xScale.domain([d3.min(all_features, xValue) - xBuffer, d3.max(all_features, xValue) + xBuffer]);

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

    yBuffer = (d3.max(all_features, yValue) - d3.min(all_features, yValue)) * 0.05;
    yScale.domain([d3.min(all_features, yValue) - yBuffer, d3.max(all_features, yValue) + yBuffer]);
    // data -> display
    yMap = function (d) {
        return yScale(yValue(d));
    }; 
    yAxis = d3.svg.axis().scale(yScale).orient("left");

    // Set the new locations of all the features
    for(var i=0;i<all_features.length;i++){
        all_features[i].x = xMap(all_features[i]);
        all_features[i].y = yMap(all_features[i]);
        if(!all_features[i].x0){
            // If previous location has not been initialize, save the current location
            all_features[i].x0 = all_features[i].x;
            all_features[i].y0 = all_features[i].y;
        }
    }
    

    //Needed to map the values of the dataset to the color scale
    colorInterpolateRainbow = d3.scale.linear()
        .domain(d3.extent(scores))
        .range([0,1]);

    // Set zoom
    d3.select('#dfplot_svg').call(
        
                d3.behavior.zoom()
                .x(xScale)
                .y(yScale)
                .scaleExtent([0.2, 50])
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
                })
        
            )
            .append("g")        
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

     
                
    var svg = d3.select('#dfplot_svg').select('g')
    
    d3.select('.x.axis.dfplot').remove();
    d3.select('.y.axis.dfplot').remove();
    d3.select('.axisLine.hAxisLine.dfplot').remove();
    d3.select('.axisLine.vAxisLine.dfplot').remove();
    
    // x-axis
    svg.append('g')
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
    svg.append('g')
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
    
    
    var objects = d3.select(".objects.dfplot")
    
    //Create main 0,0 axis lines:
    objects.append("svg:line")
            .attr("class", "axisLine hAxisLine dfplot")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", width)
            .attr("y2", 0)
            .attr("transform", "translate(0," + yScale(0) + ")");
    
    objects.append("svg:line")
            .attr("class", "axisLine vAxisLine dfplot")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 0)
            .attr("y2", height)
            .attr("transform", "translate(" + xScale(0) + ",0)");
    
    // Remove unnecessary points
    objects.selectAll('.dot.dfplot')
            .data(all_features)
            .exit()
            .remove();
    
    // Create new dots
    objects.selectAll(".dot.dfplot")
            .data(all_features)
            .enter()
            .append('path')
            .attr('class','point dot dfplot')
            .attr("d", d3.svg.symbol().type('triangle-up').size(120))
            .attr("transform", function (d) {
                return "translate(" + d.x0 + "," + d.y0 + ")";
            })
            .style("stroke-width",1);
    
            
    // Utopia point: modify the shape to a star
    get_utopia_point().attr('d',d3.symbol().type(d3.symbolStar).size(120));
       
    // The current feature: modify the shape to a cross
    var _current_feature = get_current_feature().attr('d',d3.symbol().type(d3.symbolCross).size(120));
    
    _current_feature.shown=true;
    
    function blink() {
        if(_current_feature.shown) {
            _current_feature.style("opacity",0);
            _current_feature.shown = false;
        } else {
            _current_feature.style("opacity",1);
            _current_feature.shown = true;
        }
    }

    if(current_feature_blink_interval != null){
        clearInterval(current_feature_blink_interval);
        d3.selectAll('.dot.dfplot').filter(function(d){
            if(d.added=="1"){
               return true;
            }
            return false;
        }).style('opacity',1);
    }
    current_feature_blink_interval = setInterval(blink, 350);

    
    d3.selectAll('.dot.dfplot').filter(function(d,i){
            if(d.name=="utopiaPoint"){
                return false;
            }
            return true;
        }).on("mouseover", feature_mouseover)
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
    
 
    //Transition the colors to a rainbow
    function updateRainbow() {
        d3.selectAll(".dot.dfplot")
            .style("fill", function (d,i) { return colorScaleRainbow(colorInterpolateRainbow(scores[i])); })
    }
    updateRainbow();

    // Remove the utopia point
    all_features.splice(0,1);
    
    if(remove_last_feature){
        // Remove the last feature, as it had been added temporarily to display the cursor
        all_features.pop();
        added_features.pop();
    }
    
    // The current feature
    _current_feature.style('fill',"black");    
    
    d3.selectAll('.dot.dfplot').transition()
        .duration(duration)
        .attr("transform",function(d){
            return "translate(" + d.x + "," + d.y + ")";
        });   
    
    
}
            




function feature_click(d){
    // Replaces the current feature expression with the stashed expression
    update_feature_application('update');
}
            


function feature_mouseover(d){
    
    numOfDrivingFeatureViewed = numOfDrivingFeatureViewed+1;
    
    var id= d.id; 
    var expression = d.expression;
    var metrics = d.metrics;
    var conf = d.metrics[2];
    var conf2 = d.metrics[3];

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
                        var output= "" + pp_feature(d.expression) + "<br><br> lift: " + round_num(d.metrics[1]) + 
                        "<br> Support: " + round_num(d.metrics[0]) + 
                        "<br> Confidence(F->S): " + round_num(d.metrics[2]) + 
                        "<br> Confidence(S->F): " + round_num(d.metrics[3]) +"";
                        return output;
                    }).style("padding","8px")
                    .style('color','#F7FF55')
                    .style('word-wrap','break-word');   
    
    
    // Update the placeholder with the driving feature and stash the expression    
    update_feature_application('temp',expression);
    applyComplexFilter(parse_tree(root));
    draw_venn_diagram();   
}



function feature_mouseout(d){
    
    var id = d.id;
    
    // Remove the tooltip
    d3.selectAll("#tooltip_g").remove();
    
    // Remove all the features created temporarily
    d3.selectAll('.applied_feature').remove();
    
    // Bring back the previously stored feature expression
    update_feature_application('restore');
    applyComplexFilter(parse_tree(root));
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




function add_feature_to_plot(expression){
    
    function find_equivalent_feature(metrics,indices){

        for(var i=0;i<all_features.length;i++){
            var _metrics = all_features[i].metrics;
            var match = true;
            for(var j=0;j<indices.length;j++){
                var index = indices[j];
                if(round_num(metrics[index])!=round_num(_metrics[index])){
                    match=false;
                }
            }
            if(match){
                return all_features[i];
            }
        }
        return null;
    }

    
        
    if(!expression || expression==""){
        
        // Assign new indices for the added features
        for(var i=0;i<added_features.length;i++){
            all_features[all_features.length-added_features.length+i].added = ""+added_features.length-i;
        }        
        update_drivingFeatures([current_feature]);
        
    }else{        
        
        // Compute the metrics of a feature
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
        
        // Stash the previous location
        var x=current_feature.x;
        var y=current_feature.y;
        
        // Define new feature
        current_feature = {id:df_i++,name:expression,expression:expression,metrics:metrics,added:"0",x0:x,x:x,y0:y,y:y};
                
        // Check if there exists a feature whose metrics match with the current feature's metrics
        var matched = find_equivalent_feature(metrics,[2,3]);       
                
        // Add new feature to the list of added features
        added_features.push(current_feature);
        all_features.push(current_feature);  
        
        // Stash the previous locations of all features
        for(var i=0;i<all_features.length;i++){
            all_features[i].x0 = all_features[i].x;
            all_features[i].y0 = all_features[i].y;
        }

        // Assign new indices for the added features
        for(var i=0;i<added_features.length;i++){
            all_features[all_features.length-added_features.length+i].added = ""+added_features.length-1-i;
        }
        
        document.getElementById('tab3').click();
        highlight_support_panel();
        
        
        // Display the driving features with newly added feature
        if(matched){ 
            update_drivingFeatures([current_feature],true);
        }else{
            update_drivingFeatures([current_feature],false);
        }
        
    }
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


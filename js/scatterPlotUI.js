/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */





function reset_drawing_scatterPlot() {
    d3.select("[id=scatterPlotFigure]").selectAll("svg").remove();
}

function draw_scatterPlot(source) {

    source.forEach(function (d) {  // convert string to numbers
        d.science = +d.science;
        d.cost = +d.cost;
        if (d.cost == 100000) {
            d.cost = 0;
            d.science = 0;
        }
    });


    // setup x 
    xValue = function (d) {
        return d.science;
    }; // data -> value
    xScale = d3.scale.linear().range([0, width]); // value -> display
    //
    // don't want dots overlapping axis, so add in buffer to data domain 
    xBuffer = (d3.max(source, xValue) - d3.min(source, xValue)) * 0.05;
    xScale.domain([d3.min(source, xValue) - xBuffer, d3.max(source, xValue) + xBuffer]);

    xMap = function (d) {
        return xScale(xValue(d));
    }; // data -> display
    xAxis = d3.svg.axis().scale(xScale).orient("bottom");
//                                    .tickSize(-height);
//                                    .tickFormat(d3.format("s"));

    // setup y
    yValue = function (d) {
        return d.cost;
    }; // data -> value
    yScale = d3.scale.linear().range([height, 0]); // value -> display

    yBuffer = (d3.max(source, yValue) - d3.min(source, yValue)) * 0.05;
    yScale.domain([d3.min(source, yValue) - yBuffer, d3.max(source, yValue) + yBuffer]);

    yMap = function (d) {
        return yScale(yValue(d));
    }; // data -> display
    yAxis = d3.svg.axis().scale(yScale).orient("left");
//                                .tickSize(-width);
//                                .tickFormat(d3.format("s"));


    svg = d3.select("[id=scatterPlotFigure]")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .call(
                d3.behavior.zoom()
                .x(xScale)
                .y(yScale)
                .scaleExtent([0.4, 20])
                .on("zoom", function (d) {

                    svg = d3.select("[id=scatterPlotFigure]")
                            .select("svg");

                    svg.select(".x.axis").call(xAxis);
                    svg.select(".y.axis").call(yAxis);

                    objects.select(".hAxisLine").attr("transform", "translate(0," + yScale(0) + ")");
                    objects.select(".vAxisLine").attr("transform", "translate(" + xScale(0) + ",0)");
                    //d3.event.translate[0]

                    svg.selectAll(".dot")
                            .attr("transform", function (d) {
                                var xCoord = xMap(d);
                                var yCoord = yMap(d);
                                return "translate(" + xCoord + "," + yCoord + ")";
                            });

                    
                    
                    svg.selectAll("[class=paretoFrontier]")
                            .attr("transform", function (d) {
                                return "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")";
                            })
                            .attr("stroke-width",1.5/d3.event.scale);

                    translate_tmp = d3.event.translate;
                    scale_tmp = d3.event.scale;

                })
                )
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");



    // x-axis
    svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .append("text")
            .attr("class", "label")
            .attr("x", width)
            .attr("y", -6)
            .style("text-anchor", "end")
            .text("Science benefit");

    // y-axis
    svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("class", "label")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Cost");

    objects = svg.append("svg")
            .attr("class", "objects")
            .attr("width", width)
            .attr("height", height);

    //Create main 0,0 axis lines:
    objects.append("svg:line")
            .attr("class", "axisLine hAxisLine")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", width)
            .attr("y2", 0)
            .attr("transform", "translate(0," + (yScale(0)) + ")");
    objects.append("svg:line")
            .attr("class", "axisLine vAxisLine")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 0)
            .attr("y2", height)
            .attr("transform", "translate(" + (xScale(0)) + ",0)");

    var dots = objects.selectAll(".dot")
            .data(source)
            .enter().append("circle")
            .attr("class", "dot")
            .attr("status","default")
            .attr("r", 3.3)
            .attr("transform", function (d) {
                var xCoord = xMap(d);
                var yCoord = yMap(d);
                return "translate(" + xCoord + "," + yCoord + ")";
            })
            .style("fill", "#000000");


    dots.on("mouseover", dot_mouseover);
    dots.on("click", dot_click);

    initialize_tabs();
    
    d3.select("[id=selectArchsWithinRangeButton]")[0][0].disabled = false;
    d3.select("[id=cancel_selection]")[0][0].disabled = false;
    d3.select("[id=hide_selection]")[0][0].disabled = false;
    d3.select("[id=show_all_archs]")[0][0].disabled = false;
	
    d3.select("[id=scatterPlotFigure]").on("click",unhighlight_basic_info_box);
    d3.select("[id=basicInfoBox_div]").on("click",highlight_basic_info_box);
	d3.selectAll("[id=getDrivingFeaturesButton]").on("click", runDataMining);
    d3.select("[id=selectArchsWithinRangeButton]").on("click", selectArchsWithinRange);
    d3.select("[id=cancel_selection]").on("click",cancelDotSelections);
    d3.select("[id=hide_selection]").on("click",hideSelection);
    d3.select("[id=show_all_archs]").on("click",show_all_archs);
    d3.select("[id=openFilterOptions]").on("click",openFilterOptions);
    d3.select("[id=drivingFeaturesAndSensitivityAnalysis_div]").selectAll("options");
    d3.select("[id=numOfArchs_inputBox]").text(""+numOfArchs());
    d3.selectAll("[class=dot]")[0].forEach(function(d,i){
        d3.select(d).attr("paretoRank",-1);
    });
    
    
    
    if(testType=="1"){
    	    	
    	d3.select("#tab3").text('-');
    	d3.select("#view3").selectAll('g').remove();
    	d3.select("#tab4").text('-');
    	d3.select("#view4").select('g').remove();
    	
    }else if(testType=="2"){
    	
    	d3.select("#tab4").text('-');
    	d3.select("#view4").select('g').remove();
    	
    }else {
    	
    	// Do nothing
    	
    }

    calculateParetoRanking();
    drawParetoFront();
    
    selection_changed = true;
    
}




function add_newArchs_to_scatterPlot() {
    for (var i = 0; i < newArchs.length; i++) {
        architectures.push(newArchs[i]);
    }
    reset_drawing_scatterPlot();
    draw_scatterPlot(architectures);
}

function selectArchsWithinRange() {
	
    var clickedArchs = d3.selectAll("[status=selected]");
    var unClickedArchs = d3.selectAll("[status=default]");

    var minCost = d3.select("[id=selectArchsWithinRange_minCost]")[0][0].value;
    var maxCost = d3.select("[id=selectArchsWithinRange_maxCost]")[0][0].value;
    var minScience = d3.select("[id=selectArchsWithinRange_minScience]")[0][0].value;
    var maxScience = d3.select("[id=selectArchsWithinRange_maxScience]")[0][0].value;

    if (maxCost == "inf") {
        maxCost = 1000000000000;
    }

    unClickedArchs.filter(function (d) {

        var sci = d.science;
        var cost = d.cost;

        if (sci < minScience) {
            return false;
        } else if (sci > maxScience) {
            return false;
        } else if (cost < minCost) {
            return false;
        } else if (cost > maxCost) {
            return false;
        } else {
            return true;
        }
    })
    .attr("status", "selected")
    .style("fill", "#19BAD7");

    clickedArchs.filter(function (d) {

        var sci = d.science;
        var cost = d.cost;

        if (sci < minScience) {
            return true;
        } else if (sci > maxScience) {
            return true;
        } else if (cost < minCost) {
            return true;
        } else if (cost > maxCost) {
            return true;
        } else {
            return false;
        }
    })
    .attr("status", "default")
    .style("fill","#000000");

    d3.select("[id=numOfSelectedArchs_inputBox]").text(""+numOfSelectedArchs());
    selection_changed = true;
    initialize_tabs_driving_features();
    initialize_tabs_classification_tree();
    update_feature_metric_chart();
}

function cancelDotSelections(option){
    
    if(option==null){
        d3.selectAll(".dot")
            .attr("status", "default")
            .style("fill","#000000");
    }else if(option=='remove_selection'){
        d3.selectAll('.dot')[0].forEach(function(d){
            var status = d3.select(d).attr('status');
            if(status=='selected'){
                d3.select(d)
                    .attr("status", "default")
                    .style("fill","#000000");
            }else if(status=='selected_and_highlighted'){
                d3.select(d)
                .attr('status','highlighted')
                .style("fill", "#F75082");
            }
        })
        selection_changed = true;
        update_feature_metric_chart();
        initialize_tabs_driving_features();
        initialize_tabs_classification_tree();
    }else if(option=='remove_highlighted'){
        d3.selectAll('.dot')[0].forEach(function(d){
            var status = d3.select(d).attr('status');
            if(status=='highlighted'){
                d3.select(d)
                    .attr("status", "default")
                    .style("fill","#000000");
            }else if(status=='selected_and_highlighted'){
                d3.select(d)
                .attr('status','selected')
                .style("fill", "#19BAD7");
            }
        })
    }else{
        selection_changed = true;
        update_feature_metric_chart();
        initialize_tabs_driving_features();
        initialize_tabs_classification_tree();
    }
    
  
    d3.select("[id=numOfSelectedArchs_inputBox]").text(""+numOfSelectedArchs());

}

function hideSelection(){

    var clickedArchs = d3.selectAll("[status=selected]");

    clickedArchs.attr("status", "hidden")
            .style("opacity", 0.085);
    d3.select("[id=instrumentOptions]")
            .select("table").remove();        
    d3.select("[id=numOfSelectedArchs_inputBox]").text(""+numOfSelectedArchs());
    d3.select("[id=numOfArchs_inputBox]").text(""+numOfArchs());
    selection_changed = true;
    initialize_tabs_driving_features();
    initialize_tabs_classification_tree();
    update_feature_metric_chart();
}
function show_all_archs(){

    var hiddenArchs = d3.selectAll("[status=hidden]");
    hiddenArchs.attr("status", "default")
            .style("fill","#000000")
            .style("opacity",1);
    d3.select("[id=instrumentOptions]")
            .select("table").remove();        
    d3.select("[id=numOfSelectedArchs_inputBox]").text(""+numOfSelectedArchs());
    d3.select("[id=numOfArchs_inputBox]").text(""+numOfArchs());
    selection_changed = true;
    initialize_tabs_driving_features();
    initialize_tabs_classification_tree();
    update_feature_metric_chart();
}






function dot_mouseover(d) {

	if(infoBox_active===true){
		return;
	}
	
	numOfArchViewed = numOfArchViewed+1;
	

    d3.select("[id=basicInfoBox_div]").select("[id=view1]").select("g").remove();
    var archInfoBox = d3.select("[id=basicInfoBox_div]").select("[id=view1]")
            .append("g");

    archInfoBox.append("p")
            .text("Benefit: " + d.science.toFixed(4));
    archInfoBox.append("p")
            .text("Cost: " + d.cost.toFixed(1));

    var bitString = booleanArray2String(d.bitString);
    draw_archBasicInfoTable(bitString);

    d3.select("[id=instrumentOptions]")
            .select("table").remove();

}



function dot_click(d) {

//    if (d3.select(this).attr("status") == "selected") {
//        d3.select(this).attr("status", "default")
//                .style("fill","#000000");
//    } else {
//        d3.select(this).attr("status", "selected")
//                .style("fill", "#19BAD7");
//    }
//    d3.select("[id=numOfSelectedArchs_inputBox]").text(""+numOfSelectedArchs());
//    selection_changed = true;
//    initialize_tabs_driving_features();
//    initialize_tabs_classification_tree();
}


function scatterPlot_option(selected_option){ // three options: zoom, drag_selection, drag_deselection

    if (selected_option=="1"){
        // Zoom
    	
        translate_tmp_local[0] = translate_tmp[0];
        translate_tmp_local[1] = translate_tmp[1];
        scale_tmp_local = scale_tmp;

        var svg_tmp =  d3.select("[id=scatterPlotFigure]")
            .select("svg")
            .on("mousedown",null)
            .on("mousemove",null)
            .on("mouseup",null);

        d3.select("[id=scatterPlotFigure]")
            .select("svg")
            .call(
                d3.behavior.zoom()
                        .x(xScale)
                        .y(yScale)
                        .scaleExtent([0.4, 20])
                        .on("zoom", function (d) {

                            var svg = d3.select("[id=scatterPlotFigure]")
                                    .select("svg");

                            svg.select(".x.axis").call(xAxis);
                            svg.select(".y.axis").call(yAxis);

                            objects.select(".hAxisLine").attr("transform", "translate(0," + yScale(0) + ")");
                            objects.select(".vAxisLine").attr("transform", "translate(" + xScale(0) + ",0)");
                            //d3.event.translate[0]

                            svg.selectAll("[class=dot]")
                                    .attr("transform", function (d) {
                                        var xCoord = xMap(d);
                                        var yCoord = yMap(d);
                                        return "translate(" + xCoord + "," + yCoord + ")";
                                    });
                            
                            svg.selectAll("[class=paretoFrontier]")
                                    .attr("transform", function (d) {
                                         var x = translate_tmp_local[0]*d3.event.scale + d3.event.translate[0];
                                         var y = translate_tmp_local[1]*d3.event.scale + d3.event.translate[1];
                                         var s = d3.event.scale*scale_tmp_local;
                                        return "translate(" + x +","+ y + ")scale(" + s + ")";
                                    })
                                     .attr("stroke-width",function(){
                                         return 1.5/(d3.event.scale*scale_tmp_local);
                                     });

                            translate_tmp[0] = d3.event.translate[0] + translate_tmp_local[0]*d3.event.scale;
                            translate_tmp[1] = d3.event.translate[1] + translate_tmp_local[1]*d3.event.scale;
                            scale_tmp = d3.event.scale*scale_tmp_local;

                        })       
            )  
    } else{
    	
        var option;
        if(selected_option=="2"){
            option = "selection";
        }else{
            option = "deselection";
        }

        var svg_tmp =  d3.select("[id=scatterPlotFigure]")
            .select("svg")
            .call(d3.behavior.zoom().on("zoom",null));

        svg_tmp
            .on( "mousedown", function() {

            	var p = d3.mouse( this);
                svg_tmp.append( "rect")
                        .attr({
                            rx      : 0,
                            ry      : 0,
                            class   : "selection",
                            x       : p[0],
                            y       : p[1],
                            width   : 0,
                            height  : 0,
                            x0      : p[0],
                            y0      : p[1]
                        })
                        .style("background-color", "#EEEEEE")
                        .style("opacity", 0.18);
            
                initialize_tabs_driving_features();
                initialize_tabs_classification_tree();
                update_feature_metric_chart(); 
            
            })
            .on( "mousemove", function() {

                var s = svg_tmp.select("rect.selection");
                if( !s.empty()) {
                    var p = d3.mouse( this);

                    var b = {
                        x       : parseInt( s.attr("x"),10),
                        y       : parseInt( s.attr("y"), 10),
                        x0       : parseInt( s.attr("x0"),10),
                        y0       : parseInt( s.attr("y0"), 10),
                        width   : parseInt( s.attr("width"),10),
                        height  : parseInt( s.attr("height"), 10)
                    };
                    var move = {
                        x : p[0] - b.x0,
                        y : p[1] - b.y0
                    };

                    if (move.x < 0){
                        b.x = b.x0 + move.x;

                    } else{
                        b.x = b.x0;
                    }
                    if (move.y < 0){
                        b.y = b.y0 + move.y;
                    } else {
                        b.y = b.y0;
                    }
                    b.width = Math.abs(move.x);
                    b.height = Math.abs(move.y);

                    s.attr(b);

                    if(option=="selection"){ // Make selection
                        
                        d3.selectAll("[status=default]")[0].forEach(function(d,i){
                            var sci = d.__data__.science;
                            var cost = d.__data__.cost;
                            var xCoord = xScale(sci);
                            var yCoord = yScale(cost);

                            if( 
                                xCoord + margin.left>= b.x && xCoord + margin.left <= b.x+b.width && 
                                yCoord + margin.top >= b.y && yCoord + margin.top  <= b.y+b.height
                            ) {
                                d3.select(d)
                                        .attr("status","selected")
                                        .style("fill", "#19BAD7");      
                                selection_changed = true;
                            }
                        });
                        d3.selectAll("[status=highlighted]")[0].forEach(function(d,i){
                            var sci = d.__data__.science;
                            var cost = d.__data__.cost;
                            var xCoord = xScale(sci);
                            var yCoord = yScale(cost);

                            if( 
                                xCoord + margin.left>= b.x && xCoord + margin.left <= b.x+b.width && 
                                yCoord + margin.top >= b.y && yCoord + margin.top  <= b.y+b.height
                            ) {
                                d3.select(d)
                                        .attr("status","selected_and_highlighted")
                                        .style("fill", "#A340F0");      
                                selection_changed = true;
                            }
                        });
                    }else{	// De-select
                        d3.selectAll("[status=selected]")[0].forEach(function(d,i){
                            var sci = d.__data__.science;
                            var cost = d.__data__.cost;
                            var xCoord = xScale(sci);
                            var yCoord = yScale(cost);

                            if( 
                                xCoord + margin.left>= b.x && xCoord + margin.left <= b.x+b.width && 
                                yCoord + margin.top >= b.y && yCoord + margin.top  <= b.y+b.height
                            ) {
                                d3.select(d).attr("status","default")
                                        .style("fill", "#000000");      
                                selection_changed = true;
                            }
                        });
                        d3.selectAll("[status=selected_and_highlighted]")[0].forEach(function(d,i){
                            var sci = d.__data__.science;
                            var cost = d.__data__.cost;
                            var xCoord = xScale(sci);
                            var yCoord = yScale(cost);

                            if( 
                                xCoord + margin.left>= b.x && xCoord + margin.left <= b.x+b.width && 
                                yCoord + margin.top >= b.y && yCoord + margin.top  <= b.y+b.height
                            ) {
                                d3.select(d).attr("status","highlighted")
                                        .style("fill", "#F75082");      
                                selection_changed = true;
                            }
                        });
                    }
                    d3.select("[id=numOfSelectedArchs_inputBox]").text(""+numOfSelectedArchs());
                }      
            })
            .on( "mouseup", function() {
                unhighlight_basic_info_box();
                var svg_tmp =  d3.select("[id=scatterPlotFigure]").select("svg")

                   // remove selection frame
                svg_tmp.selectAll( "rect.selection").remove();


            })
    }               
}


function drawParetoFront(){

    var archsInParetoFront = d3.selectAll("[class=dot]")[0].filter(function(d){
        if(d3.select(d).attr("paretoRank")=="0"){
            return true;
        }
    });

    var sortedScoreList = []; sortedScoreList.length=0;
    var sortedArchList = []; sortedArchList.length=0;

    var size = archsInParetoFront.length;

    for(var i=0;i<size;i++){
        var thisScore = archsInParetoFront[i].__data__.science;
        var tmp = {
                cost: archsInParetoFront[i].__data__.cost,
                sci: archsInParetoFront[i].__data__.science
        };

        if(sortedScoreList.length==0){
            sortedScoreList.push(thisScore);
            sortedArchList.push(tmp);
        }else{
            var sortedLength = sortedScoreList.length;
            for(var j=0;j<sortedLength;j++){
                if(thisScore > sortedScoreList[j]){
                    break;
                }
            }
            sortedScoreList.splice(j, 0, thisScore);
            sortedArchList.splice(j, 0, tmp);
        }
    }

    var lines = []; lines.length=0;
    for (var i=1;i<size;i++){
        var line = {
            x1: xScale(sortedArchList[i-1].sci),
            x2: xScale(sortedArchList[i].sci),
            y1: yScale(sortedArchList[i-1].cost),
            y2: yScale(sortedArchList[i].cost) 
        };
        lines.push(line);
    }

    d3.select("[id=scatterPlotFigure]").select("svg")
            .select("[class=objects]")
            .selectAll("[class=paretoFrontier]")
            .data(lines)
            .enter()
            .append("line")
            .attr("class","paretoFrontier")
            .attr("stroke-width", 1.5)
            .attr("stroke", "#D00F0F")
            .attr("x1",function(d){
                return d.x1;
            })
            .attr("x2",function(d){
                return d.x2;
            })
            .attr("y1",function(d){
                return d.y1;
            })
            .attr("y2",function(d){
                return d.y2;
            });

}

function calculateParetoRanking(){      
    cancelDotSelections();

    var archs = d3.selectAll("[class=dot]")[0].filter(function(d){
        if(d3.select(d).attr("paretoRank")=="-1"){
            return true;
        }
    });
    if (archs.length==0){
        return;
    }

    var rank=0;
    while(archs.length > 0){

        var numArchs = archs.length;
        if (rank>15){
            break;
        }

        for (var i=0; i<numArchs; i++){
            var non_dominated = true;
            var thisArch = archs[i];

            for (var j=0;j<numArchs;j++){
                if (i==j) continue;
                if (
                    (thisArch.__data__.science <= archs[j].__data__.science &&
                    thisArch.__data__.cost > archs[j].__data__.cost) || 
                    (thisArch.__data__.science < archs[j].__data__.science &&
                    thisArch.__data__.cost >= archs[j].__data__.cost) 
                ){
                    non_dominated = false;
                }
            }
            if (non_dominated == true){
                d3.select(thisArch).attr("paretoRank",""+rank);
            } 
        }
        archs = d3.selectAll("[class=dot]")[0].filter(function(d){
            if(d3.select(d).attr("paretoRank")=="-1"){
                return true;
            }
        });
        rank++;
    }

}


function highlight_basic_info_box(){

    d3.select("[id=scatterPlotFigure]")
    	.style("border-width","1px");
	d3.select("[id=basicInfoBox_div]")
		.style("border-width","3.3px");
	infoBox_active=true;
}
function unhighlight_basic_info_box(){

    d3.select("[id=scatterPlotFigure]")
			.style("border-width","3.3px");
	d3.select("[id=basicInfoBox_div]")
			.style("border-width","1px");
	infoBox_active=false;
}






function initialize_tabs(){
	initialize_tabs_inspection();
	initialize_tabs_filter_options();
	initialize_tabs_driving_features();
	initialize_tabs_classification_tree();
}


function initialize_tabs_inspection(){
	d3.select("[id=basicInfoBox_div]").select("[id=view1]").select("g").remove();
	d3.select("[id=basicInfoBox_div]").select("[id=view1]").append("g")
			.append("div")
			.style("width","900px")
			.style("margin","auto")
			.append("div")
			.style("width","100%")
			.style("font-size","21px")
			.text("If you hover the mouse over a design, relevant information will be displayed here.");
}

function initialize_tabs_filter_options(){
    openFilterOptions(); 
}



function initialize_tabs_driving_features(){
	
	if(testType=="1"){
		return;
	}
	
	
	selection_changed=true;
	
	
	d3.select("[id=basicInfoBox_div]").select("[id=view3]").select("g").remove();
	var guideline = d3.select("[id=basicInfoBox_div]").select("[id=view3]")
			.append("g")
			.append("div")
			.style("width","900px")
			.style("margin","auto")
			
	guideline.append("div")
			.style("width","100%")
			.style("font-size","21px")
			.text("To run data mining, select target solutions on the scatter plot. Then click the button below.");

	guideline.append("div")
			.style("width","300px")
			.style("margin","auto")
			.append("button")
			.attr("id","getDrivingFeaturesButton")
			.style("margin-top","30px")
			.style("width","200px")
			.style("font-size","19px")
			.text("Run data mining");
	d3.selectAll("[id=getDrivingFeaturesButton]").on("click", runDataMining);
    
    
}

function initialize_tabs_classification_tree(){

	if(testType=="3"){
		d3.select("[id=basicInfoBox_div]").select("[id=view4]").select("g").remove();
		var guideline = d3.select("[id=basicInfoBox_div]").select("[id=view4]")
				.append("g")
				.append("div")
				.style("width","900px")
				.style("margin","auto")
				
		guideline.append("div")
				.style("width","100%")
				.style("font-size","21px")
				.text("To run data mining, select target solutions on the scatter plot. Then click the button below.");

		guideline.append("div")
				.style("width","300px")
				.style("margin","auto")
				.append("button")
				.attr("id","getDrivingFeaturesButton")
				.style("margin-top","30px")
				.style("width","200px")
				.style("font-size","19px")
				.text("Run data mining");
		d3.selectAll("[id=getDrivingFeaturesButton]").on("click", runDataMining);
	}else{
		return;
	}
}



function set_selection_option(selected_option){
	if(testType=="1"){
		return;
	}
	if(selected_option=="1"){
		d3.select("#zoom-pan")[0][0].checked=true;
		d3.select("#drag-select")[0][0].checked=false;
		d3.select("#de-select")[0][0].checked=false;
	}else if(selected_option=="2"){
		d3.select("#zoom-pan")[0][0].checked=false;
		d3.select("#drag-select")[0][0].checked=true;
		d3.select("#de-select")[0][0].checked=false;
	}else{
		d3.select("#zoom-pan")[0][0].checked=false;
		d3.select("#drag-select")[0][0].checked=false;
		d3.select("#de-select")[0][0].checked=true;
	}
	scatterPlot_option(selected_option)
}


function round_num_2_perc(num){
	var temp = num*100;
	return temp.toFixed(1);
}



function get_selected_arch_ids(){
	var target_string = "";
	d3.selectAll('[status=selected]')[0].forEach(function(d){
		target_string = target_string + "," + d.__data__.id;
	});
	return target_string.substring(1,target_string.length);
}


function select_archs_using_ids(target_ids_string){
	//var target_ids_string = "356,1695,1696,1701,1702,1703,1704,1719,1720,1722,1723,1724,1725,1726,1727,1728,1729,1733,1734,1735,1737,1741,1743,1744,1745,1753,1760,1761,1762,1763,1764,1765,1767,1771,1775,1776,1777,1784,1785,1786,1787,1788,1790,1796,1797,1801,1802,1803,1804,1805,1813,1814,1817,1818,1819,1820,1821,1822,1823,1824,1825,1827,1828,1830,1831,1832,1835,1843,1849,1850,1855,1856,1862,1864,1865,1871,1875,1876,1878,1879,1880,1888,1889,1890,1891,1894,1896,1902,1907,1908,1909,1910,1920,1922,1924,1926,1928,1930,1932,1933,1934,1936,1937,1939,1941,1947,1952,1953,2004,2008,2014,2026,2028,2034,2035,2039,2041,2046,2047,2051,2053,2059,2069,2122,2128,2131,2158,2164,2165,2178,2182,2183,2186,2188,2190,2192,2195,2196,2198,2200,2203,2204,2208,2210,2212,2237,2241,2243,2247,2250,2256,2257,2258,2265,2266,2267,2268,2269,2271,2272,2274,2283,2293,2295,2297,2302,2303,2305,2307,2308,2310,2314,2322,2327,2332,2343,2355,2358,2359,2360,2361,2362,2363,2364,2365,2369,2374,2378,2379,2380,2382,2383,2384,2385,2400,2402,2403,2405,2409,2411,2413,2416,2417,2421,2426,2452,2453,2455,2456,2457,2459,2460,2477,2497,2499,2501,2503,2519,2522,2523,2528,2536,2539,2541,2543,2567,2569,2575,2583,2586,2587,2598,2604,2605,2613,2614,2617,2618";
	var target_ids_split = target_ids_string.split(',');
	var target_ids =[];
	for(var i=0;i<target_ids_split.length;i++){
		var id = + target_ids_split[i];
		target_ids.push(id);
	}
    d3.selectAll('.dot')[0].forEach(function(d){
    	if(target_ids.indexOf(d.__data__.id)!=-1){
    		d3.select(d)
    			.attr("status", "selected")
    			.style("fill", "#19BAD7");
    	}
    });

}



var high_cost_high_perf = "1703,1704,1705,1731,1738,1740,1741,1742,1744,1746,1747,1748,1762,1789,1790,1791,1792,1794,1797,1799,1800,1804,1805,1806,1807,1822,1823,1825,1830,1832,1835,1843,1853,1857,1859,1863,1875,1878,1879,1884,1885,1888,1890,1895,1903,1908,1914,1916,1926,1928,1930,1933,1946,1951,1983,1991,1993,1994,2000,2004,2014,2015,2017,2024,2026,2034,2046,2047,2059,2076,2084,2086,2124,2179,2181,2186,2188,2189,2190,2191,2197,2202,2237,2239,2241,2247,2251,2253,2257,2262,2264,2276,2278,2282,2283,2284,2289,2290,2295,2298,2305,2310,2314,2322,2338,2346,2355,2360,2361,2363,2374,2378,2411,2466,2469,2474,2476,2481,2482,2483,2484,2487,2489,2493,2497,2507,2512,2536,2544,2569,2574,2586,2607,2610,2611,2617";
var mid_cost_mid_perf = "1695,1719,1720,1722,1723,1724,1725,1726,1727,1728,1729,1733,1734,1735,1737,1760,1761,1762,1763,1765,1767,1775,1776,1784,1785,1786,1788,1812,1814,1817,1819,1820,1821,1822,1825,1843,1849,1850,1855,1856,1864,1865,1869,1871,1875,1876,1879,1888,1889,1890,1891,1894,1896,1907,1908,1909,1920,1922,1926,1928,1934,1936,1937,1939,1941,1947,2026,2034,2035,2051,2053,2069,2158,2165,2182,2186,2192,2195,2204,2208,2210,2212,2247,2250,2258,2265,2268,2269,2272,2274,2293,2295,2302,2303,2305,2308,2310,2322,2327,2332,2355,2364,2378,2379,2380,2382,2402,2403,2405,2411,2413,2416,2417,2421,2452,2453,2456,2457,2460,2496,2503,2519,2522,2523,2536,2539,2541,2543,2555,2575,2598,2604,2614,2617";
var low_cost_low_perf = "19,25,26,34,44,77,81,106,108,161,170,1692,1694,1697,1698,1699,1700,1708,1709,1712,1715,1720,1721,1754,1759,1765,1767,1772,1773,1775,1778,1779,1781,1783,1808,1810,1811,1812,1815,1817,1819,1837,1838,1839,1840,1846,1850,1851,1852,1854,1856,1858,1860,1868,1869,1870,1871,1907,1909,1912,1915,1918,1919,1927,1935,1936,1943,1945,1947,1956,1958,1962,1963,1967,2029,2035,2049,2051,2054,2064,2088,2090,2107,2109,2117,2125,2138,2145,2148,2155,2158,2159,2165,2167,2176,2204,2207,2208,2215,2219,2224,2227,2265,2273,2321,2327,2336,2348,2356,2391,2393,2419,2427,2428,2435,2438,2439,2446,2450,2452,2490,2496,2498,2515,2522,2529,2533,2534,2546,2547,2551,2554,2555,2556,2561,2578,2581,2598,2604";


function turn_highlighted_to_selection(){
	d3.selectAll('[status=selected]')
		.attr("status","default")
	    .style("fill", "#000000"); 
	d3.selectAll('[status=highlighted]')
		.attr("status","selected")
		.style("fill", "#19BAD7");  
	d3.selectAll('[status=selected_and_highlighted]')
		.attr("status","selected")
		.style("fill", "#19BAD7"); 
}

function cancel_all_target_selection(){
	d3.selectAll('.dot')
		.attr("status","default")
        .style("fill", "#000000");      
}





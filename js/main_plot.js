

function MainPlot(ifeed){
    
    var self = this;
    
    self.translate = [0,0];
    self.scale = 1;
    self.xIndex = null;
    self.yIndex = null;
    
    self.cursor_blink_interval = null;
    

    self.main_plot_params = {
        "margin":{top: 20, right: 20, bottom: 30, left: 60},
        "width": 960,
        "height": 540,
    };
    
    self.color = {
        "default": "#8E8E8E",
        "selected": "#19BAD7",
        "highlighted": "#F86591",
        "overlap": "#A340F0",
        "mouseover":"#74FF6E",
        "cursor":"black",
    };
        

    self.reset_main_plot = function() {
        //Resets the main plot
        d3.select(".main_plot.figure").selectAll("svg").remove();
    }

    
    self.initialize = function(){
        
        d3.select("#support_panel").select("#view1").select("g").remove();
        d3.select("#support_panel").select("#view1").append("g")
                .append("div")
                .style("width","900px")
                .style("margin","auto")
                .append("div")
                .style("width","100%")
                .style("font-size","21px")
                .text("If you hover the mouse over a design, relevant information will be displayed here.");
    }
    
    
    self.draw_tradespace_plot = function(source, xIndex, yIndex){
        /*
            Draws the scatter plot with architecture inputs
            @param source: a JSON object array containing the basic arch info
        */
        
        self.reset_main_plot();
        
        var margin = self.main_plot_params.margin;
        var width = self.main_plot_params.width - margin.right - margin.left;
        var height = self.main_plot_params.height - margin.top - margin.bottom;

        // setup x 
        var xValue = function (d) {
            return d.outputs[xIndex];
        }; // data -> value
        
        var xScale = d3.scale.linear().range([0, width]); // value -> display

        // don't want dots overlapping axis, so add in buffer to data domain 
        var xBuffer = (d3.max(source, xValue) - d3.min(source, xValue)) * 0.05;
        xScale.domain([d3.min(source, xValue) - xBuffer, d3.max(source, xValue) + xBuffer]);
        
        var xMap = function (d) {
            return xScale(xValue(d));
        }; // data -> display
        var xAxis = d3.svg.axis().scale(xScale).orient("bottom");

        // setup y
        var yValue = function (d) {
            return d.outputs[yIndex];
        }; // data -> value
        var yScale = d3.scale.linear().range([height, 0]); // value -> display

        var yBuffer = (d3.max(source, yValue) - d3.min(source, yValue)) * 0.05;
        yScale.domain([d3.min(source, yValue) - yBuffer, d3.max(source, yValue) + yBuffer]);

        var yMap = function (d) {
            return yScale(yValue(d));
        }; // data -> display
        var yAxis = d3.svg.axis().scale(yScale).orient("left");
                
        self.xScale = xScale;
        self.yScale = yScale;
        self.xMap = xMap;
        self.yMap = yMap;
        self.xAxis = xAxis;
        self.yAxis = yAxis;
        self.xIndex = xIndex;
        self.yIndex = yIndex;

        // Create svg
        var svg = d3.select(".main_plot.figure")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .call(
                    d3.behavior.zoom()
                    .x(xScale)
                    .y(yScale)
                    .scaleExtent([0.4, 25])
                    .on("zoom", function (d) {

                        svg = d3.select(".main_plot.figure")
                                .select("svg");

                        svg.select(".main_plot.x.axis").call(xAxis);
                        svg.select(".main_plot.y.axis").call(yAxis);

                        objects.select(".hAxisLine").attr("transform", "translate(0," + yScale(0) + ")");
                        objects.select(".vAxisLine").attr("transform", "translate(" + xScale(0) + ",0)");
                        //d3.event.translate[0]

                        svg.selectAll(".main_plot.dot")
                                .attr("transform", function (d) {
                                    var xCoord = xMap(d);
                                    var yCoord = yMap(d);
                                    return "translate(" + xCoord + "," + yCoord + ")";
                                });

                        self.translate = d3.event.translate;
                        self.scale = d3.event.scale;
                    })
                    )
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // x-axis
        svg.append("g")
                .attr("class", "main_plot x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis)
                .append("text")
                .attr("class", "label")
                .attr("x", width)
                .attr("y", -6)
                .style("text-anchor", "end")
                .text(function(){
                    return ifeed.metadata.output_list[xIndex];
                });

        // y-axis
        svg.append("g")
                .attr("class", "main_plot y axis")
                .call(yAxis)
                .append("text")
                .attr("class", "label")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text(function(){
                    return ifeed.metadata.output_list[yIndex];
                });

        objects = svg.append("svg")
                .attr("class", "main_plot objects")
                .attr("width", width)
                .attr("height", height);

        //Create main 0,0 axis lines:
        objects.append("svg:line")
                .attr("class", "main_plot axisLine hAxisLine")
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", width)
                .attr("y2", 0)
                .attr("transform", "translate(0," + (yScale(0)) + ")");
        objects.append("svg:line")
                .attr("class", "main_plot axisLine vAxisLine")
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", 0)
                .attr("y2", height)
                .attr("transform", "translate(" + (xScale(0)) + ",0)");
        
        d3.select(".main_plot.figure").on("click",self.unhighlight_support_panel);
        d3.select("#support_panel").on("click",self.highlight_support_panel);        
        
//        // Set button click operations
//        d3.select("[id=selectArchsWithinRangeButton]").on("click", selectArchsWithinRange);
        d3.select("#selection_options #cancel_selection").on("click",self.cancel_selection);
//        d3.select("[id=hide_selection]").on("click",hideSelection);
//        d3.select("[id=show_all_archs]").on("click",show_all_archs);

//        d3.selectAll(".main_plot.dot")[0].forEach(function(d,i){
//            d3.select(d).attr("paretoRank",-1);
//        });        
        d3.select('#interaction_modes').selectAll('.tooltip').select('div').on('click',self.toggle_selection_mode);        
        
        
        self.update(source, xIndex, yIndex);
    }
    
    
    

    self.update = function(source,xIndex,yIndex) {

        var dots = d3.select('.main_plot.objects').selectAll(".main_plot.dot")
                .data(source)
                .enter().append("circle")
                .attr("class", "dot main_plot")
                .attr("r", 3.3)
                .attr("transform", function (d) {
                    var xCoord = self.xMap(d);
                    var yCoord = self.yMap(d);
                    return "translate(" + xCoord + "," + yCoord + ")";
                })
                .style("fill", self.color.default);
             
        
        dots.on("click", self.arch_click);
        dots.on("mouseover", self.arch_mouseover);
        dots.on("mouseout", self.arch_mouseout);

        d3.select("#num_of_archs").text(""+self.get_num_of_archs());
    }
    
    

    
    self.arch_click = function(d){

        var arch = d;
        
        if(!d3.select('#run_design_local_search')[0][0]){
            d3.select('#arch_info_display_outputs')
                .insert("button",":first-child")
                .attr('id','run_design_local_search')
                .text('Run local search')
                .on('click',function(){
                    clearInterval(self.cursor_blink_interval);
                    d3.selectAll('.dot.main_plot.cursor.blink').style("opacity",1);
                    PubSub.publish(RUN_LOCAL_SEARCH,arch);
                });
        }
                
        ifeed.problem.display_instrument_options();
        ifeed.problem.enable_modify_architecture();
        
        d3.selectAll('.main_plot.dot.cursor.blink')
                .attr("transform", function (d) {
                    var xCoord = self.xMap(d);
                    var yCoord = self.yMap(d);
                    return "translate(" + xCoord + "," + yCoord + ")";
                })
                .transition()
                .duration(500);
        
        d3.selectAll('.main_plot.dot.cursor:not(.blink)').remove();   
        
        
        var _current_architecture = d3.select('.main_plot.objects').selectAll('.main_plot.dot.cursor.blink')
                .data([arch])
                .enter()
                .append('path')
                .attr("class","main_plot cursor dot blink")
                .attr('d', d3.symbol().type(d3.symbolCross).size(120))
                .attr("transform", function (d) {
                    var xCoord = self.xMap(d);
                    var yCoord = self.yMap(d);
                    return "translate(" + xCoord + "," + yCoord + ")";
                })
                .style("stroke-width",1);
        
        
        _current_architecture.shown=true;
        // The current feature
        _current_architecture.style('fill',"black");    
        
        function blink() {
            if(_current_architecture.shown) {
                _current_architecture.style("opacity",0);
                _current_architecture.shown = false;
            } else {
                _current_architecture.style("opacity",1);
                _current_architecture.shown = true;
            }
        }

        self.cursor_blink_interval = setInterval(blink, 350);
                
        document.getElementById('tab1').click();       
        
        PubSub.publish(HIGHLIGHT_SUPPORT_PANEL,null);
    }
    
    
    
    self.toggle_selection_mode = function(){
        
        var mode = null;
        
        if(this==self){
            mode = ifeed.UI_states.selection_mode;
            if(mode=="zoom-pan"){
                mode="drag-select";
            }else if(mode=="drag-select"){
                mode="de-select";
            }else{
                mode="zoom-pan";
            }
        }else{
            mode = d3.select(this).select('input').attr('id');
        }

        if(mode=="zoom-pan"){
            d3.select("#zoom-pan")[0][0].checked=true;
            d3.select("#drag-select")[0][0].checked=false;
            d3.select("#de-select")[0][0].checked=false;
        }else if(mode=="drag-select"){
            d3.select("#zoom-pan")[0][0].checked=false;
            d3.select("#drag-select")[0][0].checked=true;
            d3.select("#de-select")[0][0].checked=false;            
        }else{
            d3.select("#zoom-pan")[0][0].checked=false;
            d3.select("#drag-select")[0][0].checked=false;
            d3.select("#de-select")[0][0].checked=true;
        }
        
        ifeed.UI_states.selection_mode = mode;
        self.change_interaction_mode(mode);     
    }
    

    self.cancel_selection = function(option){

        /*
           Removes selections and/or highlights in the scatter plot
           @param option: option to remove all selections and highlights or remove only highlights
        */
        
        
        if(option==null){
            
            // Remove both highlights and selections
            d3.selectAll(".main_plot.dot")
                .classed('selected',false)
                .classed('highlighted',false)
                .style("fill",self.color.default);

            if(!ifeed.UI_states.selection_changed){
                ifeed.UI_states.selection_changed=true;
                ifeed.data_mining.initialize();
            }
            
        }else if(option=='remove_selection'){
            
            // Remove only selection only
            d3.selectAll('.main_plot.dot.selected')[0].forEach(function(d){
                var dot = d3.select(d);
                dot.classed('selected',false);
                if(dot.classed('highlighted')){
                    // selected and highlighted
                    dot.style("fill", self.color.highlighted);
                }else{
                    // selected
                    dot.style("fill",self.color.default);
                }
            });
            
            if(!ifeed.UI_states.selection_changed){
                ifeed.UI_states.selection_changed=true;
                ifeed.data_mining.initialize();
            }
            
        }else if(option=='remove_highlighted'){
            
            // Remove only highlights
            d3.selectAll('.main_plot.dot.highlighted')[0].forEach(function(d){
                
                var dot = d3.select(d);
                dot.classed('highlighted',false);
                
                if(dot.classed('selected')){
                    dot.style("fill", self.color.selected);
                }else{
                    dot.style("fill",self.color.default);
                }
            });
        }

        // Reset the number of selected archs displayed
        d3.select("#num_of_selected_archs").text(""+self.get_num_of_selected_archs());
    }
    
    
    
    
    
    
    self.change_interaction_mode = function(option){ // three options: zoom-pan, drag-select, de-select

        var margin=self.main_plot_params.margin;
        var width=self.main_plot_params.width;
        var height=self.main_plot_params.height;

        var xScale = self.xScale;
        var xMap = self.xMap;
        var xAxis = self.xAxis;
        var yScale = self.yScale;
        var yMap = self.yMap;
        var yAxis = self.yAxis;

        if(option=="zoom-pan"){ // Zoom

            translate_local = self.translate;
            scale_local = self.scale;

            var svg =  d3.select(".main_plot.figure")
                .select("svg")
                .on("mousedown",null)
                .on("mousemove",null)
                .on("mouseup",null);

            d3.select(".main_plot.figure")
                .select("svg")
                .call(
                    d3.behavior.zoom()
                            .x(xScale)
                            .y(yScale)
                            .scaleExtent([0.4, 25])
                            .on("zoom", function (d) {

                                var svg = d3.select(".main_plot.figure")
                                            .select("svg");

                                svg.select(".main_plot.x.axis").call(xAxis);
                                svg.select(".main_plot.y.axis").call(yAxis);

                                objects.select(".main_plot.hAxisLine").attr("transform", "translate(0," + yScale(0) + ")");
                                objects.select(".main_plot.vAxisLine").attr("transform", "translate(" + xScale(0) + ",0)");
                                //d3.event.translate[0]

                                svg.selectAll(".main_plot.dot")
                                        .attr("transform", function (d) {
                                            var xCoord = xMap(d);
                                            var yCoord = yMap(d);
                                            return "translate(" + xCoord + "," + yCoord + ")";
                                        });

//                                svg.selectAll("[class=paretoFrontier]")
//                                        .attr("transform", function (d) {
//                                             var x = ScatterPlot_translate[0]*d3.event.scale + d3.event.translate[0];
//                                             var y = ScatterPlot_translate[1]*d3.event.scale + d3.event.translate[1];
//                                             var s = d3.event.scale*ScatterPlot_scale;
//                                            return "translate(" + x +","+ y + ")scale(" + s + ")";
//                                        })
//                                         .attr("stroke-width",function(){
//                                             return 1.5/(d3.event.scale*ScatterPlot_scale_local);
//                                         });

                                self.translate[0] = d3.event.translate[0] + translate_local[0]*d3.event.scale;
                                self.translate[1] = d3.event.translate[1] + translate_local[1]*d3.event.scale;
                                self.scale = d3.event.scale*scale_local;

                            })       
                )  
        } else{

            var svg =  d3.select(".main_plot.figure")
                .select("svg")
                .call(d3.behavior.zoom().on("zoom",null));

            svg.on( "mousedown", function() {

                    var p = d3.mouse( this);
                    svg.append( "rect")
                            .attr({
                                rx      : 0,
                                ry      : 0,
                                class   : "main_plot selection",
                                x       : p[0],
                                y       : p[1],
                                width   : 0,
                                height  : 0,
                                x0      : p[0],
                                y0      : p[1]
                            })
                            .style("background-color", "#EEEEEE")
                            .style("opacity", 0.18);

                })
                .on( "mousemove", function() {

                    var s = svg.select("rect.main_plot.selection");
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

                        if(option=="drag-select"){ // Make selection

                            d3.selectAll(".dot.main_plot:not(.selected)")[0].forEach(function(d,i){
                                
                                var xVal = d.__data__.outputs[self.xIndex];
                                var yVal = d.__data__.outputs[self.yIndex];
                                var xCoord = xScale(xVal);
                                var yCoord = yScale(yVal);

                                if( 
                                    xCoord + margin.left>= b.x && xCoord + margin.left <= b.x+b.width && 
                                    yCoord + margin.top >= b.y && yCoord + margin.top  <= b.y+b.height
                                ) {
                                    // Select
                                    var dot = d3.select(d);
                                    dot.classed('selected',true);

                                    if(dot.classed('highlighted')){
                                        // highlighted and selected
                                        dot.style("fill", self.color.overlap);      
                                    }else{
                                        // selected but not highlighted
                                        dot.style("fill", self.color.selected);      
                                    }
                                    
                                    if(!ifeed.UI_states.selection_changed){
                                        ifeed.UI_states.selection_changed=true;
                                        ifeed.data_mining.initialize();
                                    }
                                }
                            });

                        }else{	// De-select
                            
                            d3.selectAll(".dot.main_plot.selected")[0].forEach(function(d,i){
                                
                                var xVal = d.__data__.outputs[self.xIndex];
                                var yVal = d.__data__.outputs[self.yIndex];
                                var xCoord = xScale(xVal);
                                var yCoord = yScale(yVal);

                                if( 
                                    xCoord + margin.left>= b.x && xCoord + margin.left <= b.x+b.width && 
                                    yCoord + margin.top >= b.y && yCoord + margin.top  <= b.y+b.height
                                ) {
                                    
                                    // Cancel selection
                                    var dot = d3.select(d);
                                    dot.classed('selected',false);

                                    if(dot.classed('highlighted')){
                                        // was selected and highlighted
                                        dot.style("fill", self.color.highlighted);      
                                    }else{
                                        // was not highlighted
                                        dot.style("fill", self.color.default);   
                                    }
                                    
                                    if(!ifeed.UI_states.selection_changed){
                                        ifeed.UI_states.selection_changed=true;
                                        ifeed.data_mining.initialize();
                                    }
                                    
                                }
                            });
                        }
                        
                        d3.select("#num_of_selected_archs").text(""+self.get_num_of_selected_archs());
                    }      
                })
                .on( "mouseup", function() {
                    //unhighlight_support_panel();
                    // remove selection frame
                    d3.select('.main_plot.figure').select('svg').selectAll( "rect.selection").remove();
                })
        }               
    }
    
    
    
    self.hide_selection = function(){
        
        var selected = d3.selectAll(".dot.main_plot.selected");

        selected.classed('hidden',true)
                .classed('selected',false)
                .classed('highlighted',false)
                .style('fill',self.color.default)
                .style("opacity", 0.085);

        d3.select("#num_of_selected_archs").text(""+self.get_num_of_selected_archs());
        d3.select("#num_of_archs").text(""+self.get_num_of_archs());
    }

    

    self.show_all_archs = function(){
        
        var hidden = d3.selectAll(".dot.main_plot.hidden");
        hidden.classed('hidden',false)
                .style("opacity",1);

        d3.select("#num_of_selected_archs").text(""+self.get_num_of_selected_archs());
        d3.select("#num_of_archs").text(""+self.get_num_of_archs());
    }
    
    


    self.get_num_of_archs = function(){
        /*
            Counts the number of all archs displayed
            @return: the number of dots
        */
        return d3.selectAll('.main_plot.dot:not(.hidden)')[0].length;
    }

    
    
    self.get_num_of_selected_archs = function(){
        /*
            Counts the number of selected archs
            @return: the number of dots selected
        */
        return d3.selectAll('.dot.selected.main_plot:not(.hidden)')[0].length; 
    }

    
    

    self.arch_mouseover = function(d) {

        var arch = d;
        
        // The support panel is active, disable hovering 
        if(ifeed.UI_states.support_panel_active){
            return;
        }
                        
        
        if(this==self){  // If this function is called directly
            // Do nothing
        }else{
            // If this function is called from mouseover action
            // Change the color of the dot temporarily
            d3.select(this).style("fill",self.color.mouseover);
        }

        // Remove the previous info
        d3.select("#support_panel").select("#view1").select("g").remove();
        
        var support_panel = d3.select("#support_panel").select("#view1")
                .append("g");

        // Display the current architecture info
        var arch_info_display_outputs = support_panel.append('div')
                .attr('id','arch_info_display_outputs');

        
        for(var i=0;i<ifeed.metadata.output_num;i++){
            
            arch_info_display_outputs.append("p")
                            .text(function(d){
                
                                var out = ifeed.metadata.output_list[i] + ": ";
                                var val = arch.outputs[i];
                
                                if(typeof val == 'number'){
                                    if(val>100){ val = val.toFixed(2); }
                                    else{ val = val.toFixed(4); }
                                }
                
                                return out + val;
                            })
                            .style('font-size','20px');
        }
        

        PubSub.publish(SET_CURRENT_ARCHITECTURE, arch);
        
        ifeed.problem.display_arch_info(arch);
        
        document.getElementById('tab1').click();
        
        d3.select('#instr_options_display').remove();

        clearInterval(self.cursor_blink_interval);
        d3.select('.main_plot.dot.cursor.blink').remove();
        self.cursor_blink_interval=null;
    }    
    
    

    
    
    
    self.arch_mouseout = function(d) {
        var dot = d3.select(this)
        if(dot.classed('selected') && dot.classed('highlighted')){
            dot.style('fill', self.color.overlap);
        }else if(dot.classed('selected')){
            dot.style('fill',self.color.selected);  
        }else if(dot.classed('highlighted')){
            dot.style('fill',self.color.highlighted);
        }else{
            if(dot.classed('cursor')){
                dot.style('fill',self.color.cursor);
            }else{
                dot.style("fill", self.color.default);
            }
        }
    }
    
    
    self.highlight_support_panel = function(){
        d3.select(".main_plot.figure")
            .style("border-width","1px");
        d3.select("#support_panel")
            .style("border-width","3.3px");

        ifeed.UI_states.support_panel_active=true;
    }


    self.unhighlight_support_panel = function(){

        d3.select(".main_plot.figure")
                .style("border-width","3.3px");
        d3.select("#support_panel")
                .style("border-width","1px");
        
        ifeed.UI_states.support_panel_active=false;
    }
    
    
    
    PubSub.subscribe(DATA_PROCESSED, (msg, data) => {
        self.draw_tradespace_plot(data,0,1);
    });    
    
    
    PubSub.subscribe(HIGHLIGHT_SUPPORT_PANEL, (msg, data) => {
        self.highlight_support_panel();
    });    
    
    
    PubSub.subscribe(ADD_ARCHITECTURE, (msg, data) => {
        
        var allData = data.previous;
        var added = data.added;

        if(Array.isArray(added)){
            //allData = allData.concat(added);
            
        }else{
            //allData.push(added);
            added = [added];
        }

        self.update(allData,0,1);
        
        clearInterval(self.cursor_blink_interval);
        d3.select('.main_plot.dot.cursor').remove();
        self.cursor_blink_interval=null;
                        
        d3.select('.main_plot.objects').selectAll('.main_plot.dot.cursor:not(.blink)')
                .data(added)
                .enter()
                .append('path')
                .attr("class","main_plot dot cursor")
                .attr('d', d3.symbol().type(d3.symbolCross).size(120))
                .attr("transform", function (d) {
                    var xCoord = self.xMap(d);
                    var yCoord = self.yMap(d);
                    return "translate(" + xCoord + "," + yCoord + ")";
                })
                .style("stroke-width",1)
                .on("mouseover",self.arch_mouseover)
                .on("mouseout",self.arch_mouseout)
                .on('click',self.arch_click);        
    });        
    
    
    PubSub.subscribe(VIEW_ARCHITECTURE, (msg, data) => {
        ifeed.UI_states.support_panel_active=false;
        self.arch_mouseover(data);
    });     
    
    self.initialize();

}





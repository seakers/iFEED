

class TradespacePlot{
    
    constructor(output_list){
        
        this.translate = [0,0];
        this.scale = 1;
        this.xIndex = null;
        this.yIndex = null;
        
        this.cursor_blink_interval = null;

        this.tradespace_plot_params = {
            "margin":{top: 20, right: 20, bottom: 30, left: 60},
            "width": 960,
            "height": 540,
        };
        
        this.color = {
            "default": "#8E8E8E",
            "selected": "#19BAD7",
            "highlighted": "#F86591",
            "overlap": "#A340F0",
            "mouseover":"#74FF6E",
            "cursor":"black",
        };

        this.output_list = output_list;
        this.initialize();





    }



    reset_tradespace_plot() {
        //Resets the main plot
        d3.select('.tradespace_plot.figure').selectAll('svg').remove();
        d3.select('.tradespace_plot.figure').selectAll('canvas').remove();
    }
    
    initialize(){
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
    
    
    /*
        Draws the scatter plot with architecture inputs
        @param source: a JSON object array containing the basic arch info
    */    
    update(source, xIndex, yIndex){

        this.reset_tradespace_plot();
        
        let margin = this.tradespace_plot_params.margin;
        this.width = this.tradespace_plot_params.width - margin.right - margin.left;
        this.height = this.tradespace_plot_params.height - margin.top - margin.bottom;

        // setup x 
        this.xValue = function (d) {
            return d.outputs[xIndex];
        }; // data -> value
        
        this.xScale = d3.scale.linear().range([0, this.width]); // value -> display

        // don't want dots overlapping axis, so add in buffer to data domain 
        let xBuffer = (d3.max(source, this.xValue) - d3.min(source, this.xValue)) * 0.05;
        this.xScale.domain([d3.min(source, this.xValue) - xBuffer, d3.max(source, this.xValue) + xBuffer]);
        
        this.xMap = function (d) {
            return this.xScale(this.xValue(d));
        }; // data -> display
        let xAxis = d3.svg.axis().scale(this.xScale).orient("bottom");

        // setup y
        this.yValue = function (d) {
            return d.outputs[yIndex];
        }; // data -> value
        this.yScale = d3.scale.linear().range([height, 0]); // value -> display

        let yBuffer = (d3.max(source, this.yValue) - d3.min(source, this.yValue)) * 0.05;
        yScale.domain([d3.min(source, this.yValue) - yBuffer, d3.max(source, this.yValue) + yBuffer]);

        this.yMap = function (d) {
            return this.yScale(this.yValue(d));
        }; // data -> display
        let yAxis = d3.svg.axis().scale(this.yScale).orient("left");

        this.zoom = d3.behavior.zoom()
                        .x(this.xScale)
                        .y(this.yScale)
                        .scaleExtent([0.4, 25])
                        .on("zoom", function (d) {

                            // svg = d3.select(".tradespace_plot.figure")
                            //         .select("svg");

                            // svg.select(".tradespace_plot.x.axis").call(xAxis);
                            // svg.select(".tradespace_plot.y.axis").call(yAxis);

                            // objects.select(".hAxisLine").attr("transform", "translate(0," + yScale(0) + ")");
                            // objects.select(".vAxisLine").attr("transform", "translate(" + xScale(0) + ",0)");
                            // //d3.event.translate[0]

                            // svg.selectAll(".tradespace_plot.dot")
                            //         .attr("transform", function (d) {
                            //             var xCoord = xMap(d);
                            //             var yCoord = yMap(d);
                            //             return "translate(" + xCoord + "," + yCoord + ")";
                            //         });

                            // self.translate = d3.event.translate;
                            // self.scale = d3.event.scale;
                        })

        // Create svg
        let svg = d3.select('.tradespace_plot.figure')
            .append("svg")
            .attr("width", this.width + margin.left + margin.right)
            .attr("height", this.height + margin.top + margin.bottom)
            .call(this.zoom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        let canvas = d3.select(".tradespaceplot.figure")
            .append("canvas")
            .style("position","absolute")
            .style("top", margin.top + "px")
            .style("left", margin.left + "px")
            .attr("width", this.width)
            .attr("height", this.height)
            .call(this.zoom);

        this.context = canvas.node().getContext("2d");

        let hiddenCanvas = d3.select('.tradespace_plot.figure')
            .append("canvas")
            .style("position", "absolute")
            .style("top", margin.top + "px")
            .style("left", margin.left + "px")
            .style("display", "none")
            .attr("width", this.width)
            .attr("height", this.height);

        this.hiddenContext = hiddenCanvas.node().getContext("2d");

        // x-axis
        let gX = svg.append("g")
            .attr("class", "axis axis-x")
            .attr("transform", "translate(0, " + this.height + ")")
            .call(this.xAxis);
            
        svg.append("text")
            .attr("transform", "translate(" + this.width + ", " + this.height + ")")
            .attr("class", "label")
            .attr("y", -6)
            .style("text-anchor", "end")
            .text(this.output_list[xIndex]);

        // y-axis
        let gY = svg.append("g")
            .attr("class", "axis axis-y")
            .call(this.yAxis);
        
        svg.append("text")
            .attr("class", "label")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text(this.output_list[yIndex]);

        // Canvas related functions
        let that = this;
        // Function to create new colors for the picking.
        let nextCol = 1;
        function genColor(){ 
            let ret = [];
            if (nextCol < 16777215) {
                ret.push(nextCol & 0xff); // R 
                ret.push((nextCol & 0xff00) >> 8); // G 
                ret.push((nextCol & 0xff0000) >> 16); // B
                nextCol += 1;
            }
            let col = "rgb(" + ret.join(',') + ")";
            return col;
        }

        // Add one unique color to each point and save the backreference
        let colorMap = {};
        this.data.forEach(function(point) {
            point.interactColor = genColor();
            colorMap[point.interactColor] = point;
        });





        this.drawPoints(this.context, false);

        // Canvas interaction
        canvas.on("mousemove.inspection", function() { that.canvas_mousemove(colorMap); });
        
        // Set button click operations
        d3.select("button#cancel_selection").on("click", () => { that.cancel_selection(); });
        d3.select('#interaction_modes').selectAll("label").on("click", () => { that.toggle_selection_mode(); });
        d3.select("#num_architectures").text(""+this.get_num_of_archs());
        d3.select("#num_selected_architectures").text(""+this.get_num_of_selected_archs());









        d3.select(".tradespace_plot.figure").on("click",this.unhighlight_support_panel);
        d3.select("#support_panel").on("click",this.highlight_support_panel);        

//        // Set button click operations
//        d3.select("[id=selectArchsWithinRangeButton]").on("click", selectArchsWithinRange);
        d3.select("#selection_options #cancel_selection").on("click",this.cancel_selection);
//        d3.select("[id=hide_selection]").on("click",hideSelection);
//        d3.select("[id=show_all_archs]").on("click",show_all_archs);

//        d3.selectAll(".tradespace_plot.dot")[0].forEach(function(d,i){
//            d3.select(d).attr("paretoRank",-1);
//        });        
        d3.select('#interaction_modes').selectAll('.tooltip').select('div').on('click',this.toggle_selection_mode);        
        self.update(source, xIndex, yIndex);
    }
    
    
    


    self.update = function(source,xIndex,yIndex) {

        var dots = d3.select('.tradespace_plot.objects').selectAll(".tradespace_plot.dot")
                .data(source)
                .enter().append("circle")
                .attr("class", "dot tradespace_plot")
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
    























    drawPoints(context, hidden) {
        context.clearRect(0, 0, this.width, this.height);
        context.save();
        
        this.data.forEach(point => {
            let tx = this.transform.applyX(this.xMap(point));
            let ty = this.transform.applyY(this.yMap(point));
            context.beginPath();
            context.fillStyle = hidden ? point.interactColor : point.drawingColor;
            context.arc(tx, ty, 3.3, 0, 2 * Math.PI);
            context.fill();
        });

        context.restore();
    }

    canvas_mousemove(colorMap) {
        // Draw the hidden canvas.
        this.drawPoints(this.hiddenContext, true);

        // Get mouse positions from the main canvas.
        let mouse_pos = d3.mouse(d3.select("#main_plot").select("canvas").node());
        let mouseX = mouse_pos[0]; 
        let mouseY = mouse_pos[1];

        // Pick the colour from the mouse position and max-pool it. 
        let color = this.hiddenContext.getImageData(mouseX-3, mouseY-3, 6, 6).data;
        let color_list = {};
        for (let i = 0; i < color.length; i += 4) {
            let color_rgb = "rgb(" + color[i] + "," + color[i+1] + "," + color[i+2] + ")";
            if (color_rgb in color_list) {
                color_list[color_rgb] += 1;
            }
            else {
                color_list[color_rgb] = 1;
            }
        }
        let maxcolor, maxcolor_num = 0;
        for (let key in color_list) {
            if (maxcolor_num < color_list[key]) {
                maxcolor_num = color_list[key];
                maxcolor = key;
            }
        }

        // Check if something changed
        let changesHappened = false;

        // Change color back to default if not selected anymore
        if (this.lastHoveredArch in colorMap && this.lastHoveredArch != maxcolor) {
            let oldPoint = colorMap[this.lastHoveredArch];
            if (oldPoint.selected && oldPoint.highlighted) {
                oldPoint.drawingColor = this.color.overlap;
            }
            else if (oldPoint.selected) {
                oldPoint.drawingColor = this.color.selected;
            }
            else if (oldPoint.highlighted) {
                oldPoint.drawingColor = this.color.highlighted;
            }
            else {
                oldPoint.drawingColor = this.color.default;
            }
        }

        // Get the data from our map!
        if (maxcolor in colorMap) {
            // Only update if there is a change in the selection
            if (this.lastHoveredArch != maxcolor) {
                let arch = colorMap[maxcolor];
                this.lastHoveredArch = maxcolor;
                changesHappened = true;
                
                // Change the color of the dot temporarily
                arch.drawingColor = this.color.mouseover;

                // Remove the previous info
                d3.select(".design_inspector > .panel-block").select("g").remove();
                
                let design_inspector = d3.select(".design_inspector > .panel-block").append("g");

                // Display the current architecture info
                let arch_info_display = design_inspector.append("div")
                    .attr("id", "arch_info_display");

                arch_info_display.append("p").text(d => "Design ID: D" + arch.id);

                for (let i = 0; i < this.output_list.length; i++) {
                    arch_info_display.append("p")
                        .text(d => {
                            let out = this.output_list[i] + ": ";
                            let val = arch.outputs[i];
                            if (typeof val == "number") {
                                if (val > 100) {
                                    val = val.toFixed(2);
                                }
                                else {
                                    val = val.toFixed(4);
                                }
                            }
                            return out + val;
                        });
                }

                PubSub.publish(ARCH_SELECTED, arch);
            }
        }
        else {
            // In case nothing is selected just revert everything back to normal
            this.lastHoveredArch = null;
            changesHappened = true;
        }

        // Only redraw if there have been changes
        if (changesHappened) {
            this.drawPoints(this.context, false);
        }
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
                    d3.selectAll('.dot.tradespace_plot.cursor.blink').style("opacity",1);
                    PubSub.publish(RUN_LOCAL_SEARCH,arch);
                });
        }
                
        ifeed.problem.display_instrument_options();
        ifeed.problem.enable_modify_architecture();
        
        d3.selectAll('.tradespace_plot.dot.cursor.blink')
                .attr("transform", function (d) {
                    var xCoord = self.xMap(d);
                    var yCoord = self.yMap(d);
                    return "translate(" + xCoord + "," + yCoord + ")";
                })
                .transition()
                .duration(500);
        
        d3.selectAll('.tradespace_plot.dot.cursor:not(.blink)').remove();   
        
        
        var _current_architecture = d3.select('.tradespace_plot.objects').selectAll('.tradespace_plot.dot.cursor.blink')
                .data([arch])
                .enter()
                .append('path')
                .attr("class","tradespace_plot cursor dot blink")
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
            d3.selectAll(".tradespace_plot.dot")
                .classed('selected',false)
                .classed('highlighted',false)
                .style("fill",self.color.default);

            if(!ifeed.UI_states.selection_changed){
                ifeed.UI_states.selection_changed=true;
                ifeed.data_mining.initialize();
            }
            
            ifeed.UI_states.selection_changed=true;
            PubSub.publish(INITIALIZE_DATA_MINING,null);
            
        }else if(option=='remove_selection'){
            
            // Remove only selection only
            d3.selectAll('.tradespace_plot.dot.selected')[0].forEach(function(d){
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
            
            ifeed.UI_states.selection_changed=true;
            PubSub.publish(INITIALIZE_DATA_MINING,null);
            
        }else if(option=='remove_highlighted'){
            
            // Remove only highlights
            d3.selectAll('.tradespace_plot.dot.highlighted')[0].forEach(function(d){
                
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

        var margin=self.tradespace_plot_params.margin;
        var width=self.tradespace_plot_params.width;
        var height=self.tradespace_plot_params.height;

        var xScale = self.xScale;
        var xMap = self.xMap;
        var xAxis = self.xAxis;
        var yScale = self.yScale;
        var yMap = self.yMap;
        var yAxis = self.yAxis;

        if(option=="zoom-pan"){ // Zoom

            translate_local = self.translate;
            scale_local = self.scale;

            var svg =  d3.select(".tradespace_plot.figure")
                .select("svg")
                .on("mousedown",null)
                .on("mousemove",null)
                .on("mouseup",null);

            d3.select(".tradespace_plot.figure")
                .select("svg")
                .call(
                    d3.behavior.zoom()
                            .x(xScale)
                            .y(yScale)
                            .scaleExtent([0.4, 25])
                            .on("zoom", function (d) {

                                var svg = d3.select(".tradespace_plot.figure")
                                            .select("svg");

                                svg.select(".tradespace_plot.x.axis").call(xAxis);
                                svg.select(".tradespace_plot.y.axis").call(yAxis);

                                objects.select(".tradespace_plot.hAxisLine").attr("transform", "translate(0," + yScale(0) + ")");
                                objects.select(".tradespace_plot.vAxisLine").attr("transform", "translate(" + xScale(0) + ",0)");
                                //d3.event.translate[0]

                                svg.selectAll(".tradespace_plot.dot")
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

            var svg =  d3.select(".tradespace_plot.figure")
                .select("svg")
                .call(d3.behavior.zoom().on("zoom",null));

            svg.on( "mousedown", function() {

                    var p = d3.mouse( this);
                    svg.append( "rect")
                            .attr({
                                rx      : 0,
                                ry      : 0,
                                class   : "tradespace_plot selection",
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

                    var s = svg.select("rect.tradespace_plot.selection");
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

                            d3.selectAll(".dot.tradespace_plot:not(.selected)")[0].forEach(function(d,i){
                                
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
                            
                            d3.selectAll(".dot.tradespace_plot.selected")[0].forEach(function(d,i){
                                
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
                    d3.select('.tradespace_plot.figure').select('svg').selectAll( "rect.selection").remove();
                })
        }               
    }
    
    
    
    self.hide_selection = function(){
        
        var selected = d3.selectAll(".dot.tradespace_plot.selected");

        selected.classed('hidden',true)
                .classed('selected',false)
                .classed('highlighted',false)
                .style('fill',self.color.default)
                .style("opacity", 0.085);

        d3.select("#num_of_selected_archs").text(""+self.get_num_of_selected_archs());
        d3.select("#num_of_archs").text(""+self.get_num_of_archs());
    }

    

    self.show_all_archs = function(){
        
        var hidden = d3.selectAll(".dot.tradespace_plot.hidden");
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
        return d3.selectAll('.tradespace_plot.dot:not(.hidden)')[0].length;
    }

    
    
    self.get_num_of_selected_archs = function(){
        /*
            Counts the number of selected archs
            @return: the number of dots selected
        */
        return d3.selectAll('.dot.selected.tradespace_plot:not(.hidden)')[0].length; 
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
        d3.select('.tradespace_plot.dot.cursor.blink').remove();
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
    
    
    highlight_support_panel(){
        d3.select(".tradespace_plot.figure")
            .style("border-width","1px");
        d3.select("#support_panel")
            .style("border-width","3.3px");

        ifeed.UI_states.support_panel_active=true;
    }


    unhighlight_support_panel(){

        d3.select(".tradespace_plot.figure")
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
        d3.select('.tradespace_plot.dot.cursor').remove();
        self.cursor_blink_interval=null;
                        
        d3.select('.tradespace_plot.objects').selectAll('.tradespace_plot.dot.cursor:not(.blink)')
                .data(added)
                .enter()
                .append('path')
                .attr("class","tradespace_plot dot cursor")
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





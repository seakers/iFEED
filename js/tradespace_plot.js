

class TradespacePlot{

    constructor(xIndex, yIndex){
        if(xIndex != null){
            this.xIndex = xIndex;
        }else{
            this.xIndex = 0;
        }

        if(yIndex != null){
            this.yIndex = yIndex;
        }else{
            this.yIndex = 1;
        }

        this.cursor_blink_interval = null;

        this.color = {
            "default": "rgba(110,110,110,1)",
            "selected": "rgba(25,186,215,1)",
            "highlighted": "rgba(248,101,145,1)",
            "overlap": "rgba(163,64,240,1)",
            "mouseover": "rgba(116,255,110,1)",
            "hidden": "rgba(0, 0, 0, 0.03)",
            "cursor": "rgba(0, 0, 0, 1)"
        };

        this.output_list = [];

        this.data = null;
        this.num_total_points = 0;
        this.num_selected_points = 0;
        this.num_highlighted_points = 0;

        this.transform = d3.zoomIdentity;
        this.lastHoveredArch = null;

        this.selection_updated = false;
        this.selection_mode = "zoom-pan";

        PubSub.subscribe(DESIGN_PROBLEM_LOADED, (msg, data) => {
            this.metadata = data.metadata;
            this.output_list = this.metadata.output_list;
            this.initialize();
        });         

        PubSub.subscribe(DATA_PROCESSED, (msg, data) => {
            this.data = data;
            this.data.forEach(point => {
                point.selected = false;
                point.highlighted = false;
                point.hidden = false;
                point.drawingColor = this.color.default;
                this.num_total_points += 1;
            });
            this.drawPlot(this.xIndex, this.yIndex);
            document.getElementById('tab1').click();
        });

        PubSub.subscribe(UPDATE_TRADESPACE_PLOT, (msg, data) => {
            let resetColor = data;
            this.update(resetColor);
        });      

        PubSub.subscribe(ADD_ARCHITECTURE, (msg, data) => {    
            this.data.forEach(point => {
                point.highlighted = false;
            });
            var arch = data;
            arch.selected = false;
            arch.highlighted = true;
            arch.hidden = false;
            this.data.push(arch);
            var resetColor = true;
            this.update(resetColor);
            this.drawPlot(this.xIndex, this.yIndex);
        }); 
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
                .style("width","85%")
                .style("margin","auto")
                .append("div")
                .style("width","100%")
                .style("font-size","1.2vw")
                .text("If you hover the mouse over a design, relevant information will be displayed here.");

        d3.select('#plot_options').selectAll('div').remove();
        if(this.output_list){
            d3.select('#plot_options')
                .append('div')
                .text('X axis: ')
                .append('select')
                .attr('id', 'x-axis-select');

            d3.select('#plot_options') 
                .append('div')
                .text('Y axis: ')
                .append('select')
                .attr('id', 'y-axis-select');

            d3.select('#plot_options').selectAll('select')
                .selectAll('option')
                .data(this.output_list)
                .enter()
                .append('option')
                .attr("value", function(d){
                    return d;
                })
                .text(function(d){
                    return d;
                });

            d3.select('#x-axis-select').node().value = this.output_list[this.xIndex];
            d3.select('#y-axis-select').node().value = this.output_list[this.yIndex];

            d3.select("#plot_options")
                .selectAll('select')
                .on("change", (d) => {
                    let x_axis_name = d3.select('#x-axis-select').node().value;
                    let y_axis_name = d3.select('#y-axis-select').node().value;
                    this.drawPlot(this.output_list.indexOf(x_axis_name), this.output_list.indexOf(y_axis_name));

                    this.change_interaction_mode();
                });   
        }
    }
    
    /*
        Draws the scatter plot with architecture inputs
        @param source: a JSON object array containing the basic arch info
    */    
    drawPlot(xIndex, yIndex){
        this.reset_tradespace_plot();

        let tradespacePlotBoundingRec = d3.select(".tradespace_plot.figure").node().getBoundingClientRect();

        this.margin = {top: tradespacePlotBoundingRec.height / 30, 
                        bottom: tradespacePlotBoundingRec.width / 27, 
                        right: tradespacePlotBoundingRec.height / 40, 
                        left: tradespacePlotBoundingRec.width / 15};

        this.width = d3.select(".tradespace_plot.figure").node().clientWidth - this.margin.left - this.margin.right;
        this.height = d3.select(".tradespace_plot.figure").node().clientHeight - this.margin.top - this.margin.bottom;

        // setup x 
        this.xValue = d => d.outputs[xIndex]; // data -> value
        this.xScale = d3.scaleLinear().range([0, this.width]); // value -> display

        // don't want dots overlapping axis, so add in buffer to data domain 
        let xBuffer = (d3.max(this.data, this.xValue) - d3.min(this.data, this.xValue)) * 0.05;
        this.xScale.domain([d3.min(this.data, this.xValue) - xBuffer, d3.max(this.data, this.xValue) + xBuffer]);
        
        this.xMap = d => this.xScale(this.xValue(d)); // data -> display
        let xAxis = d3.axisBottom(this.xScale);

        // setup y
        this.yValue = d => d.outputs[yIndex]; // data -> value

        this.yScale = d3.scaleLinear().range([this.height, 0]); // value -> display

        let yBuffer = (d3.max(this.data, this.yValue) - d3.min(this.data, this.yValue)) * 0.05;
        this.yScale.domain([d3.min(this.data, this.yValue) - yBuffer, d3.max(this.data, this.yValue) + yBuffer]);

        this.yMap = d => this.yScale(this.yValue(d)); // data -> display
        let yAxis = d3.axisLeft(this.yScale);

        this.zoom = d3.zoom()
            .scaleExtent([0.4, 25])
            .on("zoom", d => {
                this.transform = d3.event.transform;
                gX.call(xAxis.scale(this.transform.rescaleX(this.xScale)));
                gY.call(yAxis.scale(this.transform.rescaleY(this.yScale)));
                this.drawPoints(this.context, false);
            });

        // Create svg
        let svg = d3.select('.tradespace_plot.figure')
            .append("svg")
            .style("position","absolute")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .call(this.zoom)
            .append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        let canvas = d3.select(".tradespace_plot.figure")
            .append("canvas")
            .style("position","absolute")
            .style("top", ()=>{
                return this.margin.top + "px";
            })
            .style("left", ()=>{
                return this.margin.left + "px";
            })
            .attr("width", this.width)
            .attr("height", this.height)
            .call(this.zoom);

        this.context = canvas.node().getContext("2d");

        let hiddenCanvas = d3.select('.tradespace_plot.figure')
            .append("canvas")
            .style("position", "absolute")
            .style("top", ()=>{
                return this.margin.top + "px";
            })
            .style("left", ()=>{
                return this.margin.left + "px";
            })
            .style("display", "none")
            .attr("width", this.width)
            .attr("height", this.height);
        this.hiddenContext = hiddenCanvas.node().getContext("2d");

        // x-axis
        let gX = svg.append("g")
            .attr("class", "tradespace_plot axis axis-x")
            .attr("transform", "translate(0, " + this.height + ")")
            .call(xAxis);
            
        svg.append("text")
            .attr("transform", "translate(" + this.width + ", " + this.height + ")")
            .attr("class", "tradespace_plot axisLabel")
            .attr("y", -6)
            .style("text-anchor", "end")
            .text(this.output_list[xIndex]);

        // y-axis
        let gY = svg.append("g")
            .attr("class", "tradespace_plot axis axis-y")
            .call(yAxis);
        
        svg.append("text")
            .attr("class", "tradespace_plot axisLabel")
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
        this.data.forEach(point => {
            point.interactColor = genColor();
            colorMap[point.interactColor] = point;
        });
        this.drawPoints(this.context, false);

        // Canvas interaction
        canvas.on("mousemove.inspection", function() { 
            let maxcolor = that.canvas_event_arch(colorMap);
            that.canvas_mousemove(maxcolor, colorMap); 
        });
        canvas.on("click", function(){ 
            let maxcolor = that.canvas_event_arch(colorMap);
            that.canvas_click(maxcolor, colorMap); 
        });

        // Set button click operations
        d3.select("button#cancel_selection").on("click", () => { that.cancel_selection(); });
        //d3.select('#interaction_modes').selectAll("label").on("click", () => { that.toggle_selection_mode(); });
        d3.select("#num_of_archs").text(""+this.num_total_points);
        d3.select("#num_of_selected_archs").text(""+this.num_selected_points);

        d3.select("#hide_selection").on("click", ()=> {
            this.hide_selection();
        });     

        d3.select("#show_all_archs").on("click", ()=> {
            this.show_hidden_archs();
        }); 

        d3.select("#select_highlighted").on("click", ()=> {
            this.select_highlighted();
        }); 

        d3.select("#select_complement").on("click", ()=> {
            this.select_complement();
        }); 

        d3.select('#interaction_modes')
            .selectAll('div')
            .on("click", function(){
                let clickedElement = d3.select(this);
                if (clickedElement.select("input").node()){
                    that.toggle_selection_mode(clickedElement.select("input").attr("id")); 
                }
            });   
    }

    setPointColor(point){
        if(point.hidden){
            point.drawingColor = this.color.hidden;

        }else if (point.selected && point.highlighted) {
            point.drawingColor = this.color.overlap;
        }
        else if (point.selected) {
            point.drawingColor = this.color.selected;
        }
        else if (point.highlighted) {
            point.drawingColor = this.color.highlighted;
        }
        else {
            point.drawingColor = this.color.default;
        }
    }

    drawPoints(context, hidden) {
        context.clearRect(0, 0, this.width, this.height);
        context.save();

        let tradespacePlotBoundingRec = d3.select(".tradespace_plot.figure").node().getBoundingClientRect();
        let r = tradespacePlotBoundingRec.height / 160;

        if(hidden){
            r = tradespacePlotBoundingRec.height / 100;
        }

        this.data.forEach(point => {
            let tx = this.transform.applyX(this.xMap(point));
            let ty = this.transform.applyY(this.yMap(point));
            context.beginPath();
            if(point.hidden){
                context.fillStyle = point.drawingColor;
            }else{
                context.fillStyle = hidden ? point.interactColor : point.drawingColor;
            }
            context.arc(tx, ty, r, 0, 2 * Math.PI);
            context.fill();
        });

        context.restore();
    }

    canvas_event_arch(colorMap){

        // Draw the hidden canvas.
        this.drawPoints(this.hiddenContext, true);

        // Get mouse positions from the main canvas.
        let mouse_pos = d3.mouse(d3.select(".tradespace_plot.figure").select("canvas").node());
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

        // Change color back to default if not selected anymore
        if (this.lastHoveredArch in colorMap && this.lastHoveredArch != maxcolor) {
            let oldPoint = colorMap[this.lastHoveredArch];
            this.setPointColor(oldPoint);
        }

        return maxcolor;
    }

    canvas_click(maxcolor, colorMap){

        // var arch = d;
        
        // if(!d3.select('#run_design_local_search')[0][0]){
        //     d3.select('#arch_info_display_outputs')
        //         .insert("button",":first-child")
        //         .attr('id','run_design_local_search')
        //         .text('Run local search')
        //         .on('click',function(){
        //             clearInterval(self.cursor_blink_interval);
        //             d3.selectAll('.dot.tradespace_plot.cursor.blink').style("opacity",1);
        //             PubSub.publish(RUN_LOCAL_SEARCH,arch);
        //         });
        // }
                
        // ifeed.problem.display_instrument_options();
        // ifeed.problem.enable_modify_architecture();
        
        // d3.selectAll('.tradespace_plot.dot.cursor.blink')
        //         .attr("transform", function (d) {
        //             var xCoord = self.xMap(d);
        //             var yCoord = self.yMap(d);
        //             return "translate(" + xCoord + "," + yCoord + ")";
        //         })
        //         .transition()
        //         .duration(500);
        
        // d3.selectAll('.tradespace_plot.dot.cursor:not(.blink)').remove();   
        
        
        // var _current_architecture = d3.select('.tradespace_plot.objects').selectAll('.tradespace_plot.dot.cursor.blink')
        //         .data([arch])
        //         .enter()
        //         .append('path')
        //         .attr("class","tradespace_plot cursor dot blink")
        //         .attr('d', d3.symbol().type(d3.symbolCross).size(120))
        //         .attr("transform", function (d) {
        //             var xCoord = self.xMap(d);
        //             var yCoord = self.yMap(d);
        //             return "translate(" + xCoord + "," + yCoord + ")";
        //         })
        //         .style("stroke-width",1);
        
        
        // _current_architecture.shown=true;
        // // The current feature
        // _current_architecture.style('fill',"black");    
        
        // function blink() {
        //     if(_current_architecture.shown) {
        //         _current_architecture.style("opacity",0);
        //         _current_architecture.shown = false;
        //     } else {
        //         _current_architecture.style("opacity",1);
        //         _current_architecture.shown = true;
        //     }
        // }

        // self.cursor_blink_interval = setInterval(blink, 350);
                
        // document.getElementById('tab1').click();       
        
    }

    canvas_mousemove(maxcolor, colorMap) {
        // Check if something changed
        let changesHappened = false;        

        // Get the data from our map!
        if (maxcolor in colorMap) {
            // Only update if there is a change in the selection
            if (this.lastHoveredArch != maxcolor) {
                this.lastHoveredArch = maxcolor;
                changesHappened = true;
                let arch = colorMap[maxcolor];

                // Change the color of the dot temporarily
                arch.drawingColor = this.color.mouseover;

                PubSub.publish(INSPECT_ARCH, arch);
            }

        }else {
            // In case nothing is selected just revert everything back to normal
            this.lastHoveredArch = null;
            changesHappened = true;

            PubSub.publish(INSPECT_ARCH, null);
        }

        // Only redraw if there have been changes
        if (changesHappened) {
            this.drawPoints(this.context, false);
        }
    }

    toggle_selection_mode(mode){
        if(mode=="zoom-pan"){
            d3.select("#zoom-pan").node().checked=true;
            d3.select("#drag-select").node().checked=false;
            d3.select("#de-select").node().checked=false;
        }else if(mode=="drag-select"){
            d3.select("#zoom-pan").node().checked=false;
            d3.select("#drag-select").node().checked=true;
            d3.select("#de-select").node().checked=false;            
        }else{
            d3.select("#zoom-pan").node().checked=false;
            d3.select("#drag-select").node().checked=false;
            d3.select("#de-select").node().checked=true;
        }        
        this.change_interaction_mode(mode);     
    }
    
    /*
       Removes selections and/or highlights in the scatter plot
       @param option: option to remove all selections and highlights or remove only highlights
    */
    cancel_selection(option = ""){

        if (option === ""){
            // Remove both highlights and selections
            this.data.forEach(point => {
                point.selected = false;
                point.highlighted = false;
                this.setPointColor(point);
            });

            // Selection updated
            PubSub.publish(SELECTION_UPDATED, []);            
            //PubSub.publish(INITIALIZE_DATA_MINING,null);
            this.num_selected_points = 0;
            
        }else if(option=='remove_selection'){
            // Remove only selection only
            this.data.forEach(point => {
                point.selected = false;
                this.setPointColor(point);
            });

            // Selection updated
            PubSub.publish(SELECTION_UPDATED, []);            
            //PubSub.publish(INITIALIZE_DATA_MINING,null);
            this.num_selected_points = 0;

        }else if(option=='remove_highlighted'){
            this.data.forEach(point => {
                point.highlighted = false;
                this.setPointColor(point);
            });
        }

        // Re-draw the points
        this.drawPoints(this.context, false);
        // Reset the number of selected archs displayed
        d3.select("#num_of_selected_archs").text(""+this.num_selected_points);
    }
    

    change_interaction_mode(option) { // three options: zoom-pan, drag-select, de-select

        if(option){
            this.selection_mode = option;
        }else{
            option = this.selection_mode;
        }

        let margin = this.margin;
        let width  = this.width;
        let height = this.height;

        if (option === "zoom-pan") { // Zoom
            d3.select(".tradespace_plot.figure").select("svg")
                .on("mousedown.modes",null)
                .on("mousemove.modes",null)
                .on("mouseup.modes",null)
                .call(this.zoom);

            d3.select(".tradespace_plot.figure").selectAll("canvas")
                .on("mousedown.modes",null)
                .on("mousemove.modes",null)
                .on("mouseup.modes",null)
                .call(this.zoom);
        }
        else {
            let svg = d3.select(".tradespace_plot.figure").select("svg")
                .on(".zoom", null);

            let canvases = d3.select(".tradespace_plot.figure").selectAll("canvas")
                .on(".zoom", null);

            let that = this;

            function select_mousedown() {
                let mouse_pos = d3.mouse(this);
                svg.append("rect")
                    .attrs(
                    {
                        rx     : 0,
                        ry     : 0,
                        class  : "selection",
                        x      : mouse_pos[0],
                        y      : mouse_pos[1],
                        width  : 0,
                        height : 0,
                        x0     : mouse_pos[0],
                        y0     : mouse_pos[1]
                    })
                    .style("background-color", "#EEEEEE")
                    .style("opacity", 0.18)
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            }

            function select_mousemove() {
                let selection = svg.select("rect.selection");
                if (!selection.empty()) {
                    let selection_changed = false;
                    let mouse_pos = d3.mouse(this);

                    let box = {
                        x      : parseInt(selection.attr("x"), 10),
                        y      : parseInt(selection.attr("y"), 10),
                        x0     : parseInt(selection.attr("x0"), 10),
                        y0     : parseInt(selection.attr("y0"), 10),
                        width  : parseInt(selection.attr("width"), 10),
                        height : parseInt(selection.attr("height"), 10)
                    };
                    let move = {
                        x : mouse_pos[0] - box.x0,
                        y : mouse_pos[1] - box.y0
                    };

                    if (move.x < 0) {
                        box.x = box.x0 + move.x;
                    }
                    else {
                        box.x = box.x0;
                    }
                    if (move.y < 0) {
                        box.y = box.y0 + move.y;
                    } 
                    else {
                        box.y = box.y0;
                    }
                    box.width = Math.abs(move.x);
                    box.height = Math.abs(move.y);

                    selection.attrs(box);

                    if (option === "drag-select") { // Make selection
                        that.data.forEach(point => {
                            let tx = that.transform.applyX(that.xMap(point));
                            let ty = that.transform.applyY(that.yMap(point));

                            if( tx >= box.x && tx <= box.x + box.width && 
                                ty >= box.y && ty <= box.y + box.height)
                            {
                                if (!point.hidden && !point.selected) {
                                    // Select
                                    point.selected = true;
                                    that.num_selected_points += 1;

                                    if (point.highlighted) {
                                        // selected and highlighted
                                        point.drawingColor = that.color.overlap;
                                    }
                                    else {
                                        // default
                                        point.drawingColor = that.color.selected;
                                    }

                                    selection_changed = true;
                                    // Update the number of selected points
                                }
                            }
                        });
                    }
                    else {  // De-select
                        that.data.forEach(point => {
                            let tx = that.transform.applyX(that.xMap(point));
                            let ty = that.transform.applyY(that.yMap(point));

                            if( tx >= box.x && tx <= box.x + box.width && 
                                ty >= box.y && ty <= box.y + box.height)
                            {
                                if (!point.hidden && point.selected) {
                                    point.selected = false;
                                    that.num_selected_points -= 1;

                                    if(point.highlighted){
                                        // selected and highlighted
                                        point.drawingColor = that.color.highlighted;
                                    }
                                    else {
                                        // default
                                        point.drawingColor = that.color.default;
                                    }

                                    selection_changed = true;
                                }
                            }
                        });
                    }

                    if (selection_changed) {
                        that.selection_updated = true;
                    }
                    d3.select("#num_of_selected_archs").text(""+that.num_selected_points);
                    that.drawPoints(that.context, false);
                }
            }

            function select_mouseup() {
                // remove selection frame
                svg.selectAll("rect.selection").remove();

                if (that.selection_updated){
                    // Get the selected archs
                    let selected_archs = that.get_selected_architectures();

                    PubSub.publish(SELECTION_UPDATED, selected_archs);
                    // Reset the variable
                    that.selection_updated = false;
                }
            }

            svg.on("mousedown.modes", select_mousedown)
                .on("mousemove.modes", select_mousemove)
                .on("mouseup.modes", select_mouseup);

            canvases.on("mousedown.modes", select_mousedown)
                .on("mousemove.modes", select_mousemove)
                .on("mouseup.modes", select_mouseup);
        }
    }

    update(resetColor){
        if(resetColor){
            this.data.forEach( (point) => {
                this.setPointColor(point);
            }); 
        }
        this.drawPoints(this.context, false);
        this.num_selected_points = this.get_selected_architectures().length;
        this.num_highlighted_points = this.get_highlighted_architectures().length;
        this.num_total_points = this.get_all_architectures().length;
        d3.select("#num_of_selected_archs").text("" + this.num_selected_points);
        d3.select("#num_of_archs").text("" + this.num_total_points);
    }    


    get_all_architectures(){
        let out = [];
        this.data.forEach(point => {
            if (!point.hidden){
                out.push(point);
            }
        });    
        return out;    
    }

    get_selected_architectures(){
        let out = [];
        this.data.forEach(point => {
            if (point.selected && !point.hidden){
                out.push(point);
            }
        });    
        return out;    
    }

    get_highlighted_architectures(){
        let out = [];
        this.data.forEach(point => {
            if (point.highlighted && !point.hidden){
                out.push(point);
            }
        });    
        return out;    
    }

    select_highlighted(){
        this.data.forEach( (point) => {

            if(point.highlighted){
                point.selected = true;
                point.highlighted = false;
            }else{
                point.selected = false;
            }
            this.setPointColor(point);
        }); 
        this.drawPoints(this.context, false);

        this.num_selected_points = this.get_selected_architectures().length;
        this.num_highlighted_points = this.get_highlighted_architectures().length;

        d3.select("#num_of_selected_archs").text(""+this.num_selected_points);

        PubSub.publish(SELECTION_UPDATED, this.get_selected_architectures());
    }


    select_complement(){

        this.data.forEach( (point) => {

            if(point.selected){
                point.selected = false;
            }else if(point.highlighted){
                point.selected = false;
            }else{
                point.selected = true;
            }
            this.setPointColor(point);
        }); 
        this.drawPoints(this.context, false);

        this.num_selected_points = this.get_selected_architectures().length;
        this.num_highlighted_points = this.get_highlighted_architectures().length;

        d3.select("#num_of_selected_archs").text(""+this.num_selected_points);

        PubSub.publish(SELECTION_UPDATED, this.get_selected_architectures());
    }

    show_hidden_archs(){

        this.data.forEach( (point) => {
            if(point.hidden){
                point.hidden = false;
            }
            this.setPointColor(point);
        }); 
        this.drawPoints(this.context, false);

        this.num_selected_points = this.get_selected_architectures().length;
        this.num_highlighted_points = this.get_highlighted_architectures().length;

        d3.select("#num_of_selected_archs").text(""+this.num_selected_points);

        PubSub.publish(SELECTION_UPDATED, this.get_selected_architectures());
    }

    hide_selection(){
        this.data.forEach( (point) => {
            point.highlighted = false;
            point.selected = false;
            point.hidden = true;
            this.setPointColor(point);
        }); 
        this.drawPoints(this.context, false);

        this.num_selected_points = this.get_selected_architectures().length;
        this.num_highlighted_points = this.get_highlighted_architectures().length;
        this.num_total_points = this.num_selected_points + this.num_highlighted_points;

        d3.select("#num_of_selected_archs").text("" + this.num_selected_points);
        d3.select("#num_of_archs").text("" + this.num_total_points);

        PubSub.publish(SELECTION_UPDATED, this.get_selected_architectures());
    }

    toggle_selection_and_highlight(){

        this.data.forEach( (point) => {

            if(point.highlighted && point.selected){
                // do nothing
                
            } else if(point.highlighted){ // highlighted but not selected
                point.highlighted = false;
                point.selected = true;

            } else if(point.selected){ // selected but not highlighted
                point.highlighted = true;
                point.selected = false;
            }

            this.setPointColor(point);
        }); 
        this.drawPoints(this.context, false);

        this.num_selected_points = this.get_selected_architectures().length;
        this.num_highlighted_points = this.get_highlighted_architectures().length;

        d3.select("#num_of_selected_archs").text(""+this.num_selected_points);

        PubSub.publish(SELECTION_UPDATED, this.get_selected_architectures());
    }

    activate_support_panel(){
        d3.select(".tradespace_plot.figure")
            .style("border-width","1px");
        d3.select("#support_panel")
            .style("border-width","3.3px");
    }

    deactivate_support_panel(){
        d3.select(".tradespace_plot.figure")
                .style("border-width","3.3px");
        d3.select("#support_panel")
                .style("border-width","1px");        
    }
    
    
}





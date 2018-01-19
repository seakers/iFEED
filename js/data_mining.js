
class DataMining{
    
    constructor(filteringScheme, labelingScheme){

        this.filter = filteringScheme;
        this.label = labelingScheme;
        this.feature_application = null;

        this.selected_archs = [];
        this.data = null;

        this.support_threshold = 0.002;
        this.confidence_threshold = 0.2;
        this.lift_threshold = 1;
        
        this.margin = {top: 20, right: 20, bottom: 30, left:65};
        this.width = 770 - 35 - this.margin.left - this.margin.right;
        this.height = 400 - 20 - this.margin.top - this.margin.bottom;
        
        this.featureID = 1;
        this.transform = d3.zoomIdentity;

        this.all_features = [];
        this.mined_features_id = [];
        this.user_added_features_id = [];   
        this.recent_features_id = [];    
        this.current_feature = null;
        this.current_feature_blink_interval=null;
        this.utopia_point = {id:0,name:'utopiaPoint',expression:null,metrics:null,x0:-1,y0:-1,x:-1,y:-1};
        

        this.coloursRainbow = ["#2c7bb6", "#00a6ca","#00ccbc","#90eb9d","#ffff8c","#f9d057","#f29e2e","#e76818","#d7191c"];
        this.colourRangeRainbow = d3.range(0, 1, 1.0 / (this.coloursRainbow.length - 1));
        this.colourRangeRainbow.push(1);

        //Create color gradient
        this.colorScaleRainbow = d3.scaleLinear()
            .domain(this.colourRangeRainbow)
            .range(this.coloursRainbow)
            .interpolate(d3.interpolateHcl);

        //Needed to map the values of the dataset to the color scale
        this.colorInterpolateRainbow = d3.scaleLinear()
            .domain(d3.extent([]))
            .range([0,1]);



        // PubSub.subscribe(ADD_FEATURE, (msg, data) => {
        //     self.add_feature_to_plot(data);
        // });  
        
        // PubSub.subscribe(DRAW_VENN_DIAGRAM, (msg, data) => {
        //     self.draw_venn_diagram();
        // });     
        
        // PubSub.subscribe(INITIALIZE_DATA_MINING, (msg, data) => {
        //     self.initialize();
        // });     


        // Save the data
        PubSub.subscribe(DATA_PROCESSED, (msg, data) => {
            this.data = data;
        });         
        
        PubSub.subscribe(SELECTION_UPDATED, (msg, data) => {
            this.initialize();
            this.selected_archs = data;
        });

        PubSub.subscribe(FEATURE_APPLICATION_LOADED, (msg, data) => {
            this.feature_application = data;
        });  

        this.initialize();        
    }

    initialize(){
        d3.select("#support_panel").select("#view3").select("g").remove();
        
        var guideline = d3.select("#support_panel").select("#view3")
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
                .attr("id","run_data_mining_button")
                .style("margin-top","30px")
                .style("width","200px")
                .style("font-size","19px")
                .text("Run data mining");
        
        d3.selectAll("#run_data_mining_button").on("click", () => {this.run();});
        
        this.all_features = [];
        this.mined_features_id = [];
        this.user_added_features_id = [];   
        this.recent_features_id = [];    
        this.current_feature = null;
        this.current_feature_blink_interval=null;
        
        //PubSub.publish(INITIALIZE_FEATURE_APPLICATION, null);
        
        this.featureID = 1;
    }
    
    
    async run(option){
        
        // Store the id's of all dots
        let selected = [];
        let non_selected = [];

        for (let i = 0; i< this.selected_archs.length; i++){
            selected.push(this.selected_archs[i].id);
        }

        for (let i = 0; i < this.data.length; i++){
            let id = this.data[i].id;
            if (selected.indexOf(id) === -1){
                // non-selected
                non_selected.push(id);
            }
        }

        if (this.selected_archs.length==0){
            alert("First select target solutions!");
            return;
        }     
                
        // If the feature application tree exists:
        if(this.feature_application.root){
            // // Run data mining in the marginal feature space
            // var selected_node = null;            
            
            // // Save the node where the placeholder is to be located
            // this.feature_application.visit_nodes(this.feature_application.root,function(d){
            //     if(d.add){selected_node=d;}                        
            // })            
            
            // // Save the currently applied feature
            // let base_feature = this.feature_application.parse_tree(this.feature_application.root,selected_node);

            // let extracted_features = null;

            // if(selected_node){

            //     extracted_features = this.get_marginal_driving_features(selected, non_selected, base_feature, 
            //                                                  this.support_threshold,this.confidence_threshold,this.lift_threshold);           

            // }else if(!option){

            //     // Save the architectures that have the currently applied feature
            //     let highlightedArchs = d3.selectAll(".dot.tradespace_plot.highlighted:not(.hidden):not(.cursor)")[0];                    

            //     let highlighted = [];
            //     for (var i = 0; i < highlightedArchs.length; i++) {
            //         var id = highlightedArchs[i].__data__.id;
            //         highlighted.push(id);
            //     }                       

            //     extracted_features = this.get_marginal_driving_features_conjunctive(selected, non_selected, base_feature, highlighted, 
            //                                                      this.support_threshold,this.confidence_threshold,this.lift_threshold);
            // }else{

            //     let root = this.feature_application.root;

            //     extracted_features = [];

            //     let all_extracted_features = [];

            //     for(let i=0;i<root.children.length;i++){

            //         selected_node = root.children[i];  
                    
            //         if(selected_node.type=="logic"){
            //             continue;
            //         }
                    
            //         let test_feature = this.feature_application.parse_tree(root,selected_node); 

            //         let temp_features = this.get_marginal_driving_features(selected, non_selected, test_feature, 
            //                                                  this.support_threshold,this.confidence_threshold,this.lift_threshold);

            //         all_extracted_features = all_extracted_features.concat(temp_features);

            //     }

            //     // Check non-dominance against the extracted features
            //     for(let j=0;j<all_extracted_features.length;j++){
            //         let this_feature = all_extracted_features[j];
            //         if(this.check_if_non_dominated(this_feature, all_extracted_features)) extracted_features.push(this_feature);
            //     }                    
            // }
                        
            // let features_to_add = [];
            // this.recent_features_id = [];

            // // Check non-dominance against all existing features
            // for(let i=0;i<extracted_features.length;i++){

            //     let this_feature = extracted_features[i];
            //     if(this.check_if_non_dominated(this_feature,this.all_features)){
            //         var id = featureID++;
            //         // non-dominated
            //         this.mined_features_id.push(id);
            //         this.recent_features_id.push(id); 

            //         this_feature.id=id;
            //         features_to_add.push(this_feature);
            //     }
            // }     

            // // Update the location of the current feature
            // var x=this.current_feature.x;
            // var y=this.current_feature.y;
            // this.current_feature.x0=x;
            // this.current_feature.y0=y;

            // this.update(features_to_add);
            // PubSub.publish(CANCEL_ADD_FEATURE, null);
                        
        }else{            
            // Run data mining from the scratch (no local search)
            
            // Clear the feature application
            PubSub.publish(INITIALIZE_FEATURE_APPLICATION, null);

            // Remove all highlights in the scatter plot (retain target solutions)
            PubSub.publish(HIGHLIGHT_ARCHITECTURES, []);

            this.all_features = this.get_driving_features(selected, non_selected, this.support_threshold, this.confidence_threshold, this.lift_threshold);

            if(this.all_features.length === 0){ // If there is no driving feature returned
                return;
            }else{
                for(let i = 0; i < this.all_features.length; i++){
                    this.mined_features_id.push(this.all_features[i].id);
                }
            }

            this.display_features();              
        }

    }

    
    get_driving_features(selected,non_selected,support_threshold,confidence_threshold,lift_threshold){

        var output;
        $.ajax({
            url: "/api/data-mining/get-driving-features/",
            type: "POST",
            data: {ID: "get_driving_features",
                    selected: JSON.stringify(selected),
                    non_selected:JSON.stringify(non_selected),
                    supp:support_threshold,
                    conf:confidence_threshold,
                    lift:lift_threshold
                  },
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
    
    /*
        Run local search: can be used for both conjunction and disjunction
    */  
    get_marginal_driving_features(selected,non_selected,featureExpression,
                                                   support_threshold,confidence_threshold,lift_threshold){
        
        var output;
        $.ajax({
            url: "/api/data-mining/get-marginal-driving-features/",
            type: "POST",
            data: {featureExpression: featureExpression,
                    selected: JSON.stringify(selected),
                    non_selected:JSON.stringify(non_selected),
                    supp:support_threshold,
                    conf:confidence_threshold,
                    lift:lift_threshold
                  },
            async: false,
            success: function (data, textStatus, jqXHR)
            {
                output = data;
            },
            error: function (jqXHR, textStatus, errorThrown)
            {alert("error");}
        });

        return output;
    }    
    
    
    /*
        Run local search: only conjunction
    */
    get_marginal_driving_features_conjunctive(selected,non_selected,featureName,highlighted,
                                                   support_threshold,confidence_threshold,lift_threshold){
        
        var output;
        $.ajax({
            url: "/api/data-mining/get-marginal-driving-features-conjunctive/",
            type: "POST",
            data: {featureName: featureName,
                   highlighted: JSON.stringify(highlighted),
                    selected: JSON.stringify(selected),
                    non_selected:JSON.stringify(non_selected),
                    supp:support_threshold,
                    conf:confidence_threshold,
                    lift:lift_threshold
                  },
            async: false,
            success: function (data, textStatus, jqXHR)
            {
                output = data;
            },
            error: function (jqXHR, textStatus, errorThrown)
            {alert("error");}
        });

        return output;
    }
    
    
    display_features(){

        document.getElementById('tab3').click();
        
        //ifeed.tradespace_plot.highlight_support_panel();

        // Remove previous plot
        d3.select("#view3").select("g").remove();

        let tab = d3.select('#view3').append('g');

        // Create plot div's
        let feature_plot = tab.append('div')
            .attr('class','feature_plot')
            .style('width', this.width + this.margin.left + this.margin.right)
            .style('height', this.height + this.margin.top + this.margin.bottom);

        // Create a new svg
        let svg = feature_plot.append("svg")
            .attr('class','feature_plot figure')
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        // feature_plot.append('div')
        //     .attr('class','feature_plot venn_diagram')
        //     .append('div')
        //     .text('Total number of designs: ' + ifeed.tradespace_plot.get_num_of_archs());
        
        var objects = svg.append("svg")
                .attr("class", "objects feature_plot")
                .attr("width", this.width)
                .attr("height", this.height)
                .style('margin-bottom','30px');

        // Initialize location
        for (let i = 0; i < this.all_features.length; i++){
            this.all_features[i].x0 = -1;
            this.all_features[i].y0 = -1;
            this.all_features[i].id = this.featureID++;
        }

        this.update();
    }
    
    
    update(newly_added_features){

        let that = this;
        
        function get_utopia_point(){
            // Utopia point
            return d3.selectAll('.dot.feature_plot').filter(function(d){
                if(d.id===that.utopia_point.id) return true;
                return false;
            });
        }

        
        function get_current_feature(){
            var id;
            if(that.current_feature){
                id = that.current_feature.id;
            }
            // The current feature
            return d3.selectAll('.dot.feature_plot').filter(function(d){
                if (d.id == id) return true;
                return false;
            });
        }


        // Set variables
        let margin = this.margin;
        let width = this.width;
        let height = this.height;

        let gX, gY;

        let duration = 500;

        let supps = [];
        let lifts = [];
        let conf1s = [];
        let conf2s = [];
        let scores=[];   
        let maxScore = -1;
        
        // Remove unnecessary points (cursor)
        d3.select(".objects.feature_plot")
                .selectAll('.dot.feature_plot')
                .data(this.all_features)
                .exit()
                .remove();
        
        // Clear the previously existing interval
        if(this.current_feature_blink_interval != null){
            
            clearInterval(this.current_feature_blink_interval);
            d3.selectAll('.dot.feature_plot').style('opacity',1);
        }
        
        if(newly_added_features){
            this.all_features = this.all_features.concat(newly_added_features);
        }
        
        for (var i=0;i<this.all_features.length;i++){
            
            supps.push(this.all_features[i].metrics[0]);
            lifts.push(this.all_features[i].metrics[1]);
            conf1s.push(this.all_features[i].metrics[2]);
            conf2s.push(this.all_features[i].metrics[3]);
            
            var score = 1-Math.sqrt(Math.pow(1-conf1s[i],2)+Math.pow(1-conf2s[i],2));
            scores.push(score);

            if(score > maxScore) maxScore = score;
        }
        
        // Add utopia point to the list
        var max_conf1 = Math.max.apply(null, conf1s);
        var max_conf2 = Math.max.apply(null, conf2s);
        var max_conf = Math.max(max_conf1, max_conf2);

        // Adjust the location of the utopia point
        this.utopia_point.metrics=[Math.max.apply(null, lifts),Math.max.apply(null, supps),max_conf,max_conf];

        // Insert the utopia point to the list of features
        this.all_features.splice(0, 0, this.utopia_point);
        // Add score for the utopia point (0.2 more than the best score found so far)
        scores.splice(0,0,Math.max.apply(null,scores)+0.2); 
        
        if(this.current_feature){
            // Add the current feature
            this.all_features.push(this.current_feature);
        }
        
        // Set the axis to be Conf(F->S) and Conf(S->F)
        let x = 2;
        let y = 3;

        // setup x
        // data -> value
        let xValue = function (d) {
            return d.metrics[x];
        }; 
        // value -> display
        let xScale = d3.scaleLinear().range([0, width]); 

        // don't want dots overlapping axis, so add in buffer to data domain 
        let xBuffer = (d3.max(this.all_features, xValue) - d3.min(this.all_features, xValue)) * 0.05;

        xScale.domain([d3.min(this.all_features, xValue) - xBuffer, d3.max(this.all_features, xValue) + xBuffer]);

        // data -> display
        let xMap = function (d) {
            return xScale(xValue(d));
        }; 
        let xAxis = d3.axisBottom(xScale);


        // setup y
        // data -> value
        let yValue = function (d) {
            return d.metrics[y];
        };
        // value -> display
        let yScale = d3.scaleLinear().range([height, 0]); 

        let yBuffer = (d3.max(this.all_features, yValue) - d3.min(this.all_features, yValue)) * 0.05;
        yScale.domain([d3.min(this.all_features, yValue) - yBuffer, d3.max(this.all_features, yValue) + yBuffer]);
        // data -> display
        let yMap = function (d) {
            return yScale(yValue(d));
        }; 
        let yAxis = d3.axisLeft(yScale);

        // Set the new locations of all the features
        for(let i = 0; i < this.all_features.length; i++){
            this.all_features[i].x = xMap(this.all_features[i]);
            this.all_features[i].y = yMap(this.all_features[i]);
            if(!this.all_features[i].x0){
                // If previous location has not been initialize, save the current location
                this.all_features[i].x0 = this.all_features[i].x;
                this.all_features[i].y0 = this.all_features[i].y;
            }
        }

        //Needed to map the values of the dataset to the color scale
        this.colorInterpolateRainbow = d3.scaleLinear()
                .domain(d3.extent(scores))
                .range([0,1]);

        // Setup zoom
        this.zoom = d3.zoom()
            .scaleExtent([0.2, 25])
            .on("zoom", d => {
                this.transform = d3.event.transform;
                gX.call(xAxis.scale(this.transform.rescaleX(xScale)));
                gY.call(yAxis.scale(this.transform.rescaleY(yScale)));

                d3.selectAll('.dot.feature_plot')
                    .attr("transform", function (d) {
                        let xCoord = that.transform.applyX(xMap(d));
                        let yCoord = that.transform.applyY(yMap(d));
                        return "translate(" + xCoord + "," + yCoord + ")";
                    });    
            });
        d3.select('.feature_plot.figure').call(this.zoom);
       

        let svg = d3.select('.feature_plot.figure').select('g')
        // x-axis
        gX = svg.append("g")
            .attr("class", "axis axis-x")
            .attr("transform", "translate(0, " + height + ")")
            .call(xAxis);
            
        svg.append("text")
            .attr("transform", "translate(" + width + ", " + height + ")")
            .attr("class", "label")
            .attr("y", -6)
            .style("text-anchor", "end")
            .text('Confidence(F->S)')
            .style('font-size','15px');

        // y-axis
        gY = svg.append("g")
            .attr("class", "axis axis-y")
            .call(yAxis);
        
        svg.append("text")
            .attr("class", "label")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text('Confidence(S->F)')
            .style('font-size','15px');

        var objects = d3.select(".objects.feature_plot")

        // Remove unnecessary points
        objects.selectAll('.dot.feature_plot')
                .data(this.all_features)
                .exit()
                .remove();

        // Create new dots
        objects.selectAll(".dot.feature_plot")
                .data(this.all_features)
                .enter()
                .append('path')
                .attr('class','point dot feature_plot')
                .attr("d", d3.symbol().type((d) => {return d3.symbolTriangle;}).size(120))
                .attr("transform", function (d) {
                    return "translate(" + d.x0 + "," + d.y0 + ")";
                })
                .style("stroke-width",1);

        d3.selectAll('.dot.feature_plot').filter(function(d){
            if(that.recent_features_id.indexOf(d.id)==-1){
                return true;
            }
            return false;
        })
        .attr("d", d3.symbol().type((d) => {return d3.symbolTriangle;}).size(120));
        
        // Modify the shape of all features that were added recently
        d3.selectAll('.dot.feature_plot').filter(function(d){
            if(that.recent_features_id.indexOf(d.id)!=-1){
                return true;
            }
            return false;
        })
        .attr('d',d3.symbol().type(d3.symbolCross).size(120));
        
        // Utopia point: modify the shape to a star
        get_utopia_point().attr('d',d3.symbol().type(d3.symbolStar).size(120));        
        

        // The current feature: modify the shape to a cross
        var _current_feature = get_current_feature().attr('d',d3.symbol().type(d3.symbolCross).size(120));

        _current_feature.shown=true;
        // The current feature
        _current_feature.style('fill',"black");    
        
        function blink() {
            if(_current_feature.shown) {
                _current_feature.style("opacity",0);
                _current_feature.shown = false;
            } else {
                _current_feature.style("opacity",1);
                _current_feature.shown = true;
            }
        }

        this.current_feature_blink_interval = setInterval(blink, 350);

        
        d3.selectAll('.dot.feature_plot').filter((d) => {
                if (d.id === this.utopia_point.id) {
                    return false;
                }
                else {
                    return true;
                }
            })
            .on("mouseover", (d) => { this.feature_mouseover(d); })
            .on('mouseout', (d) => { this.feature_mouseout(d); })
            .on('click', (d) => { this.feature_click(d); });   

        
        //Transition the colors to a rainbow
        function updateRainbow() {
            d3.selectAll(".dot.feature_plot")
                .style("fill", function (d,i) { return that.colorScaleRainbow(that.colorInterpolateRainbow(scores[i])); })
        }
        
        updateRainbow();

        // Remove the utopia point from the list
        this.all_features.splice(0,1);

        if(this.current_feature){
            // Remove the last feature, as it had been added temporarily to display the cursor
            this.all_features.pop();
        }

        d3.selectAll('.dot.feature_plot').transition()
            .duration(duration)
            .attr("transform",function(d){
                return "translate(" + d.x + "," + d.y + ")";
            });   
                
    }

    feature_click(d){
        // Replaces the current feature expression with the stashed expression
        this.feature_application.update_feature_application('update');
    }

    feature_mouseover(d){

        let id= d.id; 
        let expression = d.expression;
        let metrics = d.metrics;
        let conf = d.metrics[2];
        let conf2 = d.metrics[3];

        // Set variables
        let margin = this.margin;
        let width = this.width;
        let height = this.height;

        let mouseLoc_x = d3.mouse(d3.select(".objects.feature_plot").node())[0];
        let mouseLoc_y = d3.mouse(d3.select(".objects.feature_plot").node())[1];

        let tooltip_location = {x:0,y:0};
        let tooltip_width = 250;
        let tooltip_height = 120;

        let h_threshold = (width + margin.left + margin.right)*0.5;
        let v_threshold = (height + margin.top + margin.bottom)*0.55;


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

        var svg = d3.select(".objects.feature_plot");
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
                        .attrs({
                            'width':tooltip_width,
                            'height':tooltip_height  
                        })
                        .data([{id:id, expression:expression, metrics:metrics}]) 
                        .html(function(d){
                            var output= "lift: " + round_num(d.metrics[1]) + 
                            "<br> Support: " + round_num(d.metrics[0]) + 
                            "<br> Confidence(F->S): " + round_num(d.metrics[2]) + 
                            "<br> Confidence(S->F): " + round_num(d.metrics[3]) +"";
                            return output;
                        }).style("padding","14px")
                        .style('color','#F7FF55')
                        .style('word-wrap','break-word');   


        // Update the placeholder with the driving feature and stash the expression    
        this.feature_application.update_feature_application('temp',expression);
        //self.draw_venn_diagram(); 
    }

    feature_mouseout(d){
        var id = d.id;

        // Remove the tooltip
        d3.selectAll("#tooltip_g").remove();

        // Remove all the features created temporarily

        // Bring back the previously stored feature expression
        this.feature_application.update_feature_application('restore');        
        //this.draw_venn_diagram();       
    }
    
    add_feature_to_plot(expression){
        
                
        function find_equivalent_feature(metrics,indices){

            for(var i=0;i<self.all_features.length;i++){
                var _metrics = self.all_features[i].metrics;
                var match = true;
                for(var j=0;j<indices.length;j++){
                    var index = indices[j];
                    if(round_num(metrics[index])!=round_num(_metrics[index])){
                        match=false;
                    }
                }
                if(match){
                    return self.all_features[i];
                }
            }
            return null;
        }
        
        
        if(!expression || expression==""){

            self.current_feature=null;
            // Assign new indices for the added features
            self.update();

        }else{       
            
            this.filter.apply_filter_expression(expression);

            // Compute the metrics of a feature
            var total = ifeed.tradespace_plot.get_num_of_archs();
            var intersection = d3.selectAll('.dot.tradespace_plot.selected.highlighted:not(.cursor)')[0].length;
            var selected = d3.selectAll('.dot.tradespace_plot.selected:not(.cursor)')[0].length;
            var highlighted = d3.selectAll('.dot.tradespace_plot.highlighted:not(.cursor)')[0].length;

            var p_snf = intersection/total;
            var p_s = selected/total;
            var p_f = highlighted/total;

            var supp = p_snf;
            var conf = supp / p_f;
            var conf2 = supp / p_s;
            var lift = p_snf/(p_f*p_s); 
            var metrics = [supp, lift, conf, conf2];

            // Stash the previous location
            var x,y;
            if(self.current_feature){
                x=self.current_feature.x;
                y=self.current_feature.y;
            }else{
                x=-1,y=-1;
            }

            // Define new feature
            self.current_feature = {id:-1,name:expression,expression:expression,metrics:metrics,x0:x,x:x,y0:y,y:y};

            // Check if there exists a feature whose metrics match with the current feature's metrics
            var matched = find_equivalent_feature(metrics,[2,3]);       

            if(!matched){                
                var new_feature =  JSON.parse(JSON.stringify(self.current_feature));
                new_feature.id = featureID++;
                // Add new feature to the list of features
                self.user_added_features_id.push(new_feature.id);
                self.all_features.push(new_feature);
            }
            
            // Stash the previous locations of all features
            for(var i=0;i<self.all_features.length;i++){
                self.all_features[i].x0 = self.all_features[i].x;
                self.all_features[i].y0 = self.all_features[i].y;
            }

            document.getElementById('tab3').click();
            
            ifeed.tradespace_plot.highlight_support_panel();

            // Display the driving features with newly added feature
            this.update();
        }
    }
    
    
    check_if_non_dominated(test_feature, all_features){  
        
        var non_dominated = true;
        
        for (var j=0;j<all_features.length;j++){
            
            var this_feature = all_features[j];
            
            if(this_feature==test_feature) continue;
            
            if(dominates(this_feature.metrics.slice(2), test_feature.metrics.slice(2))){
                non_dominated = false;
            }
        }
        
        return non_dominated;
    }

        
    
    
    draw_venn_diagram(){

        var venn_diagram_container = d3.select('.feature_plot .venn_diagram').select('div');
        
        if(venn_diagram_container[0][0]==null) return;

        venn_diagram_container.select("svg").remove();
        
        var svg = venn_diagram_container
                                    .append("svg")
                                    .style('width','320px')  			
                                    .style('border-width','3px')
                                    .style('height','305px')
                                    .style('border-style','solid')
                                    .style('border-color','black')
                                    .style('border-radius','40px')
                                    .style('margin-top','10px')
                                    .style('margin-bottom','10px'); 

        
        var total = ifeed.tradespace_plot.get_num_of_archs();
        var intersection = d3.selectAll('.dot.tradespace_plot.selected.highlighted:not(.hidden):not(.cursor)')[0].length;
        var selected = d3.selectAll('.dot.tradespace_plot.selected:not(.hidden):not(.cursor)')[0].length;
        var highlighted = d3.selectAll('.dot.tradespace_plot.highlighted:not(.hidden):not(.cursor)')[0].length;

        
        var left_margin = 50;
        var c1x = 110;
        // Selection has a fixed radius
        var r1 = 70;
        var S_size = selected;

        svg.append("circle")
            .attr("id","venn_diag_c1")
            .attr("cx", c1x)
            .attr("cy", 180-30)
            .attr("r", r1)
            .style("fill", "steelblue")
            .style("fill-opacity", ".5");

        svg.append("text")
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
            var intersection = supp * ifeed.tradespace_plot.get_num_of_archs() * a1 / S_size;

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

            svg.append("circle")
                .attr("id","venn_diag_c2")
                .attr("cx", c2x)
                .attr("cy", 180-30)
                .attr("r", r2)
                .style("fill", "brown")
                .style("fill-opacity", ".5");

        }


        svg.append("text")
            .attr("id","venn_diag_int_text")
            .attr("x",left_margin-10)
            .attr("y",70-30)
            .attr("font-family","sans-serif")
            .attr("font-size","18px")
            .attr("fill","black")
            .text("Intersection: " + Math.round(supp * total));


        svg.append("text")
            .attr("id","venn_diag_c2_text")
            .attr("x",c1x+60)
            .attr("y",180+r1+50-30)
            .attr("font-family","sans-serif")
            .attr("font-size","18px")
            .attr("fill","brown")
            .text("Features:" + Math.round(F_size) );
    }
}



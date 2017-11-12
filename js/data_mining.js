/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


function DataMining(ifeed){
    
    var self = this;

    self.support_threshold = 0.002;
    self.confidence_threshold = 0.2;
    self.lift_threshold = 1;
    
//    self.support_threshold = 0.07;
//    self.confidence_threshold = 0.5;
//    self.lift_threshold = 1;    
    
    self.margin = {top: 20, right: 20, bottom: 30, left:65};
    self.width = 770 - 35 - self.margin.left - self.margin.right;
    self.height = 400 - 20 - self.margin.top - self.margin.bottom;
    
    var featureID = 1;
    
    self.all_features = [];
    self.mined_features_id = [];
    self.user_added_features_id = [];   
    self.recent_features_id = [];    
    self.current_feature = null;
    self.current_feature_blink_interval=null;
    self.utopia_point = {id:0,name:'utopiaPoint',expression:null,metrics:null,x0:-1,y0:-1,x:-1,y:-1};
    

    self.coloursRainbow = ["#2c7bb6", "#00a6ca","#00ccbc","#90eb9d","#ffff8c","#f9d057","#f29e2e","#e76818","#d7191c"];
    self.colourRangeRainbow = d3.range(0, 1, 1.0 / (self.coloursRainbow.length - 1));
    self.colourRangeRainbow.push(1);

    //Create color gradient
    self.colorScaleRainbow = d3.scale.linear()
        .domain(self.colourRangeRainbow)
        .range(self.coloursRainbow)
        .interpolate(d3.interpolateHcl);

    //Needed to map the values of the dataset to the color scale
    self.colorInterpolateRainbow = d3.scale.linear()
        .domain(d3.extent([]))
        .range([0,1]);
    

    self.xScale = null;
    self.yScale = null;
    self.xAxis = null;
    self.yAxis = null;
    
    

    self.initialize = function(){
        
        ifeed.UI_states.selection_changed=true;

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
        
        d3.selectAll("#run_data_mining_button").on("click", self.run);
        
        self.all_features = [];
        self.mined_features_id = [];
        self.user_added_features_id = [];   
        self.recent_features_id = [];    
        self.current_feature = null;
        self.current_feature_blink_interval=null;
        
        PubSub.publish(INITIALIZE_FEATURE_APPLICATION, null);
        
        featureID=1;
    }
    
    

    self.run = function(option){
        
        var selectedArchs = d3.selectAll(".dot.main_plot.selected:not(.hidden):not(.cursor)")[0];
        var nonSelectedArchs =  d3.selectAll(".dot.main_plot:not(.selected):not(.hidden):not(.cursor)")[0];

        // Store the id's of all dots
        var selected = [];
        var non_selected = [];

        for (var i = 0; i < selectedArchs.length; i++) {
            var id = selectedArchs[i].__data__.id;
            selected.push(id);
        }
        for (var i = 0; i < nonSelectedArchs.length; i++) {
            var id = nonSelectedArchs[i].__data__.id;
            non_selected.push(id);
        }                
        
        
        if (selectedArchs.length==0){
            alert("First select target solutions!");
            return;
        }     
                
        
        // If the feature application tree exists:
        if(ifeed.feature_application.root){
            // Run data mining in the marginal feature space
                        
            var selected_node = null;            
            
            // Save the node where the placeholder is to be located
            ifeed.feature_application.visit_nodes(ifeed.feature_application.root,function(d){
                if(d.add){selected_node=d;}                        
            })            
            
            // Save the currently applied feature
            var base_feature = ifeed.feature_application.parse_tree(ifeed.feature_application.root,selected_node);
            base_feature = ifeed.experiment.label.restore_randomized_variable(base_feature);

            var extracted_features = null;

            if(selected_node){

                extracted_features = self.get_marginal_driving_features(selected, non_selected, base_feature, 
                                                             self.support_threshold,self.confidence_threshold,self.lift_threshold);           

            }else if(!option){

                // Save the architectures that have the currently applied feature
                var highlightedArchs = d3.selectAll(".dot.main_plot.highlighted:not(.hidden):not(.cursor)")[0];                    

                var highlighted = [];
                for (var i = 0; i < highlightedArchs.length; i++) {
                    var id = highlightedArchs[i].__data__.id;
                    highlighted.push(id);
                }                       

                extracted_features = self.get_marginal_driving_features_conjunctive(selected, non_selected, base_feature, highlighted, 
                                                                 self.support_threshold,self.confidence_threshold,self.lift_threshold);
            }else{

                var root = ifeed.feature_application.root;

                extracted_features = [];

                var all_extracted_features = [];

                for(var i=0;i<root.children.length;i++){

                    selected_node = root.children[i];  
                    
                    if(selected_node.type=="logic"){
                        continue;
                    }
                    
                    var test_feature = ifeed.feature_application.parse_tree(root,selected_node); 
                    test_feature = ifeed.experiment.label.restore_randomized_variable(test_feature);
                    
                    var temp_features = self.get_marginal_driving_features(selected, non_selected, test_feature, 
                                                             self.support_threshold,self.confidence_threshold,self.lift_threshold);

                    all_extracted_features = all_extracted_features.concat(temp_features);

                }

                // Check non-dominance against the extracted features
                for(var j=0;j<all_extracted_features.length;j++){
                    var this_feature = all_extracted_features[j];
                    if(self.check_if_non_dominated(this_feature, all_extracted_features)) extracted_features.push(this_feature);
                }                    
            }
            
            
            
            var features_to_add = [];
            self.recent_features_id = [];

            // Check non-dominance against all existing features
            for(var i=0;i<extracted_features.length;i++){

                var this_feature = extracted_features[i];
                if(self.check_if_non_dominated(this_feature,self.all_features)){
                    var id = featureID++;
                    // non-dominated
                    self.mined_features_id.push(id);
                    self.recent_features_id.push(id); 

                    this_feature.id=id;
                    this_feature.expression = ifeed.experiment.label.relabel_randomized_variable(this_feature.expression);
                    this_feature.name=this_feature.expression;
                    features_to_add.push(this_feature);
                }
            }     

                       
            // Update the location of the current feature
            var x=self.current_feature.x;
            var y=self.current_feature.y;
            self.current_feature.x0=x;
            self.current_feature.y0=y;

            self.update_feature_plot(features_to_add);
            PubSub.publish(CANCEL_ADD_FEATURE, null);
                        
        }else{
            
            // Run data mining from the scratch (no local search)
            
            // Clear the feature application
            PubSub.publish(INITIALIZE_FEATURE_APPLICATION, null);

            // Remove all highlights in the scatter plot (retain target solutions)
            ifeed.main_plot.cancel_selection('remove_highlighted');   
            
            
            if(ifeed.experiment.condition_number=='2'){
                self.all_features=[];
                self.mined_features_id = [];
            }else{
                self.all_features = [];
                var extracted_features = self.get_driving_features(selected,non_selected,self.support_threshold,self.confidence_threshold,self.lift_threshold);    
                
                for(var j=0;j<extracted_features.length;j++){
                    var this_feature = extracted_features[j];
                    this_feature.expression = ifeed.experiment.label.relabel_randomized_variable(this_feature.expression);
                    this_feature.name=this_feature.expression;
                    self.all_features.push(this_feature);
                }
                
                if(self.all_features.length==0){
                    return;
                }else{
                    for(var i=0;i<self.all_features.length;i++){
                        self.mined_features_id.push(self.all_features[i].id);
                    }
                }                
                
            } 
            
            self.display_features();              
            
        }
 
    }

    
    

    self.get_driving_features = function(selected,non_selected,support_threshold,confidence_threshold,lift_threshold){

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
    
    
    self.get_marginal_driving_features = function(selected,non_selected,featureExpression,
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
    
    
    
    self.get_marginal_driving_features_conjunctive = function(selected,non_selected,featureName,highlighted,
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
    
    
    
    
    self.display_features = function(){

        document.getElementById('tab3').click();
        
        ifeed.main_plot.highlight_support_panel();

        // Remove previous plot
        d3.select("#view3").select("g").remove();

        var tab = d3.select('#view3').append('g');

        // Create plot div's
        var feature_plot = tab.append('div')
            .attr('class','feature_plot')
            .style('width', self.width + self.margin.left + self.margin.right)
            .style('height', self.height + self.margin.top + self.margin.bottom);

        // Create a new svg
        var svg = feature_plot.append("svg")
            .attr('class','feature_plot figure')
            .attr("width", self.width + self.margin.left + self.margin.right)
            .attr("height", self.height + self.margin.top + self.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");

        feature_plot.append('div')
            .attr('class','feature_plot venn_diagram')
            .append('div')
            .text('Total number of designs: ' + ifeed.main_plot.get_num_of_archs());
        
        
        var objects = svg.append("svg")
                .attr("class", "objects feature_plot")
                .attr("width", self.width)
                .attr("height", self.height)
                .style('margin-bottom','30px');

        // Initialize location
        for(var i=0;i<self.all_features.length;i++){
            self.all_features[i].x0 = -1;
            self.all_features[i].y0 = -1;
            self.all_features[i].id = featureID++;
        }

        self.update_feature_plot();
    }
    
    
    
    self.update_feature_plot = function(newly_added_features){
        
        function get_utopia_point(){
            // Utopia point
            return d3.selectAll('.dot.feature_plot').filter(function(d){
                if(d.id===self.utopia_point.id) return true;
                return false;
            });
        }

        
        function get_current_feature(){
            var id;
            if(self.current_feature){
                id = self.current_feature.id;
            }
            // The current feature
            return d3.selectAll('.dot.feature_plot').filter(function(d){
                if(d.id==id) return true;
                return false;
            });
        }


        // Set variables
        var margin = self.margin;
        var width = self.width;
        var height = self.height;

        var duration = 500;

        var supps = [];
        var lifts = [];
        var conf1s = [];
        var conf2s = [];

        var scores=[];   
        var maxScore = -1;
        
        // Remove unnecessary points (cursor)
        d3.select(".objects.feature_plot")
                .selectAll('.dot.feature_plot')
                .data(self.all_features)
                .exit()
                .remove();
        
        // Clear the previously existing interval
        if(self.current_feature_blink_interval != null){
            
            clearInterval(self.current_feature_blink_interval);
            d3.selectAll('.dot.feature_plot').style('opacity',1);
        }
        
        if(newly_added_features){
            self.all_features = self.all_features.concat(newly_added_features);
        }
        
        for (var i=0;i<self.all_features.length;i++){
            
            supps.push(self.all_features[i].metrics[0]);
            lifts.push(self.all_features[i].metrics[1]);
            conf1s.push(self.all_features[i].metrics[2]);
            conf2s.push(self.all_features[i].metrics[3]);
            
            var score = 1-Math.sqrt(Math.pow(1-conf1s[i],2)+Math.pow(1-conf2s[i],2));
            scores.push(score);

            if(score > maxScore) maxScore = score;
        }

        
        // Add utopia point to the list
        var max_conf1 = Math.max.apply(null, conf1s);
        var max_conf2 = Math.max.apply(null, conf2s);
        var max_conf = Math.max(max_conf1, max_conf2);

        // Adjust the location of the utopia point
        self.utopia_point.metrics=[Math.max.apply(null, lifts),Math.max.apply(null, supps),max_conf,max_conf];
        
        if(self.all_features.length!=0){
            // Insert the utopia point to the list of features        
            self.all_features.splice(0, 0, self.utopia_point);
        }

        // Add score for the utopia point (0.2 more than the best score found so far)
        scores.splice(0,0,Math.max.apply(null,scores)+0.2); 

        
        if(self.current_feature){
            // Add the current feature
            self.all_features.push(self.current_feature);
        }
        
        
        // Set the axis to be Conf(F->S) and Conf(S->F)
        var x = 2;
        var y = 3;

        // setup x
        // data -> value
        var xValue = function (d) {
            return d.metrics[x];
        }; 
        // value -> display
        var xScale = d3.scale.linear().range([0, width]); 

        // don't want dots overlapping axis, so add in buffer to data domain 
        var xBuffer = (d3.max(self.all_features, xValue) - d3.min(self.all_features, xValue)) * 0.05;
        
        if(self.all_features.length==0){
            xScale.domain([0,1]);
        }else{
            xScale.domain([d3.min(self.all_features, xValue) - xBuffer, d3.max(self.all_features, xValue) + xBuffer]);
        }
        

        // data -> display
        var xMap = function (d) {
            return xScale(xValue(d));
        }; 
        var xAxis = d3.svg.axis().scale(xScale).orient("bottom");


        // setup y
        // data -> value
        var yValue = function (d) {
            return d.metrics[y];
        };
        // value -> display
        var yScale = d3.scale.linear().range([height, 0]); 

        var yBuffer = (d3.max(self.all_features, yValue) - d3.min(self.all_features, yValue)) * 0.05;
        
        if(self.all_features.length==0){
            yScale.domain([0,1]);
        }else{
            yScale.domain([d3.min(self.all_features, yValue) - yBuffer, d3.max(self.all_features, yValue) + yBuffer]);
        }
        
        // data -> display
        var yMap = function (d) {
            return yScale(yValue(d));
        }; 
        var yAxis = d3.svg.axis().scale(yScale).orient("left");

        // Set the new locations of all the features
        for(var i=0;i<self.all_features.length;i++){
            self.all_features[i].x = xMap(self.all_features[i]);
            self.all_features[i].y = yMap(self.all_features[i]);
            if(!self.all_features[i].x0){
                // If previous location has not been initialize, save the current location
                self.all_features[i].x0 = self.all_features[i].x;
                self.all_features[i].y0 = self.all_features[i].y;
            }
        }
        
        self.xScale=xScale;
        self.yScale=yScale;
        self.xAxis=xAxis;
        self.yAxis=yAxis;


        //Needed to map the values of the dataset to the color scale
        self.colorInterpolateRainbow = d3.scale.linear()
                .domain(d3.extent(scores))
                .range([0,1]);

        // Set zoom
        d3.select('.feature_plot.figure').call(

                    d3.behavior.zoom()
                    .x(xScale)
                    .y(yScale)
                    .scaleExtent([0.2, 50])
                    .on("zoom", function (d) {

                        var scale = d3.event.scale;

                        d3.select('.feature_plot.figure').select(".x.axis").call(xAxis);
                        d3.select('.feature_plot.figure').select(".y.axis").call(yAxis);

                        d3.selectAll('.dot.feature_plot')
                            .attr("transform", function (d) {
                                var xCoord = xMap(d);
                                var yCoord = yMap(d);
                                return "translate(" + xCoord + "," + yCoord + ")";
                            });        
                    })

                )
                .append("g")        
                .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");



        var svg = d3.select('.feature_plot.figure').select('g')

        d3.select('.x.axis.feature_plot').remove();
        d3.select('.y.axis.feature_plot').remove();
        d3.select('.axisLine.hAxisLine.feature_plot').remove();
        d3.select('.axisLine.vAxisLine.feature_plot').remove();

        // x-axis
        svg.append('g')
                .attr("class", "x axis feature_plot")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis)
                .append("text")
                .attr("class", "label feature_plot")
                .attr("x", self.width)
                .attr("y", -6)
                .style("text-anchor", "end")
                .text('Specificity')
                .style('font-size','15px');

        // y-axis
        svg.append('g')
                .attr("class", "y axis feature_plot")
                .call(yAxis)
                .append("text")
                .attr("class", "feature_plot label")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text('Coverage')
                .style('font-size','15px');


        var objects = d3.select(".objects.feature_plot")

        //Create main 0,0 axis lines:
        objects.append("svg:line")
                .attr("class", "axisLine hAxisLine feature_plot")
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", self.width)
                .attr("y2", 0)
                .attr("transform", "translate(0," + yScale(0) + ")");

        objects.append("svg:line")
                .attr("class", "axisLine vAxisLine feature_plot")
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", 0)
                .attr("y2", self.height)
                .attr("transform", "translate(" + xScale(0) + ",0)");

        // Remove unnecessary points
        objects.selectAll('.dot.feature_plot')
                .data(self.all_features)
                .exit()
                .remove();

        // Create new dots
        objects.selectAll(".dot.feature_plot")
                .data(self.all_features)
                .enter()
                .append('path')
                .attr('class','point dot feature_plot')
                .attr("d", d3.svg.symbol().type('triangle-up').size(120))
                .attr("transform", function (d) {
                    return "translate(" + d.x0 + "," + d.y0 + ")";
                })
                .style("stroke-width",1);



        d3.selectAll('.dot.feature_plot').filter(function(d){
            if(self.recent_features_id.indexOf(d.id)==-1){
                return true;
            }
            return false;
        })
        .attr("d", d3.svg.symbol().type('triangle-up').size(120));
        
        
        // Modify the shape of all features that were added recently
        d3.selectAll('.dot.feature_plot').filter(function(d){
            if(self.recent_features_id.indexOf(d.id)!=-1){
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

        self.current_feature_blink_interval = setInterval(blink, 350);


        
        d3.selectAll('.dot.feature_plot').filter(function(d){
                if(d.id===self.utopia_point.id) return false;
                return true;
            })
            .on("mouseover", self.feature_mouseover)
            .on('mouseout', self.feature_mouseout)
            .on('click', self.feature_click);   

        
        //Transition the colors to a rainbow
        function updateRainbow() {
            d3.selectAll(".dot.feature_plot")
                .style("fill", function (d,i) { return self.colorScaleRainbow(self.colorInterpolateRainbow(scores[i])); })
        }
        
        updateRainbow();

        // Remove the utopia point from the list
        self.all_features.splice(0,1);

        if(self.current_feature){
            // Remove the last feature, as it had been added temporarily to display the cursor
            self.all_features.pop();
        }

        d3.selectAll('.dot.feature_plot').transition()
            .duration(duration)
            .attr("transform",function(d){
                return "translate(" + d.x + "," + d.y + ")";
            });   
                
    }
    
    
    

    self.feature_click = function(d){
        // Replaces the current feature expression with the stashed expression
        ifeed.feature_application.update_feature_application('update');
    }


    self.feature_mouseover = function(d){

        var id= d.id; 
        var expression = d.expression;
        
        var metrics = d.metrics;
        var conf = d.metrics[2];
        var conf2 = d.metrics[3];

        // Set variables
        var margin = self.margin;
        var width = self.width;
        var height = self.height;

        var mouseLoc_x = d3.mouse(d3.select(".objects.feature_plot")[0][0])[0];
        var mouseLoc_y = d3.mouse(d3.select(".objects.feature_plot")[0][0])[1];

        var tooltip_location = {x:0,y:0};
        var tooltip_width = 160;
        var tooltip_height = 100;

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
                        .attr({
                            'width':tooltip_width,
                            'height':tooltip_height  
                        })
                        .data([{id:id, expression:expression, metrics:metrics}]) 
                        .html(function(d){

                            var output= "<br> Specificity: " + round_num(d.metrics[2]) + 
                            "<br> Coverage: " + round_num(d.metrics[3]) +"";

                            return output;
                        }).style("padding","3px")
                        .style('color','#F7FF55')
                        .style('word-wrap','break-word')
                        .style('font-size','21px;');   

        // Update the placeholder with the driving feature and stash the expression    
        ifeed.feature_application.update_feature_application('temp',expression);
        self.draw_venn_diagram(); 
    }



    self.feature_mouseout = function(d){

        var id = d.id;

        // Remove the tooltip
        d3.selectAll("#tooltip_g").remove();

        // Remove all the features created temporarily

        // Bring back the previously stored feature expression
        ifeed.feature_application.update_feature_application('restore');        
        self.draw_venn_diagram();       
    }


    
    
    
    self.add_feature_to_plot = function(expression){
        
                
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
        
        if(!d3.select('.feature_plot.figure')) return null;
        
        
        if(!expression || expression==""){

            self.current_feature=null;
            // Assign new indices for the added features
            self.update_feature_plot();

        }else{       
                        
            ifeed.filter.apply_filter_expression(expression);
            
            // Compute the metrics of a feature
            var total = ifeed.main_plot.get_num_of_archs();
            var intersection = d3.selectAll('.dot.main_plot.selected.highlighted:not(.cursor)')[0].length;
            var selected = d3.selectAll('.dot.main_plot.selected:not(.cursor)')[0].length;
            var highlighted = d3.selectAll('.dot.main_plot.highlighted:not(.cursor)')[0].length;

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
            
            ifeed.main_plot.highlight_support_panel();

            // Display the driving features with newly added feature
            self.update_feature_plot();
        }
    }
    
    
    self.check_if_non_dominated = function(test_feature, all_features){  
        
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

        
    
    
    self.draw_venn_diagram = function(){

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

        
        var total = ifeed.main_plot.get_num_of_archs();
        var intersection = d3.selectAll('.dot.main_plot.selected.highlighted:not(.hidden):not(.cursor)')[0].length;
        var selected = d3.selectAll('.dot.main_plot.selected:not(.hidden):not(.cursor)')[0].length;
        var highlighted = d3.selectAll('.dot.main_plot.highlighted:not(.hidden):not(.cursor)')[0].length;

        
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
            var intersection = supp * ifeed.main_plot.get_num_of_archs() * a1 / S_size;

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


    PubSub.subscribe(ADD_FEATURE, (msg, data) => {
        self.add_feature_to_plot(data)
    });  
    
    PubSub.subscribe(DRAW_VENN_DIAGRAM, (msg, data) => {
        self.draw_venn_diagram()
    });     
    
    self.initialize();
}



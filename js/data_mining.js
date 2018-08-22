
class DataMining{
    
    constructor(filteringScheme, labelingScheme){

        this.run_ga = true;
        this.enable_generalization = false;

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

        this.xAxis = null;
        this.yAxis = null;
        this.gX = null;
        this.gY = null;
        
        this.featureID = 1;
        this.transform = d3.zoomIdentity;

        this.all_features = [];
        this.mined_features_id = [];
        this.user_added_features_id = [];   
        this.recent_features_id = [];    

        this.current_feature = null;
        this.current_feature_blink_interval=null;
        this.utopia_point = {id:0,name:'utopiaPoint',expression:null,metrics:null,x0:-1,y0:-1,x:-1,y:-1};
        
        this.coloursRainbow = ["#2c7bb6", "#00a6ca", "#00ccbc", "#90eb9d", "#ffff8c", "#f9d057", "#f29e2e", "#e76818", "#d7191c"];
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

        this.run_automated_local_search = false;


        PubSub.subscribe(ADD_FEATURE, (msg, data) => {
            this.add_feature_to_plot(data);
        });  
        
        // PubSub.subscribe(DRAW_VENN_DIAGRAM, (msg, data) => {
        //     self.draw_venn_diagram();
        // });     
        
        // Save the data
        PubSub.subscribe(DATA_PROCESSED, (msg, data) => {
            this.data = data;
        });       

        PubSub.subscribe(DESIGN_PROBLEM_LOADED, (msg, data) => {
            this.metadata = data.metadata;
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
        
        PubSub.publish(INITIALIZE_FEATURE_APPLICATION, null);
        this.featureID = 1;
    }
    
    async run(option){
        
        // Store the id's of all samples
        let selected = [];
        let non_selected = [];

        for (let i = 0; i< this.selected_archs.length; i++){
            selected.push(this.selected_archs[i].id);
        }

        for (let i = 0; i < this.data.length; i++){
            if(!this.data[i].hidden){
                let id = this.data[i].id;
                if (selected.indexOf(id) === -1){
                    // non-selected
                    non_selected.push(id);
                }
            }
        }

        if (this.selected_archs.length==0){
            alert("First select target solutions!");
            return;
        }     
                
        // If the feature application tree exists, run local search
        if(this.feature_application.data){

            // Run data mining in the marginal feature space
            let selected_node = null;            
            
            // Save the node where the placeholder is to be located
            this.feature_application.visit_nodes(this.feature_application.data, (d) => {
                if(d.add){
                    selected_node=d;
                }                        
            })            
            
            // Save the currently applied feature
            let base_feature = this.feature_application.parse_tree(this.feature_application.data, selected_node);

            let extracted_features = null;

            // Run local search either using disjunction or conjunction
            let logical_connective = null;
            if(option){
                logical_connective = "OR";
            }else{
                logical_connective = "AND";
            }

            extracted_features = this.get_marginal_driving_features(selected, non_selected, base_feature, logical_connective,
                                                     this.support_threshold,this.confidence_threshold,this.lift_threshold);
        
            let features_to_add = [];
            this.recent_features_id = [];

            // Check non-dominance against all existing features
            for(let i = 0; i < extracted_features.length; i++){

                let this_feature = extracted_features[i];

                if(this.check_if_non_dominated(this_feature, this.all_features)){
                    let id = this.featureID++;
                    // non-dominated
                    this.mined_features_id.push(id);
                    this.recent_features_id.push(id); 

                    this_feature.id = id;
                    features_to_add.push(this_feature);
                }
            }     

            // Update the location of the current feature
            // let x = this.current_feature.x;
            // let y = this.current_feature.y;
            // this.current_feature.x0 = x;
            // this.current_feature.y0 = y;

            this.update(features_to_add);

            PubSub.publish(CANCEL_ADD_FEATURE, null);
                        
        }
        else if(this.run_automated_local_search){

            // Run data mining from the scratch (no local search)
            
            // Clear the feature application
            PubSub.publish(INITIALIZE_FEATURE_APPLICATION, null);

            // Remove all highlights in the scatter plot (retain target solutions)
            PubSub.publish(APPLY_FEATURE_EXPRESSION, null);

            this.all_features = this.get_driving_features_automated(selected, non_selected, this.support_threshold, this.confidence_threshold, this.lift_threshold);

            if(this.all_features.length === 0){ // If there is no driving feature returned
                return;
            }else{
                for(let i = 0; i < this.all_features.length; i++){
                    this.mined_features_id.push(this.all_features[i].id);
                }
            }

            this.display_features();       
        } 
        else{            
            // Run data mining from the scratch (no local search)
            
            // Clear the feature application
            PubSub.publish(INITIALIZE_FEATURE_APPLICATION, null);

            // Remove all highlights in the scatter plot (retain target solutions)
            PubSub.publish(APPLY_FEATURE_EXPRESSION, null);

            if(!this.run_ga){
                this.all_features = this.get_driving_features(selected, non_selected, this.support_threshold, this.confidence_threshold, this.lift_threshold);
           
            }else{
                if(this.enable_generalization){
                    this.all_features = this.get_driving_features_with_generalization(selected, non_selected);
                }else{
                    this.all_features = this.get_driving_features_epsilon_moea(selected, non_selected);
                }
            }

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

    get_driving_features_with_generalization(selected, non_selected){

        console.log("Epsilon-MOEA with variable generalization called");

        let that = this;
        let output;
        $.ajax({
            url: "/api/data-mining/get-driving-features-with-generalization",
            type: "POST",
            data: {ID: "get_driving_features",
                    problem: this.metadata.problem,  // eoss or gnc
                    input_type: this.metadata.input_type, // Binary or Discrete
                    selected: JSON.stringify(selected),
                    non_selected:JSON.stringify(non_selected),
                  },
            async: false,
            success: function (data, textStatus, jqXHR)
            {
                if(data=="[]"){
                    alert("No driving feature mined. Please try modifying the selection. (Try selecting more designs)");
                }
                output = data;
                that.get_problem_parameters();
            },
            error: function (jqXHR, textStatus, errorThrown)
            {alert("error");}
        });

        return output;
    }

    get_driving_features_epsilon_moea(selected, non_selected){

        console.log("Epsilon-MOEA called");

        let output;
        $.ajax({
            url: "/api/data-mining/get-driving-features-epsilon-moea",
            type: "POST",
            data: {ID: "get_driving_features",
                    problem: this.metadata.problem,  // eoss or gnc
                    input_type: this.metadata.input_type, // Binary or Discrete
                    selected: JSON.stringify(selected),
                    non_selected:JSON.stringify(non_selected),
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

    get_driving_features(selected,non_selected,support_threshold,confidence_threshold,lift_threshold){

        let output;
        $.ajax({
            url: "/api/data-mining/get-driving-features",
            type: "POST",
            data: {ID: "get_driving_features",
                    problem: this.metadata.problem,  // eoss or gnc
                    input_type: this.metadata.input_type, // Binary or Discrete
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
    
    get_driving_features_automated(selected,non_selected,support_threshold,confidence_threshold,lift_threshold){

        let output;
        $.ajax({
            url: "/api/data-mining/get-driving-features-automated",
            type: "POST",
            data: {ID: "get_driving_features",
                    problem: this.metadata.problem,  // eoss or gnc
                    input_type: this.metadata.input_type, // Binary or Discrete
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
    get_marginal_driving_features(selected,non_selected,featureExpression,logical_connective,
                                                   support_threshold,confidence_threshold,lift_threshold){
        
        let output;
        $.ajax({
            url: "/api/data-mining/get-marginal-driving-features",
            type: "POST",
            data: {
                    problem: this.metadata.problem,  // eoss or gnc
                    input_type: this.metadata.input_type, // Binary or Discrete
                    featureExpression: featureExpression,
                    selected: JSON.stringify(selected),
                    non_selected:JSON.stringify(non_selected),
                    logical_connective:logical_connective,
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
            return d3.selectAll('.dot.feature_plot').filter((d) => {
                if(d.id === that.utopia_point.id) return true;
                return false;
            });
        }

        function get_current_feature(){
            let id;
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

        let duration = 500;

        let supps = [];
        let lifts = [];
        let conf1s = [];
        let conf2s = [];
        let scores=[];   
        let maxScore = -1;
        
        //Remove unnecessary points (cursor)
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

        d3.select('.feature_plot.figure').select('g').selectAll('.axis').remove();
        d3.select('.feature_plot.figure').select('g').selectAll('.label').remove();

        // Add new features
        if(newly_added_features){
            this.all_features = this.all_features.concat(newly_added_features);
        }
        
        // Get the maximum values
        for (let i = 0; i < this.all_features.length; i++){
            
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
        this.utopia_point.metrics = [Math.max.apply(null, lifts), Math.max.apply(null, supps), max_conf, max_conf];

        // Insert the utopia point to the list of features
        this.all_features.splice(0, 0, this.utopia_point);

        // Add score for the utopia point (0.2 more than the best score found so far)
        scores.splice(0,0,Math.max.apply(null,scores) + 0.2); 
        
        if(this.current_feature){ // If the current feature is defined
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
        this.xAxis = d3.axisBottom(xScale);

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
        this.yAxis = d3.axisLeft(yScale);

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
            .on("zoom", (d) => {

                this.transform = d3.event.transform;
                this.gX.call(this.xAxis.scale(this.transform.rescaleX(xScale)));
                this.gY.call(this.yAxis.scale(this.transform.rescaleY(yScale)));

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
        this.gX = svg.append("g")
            .attr("class", "axis axis-x")
            .attr("transform", "translate(0, " + height + ")")
            .call(this.xAxis);

        svg.append("text")
            .attr("transform", "translate(" + width + ", " + height + ")")
            .attr("class", "label")
            .attr("y", -6)
            .style("text-anchor", "end")
            .text('Specificity')
            .style('font-size','15px');

        // y-axis
        this.gY = svg.append("g")
            .attr("class", "axis axis-y")
            .call(this.yAxis);
        
        svg.append("text")
            .attr("class", "label")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text('Coverage')
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

        // Get all the features that are not newly added
        d3.selectAll('.dot.feature_plot').filter(function(d){
            if(that.recent_features_id.indexOf(d.id) === -1){
                return true;
            }
            return false;
        })
        .attr("d", d3.symbol().type((d) => {return d3.symbolTriangle;}).size(120));
        
        // Modify the shape of all features that were added recently, to crosses
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

        _current_feature.shown = true;
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

        let id = d.id; 
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

        if(this.current_feature){
            if(d.expression === this.current_feature.expression){
                return;
            }
        }
        
        // Update the placeholder with the driving feature and stash the expression    
        this.feature_application.update_feature_application('temp', expression);
        //self.draw_venn_diagram(); 
    }

    feature_mouseout(d){
        let id = d.id;

        // Remove the tooltip
        d3.selectAll("#tooltip_g").remove();

        // Remove all the features created temporarily

        // Bring back the previously stored feature expression
        this.feature_application.update_feature_application('restore');        
        //this.draw_venn_diagram();       
    }
    
    add_feature_to_plot(expression){

        let that = this;
                
        function find_equivalent_feature(metrics, indices){

            for(let i = 0; i < that.all_features.length; i++){
                let _metrics = that.all_features[i].metrics;
                let match = true;
                for(let j = 0; j < indices.length; j++){
                    let index = indices[j];
                    if(round_num(metrics[index]) != round_num(_metrics[index])){
                        match=false;
                    }
                }
                if(match){
                    return that.all_features[i];
                }
            }
            return null;
        }
        
        if(!expression || expression === ""){
            this.current_feature = null;
            // Assign new indices for the added features
            this.update();

        }else{       
            
            // Compute the metrics of a feature
            let total = this.data.length;
            let highlighted = 0;
            let selected = 0;
            let intersection = 0;

            this.data.forEach(point => {

                if (point.highlighted && !point.hidden){
                    highlighted += 1;
                    if (point.selected){
                        intersection += 1;
                    }                    
                }
                
                if (point.selected && !point.hidden){
                    selected += 1;
                }

            });    

            let p_snf = intersection / total;
            let p_s = selected / total;
            let p_f = highlighted / total;

            let supp = p_snf;
            let conf = null;
            let conf2 = null;
            let lift = null;

            if(highlighted > 0){
                conf = supp / p_f;
            }else{
                conf = 0;
            }

            if(selected > 0){
                conf2 = supp / p_s;
            }else{
                conf2 = 0;
            }

            if(p_f > 0 && p_s > 0){
                lift = p_snf / (p_f * p_s); 
            }else{
                lift = 0;
            }
             
            let metrics = [supp, lift, conf, conf2];

            // Stash the previous location
            let x,y;
            if(this.current_feature){
                x = this.current_feature.x;
                y = this.current_feature.y;
            }else{
                x = -1;
                y = -1;
            }

            // Define new feature
            this.current_feature = {id:-1, name:expression, expression:expression, metrics:metrics, x0:x, x:x, y0:y, y:y};

            // Check if there exists a feature whose metrics match with the current feature's metrics
            let matched = find_equivalent_feature(metrics,[2,3]);       

            if(!matched){                
                let new_feature =  JSON.parse(JSON.stringify(this.current_feature));
                new_feature.id = this.featureID++;
                // Add new feature to the list of features
                this.user_added_features_id.push(new_feature.id);
                this.all_features.push(new_feature);
            }
            
            // Stash the previous locations of all features
            for(let i = 0; i < this.all_features.length; i++){
                this.all_features[i].x0 = this.all_features[i].x;
                this.all_features[i].y0 = this.all_features[i].y;
            }

            document.getElementById('tab3').click();
            
            // Display the driving features with newly added feature
            this.update();
        }
    }
    
    
    check_if_non_dominated(test_feature, all_features){  
        
        let non_dominated = true;
        
        for (let j = 0; j < all_features.length; j++){
            
            let this_feature = all_features[j];
            
            if(this_feature === test_feature) continue;
            
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
                    url: "/api/ifeed/venn-diagram-distance",
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






    run_clustering(param){

        if(!param){
            param = 3;
        }

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

        let cluster_result = null;
        $.ajax({
            url: "/api/data-mining/cluster-data",
            type: "POST",
            data: {ID: "cluster-data",
                    param: param,
                    problem: this.metadata.problem,  // eoss or gnc
                    input_type: this.metadata.input_type, // Binary or Discrete
                    selected: JSON.stringify(selected),
                    non_selected:JSON.stringify(non_selected),
                  },
            async: false,
            success: function (data, textStatus, jqXHR)
            {
                console.log("Clustering finished");
                cluster_result = data;
            },
            error: function (jqXHR, textStatus, errorThrown)
            {alert("error");}
        });

        let id_list = cluster_result.id;
        let labels = cluster_result.labels;

        let clusters = {};
        for(let i = 0; i < id_list.length; i++){
            let id = +id_list[i];
            
            let label_string = labels[i];
            let label_num = + label_string;

            if(!clusters[label_string]){
                clusters[label_string] = [];
            }

            clusters[label_string].push(id);
        }

        let cluster_colors = [
            "rgba(234, 23, 0, 1)", // red
            "rgba(0, 234, 23, 1)", // green
            "rgba(0, 129, 234, 1)", // blue
            "rgba(234, 105, 0, 1)", // orange
            "rgba(0, 234, 148, 1)", // cyan? emerald?
        ];

        this.run_data_mining_for_each_cluster(clusters);

        let clusterNames = Object.keys(clusters);

        this.data.forEach(point => {
            let id = point.id;
            for(let i = 0; i < clusterNames.length; i++){

                let clusterName = clusterNames[i];
                if(clusters[clusterName].indexOf(id) != -1){
                    // If the current point is included in the cluster
                    point.drawingColor = cluster_colors[i];
                    point.cluster = i;
                }
            }
        });

        this.clusters = clusters;

        PubSub.publish(UPDATE_TRADESPACE_PLOT, true);
    }

    run_data_mining_for_each_cluster(clusters){

        let extracted_features = [];

        let keys = Object.keys(clusters);

        // Clear the feature application
        PubSub.publish(INITIALIZE_FEATURE_APPLICATION, null);

        // Remove all highlights in the scatter plot (retain target solutions)
        PubSub.publish(APPLY_FEATURE_EXPRESSION, null);

        for(let i = 0; i < keys.length; i++){

            let thisCluster = clusters[keys[i]];

            let otherClusters = [];
            for(let j = 0; j < keys.length; j++){
                if(i === j){
                    continue;
                }else{
                    otherClusters.concat(clusters[keys[j]]);
                }
            }

            // Store the id's of all dots
            let selected = [];
            let non_selected = [];

            this.data.forEach( point => {
                let id = point.id;

                if(point.hidden){
                    return;
                
                }else if(thisCluster.indexOf(id) != -1){
                    selected.push(id);
                
                }else{
                    if(otherClusters.indexOf(id) === -1){
                        non_selected.push(id);
                    }
                }
            });

            let features = this.get_driving_features_automated(selected, non_selected, this.support_threshold, this.confidence_threshold, this.lift_threshold);

            extracted_features = extracted_features.concat(features);   
        }

        this.all_features = extracted_features;
        this.display_features();  
    }

    highlight_clustering_result(param){

        if(!param){
            param = 3;
        }

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

        let cluster_result = null;
        $.ajax({
            url: "/api/data-mining/cluster-data",
            type: "POST",
            data: {ID: "cluster-data",
                    param: param,
                    problem: this.metadata.problem,  // eoss or gnc
                    input_type: this.metadata.input_type, // Binary or Discrete
                    selected: JSON.stringify(selected),
                    non_selected:JSON.stringify(non_selected),
                  },
            async: false,
            success: function (data, textStatus, jqXHR)
            {
                console.log("Clustering finished");
                cluster_result = data;
            },
            error: function (jqXHR, textStatus, errorThrown)
            {alert("error");}
        });

        let id_list = cluster_result.id;
        let labels = cluster_result.labels;

        let clusters = {};
        for(let i = 0; i < id_list.length; i++){
            let id = +id_list[i];
            
            let label_string = labels[i];
            let label_num = + label_string;

            if(!clusters[label_string]){
                clusters[label_string] = [];
            }

            clusters[label_string].push(id);
        }

        let cluster_colors = [
            "rgba(234, 23, 0, 1)", // red
            "rgba(0, 234, 23, 1)", // green
            "rgba(0, 129, 234, 1)", // blue
            "rgba(234, 105, 0, 1)", // orange
            "rgba(0, 234, 148, 1)", // cyan? emerald?
            "rgba(250, 92, 255, 1)",
            "rgba(218, 255, 92, 1)",
        ];

        let clusterNames = Object.keys(clusters);

        this.data.forEach(point => {
            let id = point.id;
            for(let i = 0; i < clusterNames.length; i++){

                let clusterName = clusterNames[i];
                if(clusters[clusterName].indexOf(id) != -1){
                    // If the current point is included in the cluster
                    point.drawingColor = cluster_colors[i];
                    point.cluster = i;
                }
            }
        });

        PubSub.publish(UPDATE_TRADESPACE_PLOT, true);
    }


    compute_algebraic_complexity_of_features(startInd, endInd){

        let features = this.all_features;
        if(features.length == 0){
            return null;
        }

        if(startInd == null || endInd == null){
            startInd = 0;
            endInd = features.length;
        }

        let expressions = [];
        for(let i = startInd; i < endInd; i++){
            expressions.push(features[i].expression);
        }

        let complexity = [];
        $.ajax({
            url: "/api/data-mining/compute-complexity-of-features",
            type: "POST",
            data: {
                    expressions: JSON.stringify(expressions),
                  },
            async: false,
            success: function (data, textStatus, jqXHR)
            {
                complexity = data;

                for(let i = startInd; i < endInd; i++){
                    features[i].complexity = complexity[i];
                }
            },
            error: function (jqXHR, textStatus, errorThrown)
            {alert("error");}
        });    
    }

    set_problem_parameters(){
        $.ajax({
            url: "/api/data-mining/set-problem-parameters",
            type: "POST",
            data: {
                    problem: this.metadata.problem,  // ClimateCentric, GNC, etc
                  },
            async: false,
            success: function (data, textStatus, jqXHR)
            {
                console.log(data);
            },
            error: function (jqXHR, textStatus, errorThrown)
            {
                alert("error");
            }
        });    
    }

    get_problem_parameters(){
        let that = this;
        $.ajax({
            url: "/api/data-mining/get-problem-parameters",
            type: "POST",
            data: {
                    problem: this.metadata.problem,  // ClimateCentric, GNC, etc
                  },
            async: false,
            success: function (data, textStatus, jqXHR)
            {
                if(that.metadata.problem === "ClimateCentric"){
                    let input_generalization = {}
                    input_generalization.orbit_generalization = data.orbitList;
                    input_generalization.instrument_generalization = data.instrumentList;

                    let generalization_map = that.get_taxonomic_scheme()
                    input_generalization.instance_map = generalization_map["instance_map"];
                    input_generalization.superclass_map = generalization_map["superclass_map"];

                    PubSub.publish(INPUT_GENERALIZATION_LOADED, input_generalization);
                }
            },
            error: function (jqXHR, textStatus, errorThrown)
            {
                alert("error");
            }
        });    
    }

    get_taxonomic_scheme(){
        let that = this;
        let instance_map = null;
        let superclass_map = null;

        $.ajax({
            url: "/api/data-mining/get-taxonomic-scheme",
            type: "POST",
            data: {
                    problem: this.metadata.problem,  // ClimateCentric, GNC, etc
                  },
            async: false,
            success: function (data, textStatus, jqXHR)
            {
                if(that.metadata.problem === "ClimateCentric"){
                    instance_map = data.instanceMap;
                    superclass_map = data.superclassMap;

                    // If instance map is empty
                    if(Object.keys(instance_map).length == 0){

                        // For each superclass
                        for (let key in superclass_map) {
                            if (superclass_map.hasOwnProperty(key)) {

                                // Separate class name and instance name
                                let class_name = key.substring(0, key.indexOf('_'));
                                let instance_name = key.substring(key.indexOf('_') + 1);

                                let list_of_superclasses = superclass_map[key];
                                for(let i = 0; i < list_of_superclasses.length; i++){

                                    let superclass_name = list_of_superclasses[i];
                                    if(!instance_map.hasOwnProperty(superclass_name)){
                                        instance_map[superclass_name] = [];
                                    }

                                    // Add each instance to super classes
                                    instance_map[superclass_name].push(instance_name);
                                }
                            }
                        }
                    }
                    console.log(instance_map);
                    console.log(superclass_map);
                }
            },
            error: function (jqXHR, textStatus, errorThrown)
            {
                alert("error");
            }
        });

        return {"instance_map":instance_map, "superclass_map":superclass_map};    
    }
}



class DataMining{
    
    constructor(filteringScheme, labelingScheme){
        this.run_ga = true;
        this.enable_generalization = true;

        this.filter = filteringScheme;
        this.label = labelingScheme;
        this.feature_application = null;

        this.selected_archs = [];
        this.data = null;

        // Thresholds for running Apriori algorithm
        this.support_threshold = 0.002;
        this.confidence_threshold = 0.2;
        this.lift_threshold = 1;
        
        this.margin = null;
        this.width = null;
        this.height = null;

        // Parameters specific to each feature space plot
        this.xAxis = null;
        this.yAxis = null;
        this.gX = null;
        this.gY = null;
        
        this.featureID = 1;
        this.transform = null;

        this.allFeatures = [];
        this.stashedFeatures = [];
        this.recentlyAddedFeatureIDs = [];

        this.localSearchInitiatedFromGeneralization = false;
        this.localSearchOn = false;
        this.generalizationOn = false;

        this.complexityFilterThresholds = null;

        this.currentFeature = null;
        this.currentFeatureBlinkInterval = null;
        this.utopiaPoint = {id:-1, name:null, expression:null, metrics:null, x0:-1, y0:-1, x:-1, y:-1, utopiaPoint: true};
        
        this.coloursRainbow = ["#2c7bb6", "#00a6ca", "#00ccbc", "#90eb9d", "#ffff8c", "#f9d057", "#f29e2e", "#e76818", "#d7191c"];
        this.colourRangeRainbow = d3.range(0, 1, 1.0 / (this.coloursRainbow.length - 1));
        this.colourRangeRainbow.push(1);

        this.blockEntityReset = false;

        //Create color gradient
        this.colorScaleRainbow = d3.scaleLinear()
            .domain(this.colourRangeRainbow)
            .range(this.coloursRainbow)
            .interpolate(d3.interpolateHcl);

        //Needed to map the values of the dataset to the color scale
        this.colorInterpolateRainbow = d3.scaleLinear()
            .domain(d3.extent([]))
            .range([0,1]);

        this.updateFeatureColor = null;

        PubSub.subscribe(DESIGN_PROBLEM_LOADED, (msg, data) => {
            this.metadata = data.metadata;
        }); 

        // Save the data
        PubSub.subscribe(DATA_PROCESSED, (msg, data) => {
            this.data = data;
            this.openWebsocketConnection();
        });  

        PubSub.subscribe(SELECTION_UPDATED, (msg, data) => {
            this.initialize();
            this.selected_archs = data;
        });

        PubSub.subscribe(FEATURE_APPLICATION_LOADED, (msg, data) => {
            this.feature_application = data;
        });  

        PubSub.subscribe(ADD_FEATURE_FROM_EXPRESSION, (msg, data) => {
            let expression = data.expression;
            let replaceEquivalentFeature = data.replaceEquivalentFeature;
            this.add_new_feature_from_expression(expression, replaceEquivalentFeature);
        });  

        PubSub.subscribe(REMOVE_FEATURE_CURSOR, (msg, data) => {
            this.update();
        });  

        PubSub.subscribe(GENERALIZE_FEATURE, (msg, data) => {
            let root = data.root;
            let node = data.node;
            this.generalize_feature(root, node);
        });  
        
        // Initialize the interface
        this.initialize();        
    }

    openWebsocketConnection(){
        // Make a new websocket connection
        let that = this;
        this.ws = new WebSocket("wss://www.selva-research.com/api/eoss/ws")
        // this.ws = new WebSocket("ws://localhost:8080/api/eoss/ws");

        this.ws.onmessage = (event) => {
            if(event.data === ""){
                return;
            }
 
            let content = JSON.parse(event.data);       
            if(content){
                console.log(content.type);

                if(content.type === "data.mining.search.finished"){
                    if(content.features){
                        console.log(content.features);

                        if(content.searchMethod){
                            if(content.searchMethod === "localSearch"){
                                that.add_and_remove_features(content.features);

                                if(that.generalizationOn && !that.localSearchInitiatedFromGeneralization){
                                    //Start new generalization search
                                    that.generalize_feature(that.currentFeature.name);
                                }

                            }else if(content.searchMethod === "generalization"){                                
                                this.feature_application.end_loading_animation();

                                if(content.userInitiated){
                                    this.show_generalization_suggestion(content.features);
                                } else {
                                    this.ask_generalization_suggestion(content.features);
                                }   
                            }
                        }else{
                            that.add_new_features(content.features, true);
                        }
                    
                    }else{
                        if(content.searchMethod === "generalization"){
                            if(content.userInitiated){
                                let referenceBoundingRect = d3.select("#tradespace_plot_container").node().getBoundingClientRect();
                                let titleSize = referenceBoundingRect.height / 21;
                                let messageSize = referenceBoundingRect.height / 25;

                                this.feature_application.end_loading_animation();
                                this.feature_application.update_feature_application('restore', null);
                                iziToast.warning({
                                    title: 'Generalization not found',
                                    titleSize: titleSize,
                                    message: 'No appropriate generalization is found.',
                                    messageSize: messageSize,
                                    position: 'topLeft',
                                });
                            }
                        }
                    }
                
                } else if(content.type === "data.mining.problem.entities"){
                    let entities = {};

                    if(that.blockEntityReset){
                        console.log("Entity reset blocked");
                        return;
                    } else {
                        console.log("Entity list received");
                    }

                    if(that.metadata.problem === "ClimateCentric"){
                        entities = {leftSet: content.leftSet, rightSet: content.rightSet};
                        if(content.rightSet.length > that.metadata.problem_specific_params.orbit_list.length 
                            ||content.leftSet.length > that.metadata.problem_specific_params.instrument_list.length
                        ){
                            
                            let instanceMap = content.instanceMap;
                            let superclassMap = content.superclassMap;

                            // If instance map is empty
                            if(Object.keys(instanceMap).length == 0){

                                // For each superclass
                                for (let varName in superclassMap) {
                                    if (superclassMap.hasOwnProperty(varName)) {

                                        let listOfSuperclasses = superclassMap[varName];
                                        for(let i = 0; i < listOfSuperclasses.length; i++){

                                            let superclassName = listOfSuperclasses[i];
                                            if(!instanceMap.hasOwnProperty(superclassName)){
                                                instanceMap[superclassName] = [];
                                            }
                                            // Add each instance to super classes
                                            instanceMap[superclassName].push(varName);
                                        }
                                    }
                                }
                            }
                            entities['instanceMap'] = instanceMap;
                            entities['superclassMap'] = superclassMap;
                            PubSub.publish(GENERALIZED_CONCEPTS_LOADED, entities);
                        }

                    } else {
                        alert("Unsupported problem formulation: " + that.metadata.problem);
                    }
                }
            }
        };

        this.ws.onopen = function(){
            console.log("WebSocket connection successful");
            that.set_problem_parameters();            
        }
    }

    initialize(){
        d3.select("#support_panel").select("#view3").select("g").remove();
        
        let guideline = d3.select("#support_panel").select("#view3")
                .append("g")
                .append("div")
                .style("width","80%")
                .style("margin","auto")
                .style("padding","2vw");

        guideline.append("div")
                .style("width","100%")
                .style("font-size","2vh")
                .text("To run data mining, select target solutions on the scatter plot. Then click the button below.");

        guideline.append("div")
                .style("width","300px")
                .style("margin","auto")
                .append("button")
                .attr("id","run_data_mining_button")
                .style("margin-top","5vh")
                .style("width","23vh")
                .style("font-size","2vh")
                .text("Run data mining");
        
        d3.selectAll("#run_data_mining_button").on("click", () => {this.run();});
        
        this.allFeatures = [];
        this.stashedFeatures = [];
        this.recentlyAddedFeatureIDs = [];
        this.currentFeature = null;
        this.currentFeatureBlinkInterval=null;
        this.utopiaPoint = {id:-1, name:null, expression:null, metrics:null, x0:-1, y0:-1, x:-1, y:-1, utopiaPoint: true};
        this.xAxis = null;
        this.yAxis = null;
        this.gX = null;
        this.gY = null;
        this.transform = null;
        
        PubSub.publish(INITIALIZE_FEATURE_APPLICATION, null);
        this.featureID = 1;
    }

    async run(){
        this.blockEntityReset = false;

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
            alert("Target solutions must be selected to run data mining!");
            return;
        }     
                
        // Clear the feature application
        PubSub.publish(INITIALIZE_FEATURE_APPLICATION, null);

        // Remove all highlights in the scatter plot (retain target solutions)
        PubSub.publish(APPLY_FEATURE_EXPRESSION, null);

        let extractedFeatures = null;
        if(this.run_ga){
            // Epsilon MOEA
            extractedFeatures = this.get_driving_features_epsilon_moea(selected, non_selected); 
        }else{
            // Apriori 
            extractedFeatures = this.get_driving_features(selected, non_selected, this.support_threshold, this.confidence_threshold, this.lift_threshold);
        }

        if(extractedFeatures === null || typeof extractedFeatures === "undefined"){
            return;
        } else if(extractedFeatures.length === 0){ // If there is no driving feature returned
            return;
        }else{
            this.display_features(extractedFeatures);  
            this.stashedFeatures = JSON.parse(JSON.stringify(extractedFeatures));
        }          
    }

    run_local_search(logic){
        this.blockEntityReset = false;

        if(!logic){
            logic = "AND";
        }

        if (this.selected_archs.length ===0){
            alert("Target solutions must be selected to run local search!");
            return;
        }     
        
        if(!this.feature_application.data){
            alert("The baseline feature must be selected to run local search!");
            return;
        }

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

        // Run data mining in the marginal feature space
        let selected_node = null;            
        
        // Save the node where the placeholder is to be located
        this.feature_application.visit_nodes(this.feature_application.data, (d) => {
            if(d.add){
                selected_node = d;
            }                        
        })            
        
        // Save the currently applied feature
        let baseline_feature = this.feature_application.parse_tree(this.feature_application.data, selected_node);

        // Run local search either using disjunction or conjunction
        this.get_marginal_driving_features(selected, non_selected, baseline_feature, logic);

        PubSub.publish(CANCEL_ADD_FEATURE, null);   

        this.localSearchInitiatedFromGeneralization = false;
    }

    get_driving_features_with_generalization(selected, non_selected){

        console.log("Epsilon-MOEA with variable generalization called");

        let that = this;
        let output;
        $.ajax({
            url: "/api/eoss/analyst/get-driving-features-with-generalization",
            type: "POST",
            data: {
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

    get_driving_features_epsilon_moea(selected, non_selected){
        console.log("Epsilon-MOEA called");

        let output;
        $.ajax({
            url: "/api/eoss/analyst/get-driving-features-epsilon-moea",
            type: "POST",
            data: {
                    problem: this.metadata.problem,  // eoss or gnc
                    input_type: this.metadata.input_type, // Binary or Discrete
                    selected: JSON.stringify(selected),
                    non_selected:JSON.stringify(non_selected),
                  },
            async: false,
            success: function (data, textStatus, jqXHR)
            {
                if(data === "[]"){
                    alert("No driving feature mined. Please try modifying the selection. (Try selecting more designs)");
                }
                output = data;
            },
            error: function (jqXHR, textStatus, errorThrown)
            {
                alert("Error occurred while running data mining");
            }
        });
        return output;
    }

    get_driving_features(selected, non_selected, support_threshold, confidence_threshold, lift_threshold){
        let output;
        $.ajax({
            url: "/api/eoss/analyst/get-driving-features",
            type: "POST",
            data: {
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
            {
                alert("Error in extracting driving features");
            }
        });
        return output;
    }

    /*
        Run local search: can be used for both conjunction and disjunction
    */  
    get_marginal_driving_features(selected,non_selected,featureExpression,logical_connective){
        this.stop_search();

        let output;
        $.ajax({
            url: "/api/eoss/analyst/get-marginal-driving-features",
            type: "POST",
            data: {
                    problem: this.metadata.problem,  // eoss or gnc
                    input_type: this.metadata.input_type, // Binary or Discrete
                    featureExpression: featureExpression,
                    selected: JSON.stringify(selected),
                    non_selected:JSON.stringify(non_selected),
                    logical_connective:logical_connective,
                  },
            async: true,
            success: function (data, textStatus, jqXHR){},
            error: function (jqXHR, textStatus, errorThrown)
            {alert("Error in calling get_marginal_driving_features()");}
        });
    }    

    generalize_feature(root, node, userInitiated){
        this.stop_search();

        let metrics = this.currentFeature.metrics;
        let precision = metrics[2];
        let recall = metrics[3];
        let rootFeatureExpression = null;
        let nodeFeatureExpression = null;

        if(root == null){
            rootFeatureExpression = this.feature_application.parse_tree(this.feature_application.data);
        }else{
            rootFeatureExpression = root;
        }

        if(node == null){
            nodeFeatureExpression = "";
        }else{
            nodeFeatureExpression = node;
        }
        
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

        let that = this;
        $.ajax({
            url: "/api/eoss/analyst/generalize-feature",
            type: "POST",
            data: {
                    problem: this.metadata.problem,  // eoss or gnc
                    input_type: this.metadata.input_type, // Binary or Discrete
                    rootFeatureExpression: rootFeatureExpression,
                    nodeFeatureExpression: nodeFeatureExpression,
                    selected: JSON.stringify(selected),
                    non_selected:JSON.stringify(non_selected),
                    userInitiated: userInitiated,
                  },
            async: true,
            success: function (data, textStatus, jqXHR){},
            error: function (jqXHR, textStatus, errorThrown)
            {
                alert("Error in generalizing a feature");
            }
        });        
    } 

    display_features(features){
        let that = this;

        // Remove previous plot
        d3.select("#view3").select("g").remove();

        let tab = d3.select('#view3').append('g');

        let panelBoundingRect = d3.select("#support_panel").node().getBoundingClientRect();
        this.margin = {top: panelBoundingRect.height / 30, 
                        bottom: panelBoundingRect.height / 12, 
                        right: panelBoundingRect.width / 30, 
                        left: panelBoundingRect.width / 27};

        // this.margin = {top: 20, right: 20, bottom: 30, left:35};
        this.width = panelBoundingRect.width / 1.8 - this.margin.left - this.margin.right;
        this.height = panelBoundingRect.height / 1.65 - this.margin.top - this.margin.bottom;

        // Create feature space display options
        let feature_space_display_options_container = tab.append('div').attr('id', 'feature_space_display_options_container');

        // Add optiomn to turn on local search 
        let local_search_option = feature_space_display_options_container.append('div')
                .attr('class','feature_space interaction localSearch container');

        local_search_option.append('div')
                .attr('class','feature_space interaction localSearch textbox')
                .text("Auto search: ");

        local_search_option.append('input')
                .attr('class','feature_space interaction localSearch toggle')
                .attr('type','checkbox')
                .on("click", () => {
                    this.localSearchOn = d3.select('.feature_space.interaction.localSearch.toggle').node().checked;
                    if(this.localSearchOn && this.currentFeature){
                        this.run_local_search("BOTH");
                    }
                });

        // Add option to turn on generalization
        let generalization_option = feature_space_display_options_container.append('div')
                .attr('class','feature_space interaction generalization container');

        generalization_option.append('div')
                .attr('class','feature_space interaction generalization textbox')
                .text("Generalization suggestions: ")
                .style("margin-top","0px");

        generalization_option.append('input')
                .attr('class','feature_space interaction generalization toggle')
                .attr('type','checkbox')
                .on("click", () => {
                    this.generalizationOn = d3.select('.feature_space.interaction.generalization.toggle').node().checked;
                    if(this.generalizationOn && this.currentFeature){
                        this.generalize_feature(this.currentFeature.name);
                    }
                });

        this.localSearchOn = false;
        this.generalizationOn = false;
        d3.select('.feature_space.interaction.localSearch.toggle').node().checked = false;
        d3.select('.feature_space.interaction.generalization.toggle').node().checked = false;

        // Range filter for feature complexity 
        let feature_complexity_range_filter_min = feature_space_display_options_container.append('div')
                .attr('class', 'feature_space interaction complexityFilter container minRange');
        feature_complexity_range_filter_min.append('div')
                .attr('class', 'feature_space interaction complexityFilter textbox minRange')
                .text('Min complexity: ');
        feature_complexity_range_filter_min.append('select');
        
        let feature_complexity_range_filter_max = feature_space_display_options_container.append('div')
                .attr('class', 'feature_space interaction complexityFilter container maxRange');
        feature_complexity_range_filter_max.append('div')
                .attr('class', 'feature_space interaction complexityFilter textbox maxRange')
                .text('Max complexity: ');
        feature_complexity_range_filter_max.append('select');
        this.complexityFilterThresholds = null;

        // Button for restoring the initial set of features
        feature_space_display_options_container.append('div')
            .attr('class','feature_space interaction restoreButton container')
            .append('button')
            .attr('class','feature_space interaction restoreButton button')
            .on("click", () => {
                that.allFeatures = JSON.parse(JSON.stringify(that.stashedFeatures));
                that.display_features(that.allFeatures);

                // Clear the feature application
                PubSub.publish(INITIALIZE_FEATURE_APPLICATION, null);

                // Remove all highlights in the scatter plot (retain target solutions)
                PubSub.publish(APPLY_FEATURE_EXPRESSION, null);
            })
            .text("Restore initial features");

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
        
        let objects = svg.append("svg")
                .attr("class", "objects feature_plot")
                .attr("width", this.width)
                .attr("height", this.height)
                .style('margin-bottom','30px');

        feature_plot.append('div')
            .attr('class','feature_plot venn_diagram')
            .append('div')
            .text('Total number of designs: ' + this.data.length);

        if(typeof features === 'undefined' || features == null){
            return;
        }

        // Initialize the location of each feature
        this.featureID = 1;
        for (let i = 0; i < features.length; i++){
            features[i].x0 = -1;
            features[i].y0 = -1;
            features[i].id = this.featureID++;
        }

        // Calculate the pareto ranking
        this.calculate_pareto_ranking_of_features(features, [2, 3], 4);
        for(let i = 0; i < features.length; i++){
            features[i].recency = 0;
        }

        this.currentFeature = null;
        this.utopiaPoint = {id:-1, name:null, expression:null, metrics:null, x0:-1, y0:-1, x:-1, y:-1, utopiaPoint: true};
        this.update(features);
    }

    // Batch add 
    // Single feature add 
            // -> don't modify the recently-modified-features-mark
            // -> replace equivalent feature (?)
    // Cursor movement -> don't modify the recently-modified-features-mark

    add_new_features(features, replaceEquivalentFeature){
        let that = this;  
        function find_equivalent_feature(metrics, indices){
            for(let i = 0; i < that.allFeatures.length; i++){
                let _metrics = that.allFeatures[i].metrics;
                let match = true;
                for(let j = 0; j < indices.length; j++){
                    if(round_num(metrics[indices[j]]) != round_num(_metrics[indices[j]])){
                        match = false;
                        break;
                    }
                }
                if(match){
                    return that.allFeatures[i];
                }
            }
            return null;
        }

        let singleFeatureAdded = false;
        let cursorFeatureID = null;
        if(features.constructor !== Array){
            features = [features];
            singleFeatureAdded = true;
        }

        let featuresToAdd = [];
        let featuresToRemove = {};
        for(let i = 0; i < features.length; i++){
            let thisFeature = features[i];

            // Check if there exists a feature whose metrics match with the current feature's metrics
            let matchedFeature = find_equivalent_feature(thisFeature.metrics,[2,3]);  
            if(matchedFeature){
                cursorFeatureID = matchedFeature.id;
            }

            if(!matchedFeature || replaceEquivalentFeature){
                let featureCopy =  JSON.parse(JSON.stringify(thisFeature));
                featureCopy.id = this.featureID++;
                featuresToAdd.push(featureCopy);
                if(matchedFeature){
                    featuresToRemove[featureCopy.id] = matchedFeature;
                }
            }
        }
            
        // Update the plot
        if(singleFeatureAdded){
            let cursorFeature = features[0];
            if(cursorFeatureID === null){
                cursorFeature.id = -1;
            }else{
                cursorFeature.id = cursorFeatureID;
            }
            this.update(featuresToAdd[0], featuresToRemove, cursorFeature);

        }else{
            this.recentlyAddedFeatureIDs = [];
            for(let i = 0; i < featuresToAdd.length; i++){
                this.recentlyAddedFeatureIDs.push(featuresToAdd[i].id);
            }
            this.update(featuresToAdd, featuresToRemove, this.currentFeature);
        }
    }

    add_and_remove_features(featuresToAdd){
        let featuresToBeRemovedID = [];
        let allFeaturesAreRecent = true;
        for(let i = 0; i < this.allFeatures.length; i++){
            if(this.allFeatures[i].recency > 0){
                allFeaturesAreRecent = false;
            }
        }
        
        if(allFeaturesAreRecent){
            // If all features have the recency scores of 0, set new recency scores based on the pareto ranking
            for(let i = 0; i < this.allFeatures.length; i++){
                let thisFeature = this.allFeatures[i];

                // Set the recency score based on the pareto ranking
                if(thisFeature.pareto_ranking !== null && typeof thisFeature.pareto_ranking !== "undefined" && thisFeature.pareto_ranking < 5){ 
                    thisFeature.recency = thisFeature.pareto_ranking + 1;
                } else {
                    if(thisFeature.id === this.currentFeature.id){
                        thisFeature.recency = 0;
                    }else{
                        thisFeature.recency = 10;
                    }
                }
            }

        } else {
            for(let i = 0; i < this.allFeatures.length; i++){
                let thisFeature = this.allFeatures[i];

                if(thisFeature.id === this.currentFeature.id){
                    thisFeature.recency = 0;
                } else {
                    if(thisFeature.recency !== null && typeof thisFeature.recency !== "undefined"){
                        thisFeature.recency = thisFeature.recency + 1;
                    }else{
                        thisFeature.recency = 1;
                    }
                }
            } 
        }

        let tempCombinedFeatures = [];
        tempCombinedFeatures = tempCombinedFeatures.concat(this.allFeatures);
        tempCombinedFeatures = tempCombinedFeatures.concat(featuresToAdd);
        this.calculate_pareto_ranking_of_features(tempCombinedFeatures, [2, 3], 0);

        // Filter out features whose recency score is above certain threshold
        for(let i = 0; i < this.allFeatures.length; i++){
            let thisFeature = this.allFeatures[i];
            if(thisFeature.recency === null || typeof thisFeature.recency === "undefined" || thisFeature.recency > 4){
                if(thisFeature.pareto_ranking === 0){
                    thisFeature.recency = 4;
                }else{
                    featuresToBeRemovedID.push(thisFeature.id);
                }
            }
        }
       
        // Assign recency score to the newly added features
        featuresToAdd = JSON.parse(JSON.stringify(featuresToAdd));
        for(let i = 0; i < featuresToAdd.length; i++){
            featuresToAdd[i].id = this.featureID++;
            featuresToAdd[i].recency = 0;
        }

        let that = this;
        function find_equivalent_feature_ids(metrics, indices){
            let matchedFeatureIDs = [];
            for(let i = 0; i < that.allFeatures.length; i++){
                let _metrics = that.allFeatures[i].metrics;
                let match = true;
                for(let j = 0; j < indices.length; j++){
                    if(round_num(metrics[indices[j]]) != round_num(_metrics[indices[j]])){
                        match = false;
                        break;
                    }
                }
                if(match){
                    matchedFeatureIDs.push(that.allFeatures[i].id);
                }
            }
            return matchedFeatureIDs;
        }

        let overlappedFeatureIDs = [];
        for(let i = 0; i < featuresToAdd.length; i++){
            let thisFeature = featuresToAdd[i];

            // Check if there exists a feature whose metrics match with the current feature's metrics
            let matchedFeatureIDs = find_equivalent_feature_ids(thisFeature.metrics,[2,3]);  

            if(matchedFeatureIDs.indexOf(this.currentFeature.id) !== -1){
                // Update the current feature
                this.currentFeature = thisFeature;
            }

            overlappedFeatureIDs = overlappedFeatureIDs.concat(matchedFeatureIDs);
        }

        // Remove all features that overlap with the features to be added
        for(let i = 0; i < overlappedFeatureIDs.length; i++){
            for(let j = 0; j < this.allFeatures.length; j++){
                if(this.allFeatures[j].id === overlappedFeatureIDs[i]){
                    this.allFeatures.splice(j, 1);
                    break;
                }
            }
        }

        this.recentlyAddedFeatureIDs = [];
        for(let i = 0; i < featuresToAdd.length; i++){
            this.recentlyAddedFeatureIDs.push(featuresToAdd[i].id);
        }
        this.update(featuresToAdd, featuresToBeRemovedID, this.currentFeature);
    }

    add_new_feature_from_expression(expression, replaceEquivalentFeature){
        if(!expression || expression === ""){
            this.currentFeature = null;
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

            // Set the previous location
            let x,y;
            if(this.currentFeature){
                x = this.currentFeature.x;
                y = this.currentFeature.y;
            }else{
                x = -1;
                y = -1;
            }

            let new_feature = {id:-1, name:expression, expression:expression, metrics:metrics, x0:x, x:x, y0:y, y:y};
            this.add_new_features(new_feature, replaceEquivalentFeature);
        }
    }
    
    update(featuresToBeAdded, featuresToBeRemovedID, currentFeature, option){
        let that = this;

        if(d3.select('.feature_plot.figure').node() === null){
            return;
        }

        // If there is no feature to display, return
        if(this.allFeatures.length === 0 && featuresToBeAdded == null){
            return;
        }
        document.getElementById('tab3').click();

        // Set variables
        let width = this.width;
        let height = this.height;
        let duration = 30;
        
        // Set the axis to be Conf(F->S) and Conf(S->F)
        let xIndex = 2;
        let yIndex = 3;

        function get_utopia_point(){
            return d3.selectAll('.dot.feature_plot').filter((d) => {
                if(d.utopiaPoint){
                    return true;
                } else{
                    return false;
                }
            });
        }

        function get_cursor(){
            return d3.selectAll('.dot.feature_plot').filter((d) => {
                if(d.cursor){
                    return true;
                } else{
                    return false;
                }
            });
        }

        // Clear the previously existing interval
        if(this.currentFeatureBlinkInterval != null){
            clearInterval(this.currentFeatureBlinkInterval);
            d3.selectAll('.dot.feature_plot').style('opacity',1);
        }

        // Stash the previous locations of all features
        for(let i = 0; i < this.allFeatures.length; i++){
            this.allFeatures[i].x0 = this.allFeatures[i].x;
            this.allFeatures[i].y0 = this.allFeatures[i].y;
        }

        if(featuresToBeRemovedID){

            // Remove pre-existing features that overlap with the features to be added
            if(typeof(featuresToBeRemovedID) === "object" && !Array.isArray(featuresToBeRemovedID)){
                if(Object.keys(featuresToBeRemovedID).length !== 0){

                    let featuresToBeRemovedIDMap = featuresToBeRemovedID;
                    if(Object.keys(featuresToBeRemovedIDMap).length !== 0){ // check whether the key is not empty
                        for(let id in featuresToBeRemovedIDMap){

                            // Take the feature to be added from the featuresToBeAdded list
                            let addedFeature, removedFeature;
                            let featureIndex = null;
                            if(featuresToBeAdded.constructor === Array){
                                for(let i = 0; i < featuresToBeAdded.length; i++){
                                    if(featuresToBeAdded[i].id === id){
                                        featureIndex = i;
                                        break;
                                    }
                                }
                                if(featureIndex === null){
                                    continue;
                                }else{
                                    addedFeature = featuresToBeAdded.splice(featureIndex, 1);
                                }
                            }else{
                                addedFeature = featuresToBeAdded;
                                featuresToBeAdded = null;
                            }

                            // Find the index of the feature to be removed
                            for(let i = 0; i < this.allFeatures.length; i++){
                                if(this.allFeatures[i].id === featuresToBeRemovedIDMap[id].id){
                                    featureIndex = i;
                                    break;
                                }
                            }
                            removedFeature = this.allFeatures[featureIndex];

                            // Copy information from the removed feature to the added feature
                            addedFeature.x = removedFeature.x;
                            addedFeature.y = removedFeature.y;
                            addedFeature.x0 = removedFeature.x0;
                            addedFeature.y0 = removedFeature.y0;

                            // Replace the feature in allFeatures with the new one
                            this.allFeatures.splice(featureIndex, 1, addedFeature);

                            let node = d3.selectAll('.dot.feature_plot').filter((d) => {
                                if(d.id === removedFeature.id){
                                    return true;
                                } else{
                                    return false;
                                }
                            });
                            node.node().__data__.id = addedFeature.id;
                            node.node().__data__.expression = addedFeature.expression;
                            node.node().__data__.name = addedFeature.name;
                        }
                    }
                }   
            }
        }

        // Add new features
        let addedFeaturesID = [];
        if(featuresToBeAdded){
            if(featuresToBeAdded.constructor === Array){
                this.allFeatures = this.allFeatures.concat(featuresToBeAdded);
                for(let i = 0; i < featuresToBeAdded.length; i++){
                    addedFeaturesID.push(featuresToBeAdded[i].id);
                }
            } else {
                // A single feature is added manually
                this.allFeatures.push(featuresToBeAdded);
                addedFeaturesID.push(featuresToBeAdded.id);
            }
        }

        // Calculate complexity
       this.compute_complexity(this.allFeatures);
       this.compute_complexity(currentFeature);
        
        // Get the list of features to plot
        let featuresToPlot = [];
        for(let i = 0; i < this.allFeatures.length; i++){
            featuresToPlot.push(this.allFeatures[i]);
        }

        let rescalePoints = false;
        if(this.utopiaPoint.metrics === null){ // utopia point is not set up 
            rescalePoints = true;

        }else if(addedFeaturesID.length > 1){ // More than one feature is added
            rescalePoints = true;

        }else{
            // Only a single point (or none) is added 
            if(currentFeature){
                if(this.utopiaPoint.metrics[0] < currentFeature.metrics[0] || 
                    this.utopiaPoint.metrics[1] < currentFeature.metrics[1] ||
                    this.utopiaPoint.metrics[2] < currentFeature.metrics[2] ||
                    this.utopiaPoint.metrics[3] < currentFeature.metrics[3])
                {
                    rescalePoints = true;
                }else if(!this.utopiaPoint.metrics[0]){
                    rescalePoints = true;
                }
            }

            
        }

        // Check if 
        if(rescalePoints){
            // Get max values of each metric
            let maxSupp = d3.max(featuresToPlot, (d) => {return d.metrics[0]});
            let maxLift = d3.max(featuresToPlot, (d) => {return d.metrics[1]});
            let maxConf1 = d3.max(featuresToPlot, (d) => {return d.metrics[2]});
            let maxConf2 = d3.max(featuresToPlot, (d) => {return d.metrics[3]});
            let maxConf = Math.max(maxConf1, maxConf2);
            let maxComplexity = d3.max(featuresToPlot, (d) => {return d.complexity});

            // Consider the stashed features in obtaining the min and max complexity
            if(d3.max(this.stashedFeatures, (d) => {return d.complexity}) > maxComplexity){
                maxComplexity = d3.max(this.stashedFeatures, (d) => {return d.complexity});
            }

            // Set the location of the utopia point
            this.utopiaPoint.metrics = [maxSupp, maxLift, 1.0, 1.0];

            // Needed to map the values of the dataset to the color scale
            this.colorInterpolateRainbow = d3.scaleLinear()
                    .domain([1, maxComplexity])
                    .range([0,1]);

            //Transition the colors to a rainbow
            this.updateFeatureColor = function updateRainbow() {
                d3.selectAll(".dot.feature_plot")
                    .style("fill", function (d, i) { 
                        return that.colorScaleRainbow(that.colorInterpolateRainbow(d.complexity)); 
                    })
            }

            this.update_feature_complexity_range_filter(1, maxComplexity);
        }

        if(featuresToPlot.length !== 0 && featuresToPlot.length !== 1){

            // Insert the utopia point to the list of features
            featuresToPlot.splice(0, 0, this.utopiaPoint);

            // Add cursor 
            let cursorFeature;
            if(currentFeature){
                this.currentFeature = currentFeature;
                cursorFeature = JSON.parse(JSON.stringify(currentFeature));
                this.draw_venn_diagram(currentFeature.metrics[3], currentFeature.metrics[2]);
                
            }else{
                this.currentFeature = null;
                cursorFeature = JSON.parse(JSON.stringify(this.utopiaPoint));
                this.draw_venn_diagram(null, null);
                
            }
            cursorFeature.cursor = true;
            featuresToPlot.push(cursorFeature);
        }

        // setup x
        // data -> value
        let xValue = function (d) {
            return d.metrics[xIndex];
        }; 

        // value -> display
        let xScale = d3.scaleLinear().range([0, width]); 

        // don't want dots overlapping axis, so add in buffer to data domain 
        let xBuffer = (d3.max(featuresToPlot, xValue) - d3.min(featuresToPlot, xValue)) * 0.05;
        xScale.domain([d3.min(featuresToPlot, xValue) - xBuffer, d3.max(featuresToPlot, xValue) + xBuffer]);

        // data -> display
        let xMap = function (d) {
            return xScale(xValue(d));
        }; 

        this.xAxis = d3.axisBottom(xScale);

        // setup y
        // data -> value
        let yValue = function (d) {
            return d.metrics[yIndex];
        };

        // value -> display
        let yScale = d3.scaleLinear().range([height, 0]); 

        let yBuffer = (d3.max(featuresToPlot, yValue) - d3.min(featuresToPlot, yValue)) * 0.05;
        yScale.domain([d3.min(featuresToPlot, yValue) - yBuffer, d3.max(featuresToPlot, yValue) + yBuffer]);

        // data -> display
        let yMap = function (d) {
            return yScale(yValue(d));
        }; 
        this.yAxis = d3.axisLeft(yScale);

        // Set the new locations of all the features
        for(let i = 0; i < featuresToPlot.length; i++){
            featuresToPlot[i].x = xMap(featuresToPlot[i]);
            featuresToPlot[i].y = yMap(featuresToPlot[i]);
            if(!featuresToPlot[i].x0){
                // If previous location has not been initialized, set the current location
                featuresToPlot[i].x0 = featuresToPlot[i].x;
                featuresToPlot[i].y0 = featuresToPlot[i].y;
            }
        }

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

        if(d3.select('.feature_plot.figure').selectAll('.axis').nodes().length === 0){
            let svg = d3.select('.feature_plot.figure').select('g')
            
            // x-axis
            this.gX = svg.append("g")
                .attr("class", "axis axis-x axisObjects feature_plot")
                .attr("transform", "translate(0, " + height + ")")
                .call(this.xAxis);

            svg.append("text")
                .attr("transform", "translate(" + width + ", " + height + ")")
                .attr("class", "axisLabel axisObjects axis-x")
                .attr("y", -6)
                .style("text-anchor", "end")
                .text('Specificity')
                .style('font-size','1.7vh');

            // y-axis
            this.gY = svg.append("g")
                .attr("class", "axis axis-y axisObjects feature_plot")
                .call(this.yAxis);
            
            svg.append("text")
                .attr("class", "axisLabel axisObjects axis-y")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text('Coverage')
                .style('font-size','1.7vh');

            d3.selectAll(".feature_plot.figure").selectAll(".axisObjects")
                .on("mouseover", function(){
                    that.axis_label_mouseover(this);
                })
                .on("mouseout", function(){
                    that.axis_label_mouseout(this);
                });
        }

        if(this.complexityFilterThresholds){
            let filteredList = [];
            for(let i = 0; i < featuresToPlot.length; i++){
                let minThreshold = this.complexityFilterThresholds[0];
                let maxThreshold = this.complexityFilterThresholds[1];
                if(featuresToPlot[i].complexity >= minThreshold && featuresToPlot[i].complexity <= maxThreshold){
                    filteredList.push(featuresToPlot[i]);
                } else if(featuresToPlot[i].utopiaPoint){
                    filteredList.push(featuresToPlot[i]);
                } 
            }
            featuresToPlot = filteredList;
        }

        if(featuresToBeRemovedID && Array.isArray(featuresToBeRemovedID)){
            let filteredList = [];
            for(let i = 0; i < featuresToPlot.length; i++){
                if(featuresToBeRemovedID.indexOf(featuresToPlot[i].id) === -1){
                    filteredList.push(featuresToPlot[i]);
                }
            }
            featuresToPlot = filteredList;

            let filteredList2 = [];
            for(let i = 0; i < this.allFeatures.length; i++){
                if(featuresToBeRemovedID.indexOf(this.allFeatures[i].id) === -1){
                    filteredList2.push(this.allFeatures[i]);
                }
            }
            this.allFeatures = filteredList2;
        }

        let objects = d3.select(".objects.feature_plot")

        let symbolSize = d3.select("#support_panel").node().getBoundingClientRect().height / 6;

        // Remove unnecessary points
        d3.select(".objects.feature_plot")
                .selectAll('.dot.feature_plot')
                .data(featuresToPlot)
                .exit()
                .remove();

        // Create new triangles
        objects.selectAll(".dot.feature_plot")
                .data(featuresToPlot)
                .enter()
                .append('path')
                .attr('class','point dot feature_plot')
                .attr("transform", function (d) {
                    return "translate(" + d.x0 + "," + d.y0 + ")";
                })
                .style("stroke-width", 0.6);

        d3.selectAll(".point.dot.feature_plot")
            .attr("d", d3.symbol().type((d) => {return d3.symbolTriangle;}).size(symbolSize));

        // Modify the shape of all features that were added recently, to crosses
        if(this.recentlyAddedFeatureIDs.length !== 0){
            d3.selectAll('.dot.feature_plot').filter(function(d){
                if(that.recentlyAddedFeatureIDs.indexOf(d.id) !== -1){
                    return true;
                }else{
                    return false;
                }
            })
            .attr('d',d3.symbol().type(d3.symbolCross).size(symbolSize));

            if(typeof cursorFeature !== 'undefined' && cursorFeature != null){
                // Modify the shape of the cursor to cross
                if(that.recentlyAddedFeatureIDs.indexOf(cursorFeature.id) !== -1){
                    get_cursor().attr('d',d3.symbol().type(d3.symbolCross).size(symbolSize));
                }
            }
        }

        // Utopia point: modify the shape to a star
        get_utopia_point().attr('d',d3.symbol().type(d3.symbolStar).size(symbolSize));        

        d3.selectAll('.dot.feature_plot').filter((d) => {
                if (d.utopiaPoint) {
                    return false;
                } else {
                    return true;
                }
            })
            .on("mouseover", (d) => { this.feature_mouseover(d); })
            .on('mouseout', (d) => { this.feature_mouseout(d); })
            .on('click', (d) => { this.feature_click(d); });   

        if(featuresToPlot.length !== 0 && featuresToPlot.length !== 1){

            // Remove the utopia point from the list
            featuresToPlot.splice(0, 1);

            // Remove cursor from the list
            featuresToPlot.pop();
        }

        // Move objects to their correct locations
        if(this.transform){
            this.gX.call(this.xAxis.scale(this.transform.rescaleX(xScale)));
            this.gY.call(this.yAxis.scale(this.transform.rescaleY(yScale)));

            d3.selectAll('.dot.feature_plot')
                .attr("transform", function (d) {
                    let xCoord = that.transform.applyX(xMap(d));
                    let yCoord = that.transform.applyY(yMap(d));
                    return "translate(" + xCoord + "," + yCoord + ")";
                });   

        }else{
            d3.selectAll('.dot.feature_plot').transition()
                .duration(duration)
                .attr("transform",function(d){
                    return "translate(" + d.x + "," + d.y + ")";
                });   
        }  
        
        if(this.updateFeatureColor !== null){
            this.updateFeatureColor();
        }

        // Adjust the opacity of each point based on how recently each point is added
        this.feature_adjust_opacity();
        
        if(currentFeature){
            let cursor = get_cursor();
            cursor.shown = true;
            cursor.style('fill',"black");    
            function blink() {
                if(cursor.shown) {
                    cursor.style("opacity",0);
                    cursor.shown = false;
                } else {
                    cursor.style("opacity",1);
                    cursor.shown = true;
                }
            }
            this.currentFeatureBlinkInterval = setInterval(blink, 350);
        }else{
            get_cursor().style("opacity",0);
        }
    }

    feature_adjust_opacity(){
        d3.selectAll('.dot.feature_plot').style("opacity", (d) => 
            {
                if(d.recency){
                    if(d.recency === 0){
                        return 1.0;
                    }else if(d.recency === 1){
                        return 0.8;
                    }else if(d.recency === 2){
                        return 0.6;
                    }else if(d.recency === 3){
                        return 0.4;
                    }else if(d.recency === 4){
                        return 0.2;
                    }else{
                        return 0;
                    }
                }else{
                    return 1.0;
                }
            });
    }

    feature_click(d){
        this.currentFeature = d;
        this.feature_application.update_feature_application('update');
    }

    feature_mouseover(d){
        if(d.utopiaPoint){
            return;
        }

        let id = d.id; 
        let expression = d.expression;
        let metrics = d.metrics;
        let conf = d.metrics[2];
        let conf2 = d.metrics[3];
        let complexity = d.complexity;

        // Draw Venn diagram
        this.draw_venn_diagram(conf2, conf);

        // Set variables
        let margin = this.margin;
        let width = this.width;
        let height = this.height;

        let mouseLoc_x = d3.mouse(d3.select(".objects.feature_plot").node())[0];
        let mouseLoc_y = d3.mouse(d3.select(".objects.feature_plot").node())[1];

        let tooltip_location = {x:0,y:0};
        let boundingRect = d3.select("#support_panel").node().getBoundingClientRect();

        let tooltip_width = boundingRect.width / 5.82;
        let tooltip_height = boundingRect.height / 4.6;

        let h_threshold = (width + margin.left + margin.right) * 0.5;
        let v_threshold = (height + margin.top + margin.bottom) * 0.55;

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

        let svg = d3.select(".objects.feature_plot");
        let tooltip = svg.append("g")
                        .attr("id","tooltip_g");

        tooltip.append("rect")
            .attr("id","tooltip_rect")
            .attr("transform", function(){
                let x = mouseLoc_x + tooltip_location.x;
                let y = mouseLoc_y + tooltip_location.y;
                return "translate(" + x + "," + y + ")";
             })
            .attr("width",tooltip_width)
            .attr("height",tooltip_height)
            .style("fill","#4B4B4B")
            .style("opacity", 0.92);    

        let fo = tooltip
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
            .data([{id:id, expression:expression, metrics:metrics, complexity: complexity}]) 
            .html(function(d){
                let output= "Specificity: " + round_num(d.metrics[2]) + 
                "<br> Coverage: " + round_num(d.metrics[3]) + 
                "<br> Complexity: " + d.complexity;
                return output;
            })
            .style("padding", () => {
                return boundingRect.height / 32.5 + "px"; 
            })
            .style('color','#F7FF55')
            .style('word-wrap','break-word')
            .style('font-size', ()=> {
                return boundingRect.height / 27.1;
            });   

        if(this.currentFeature){
            if(d.expression === this.currentFeature.expression){
                return;
            }
        }

        if(d.description){
            console.log(d.description);
        }
        
        // Update the placeholder with the driving feature and stash the expression    
        this.feature_application.update_feature_application('temp', expression);
    }

    feature_mouseout(d){
        // Restore the venn diagram
        if(this.currentFeature){
            let precision = this.currentFeature.metrics[2];
            let recall = this.currentFeature.metrics[3];
            this.draw_venn_diagram(recall, precision);
        } else {
            this.draw_venn_diagram(null, null);
        }

        // Remove the tooltip
        d3.selectAll("#tooltip_g").remove();

        // Bring back the previously stored feature expression
        this.feature_application.update_feature_application('restore');       
    }

    axis_label_mouseout(axisLabelNode){
        d3.select("#axis_label_tooltip_g").remove();
    }

    axis_label_mouseover(axisLabelNode){
        let boundingRect = d3.select("#support_panel").node().getBoundingClientRect();

        let tooltip_width = boundingRect.width / 2.46;
        let tooltip_height = boundingRect.height / 3.61;

        let mouseLoc_x = d3.mouse(d3.select(".objects.feature_plot").node())[0];
        let mouseLoc_y = d3.mouse(d3.select(".objects.feature_plot").node())[1];
        let tooltip_location = {x:0, y:0};

        let is_x_axis = false;

        if(d3.select(axisLabelNode).classed("axis-x")){
            tooltip_location.x = -10 - tooltip_width;
            tooltip_location.y = -10 - tooltip_height;
            is_x_axis = true;
        
        } else if(d3.select(axisLabelNode).classed("axis-y")){
            tooltip_location.y = 10;
            tooltip_location.x = 10;
        }

        let svg = d3.select(".objects.feature_plot");
        let tooltip = svg.append("g")
                        .attr("id","axis_label_tooltip_g");

        tooltip.append("rect")
            .attr("id","tooltip_rect")
            .attr("transform", function(){
                let x = mouseLoc_x + tooltip_location.x;
                let y = mouseLoc_y + tooltip_location.y;
                return "translate(" + x + "," + y + ")";
             })
            .attr("width",tooltip_width)
            .attr("height",tooltip_height)
            .style("fill","#4B4B4B")
            .style("opacity", 0.92);    

        let fo = tooltip
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
            .html(() => {
                let out = null;
                if(is_x_axis){
                    out = "<p>X axis: Specificity</p>"
                    +"<p>specificity = (# of purple dots) / (# of pink dots)</p>";
                    
                }else{
                    out = "<p>Y axis: Coverage</p>"
                    +"<p>coverage = (# of purple dots) / (# of blue dots)</p>";
                }
                return out;
            })
            .style("padding", () => {
                return boundingRect.height / 32.5 + "px"; 
            })
            .style('color','#F7FF55')
            .style('word-wrap','break-word')
            .style('font-size', ()=> {
                return boundingRect.height / 27.1;
            }); 
    }

    update_feature_complexity_range_filter(min, max){
        let that = this;

        if(!d3.select('.feature_space.interaction.complexityFilter').node()){
            return;
        }

        let options = [];
        for(let i = 0; i < max - min + 1; i++){
            options.push(min + i);
        }

        let initial_val_min = d3.select('.feature_space.interaction.complexityFilter.minRange').select('select').node().value;
        let initial_val_max = d3.select('.feature_space.interaction.complexityFilter.maxRange').select('select').node().value;

        d3.select('.feature_space.interaction.complexityFilter.minRange')
            .select('select')
            .on("change", () => {
                let minThreshold = d3.select('.feature_space.interaction.complexityFilter.minRange').select('select').node().value;
                let maxThreshold = d3.select('.feature_space.interaction.complexityFilter.maxRange').select('select').node().value;
                that.complexityFilterThresholds = [minThreshold, maxThreshold];
                d3.selectAll('.feature_plot.dot').remove();
                PubSub.publish(INITIALIZE_FEATURE_APPLICATION, null);
                that.update();
            })
            .selectAll('option')
            .data(options)
            .enter()
            .append('option')              
            .attr("value", (d) => {
                return d;
            })
            .text((d) => {
                return d;
            });
        
        d3.select('.feature_space.interaction.complexityFilter.maxRange')
            .select('select')
            .on("change", () => {
                let minThreshold = d3.select('.feature_space.interaction.complexityFilter.minRange').select('select').node().value;
                let maxThreshold = d3.select('.feature_space.interaction.complexityFilter.maxRange').select('select').node().value;
                that.complexityFilterThresholds = [minThreshold, maxThreshold];
                d3.selectAll('.feature_plot.dot').remove();
                PubSub.publish(INITIALIZE_FEATURE_APPLICATION, null);
                that.update();
            })
            .selectAll('option')
            .data(options)
            .enter()
            .append('option')              
            .attr("value", (d) => {
                return d;
            })
            .text((d) => {
                return d;
            });

        d3.select('.feature_space.interaction.complexityFilter.minRange').select('select').node().value = min;
        d3.select('.feature_space.interaction.complexityFilter.maxRange').select('select').node().value = max; 
        that.complexityFilterThresholds = [min, max];       
    }

    check_if_non_dominated(testFeature, otherFeatures, objective_indices){  
        if(objective_indices === null || typeof objective_indices === "undefined"){
            objective_indices = [2, 3];
        }

        let non_dominated = true;
        let testFeatureObj = JSON.parse(JSON.stringify(testFeature.metrics)).multisplice(objective_indices);
        for (let i = 0; i < otherFeatures.length; i++){            
            if(testFeature === otherFeatures[j]){
                continue;
            }

            let otherFeatureObj = JSON.parse(JSON.stringify(otherFeatures[i].metrics)).multisplice(objective_indices);
            if(dominates(otherFeatureObj, testFeatureObj)){
                non_dominated = false;
            }
        }
        return non_dominated;
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
            url: "/api/eoss/analyst/cluster-data",
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

        let extractedFeatures = [];

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

            let features = this.get_driving_features(selected, non_selected, this.support_threshold, this.confidence_threshold, this.lift_threshold);

            extractedFeatures = extractedFeatures.concat(features);   
        }

        this.display_features(extractedFeatures);  
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
            url: "/api/eoss/analyst/cluster-data",
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

    compute_complexity(inputFeatures, recalculateAll){
        if(!inputFeatures){
            return;
        }

        if(!Array.isArray(inputFeatures)){
            inputFeatures = [inputFeatures];
        }

        for(let i = 0; i < inputFeatures.length; i++){
            let thisFeature = inputFeatures[i];

            if(recalculateAll || typeof thisFeature.complexity === "undefined" || thisFeature.complexity === -1){
                thisFeature.complexity = this.feature_application.get_num_literal_from_expression(thisFeature.name);
            }
        }
    }

    compute_algebraic_complexity_of_features(startInd, endInd){
        let features = this.allFeatures;
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
            url: "/api/eoss/analyst/compute-complexity-of-features",
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
        let that = this;
        $.ajax({
            url: "/api/eoss/analyst/set-problem-parameters",
            type: "POST",
            data: {
                    problem: this.metadata.problem,  // ClimateCentric, GNC, etc
                    params: JSON.stringify(this.metadata.problem_specific_params)
                  },
            async: false,
            success: function (data, textStatus, jqXHR){},
            error: function (jqXHR, textStatus, errorThrown)
            {
                alert("Error in calling set_problem_parameters()");
            }
        });    
    }

    set_problem_generalized_concepts(blockEntityReset){
        let that = this;

        if(blockEntityReset){
            this.blockEntityReset = true;
            this.set_problem_parameters();
        } else {
            this.blockEntityReset = false;
        }

        setTimeout(function() {
            $.ajax({
                url: "/api/eoss/analyst/set-problem-generalized-concepts",
                type: "POST",
                data: {
                        problem: that.metadata.problem,  // ClimateCentric, GNC, etc
                        params: JSON.stringify(that.metadata.problem_specific_params)
                      },
                async: false,
                success: function (data, textStatus, jqXHR){},
                error: function (jqXHR, textStatus, errorThrown)
                {
                    alert("Error in calling set_problem_generalized_concepts()");
                }
            }); 
        }, 500);
    }

    get_problem_parameters(){
        let that = this;
        $.ajax({
            url: "/api/eoss/analyst/get-problem-parameters",
            type: "POST",
            data: {
                    problem: that.metadata.problem,  // ClimateCentric, GNC, etc
                  },
            async: false,
            success: function (data, textStatus, jqXHR){
                let entities = {};
                if(that.metadata.problem === "ClimateCentric"){
                    entities = {leftSet: data.leftSet, rightSet: data.rightSet};

                    if(data.rightSet.length > that.metadata.problem_specific_params.orbit_list.length 
                        ||data.leftSet.length > that.metadata.problem_specific_params.instrument_list.length
                    ){  
                        let instanceMap = data.instanceMap;
                        let superclassMap = data.superclassMap;

                        // If instance map is empty
                        if(Object.keys(instanceMap).length == 0){

                            // For each superclass
                            for (let varName in superclassMap) {
                                if (superclassMap.hasOwnProperty(varName)) {

                                    let listOfSuperclasses = superclassMap[varName];
                                    for(let i = 0; i < listOfSuperclasses.length; i++){

                                        let superclassName = listOfSuperclasses[i];
                                        if(!instanceMap.hasOwnProperty(superclassName)){
                                            instanceMap[superclassName] = [];
                                        }
                                        // Add each instance to super classes
                                        instanceMap[superclassName].push(varName);
                                    }
                                }
                            }
                        }
                        entities['instanceMap'] = instanceMap;
                        entities['superclassMap'] = superclassMap;
                        PubSub.publish(GENERALIZED_CONCEPTS_LOADED, entities);
                    }

                } else {
                    alert("Unsupported problem formulation: " + that.metadata.problem);
                }
            },
            error: function (jqXHR, textStatus, errorThrown)
            {
                alert("Error in calling get_problem_parameters()");
            }
        });    
    }

    stop_search(){
        $.ajax({
            url: "/api/eoss/analyst/stop-search",
            type: "POST",
            data: {},
            async: false,
            success: function (data, textStatus, jqXHR){},
            error: function (jqXHR, textStatus, errorThrown){ alert("Error in stopping the search"); }
        });    
    }

    import_target_selection(filename){
        let that = this;
        this.initialize();

        $.ajax({
            url: "/api/eoss/analyst/import-target-selection",
            type: "POST",
            data: {
                    filename: filename,
                  },
            async: false,
            success: function (data, textStatus, jqXHR)
            {
                let selected_id_list = data;
                that.selected_archs = [];
                
                that.data.forEach((point) => {
                    if(selected_id_list.indexOf(point.id) != -1){
                        point.selected = true;
                        that.selected_archs.push(point);
                    }
                });
                PubSub.publish(UPDATE_TRADESPACE_PLOT, null);
            },
            error: function (jqXHR, textStatus, errorThrown)
            {alert("error");}
        });
    }

    export_target_selection(selectionName){

        if (this.selected_archs.length === 0){
            alert("First select target solutions!");
            return;
        }     

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

        if(selectionName == null){
            selectionName = "";
        }

        $.ajax({
            url: "/api/eoss/analyst/export-target-selection",
            type: "POST",
            data: {
                    problem: this.metadata.problem,  // eoss or gnc
                    input_type: this.metadata.input_type, // Binary or Discrete
                    selected: JSON.stringify(selected),
                    non_selected:JSON.stringify(non_selected),
                    name: selectionName,
                  },
            async: true,
            success: function (data, textStatus, jqXHR)
            {
            },
            error: function (jqXHR, textStatus, errorThrown)
            {alert("error");}
        });
    }

    import_feature_data(filename, set_target_selection_import, generalization_enabled){
        let that = this;

        if(filename == null){
            alert("Filename should be specified!");
        }

        let filename_data = filename + ".archive";
        let filename_params = filename + ".params";
        let filename_selection = filename + ".selection";

        if(set_target_selection_import){
            this.import_target_selection(filename_selection)
        }

        $.ajax({
            url: "/api/eoss/analyst/import-feature-data",
            type: "POST",
            data: {
                    filename_data: filename_data,  // ClimateCentric, GNC, etc
                    filename_params: filename_params,
                  },
            async: false,
            success: function (data, textStatus, jqXHR)
            {
                let imported_features = data['data'];

                // Clear the feature application
                PubSub.publish(INITIALIZE_FEATURE_APPLICATION, null);

                // Remove all highlights in the scatter plot (retain target solutions)
                PubSub.publish(APPLY_FEATURE_EXPRESSION, null);

                if(!imported_features){ // If there is no driving feature returned
                    return;
                }else if(imported_features.length === 0){
                    return;
                }

                this.allFeatures = [];
                that.stashedFeatures = JSON.parse(JSON.stringify(imported_features));
                that.display_features(imported_features);  

                if(generalization_enabled){
                    if(that.metadata.problem === "ClimateCentric"){
                        // Params loaded from a file
                        that.metadata.problem_specific_params.instrument_extended_list = data["params"]["leftSet"];
                        that.metadata.problem_specific_params.orbit_extended_list = data["params"]["rightSet"];
                        that.set_problem_generalized_concepts();
                    }  
                }
            },
            error: function (jqXHR, textStatus, errorThrown)
            {
                alert("Error in calling import_feature_data()");
            }
        });
    }

    ask_generalization_suggestion(features){
        let that = this;

        if(document.querySelector('.iziToast')){
            return;
        }

        let referenceBoundingRect = d3.select("#tradespace_plot_container").node().getBoundingClientRect();
        let titleSize = referenceBoundingRect.height / 25;
        let buttonMargin = referenceBoundingRect.height / 44;
        
        let buttonsList = [];
        let buttonsStyle = "";
        let okButton = ['<button style="'+ buttonsStyle +'"><b>Confirm</b></button>', function (instance, toast) {
            that.show_generalization_suggestion(features);
            instance.hide({transitionOut: 'fadeOutUp',}, toast, 'buttonName');
        }, true];
        buttonsList.push(okButton);
        
        let cancelButton = ['<button style="'+ buttonsStyle +'"><b>Cancel</b></button>', function (instance, toast) {
            instance.hide({transitionOut: 'fadeOutUp'}, toast, 'buttonName');
        }, true];
        buttonsList.push(cancelButton);

        iziToast.warning({
            title: 'Would you like to view generalizations of the current feature?',
            titleSize: titleSize,
            message: "",
            buttons: buttonsList,
            position: 'topLeft',
            timeout: 15000,
        });
    }

    show_generalization_suggestion(features){
        let that = this;
        iziToast.destroy();

        let buttonClicked = false;

        let timeout = 20000;
        let numMaxFeatures = 4;
        iziToast.destroy();

        let message = "";
        if(this.currentFeature){
            message = "(current feature - coverage: " + round_num(this.currentFeature.metrics[3]) + ", specificity: " + round_num(this.currentFeature.metrics[2]) + ")";
        }

        let referenceBoundingRect = d3.select("#tradespace_plot_container").node().getBoundingClientRect();
        let titleSize = referenceBoundingRect.height / 21;
        let messageSize = referenceBoundingRect.height / 25;
        let messageLineHeight = referenceBoundingRect.height / 12;
        let buttonMargin = referenceBoundingRect.height / 44;

        // Shuffle the order of the features
        features = shuffle(features);

        // Reduce the number of suggestions if there are too many
        if(features.length > numMaxFeatures){
            // Sort features based on their distance to the utopia point
            let sortedFeatureList = [];
            for(let i = 0; i < features.length; i++){
                if(sortedFeatureList.length === 0){
                    sortedFeatureList.push(features[i]);
                }else{
                    let dist1 = Math.pow(1 - features[i].metrics[2], 2) + Math.pow(1 - features[i].metrics[3], 2);
                    let index = null;
                    for(let j = 0; j < sortedFeatureList.length; j++){
                        let dist2 = Math.pow(1 - sortedFeatureList[j].metrics[2], 2) + Math.pow(1 - sortedFeatureList[j].metrics[3], 2);
                        if(dist1 < dist2){
                            index = j;
                            break;
                        }
                    }
                    if(index === null){
                        index = sortedFeatureList.length;
                    }
                    sortedFeatureList.splice(index, 0, features[i]);
                }
            }
            features = sortedFeatureList.splice(0, numMaxFeatures);
        }

        let buttonsStyle = "width: 84%; float: left; margin-top: "+ buttonMargin +"px; margin-bottom: "+ buttonMargin +"px; font-size: "+ (messageSize - 2) +"px;";
        let buttonsList = [];
        for(let i = 0; i < features.length; i++){
            let description = features[i].description;
            description = that.label.pp_generalization_description(description);
            description = description.replace("\" to \"", "\"</p> <p>to</p> <p>\"")
            description = "<p>" + description + "</p>";
            description += "<p>(coverage: "+ round_num(features[i].metrics[3]) + ", specificity: " + round_num(features[i].metrics[2]) +")</p>";

            let button = ['<button style="'+ buttonsStyle +'"><b>'+ description +'</b></button>', function (instance, toast) {
                    buttonClicked = true;

                    that.feature_application.update_feature_application('direct-update', features[i].name);
                    that.add_new_features(features[i], true);

                    if(that.localSearchOn){
                        that.run_local_search("BOTH");
                        that.localSearchInitiatedFromGeneralization = true;
                    }

                    instance.hide({transitionOut: 'fadeOutUp',}, toast, 'buttonName');
                }, true];
            buttonsList.push(button);
        }

        let cancelButton = ['<button style="'+ buttonsStyle +'"><b>Cancel</b></button>', function (instance, toast) {
            instance.hide({transitionOut: 'fadeOutUp'}, toast, 'buttonName');

            buttonClicked = true;
            that.feature_application.update_feature_application('restore', null);
        }, true];
        buttonsList.push(cancelButton);

        iziToast.show({
            theme: 'dark',
            icon: 'icon-person',
            title: 'Following generalizations may simply the current feature. Which generalization would you like to make?',
            titleSize: titleSize,
            close: false,
            message: message,
            messageSize: messageSize,
            messageLineHeight: messageLineHeight,
            position: 'topCenter', // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter
            progressBarColor: 'rgb(0, 255, 184)',
            buttons: buttonsList,
            timeout: timeout,
            onClosing: function(){
                if(!buttonClicked){
                    that.feature_application.update_feature_application('restore', null);
                }
            },
        });
    }

    calculate_pareto_ranking_of_features(featureData, objective_indices, limit){  
        console.log("Calculating pareto ranking of features...");

        if(!objective_indices || objective_indices.length === 0){
            objective_indices = [2, 3];
        }

        let features = [];
        let feature_objectives = [];
        for(let i = 0; i < featureData.length; i++){
            let objectives = JSON.parse(JSON.stringify(featureData[i].metrics)).multisplice(objective_indices);
            feature_objectives.push(objectives);
            features.push(featureData[i]);
        }

        let rank = 0;
        if(!limit){
            limit = 5;
        }
        
        let remaining_objectives, remaining;
        while(features.length > 0){
            remaining_objectives = [];
            remaining = [];

            let n = features.length;
            
            if (rank > limit){
                break;
            }

            for (let i = 0; i < n; i++){ 
                // Check dominance for each architecture
                let non_dominated = true;
                let this_feature_objectives = feature_objectives[i];

                for (let j = 0; j < n; j++){
                    let features_to_compare_objectives = feature_objectives[j];
                    if (i === j){
                        continue;
                    }else if(dominates(features_to_compare_objectives, this_feature_objectives)){
                        non_dominated = false;
                    }
                }

                if (non_dominated){
                    features[i].pareto_ranking = rank;
                }else{
                    remaining_objectives.push(feature_objectives[i]);
                    remaining.push(features[i]);
                    features[i].pareto_ranking = 100;
                }
            }

            rank++;
            features = remaining;
            feature_objectives = remaining_objectives;
        }
    }  

    remove_venn_diagram(){
        d3.select('.feature_plot.venn_diagram').select('div').select('svg').remove();
    }

    draw_venn_diagram(recall, precision){
        let venn_diagram_container = d3.select('.feature_plot.venn_diagram').select('div');

        if(!venn_diagram_container.node()) {
            return;
        }

        let total = this.data.length;
        let selected = this.selected_archs.length;
        let highlighted = null;
        let intersection = null;
        if(recall){
            intersection = Math.round(recall * selected);
        } else {
            intersection = 0;
        }
        if(precision && intersection){
            highlighted = Math.round(1 / precision * intersection);
        } else {
            highlighted = 0;
        }

        let vennDiagramBoundingRect = d3.select(".feature_plot.venn_diagram").node().getBoundingClientRect();

        // Selection has a fixed radius and location
        let r1 = vennDiagramBoundingRect.height / 3.9;
        let c1x = vennDiagramBoundingRect.width / 3.27;
        let c1y = vennDiagramBoundingRect.height / 2.48;

        let svg = venn_diagram_container.select('svg');
        if(!svg.node()){
            svg = venn_diagram_container
                .append("svg")
                .style('width','13.5vw')             
                .style('border-width','3px')
                .style('height','19vh')
                .style('border-style','solid')
                .style('border-color','black')
                .style('border-radius','40px')
                .style('margin-top','1vh')
                .style('margin-bottom','1vh'); 

            svg.append("circle")
                .attr("id","venn_diag_c1")
                .attr("cx", c1x)
                .attr("cy", c1y)
                .attr("r", r1)
                .style("fill", "steelblue")
                .style("fill-opacity", ".5");

            svg.append("text")
                .attr("id","venn_diag_c1_text")
                .attr("x", vennDiagramBoundingRect.width / 11.28)
                .attr("y", vennDiagramBoundingRect.height / 1.4)
                .attr("font-size", vennDiagramBoundingRect.height / 14.5 + "px")
                .attr("fill","steelblue")
                .text("Target:" + selected );
        }

        d3.select("#venn_diag_c2").remove();
        d3.select("#venn_diag_c2_text").remove();
        d3.select("#venn_diag_int_text").remove();

        if(!highlighted && !intersection){
            return;
        }

        // Feature 
        let r2 = Math.sqrt(highlighted / selected) * r1;
        if(r2 > vennDiagramBoundingRect.height / 2.9){ // Cap the size of the circle at r= vennDiagramBoundingRect.height / 2.9
            r2 = vennDiagramBoundingRect.height / 2.9;
        }

        let c2x;
        if (precision > 0.999){
            c2x = c1x + r2 - r1;

        } else {
            let dist;
            if(selected > highlighted){
                if(intersection == 0){
                    dist = r1 + r2;
                } else if(intersection === highlighted){
                    dist = r1 - r2;
                } else { // Linear mapping from r1-r2 to r1+r2, as intersection changes from 0 to highlighted
                    dist = -2 * r2 * intersection / highlighted + r1 + r2;
                }
            } else {
                if(intersection == 0){
                    dist = r1 + r2;
                } else if(intersection === selected){
                    dist = r2 - r1;
                } else { // Linear mapping from r2-r1 to r1+r2, as intersection changes from 0 to selected
                    dist = -2 * r1 * intersection / selected + r1 + r2;
                }
            }
            c2x = c1x + dist;
        }

        svg.append("circle")
            .attr("id","venn_diag_c2")
            .attr("cx", c2x)
            .attr("cy", c1y)
            .attr("r", r2)
            .style("fill", "brown")
            .style("fill-opacity", ".5");

        svg.append("text")
            .attr("id","venn_diag_c2_text")
            .attr("x", vennDiagramBoundingRect.width / 2.25)
            .attr("y", vennDiagramBoundingRect.height / 1.4)
            .attr("font-size", vennDiagramBoundingRect.height / 14.5 + "px")
            .attr("fill","brown")
            .text("Feature:" + highlighted );

        svg.append("text")
            .attr("id","venn_diag_int_text")
            .attr("x", vennDiagramBoundingRect.width / 6)
            .attr("y", vennDiagramBoundingRect.height / 11.6)
            .attr("font-size", vennDiagramBoundingRect.height / 14.5 + "px")
            .attr("fill","#4E1499")
            .text("Intersection: " + intersection);
    }
}


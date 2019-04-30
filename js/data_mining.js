
class DataMining{
    
    constructor(filteringScheme, labelingScheme){

        this.run_ga = true;
        this.enable_generalization = false;

        this.filter = filteringScheme;
        this.label = labelingScheme;
        this.feature_application = null;

        this.selected_archs = [];
        this.data = null;

        // Thresholds for running Apriori algorithm
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
        this.transform = null;

        this.allFeatures = [];
        this.currentFeature = null;
        this.currentFeatureBlinkInterval = null;
        this.utopiaPoint = {id:-1, name:null, expression:null, metrics:null, x0:-1, y0:-1, x:-1, y:-1, utopiaPoint: true};
        
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

        this.updateFeatureColor = null;

        PubSub.subscribe(ADD_FEATURE_FROM_EXPRESSION, (msg, data) => {
            this.add_new_feature_from_expression(data);
        });  

        PubSub.subscribe(REMOVE_FEATURE_CURSOR, (msg, data) => {
            this.update();
        });  

        PubSub.subscribe(GENERALIZE_FEATURE, (msg, data) => {
            let root = data.root;
            let node = data.node;
            this.generalize_feature(root, node);
        });  
        
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
        
        let guideline = d3.select("#support_panel").select("#view3")
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
        
        this.allFeatures = [];
        this.currentFeature = null;
        this.currentFeatureBlinkInterval=null;

        this.xAxis = null;
        this.yAxis = null;
        this.gX = null;
        this.gY = null;
        
        PubSub.publish(INITIALIZE_FEATURE_APPLICATION, null);
        this.featureID = 1;
    }
    
    async run(option){

        this.set_problem_parameters();

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

            let extractedFeatures = null;
            
            // Save the currently applied feature
            let base_feature = this.feature_application.parse_tree(this.feature_application.data, selected_node);

            // Run local search either using disjunction or conjunction
            let logical_connective = null;
            if(option){
                logical_connective = "OR";
            }else{
                logical_connective = "AND";
            }

            extractedFeatures = this.get_marginal_driving_features(selected, non_selected, base_feature, logical_connective,
                                                     this.support_threshold,this.confidence_threshold,this.lift_threshold);
            

            let featuresToAdd = [];

            // Check non-dominance against all existing features
            for(let i = 0; i < extractedFeatures.length; i++){
                let thisFeature = extractedFeatures[i];
                if(this.check_if_non_dominated(thisFeature, this.allFeatures)){
                    // non-dominated
                    let id = this.featureID++;
                    thisFeature.id = id;
                    featuresToAdd.push(thisFeature);
                }
            }
            this.add_new_features(featuresToAdd, false);
            PubSub.publish(CANCEL_ADD_FEATURE, null);
                        
        } else { // Run data mining from the scratch (no local search)
            
            // Clear the feature application
            PubSub.publish(INITIALIZE_FEATURE_APPLICATION, null);

            // Remove all highlights in the scatter plot (retain target solutions)
            PubSub.publish(APPLY_FEATURE_EXPRESSION, null);

            let extractedFeatures = null;
            if(!this.run_ga){
                extractedFeatures = this.get_driving_features(selected, non_selected, this.support_threshold, this.confidence_threshold, this.lift_threshold);
            }else{
                if(this.enable_generalization){
                    extractedFeatures = this.get_driving_features_with_generalization(selected, non_selected);
                }else{
                    extractedFeatures = this.get_driving_features_epsilon_moea(selected, non_selected);
                }
            }

            if(extractedFeatures === null){
                return;
            } else if(extractedFeatures.length === 0){ // If there is no driving feature returned
                return;
            }else{
                this.display_features(extractedFeatures);  
            }          
        }
    }

    get_driving_features_with_generalization(selected, non_selected){

        console.log("Epsilon-MOEA with variable generalization called");

        let that = this;
        let output;
        $.ajax({
            url: "/api/data-mining/get-driving-features-with-generalization",
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

    get_driving_features(selected, non_selected, support_threshold, confidence_threshold, lift_threshold){
        let output;
        $.ajax({
            url: "/api/data-mining/get-driving-features",
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
    get_marginal_driving_features(selected,non_selected,featureExpression,logical_connective,
                                                   support_threshold,confidence_threshold,lift_threshold){

        this.set_problem_generalized_concepts();
        
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

    generalize_feature(root, node){
        this.set_problem_parameters();
        this.set_problem_generalized_concepts();

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

        let output;
        $.ajax({
            url: "/api/data-mining/generalize-feature",
            type: "POST",
            data: {
                    problem: this.metadata.problem,  // eoss or gnc
                    input_type: this.metadata.input_type, // Binary or Discrete
                    rootFeatureExpression: rootFeatureExpression,
                    nodeFeatureExpression: nodeFeatureExpression,
                    selected: JSON.stringify(selected),
                    non_selected:JSON.stringify(non_selected),
                  },
            async: true,
            success: function (data, textStatus, jqXHR)
            {
                let extractedFeatures = data;
                let tempFeatures = [];
                for(let i = 0; i < extractedFeatures.length; i++){
                    let thisFeature = extractedFeatures[i];
                    if(precision - thisFeature.metrics[2] > 0.01 || recall - thisFeature.metrics[3] > 0.01){
                        continue;
                    }else{
                        tempFeatures.push(thisFeature);
                    }
                }

                if(tempFeatures.length === 0){
                    return;
                }    

                // Get the feature with the lowest distance to the utopia point
                let lowestDistance = 99;  
                let bestFeature = null;
                for (let i = 0; i < tempFeatures.length; i++){
                    let precision = tempFeatures[i].metrics[2];
                    let recall = tempFeatures[i].metrics[3];
                    let dist = 1 - Math.sqrt(Math.pow(1 - precision, 2) + Math.pow(1 - recall, 2));
                    if(dist < lowestDistance){
                        lowestDistance = dist;
                        bestFeature = tempFeatures[i];
                    }
                }

                that.add_new_features(tempFeatures, true);
                // that.show_generalization_suggestion(bestFeature.description, bestFeature);
                PubSub.publish(CANCEL_ADD_FEATURE, null); 
                that.get_problem_parameters();
            },
            error: function (jqXHR, textStatus, errorThrown)
            {alert("error");}
        });        
    } 

    display_features(features){

        document.getElementById('tab3').click();
        
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
        
        let objects = svg.append("svg")
                .attr("class", "objects feature_plot")
                .attr("width", this.width)
                .attr("height", this.height)
                .style('margin-bottom','30px');

        // Initialize the location of each feature
        this.featureID = 1;
        for (let i = 0; i < features.length; i++){
            features[i].x0 = -1;
            features[i].y0 = -1;
            features[i].id = this.featureID++;
        }

        this.allFeatures = features;
        this.update(this.allFeatures);

        d3.selectAll(".dot.feature_plot")
            .filter((d) => {
                if(d.utopiaPoint){
                    return false;
                } else{
                    return true;
                }
            })
            .attr("d", d3.symbol().type((d) => {return d3.symbolTriangle;}).size(120));
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

            if(matchedFeature === null || replaceEquivalentFeature || singleFeatureAdded){                
                let featureCopy =  JSON.parse(JSON.stringify(thisFeature));
                featureCopy.id = this.featureID++;
                featuresToAdd.push(featureCopy);

                if(matchedFeature !== null){
                    featuresToRemove[featureCopy.id] = matchedFeature;
                }
            }
        }
        document.getElementById('tab3').click();
            
        // Update the plot
        if(singleFeatureAdded){
            this.update(featuresToAdd[0], featuresToRemove, featuresToAdd[0]);
        }else{
            this.update(featuresToAdd, null, this.currentFeature);
        }
    }

    add_new_feature_from_expression(expression){

        if(expression === null || expression === ""){
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
            this.add_new_features(new_feature, true);
        }
    }
    
    update(featuresToBeAdded, mapFeaturesToBeRemoved, currentFeature){
        let that = this;

        // Set variables
        let width = this.width;
        let height = this.height;
        let duration = 500;

        // Set the axis to be Conf(F->S) and Conf(S->F)
        let xIndex = 2;
        let yIndex = 3;

        // If there is no feature to display, return
        if(this.allFeatures.length === 0 && featuresToBeAdded === null){
            return;
        }

        function get_utopia_point(){
            return d3.selectAll('.dot.feature_plot').filter((d) => {
                if(d.utopiaPoint){
                    return true;
                } else{
                    return false;
                }
            });
        }

        function get_current_feature(){
            let id;
            if(currentFeature){
                id = currentFeature.id;
            }
            // The current feature
            return d3.selectAll('.dot.feature_plot').filter(function(d){
                if (d.id === id) return true;
                return false;
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

        if(mapFeaturesToBeRemoved){
            if(typeof(mapFeaturesToBeRemoved) === "object"){
                if(Object.keys(mapFeaturesToBeRemoved).length !== 0){ // check whether the key is not empty
                    for(let id in mapFeaturesToBeRemoved){
                        // Take the feature to be added from the featuresToBeAdded list
                        let addedFeature, featureIndex, removedFeature;

                        if(featuresToBeAdded.constructor === Array){
                            for(let i = 0; i < featuresToBeAdded.length; i++){
                                if(featuresToBeAdded[i].id === id){
                                    featureIndex = i;
                                    break;
                                }
                            }
                            addedFeature = featuresToBeAdded.splice(featureIndex, 1);
                        }else{
                            addedFeature = featuresToBeAdded;
                            featuresToBeAdded = null;
                        }

                        // Find the index of the feature to be removed
                        for(let i = 0; i < this.allFeatures.length; i++){
                            if(this.allFeatures[i].id === mapFeaturesToBeRemoved[id].id){
                                featureIndex = i;
                                break;
                            }
                        }
                        removedFeature = this.allFeatures[featureIndex];

                        // Copy information from the removed feature to the added feature
                        addedFeature.id = removedFeature.id;
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
                        node.node().__data__.expression = addedFeature.expression;
                        node.node().__data__.name = addedFeature.name;
                    }
                }   
            }else{
                error();
            }
        }

        // Add new features
        let addedFeaturesID = [];
        let singleFeatureAdded = false;
        if(featuresToBeAdded){
            if(featuresToBeAdded.constructor === Array){
                this.allFeatures = this.allFeatures.concat(featuresToBeAdded);
                for(let i = 0; i < featuresToBeAdded.length; i++){
                    addedFeaturesID.push(featuresToBeAdded[i].id);
                }
            } else {
                // A single feature is added manually
                singleFeatureAdded = true;
                this.allFeatures.push(featuresToBeAdded);
                addedFeaturesID.push(featuresToBeAdded.id);
            }

            // Rescale metrics
            let supps = [];
            let lifts = [];
            let conf1s = [];
            let conf2s = [];
            let scores=[];   
            let maxScore = -1;

            // Get the maximum values
            for (let i = 0; i < this.allFeatures.length; i++){
                let thisFeature = this.allFeatures[i];
                supps.push(thisFeature.metrics[0]);
                lifts.push(thisFeature.metrics[1]);
                conf1s.push(thisFeature.metrics[2]);
                conf2s.push(thisFeature.metrics[3]);
                let score = 1-Math.sqrt(Math.pow(1-conf1s[i],2)+Math.pow(1-conf2s[i],2));
                scores.push(score);
                if(score > maxScore) maxScore = score;
            }

            let max_conf1 = Math.max.apply(null, conf1s);
            let max_conf2 = Math.max.apply(null, conf2s);
            let max_conf = Math.max(max_conf1, max_conf2);

            // Set the location of the utopia point
            this.utopiaPoint.metrics = [Math.max.apply(null, lifts), Math.max.apply(null, supps), max_conf, max_conf];

            // Add score for the utopia point (0.15 more than the best score found so far)
            scores.splice(0, 0, Math.max.apply(null, scores) + 0.15); 

            // Needed to map the values of the dataset to the color scale
            this.colorInterpolateRainbow = d3.scaleLinear()
                    .domain(d3.extent(scores))
                    .range([0,1]);

            // Insert the utopia point to the list of features
            this.allFeatures.splice(0, 0, this.utopiaPoint);

            // setup x
            // data -> value
            let xValue = function (d) {
                return d.metrics[xIndex];
            }; 

            // value -> display
            let xScale = d3.scaleLinear().range([0, width]); 

            // don't want dots overlapping axis, so add in buffer to data domain 
            let xBuffer = (d3.max(this.allFeatures, xValue) - d3.min(this.allFeatures, xValue)) * 0.05;
            xScale.domain([d3.min(this.allFeatures, xValue) - xBuffer, d3.max(this.allFeatures, xValue) + xBuffer]);

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

            let yBuffer = (d3.max(this.allFeatures, yValue) - d3.min(this.allFeatures, yValue)) * 0.05;
            yScale.domain([d3.min(this.allFeatures, yValue) - yBuffer, d3.max(this.allFeatures, yValue) + yBuffer]);

            // data -> display
            let yMap = function (d) {
                return yScale(yValue(d));
            }; 
            this.yAxis = d3.axisLeft(yScale);

            // Set the new locations of all the features
            for(let i = 0; i < this.allFeatures.length; i++){
                this.allFeatures[i].x = xMap(this.allFeatures[i]);
                this.allFeatures[i].y = yMap(this.allFeatures[i]);
                if(!this.allFeatures[i].x0){
                    // If previous location has not been initialized, set the current location
                    this.allFeatures[i].x0 = this.allFeatures[i].x;
                    this.allFeatures[i].y0 = this.allFeatures[i].y;
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
                    .attr("class", "axis axis-x objects feature_plot")
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
                    .attr("class", "axis axis-y objects feature_plot")
                    .call(this.yAxis);
                
                svg.append("text")
                    .attr("class", "label")
                    .attr("transform", "rotate(-90)")
                    .attr("y", 6)
                    .attr("dy", ".71em")
                    .style("text-anchor", "end")
                    .text('Coverage')
                    .style('font-size','15px');
            }

            let objects = d3.select(".objects.feature_plot")

            // Remove unnecessary points
            d3.select(".objects.feature_plot")
                    .selectAll('.dot.feature_plot')
                    .data(this.allFeatures)
                    .exit()
                    .remove();

            // Create new triangles
            objects.selectAll(".dot.feature_plot")
                    .data(this.allFeatures)
                    .enter()
                    .append('path')
                    .attr('class','point dot feature_plot')
                    .attr("transform", function (d) {
                        return "translate(" + d.x0 + "," + d.y0 + ")";
                    })
                    .style("stroke-width",1);

            d3.selectAll(".point.dot.feature_plot")
                .attr("d", d3.symbol().type((d) => {return d3.symbolTriangle;}).size(120));

            // Modify the shape of all features that were added recently, to crosses
            if(!singleFeatureAdded){
                d3.selectAll('.dot.feature_plot').filter(function(d){
                    if(addedFeaturesID.indexOf(d.id) !== -1){
                        return true;
                    }else{
                        return false;
                    }
                })
                .attr('d',d3.symbol().type(d3.symbolCross).size(120));
            }

            // Utopia point: modify the shape to a star
            get_utopia_point().attr('d',d3.symbol().type(d3.symbolStar).size(120));        

            d3.selectAll('.dot.feature_plot').filter((d) => {
                    if (d.id === this.utopiaPoint.id) {
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
            this.updateFeatureColor = function updateRainbow() {
                d3.selectAll(".dot.feature_plot")
                    .style("fill", function (d,i) { return that.colorScaleRainbow(that.colorInterpolateRainbow(scores[i])); })
            }

            // Remove the utopia point from the list
            this.allFeatures.splice(0,1);

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
        }

        if(this.updateFeatureColor !== null){
            this.updateFeatureColor();
        }
        
        if(currentFeature){
            let _currentFeature = get_current_feature();
            _currentFeature.shown = true;
            _currentFeature.style('fill',"black");    
            function blink() {
                if(_currentFeature.shown) {
                    _currentFeature.style("opacity",0);
                    _currentFeature.shown = false;
                } else {
                    _currentFeature.style("opacity",1);
                    _currentFeature.shown = true;
                }
            }
            this.currentFeatureBlinkInterval = setInterval(blink, 350);

        } else {
            this.currentFeature = null;
        }
    }

    feature_click(d){
        this.currentFeature = d;
        this.feature_application.update_feature_application('update');
        this.update(null, null, this.currentFeature);
        // this.generalize_feature();
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
        let id = d.id;

        // Remove the tooltip
        d3.selectAll("#tooltip_g").remove();

        // Bring back the previously stored feature expression
        this.feature_application.update_feature_application('restore');        
    }

    check_if_non_dominated(testFeature, otherFeatures){  
        let non_dominated = true;
        
        for (let j = 0; j < otherFeatures.length; j++){            
            if(otherFeatures[j] === testFeature){
                continue;
            }
            if(dominates(otherFeatures[j].metrics.slice(2), testFeature.metrics.slice(2))){
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
                    params: JSON.stringify(this.metadata.problem_specific_params)
                  },
            async: false,
            success: function (data, textStatus, jqXHR)
            {
            },
            error: function (jqXHR, textStatus, errorThrown)
            {
                alert("error");
            }
        });    
    }

    set_problem_generalized_concepts(){
        $.ajax({
            url: "/api/data-mining/set-problem-generalized-concepts",
            type: "POST",
            data: {
                    problem: this.metadata.problem,  // ClimateCentric, GNC, etc
                    params: JSON.stringify(this.metadata.problem_specific_params)
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
                    let concept_hierarchy = that.get_problem_concept_hierarchy();

                    concept_hierarchy["params"] = data;
                    PubSub.publish(PROBLEM_CONCEPT_HIERARCHY_LOADED, concept_hierarchy);
                }
            },
            error: function (jqXHR, textStatus, errorThrown)
            {
                alert("error");
            }
        });    
    }

    get_problem_concept_hierarchy(){
        
        let that = this;
        let instance_map = null;
        let superclass_map = null;
        $.ajax({
            url: "/api/data-mining/get-problem-concept-hierarchy",
            type: "POST",
            data: {
                    problem: this.metadata.problem,  // ClimateCentric, GNC, etc
                    params: JSON.stringify(this.metadata.problem_specific_params),
                  },
            async: false,
            success: function (data, textStatus, jqXHR)
            {
                // If the problem is "ClimateCentric"
                if(that.metadata.problem === "ClimateCentric"){
                    instance_map = data.instanceMap;
                    superclass_map = data.superclassMap;

                    // If instance map is empty
                    if(Object.keys(instance_map).length == 0){

                        // For each superclass
                        for (let var_name in superclass_map) {
                            if (superclass_map.hasOwnProperty(var_name)) {

                                let list_of_superclasses = superclass_map[var_name];
                                for(let i = 0; i < list_of_superclasses.length; i++){

                                    let superclass_name = list_of_superclasses[i];
                                    if(!instance_map.hasOwnProperty(superclass_name)){
                                        instance_map[superclass_name] = [];
                                    }
                                    // Add each instance to super classes
                                    instance_map[superclass_name].push(var_name);
                                }
                            }
                        }
                    }

                }else{
                    alert("Unsupported problem formulation: " + that.metadata.problem);
                }
            },
            error: function (jqXHR, textStatus, errorThrown)
            {
                alert("error");
            }
        });

        return {"instance_map":instance_map, "superclass_map":superclass_map};    
    }

    import_target_selection(filename){
        let that = this;
        this.initialize();

        $.ajax({
            url: "/api/data-mining/import-target-selection",
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

        if (this.selected_archs.length==0){
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
            url: "/api/data-mining/export-target-selection",
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
            url: "/api/data-mining/import-feature-data",
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

                if(imported_features.length === 0){ // If there is no driving feature returned
                    return;
                }

                that.display_features(imported_features);  

                if(generalization_enabled){
                    if(that.metadata.problem === "ClimateCentric"){
                        let problem_specific_params = data["params"]
                        let concept_hierarchy = that.get_problem_concept_hierarchy()
                        concept_hierarchy["params"] = problem_specific_params
                        PubSub.publish(PROBLEM_CONCEPT_HIERARCHY_LOADED, concept_hierarchy);
                    }  
                }

            },
            error: function (jqXHR, textStatus, errorThrown)
            {
                alert("error");
            }
        });
    }

    show_generalization_suggestion(message, generalizedFeature){
        let that = this;

        if(message.indexOf("\n")){
            message = message.replace("\n","</p><p>")
            message = "<p>" + message + "</p>";
        }

        let buttonsStyle = "width: 150px;"+
                        "float: left;";

        iziToast.show({
            theme: 'dark',
            icon: 'icon-person',
            title: 'Would you like to make the following generalization?: ',
            titleSize: 22,
            message: message,
            messageSize: 18,
            messageLineHeight: 30,
            position: 'topCenter', // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter
            progressBarColor: 'rgb(0, 255, 184)',
            buttons: [
                ['<button style="'+ buttonsStyle +'"> Accept </button>', function (instance, toast) {
                    that.add_new_features(generalizedFeature, true);
                    that.feature_application.update_feature_application('direct-update', generalizedFeature.expression);

                    instance.hide({
                        transitionOut: 'fadeOutUp',
                        onClosing: function(instance, toast, closedBy){
                            console.info('closedBy: ' + closedBy); // The return will be: 'closedBy: buttonName'
                        }
                    }, toast, 'buttonName');

                }, true], // true to focus
                ['<button style=' + buttonsStyle + '> Reject </button>', function (instance, toast) {
                    instance.hide({
                        transitionOut: 'fadeOutUp',
                        onClosing: function(instance, toast, closedBy){
                            console.info('closedBy: ' + closedBy); // The return will be: 'closedBy: buttonName'
                        }
                    }, toast, 'buttonName');
                }]
            ],
            timeout: 20000,
        //     onOpening: function(instance, toast){
        //         console.info('callback abriu!');
        //     },
        //     onClosing: function(instance, toast, closedBy){
        //         console.info('closedBy: ' + closedBy); // tells if it was closed by 'drag' or 'button'
        //     }
        });

    }
}


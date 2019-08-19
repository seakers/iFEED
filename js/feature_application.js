
class FeatureApplication{

    constructor(DataMiningScheme, filteringScheme, labelingScheme){
        this.filter = filteringScheme;
        this.label = labelingScheme;
        this.data_mining = DataMiningScheme;
        this.metadata = null;
        
        this.color = {"default":"#4C4C4C",
                     "logic":"#2383FF",
                     "ifThen":"#20C16E",
                     "add":"#FF7400",
                     "highlighted": "#FF7400",
                     "deactivated":"#E3E3E3",
                     "temp":"#BEBEBE",
                     "tempUnmatched": "#BE5C5C",
                     "tempMatched": "#5CBE66",
                     "unsatisfied": "#FF5C5C",
                     "generalizedVariable": "#7300B9"};
        
        this.stashed_root = null;
        this.tree = null;
        this.data = null; 
        this.root = null;
        this.i = 0;

        // top  right bottem left
        this.margin = {left:70,right:20,top:10,bottom:20},
        this.width = 2400 - this.margin.left - this.margin.right,
        this.height = 910 - this.margin.top - this.margin.bottom;

        this.draggingNode = null;
        this.selectedNode = null;
        this.dragStarted = false;
        this.contextMenu = null;  
        this.featureModificationModeOn = false;
        
	   	this.dragListener = d3.drag()
	        .on('start', (d) => { this.dragStart(d); })
	        .on('drag', (d) => { this.drag(d); })
	        .on('end', (d) => { this.dragEnd(d); });

        PubSub.subscribe(DESIGN_PROBLEM_LOADED, (msg, data) => {
            this.metadata = data.metadata;
        }); 
    
        PubSub.subscribe(INITIALIZE_FEATURE_APPLICATION, (msg, data) => {
            this.clear_feature_application();
        });  

        PubSub.subscribe(INSPECT_ARCH, (msg, data) => {
            // Update the color of the feature application tree
            this.update_base_feature_satisfaction(data);
        });   

        PubSub.subscribe(UPDATE_FEATURE_APPLICATION, (msg, data) => {
            this.update_feature_application(data.option, data.expression);
        });   

        PubSub.subscribe(SET_FEATURE_MODIFICATION_MODE, (msg, data) => {
            this.featureModificationModeOn = true;
        });

        PubSub.subscribe(END_FEATURE_MODIFICATION_MODE, (msg, data) => {
            if(data){
                let rootExpression = data.root;
                let parentNodeEpxression = data.parent_node;
                let nodeToBeReplaced = data.node_to_be_replaced;
                let newNodeExpression = data.new_node;
                let modificationSuccess = false;

                let that = this;
                if(nodeToBeReplaced){
                    // Replacing an existing base feature
                    let isSingleBaseFeature = false;
                    this.visit_nodes(this.data, (d) => {
                        if(d.name === nodeToBeReplaced){
                            modificationSuccess = true;
                            if(d.parent){
                                let index = d.parent.children.indexOf(d);
                                let _newNode = that.construct_node(that, d.depth, d.type, newNodeExpression, null, d.parent);
                                d.parent.children.splice(index, 1, _newNode);
                            }else{
                                isSingleBaseFeature = true;
                            }
                            return;
                        }
                    });
                    if(isSingleBaseFeature){
                        this.data = that.construct_node(that, this.data.depth, this.data.type, newNodeExpression, null, this.data.parent);
                    }

                }else{
                    // Adding a new base feature
                    this.visit_nodes(this.data, (d) => {
                        if(that.parse_tree(d) === parentNodeEpxression){
                            modificationSuccess = true;
                            let _newNode = that.construct_node(that, d.depth + 1, "leaf", newNodeExpression, null, d);
                            d.children.push(_newNode);
                            return;
                        }
                    });
                }

                if(!modificationSuccess){
                    throw "Target node not found";
                }else{
                    this.update_feature_application("direct-update", this.parse_tree(this.data));
                }
                this.featureModificationModeOn = false;

            } else { // End the mode without taking any action
                this.visit_nodes(this.data, function(d){
                    d.highlighted = false;
                });
                this.featureModificationModeOn = false;
                this.update();
            }            
        });   

        // Remove all features
        d3.select('#clear_all_features').on('click', (d) => { 
            this.clear_feature_application(); 
        }); 

        d3.select('#conjunctive_local_search').on('click', (d) => {
            this.data_mining.run_local_search("AND");

            // EXPERIMENT 
            PubSub.publish(EXPERIMENT_TUTORIAL_EVENT, "local_search_conjunctive"); 
        }); 
       
        d3.select('#disjunctive_local_search').on('click',(d) => {
            this.data_mining.run_local_search("OR");
        }); 

        d3.select('#generalize_feature').on('click',(d) => {
            this.data_mining.generalize_feature();
        }); 

		PubSub.publish(FEATURE_APPLICATION_LOADED, this);

        // EXPERIMENT
        this.experimentStage = null;
        this.experimentCondition = null;
        this.experimentGeneralizationEnabled = null;
        PubSub.subscribe(EXPERIMENT_SET_MODE, (msg, data) => {
            this.experimentStage = data.stage;
            this.experimentCondition = data.condition;
            this.experimentGeneralizationEnabled = data.generalization;
        });  
    }
    
    draw_feature_application_tree(expression, updateOption){   
        let margin = this.margin;
        let width = this.width;
        let height = this.height;
        
        this.tree = d3.tree().size([height, width]);

        // d3.select('#feature_application_loader').style('display','none');
        d3.select('#feature_application').select('svg').remove();

        d3.select('#feature_application')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.bottom + margin.top)
            .append('g')
            .attr('transform','translate('+ margin.left + "," + margin.top + ")");

        this.i = 0;
        this.data = null;

        if(expression && expression !== ""){
            this.data = this.construct_tree(this, expression);  

            if(this.data.type === "leaf"){
                let root = this.construct_node(this, 0, "logic", "AND", [this.data], null);
                this.data.depth = 1;
                this.data.parent = root;
                this.data = root;
            }
            
            if(updateOption){
                if(updateOption.is_temporary){
                    this.visit_nodes(this.data, (d) => {
                        d.temp = true;
                    }); 

                    if(this.stashed_root){
                        //this.get_node_matches_between_features(this.data, this.stashed_root);
                    }
                }
            }  
        }
        this.update(updateOption);  
    }

    sort_feature_types(root){
        if(root == null){
            return;
        }

        if(root.children === null){
            return;
        }

        if(root.type === "logic" && root.name === "IF_THEN"){
            return;
        }

        let branches = [];
        let sorted_nodes = [];
        if(this.label.feature_display_order){
            for(let i = 0; i < this.label.feature_display_order.length; i++){
                let currentType = this.label.feature_display_order[i];
                for(let j = 0; j < root.children.length; j++){
                    let node = root.children[j];
                    if(node.type === "logic"){
                        continue;
                    }
                    let type = this.label.pp_feature_type(node.name);
                    if(type === currentType){
                        sorted_nodes.push(node);
                    }
                }
            }

            for(let i = 0; i < root.children.length; i++){
                let node = root.children[i];
                if(node.type === "logic"){
                    branches.push(node);
                }else{
                    if(sorted_nodes.indexOf(node) === -1){
                        sorted_nodes.push(node);
                    }
                }
            }

        } else {
            let nodes_of_same_feature_type = {};
            for(let i = 0; i < root.children.length; i++){
                let node = root.children[i];

                if(node.type === "logic"){
                    branches.push(node);
                    continue;
                }
                let type = this.label.pp_feature_type(node.name);
                if(!(type in nodes_of_same_feature_type)){
                    nodes_of_same_feature_type[type] = [];
                }
                nodes_of_same_feature_type[type].push(node);
            }

            // Iterate over each feature type
            for (let type in nodes_of_same_feature_type) {
                if (nodes_of_same_feature_type.hasOwnProperty(type)) {  
                    for(let i = 0; i < root.children.length; i++){
                        let node = root.children[i];
                        if(node.type === "logic"){
                            continue;
                        }
                        if(this.label.pp_feature_type(node.name) === type){
                            sorted_nodes.push(node);
                        }
                    }
                }
            }
        }
        root.children = sorted_nodes.concat(branches);

        for(let i = 0; i < branches.length; i++){
            this.sort_feature_types(branches[i]);
        }
    }

    update(option){
        let that = this;  

        // Check the tree structure and make sure that it is correct
        this.check_tree_structure();

        // If there is no feature tree, return
        if(this.data === null){
            d3.selectAll('.treeNode').remove();
            d3.selectAll('.treeLink').remove();
            this.i = 0;
            PubSub.publish(APPLY_FEATURE_EXPRESSION, null);
            PubSub.publish(REMOVE_FEATURE_CURSOR, null);
            return;
        }

        // Apply the feature expression
        PubSub.publish(APPLY_FEATURE_EXPRESSION, {expression: this.parse_tree(this.data), option: option});

        if(this.featureModificationModeOn){
            PubSub.publish(END_FEATURE_MODIFICATION_MODE, null);
            return;
        }    
        
        let duration = d3.event && d3.event.altKey ? 6000 : 400;
        let margin = this.margin;

        // Set root node
        let root = d3.hierarchy(this.data, function(d) { return d.children; }); 
        root.x0 = that.height / 2;
        root.y0 = 0; 

        // Set the starting location of each node if it is not set up before
        this.visit_nodes(root, (node)=> {
            if(node.parent){
                if(!node.x0){
                    node.x0 = node.parent.x0;
                    node.y0 = node.parent.y0;
                    return;
                }
            }
        });

        // Create d3 tree structure
        let treeStructure = this.tree(root);

        // Get individual elements of the tree
        let nodes = treeStructure.descendants();
        let links = treeStructure.descendants().slice(1);

        // Normalize for fixed-depth.
        nodes.forEach(function(d) { 
            if(d.depth === 0){
                if(d.data.name === "IF_THEN"){
                    d.y = 60;
                }else{
                    d.y = 0;
                }
            }else if(d.depth === 1){
                d.y = 150;
            }else{
                d.y = d.depth * 170;
            }
        });

        let svg = d3.select('#feature_application_panel')
                        .select('svg').select('g');

        // Update the nodes…
        let node = svg.selectAll("g.treeNode")
                        .data(nodes, function(d) {return d.id || (d.id = d.data.id); });

        // Enter any new nodes at the parent's previous position.
        let nodeEnter = node.enter()
            .append("g")
            .attr("class", "treeNode")
            .attr("transform", (d) => { 
                if(d.depth === 0) {
                    return "translate(" + d.y0 + "," + d.x0 + ")";
                } else {
                    return "translate(" + d.parent.y0+ "," + d.parent.x0 + ")";
                }
            });

        nodeEnter.append("circle")
            .attr("r", 1e-6);

        nodeEnter.append("svg:text")
            .attr("dy", ".40em")
            .append("tspan")
            .style("fill-opacity", 1e-6);
        
        nodeEnter.filter((d) => {
                if(d.data.type === "leaf"){
                    return false;
                }else if(d.data.type === "logic" && d.data.name === "IF_THEN"){
                    return false;
                }else{
                    return true;
                };
            })
            .append('circle')
            .attr('class','nodeRange')
            .attr('r',40)
            .attr('opacity',0)
            .style('fill', '#2383FF');

        // Set up mouseover and mouseout events for nodeRange circles
        d3.selectAll('.nodeRange')
            .attr('pointer-events','mouseover')
            .on('mouseover', function(d){
                that.selectedNode = that.select_treeNode_by_id(d.id).node().__data__;
            })
            .on('mouseout', function(d){
                that.selectedNode = null;
            });
        
        // Transition nodes to their new position.
        let nodeUpdate = nodeEnter.merge(node);

        this.adjust_vertical_location();

        nodeUpdate.transition()
            .duration(duration)
            .attr("transform", (d) => { 
                return "translate(" + d.y+ "," + d.x + ")";  
            })
            .style('opacity', 1.0);
        
        nodeUpdate.select("circle")
            .attr("r", 9.5)
            .style("fill", (d) => { 
                return this.get_node_color(d);
             });

        nodeUpdate.select("text")
            .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
            .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
            .selectAll("text > tspan")
            .html((d) => {
                if(d.data.name === "IF_THEN"){
                    return "";
                } else {
                    return that.label.pp_feature_single_variable_tagged(d.data.name);
                }
            })
            .style("fill",(d) => {
                return this.get_node_color(d);
            })
            .style("font-size",23)
            .style("fill-opacity", 1);

        nodeUpdate.selectAll("tspan")
            .selectAll(".baseFeatureComponent")
            // .style("fill", () => { // Change the color of the generalized variables
            //     return "#7300B9";
            // }); 
            .on('mouseout', function(){
                d3.selectAll('#tooltip_g').remove();
            })
            .on('mouseover', function(){
                let outputText = null;

                let variable_name = this.textContent;
                let is_generalized_variable = false;
                let is_orbit_variable = false;
                let memberClassNames = d3.select(this).attr('class'); 

                let is_feature_name = memberClassNames.indexOf("featureName") !== -1;               
                if(is_feature_name){ // Feature name
                    let feature_expression = this.parentNode.__data__.data.name;
                    // Get the description of the feature
                    outputText = "<p>" + that.label.get_feature_description(feature_expression) + "</p>";

                } else { // Variable

                    outputText = "";
                    if(memberClassNames.indexOf("generalizedVariable") !== -1){
                        is_generalized_variable = true;
                    }

                    if(memberClassNames.indexOf("orbit") !== -1){
                        is_orbit_variable = true;
                    }


                    let varType;
                    if(is_orbit_variable){
                        varType = "orbit";
                    }else{
                        varType = "instrument";
                    }

                    
                    if(is_generalized_variable){
                        // list of memeber instances
                        outputText = "<p>" + TOOLTIP_MESSAGES[variable_name] + "</p>";
                        let _instances = that.label.instance_map[variable_name];
                        let instances = [];
                        for(let i = 0; i < _instances.length; i++){
                            instances.push(that.label.actualName2DisplayName(_instances[i], varType));
                        }
                        outputText = outputText + "<p> Member instances: {" + instances.join(", ") + "}</p>";

                    } else {
                        outputText = "<p>" + TOOLTIP_MESSAGES[that.label.displayName2ActualName(variable_name, varType)] + "</p>";
                    }
                }

                let tooltip_width, tooltip_height;
                if(is_feature_name){
                    tooltip_width = 450;
                    tooltip_height = 140;

                } else {
                    if(is_generalized_variable){
                        tooltip_width = 450;
                        tooltip_height = 180;
                    } else {
                        tooltip_width = 450;
                        tooltip_height = 70;
                    }
                }

                let mouseLoc_x = d3.mouse(d3.select("#feature_application_panel").select('svg').node())[0];
                let mouseLoc_y = d3.mouse(d3.select("#feature_application_panel").select('svg').node())[1];

                let tooltip_location = {x:0, y:0};
                let v_threshold = parseInt(d3.select("#feature_application_panel").select("svg").style("height"), 10) * 0.60;
                let h_threshold = parseInt(d3.select("#feature_application_panel").style("width"), 10) * 0.60;

                if(mouseLoc_x < h_threshold){
                    tooltip_location.x = 5;
                } else{
                    tooltip_location.x = -20 - tooltip_width;
                }
                if(mouseLoc_y < v_threshold){
                    tooltip_location.y = 5;
                } else{
                    tooltip_location.y = -20 - tooltip_height;
                }

                let svg = d3.select('#feature_application_panel').select('svg');
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
                    .style("fill","#303030")
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
                    .data([outputText]) 
                    .html(outputText)
                    .style("padding","25px")
                    .style('color','#D5D5D5')
                    .style('word-wrap','break-word');   

                fo.selectAll('p')
                    .style("font-size","20px")
                    .style("margin-top","0px");







                // let size;
                // if(type === "logic" && logic === "IF_THEN"){
                //     size = this.contextMenuSize["ifThen"];
                // }else{
                //     size = this.contextMenuSize[type];
                // }
                // let width = size.width;
                // let height = size.height;
                // let margin = size.margin;
                
                // // Draw the menu
                // let menu = d3.select('#feature_application')
                //     .select('svg')
                //     .append('g')
                //     .attr('class', 'context-menu')
                //     .selectAll('.tmp')
                //     .data(items)
                //     .enter()
                //     .append('g')
                //     .attr('class', 'menu-entry')
                //     .styles({'cursor': 'pointer'});

                // let that = this;
                // d3.selectAll('.menu-entry')
                //     .on('mouseover', function(d){ 
                //         d3.select(this).select('rect').styles(that.style.rect.mouseover) })
                //     .on('mouseout', function(d){ 
                //         d3.select(this).select('rect').styles(that.style.rect.mouseout) })
                //     .on('click', (d) => {
                //         this.ContextMenuAction(context, d.value);
                //     });
                
                // d3.selectAll('.menu-entry')
                //     .append('rect')
                //     .attr('x', x)
                //     .attr('y', function(d, i){ return y + (i * height); })
                //     .attr('width', width)
                //     .attr('height', height)
                //     .styles(this.style.rect.mouseout);
                
                // d3.selectAll('.menu-entry')
                //     .append('text')
                //     .text(function(d){             
                //         if(d.value === 'addChild'){
                //             if(isBeingModified){
                //                 return 'Cancel adding child node';
                //             }else{
                //                 return 'Add child node here';
                //             }
                //         }else if(d.value === 'toggle-logic'){
                //             if(logic === 'AND'){
                //                 return 'Change to OR';
                //             }else{
                //                 return 'Change to AND';
                //             }
                //         }else if(d.value === 'toggle-activation'){
                //             if(deactivated){
                //                 return 'Activate';
                //             }else{
                //                 return 'Deactivate';
                //             }
                //         }else if(d.value === 'toggle-col-exp'){
                //             if(hasChildren){
                //                 return 'Collapse';
                //             }else{
                //                 return 'Expand';
                //             }
                //         }else if(d.value === 'modifyBaseFeature'){
                //             if(isBeingModified){
                //                 return 'Cancel modifying this feature';
                //             }else{
                //                 return 'Modify this feature';
                //             }
                //         }else{
                //             return d.text; 
                //         }
                //     })
                //     .attr('x', x)
                //     .attr('y', function(d, i){ return y + (i * height); })
                //     .attr('dy', height - margin / 2)
                //     .attr('dx', margin)
                //     .styles(this.style.text);




            });















        // Adjust the horizontal location of IF_THEN nodes
        nodeUpdate.filter((d) => {
            if(d.data.name === "IF_THEN"){
                return true;
            }else{
                return false;
            }        
        }).select("text").attr("y", -25);

        // Transition exiting nodes to the parent's new position.
        let nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) { 
                if(d.depth === 0) {
                    return "translate(" + d.y + "," + d.x + ")";
                }else {
                    return "translate(" + d.parent.y + "," + d.parent.x + ")";   
                }             
            })
            .remove();          

        nodeExit.select("circle")
            .attr("r", 1e-6);

        nodeExit.select("text")
            .style("fill-opacity", 1e-6);

        // Update the links
        let link = svg.selectAll(".treeLink")
            .data(links, function(d){
                return d.id;
            });

        // Enter any new links at the parent's previous position.
        let linkEnter = link.enter()
                            .insert("g","g")
                            .attr("class", "treeLink");

        linkEnter.append("path")
            .attr('d', (d) => {
                let o = null;
                if(d.parent){
                    o = {x: d.parent.x0, y: d.parent.y0};
                }else{
                    o = {x: d.x0, y: d.y0};
                }
                return that.diagonal(o, o);
            })
            .style("stroke-width",function(d){
                return 8;
            })
            .style("fill-opacity", 0.94)
            .style('fill','none')
            .style('opacity', 1.0);

        linkEnter
            .filter((d) => {
                if(d.data.parent.type === "logic"
                    && d.data.parent.name === "IF_THEN"){
                    return true;
                }else{
                    return false;
                }    
            })
            .append("text")
            .style("font-size","20px")
            .attr("transform", function(d) {
                return "translate(" + d.parent.y0 + "," + d.parent.x0 + ")";
            })   
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .text(function(d) {
                let index = d.parent.children.indexOf(d);
                if(index === 0){
                    return "IF";
                }else if(index === 1){
                    return "THEN";
                }else if(index === 2){
                    return "ELSE"
                }
            })
            .attr("fill", (d) => {
                if(d.data.deactivated){
                    return that.color.deactivated;
                }else{
                    return "Black";
                }
            })
            .style('opacity', 1.0);

        // Update nodes
        let linkUpdate = linkEnter.merge(link);

        linkUpdate.select("path")
            .transition()
            .duration(duration)
            .attr('d', function(d){ return that.diagonal(d, d.parent) })
            .style("stroke",function(d){
                if(d.data.deactivated){
                    return that.color.deactivated;
                }else if(d.data.temp){
                    return that.color.temp; 
                }else if(d.data.highlighted){
                    if(!d.data.parent){
                        return that.color.highlighted;
                    } else {
                        if(d.data.parent.highlighted){
                            return that.color.highlighted;
                        }
                    }
                    return that.color.default;
                }else{
                    return that.color.default;
                }
            })
            .style('opacity', 1.0);

        linkUpdate.select("text")
            .transition()
            .duration(duration)
            .attr("transform", function(d) {
                let x = ((d.x + d.parent.x)/2);
                let y = ((d.y + d.parent.y)/2);
                if(d.x === d.parent.x){
                    x = x - 15;
                }else{
                    y = y - 30;
                }
                return "translate(" + y + "," + x + ")";
            })
            .attr("fill", (d) => {
                if(d.data.deactivated){
                    return that.color.deactivated;
                }else{
                    return "Black";
                }
            })
            .text(function(d) {
                let index = d.parent.children.indexOf(d);
                if(index === 0){
                    return "IF";
                }else if(index === 1){
                    return "THEN";
                }else if(index === 2){
                    return "ELSE"
                }
            })
            .style('opacity', 1.0);

        // Transition exiting nodes to the parent's new position.
        let linkExit = link.exit();

        linkExit.select("path")
            .transition()
            .duration(duration)
            .attr('d', function(d) {
	        	let o = {x: d.parent.x, y: d.parent.y}
	        	return that.diagonal(o, o)
	      	});

        linkExit.select("text")
            .transition()
            .attr("transform", function(d) {
                return "translate(" + d.parent.y0 + "," + d.parent.x0 + ")";
            });

        linkExit
            .transition()
            .attr("transform", function(d) {
                return "translate(" + d.parent.y0 + "," + d.parent.x0 + ")";
            })
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });    

        d3.selectAll('.treeNode')
   			.call(this.dragListener);

        d3.selectAll('.treeNode')
            .on('contextmenu', (d) => { 

                // EXPERIMENT
                if(that.experimentCondition){
                    if(that.experimentCondition.indexOf("automated") !== -1){
                        return;
                    }
                }

                d3.event.preventDefault();
                let context = d.type;
                let mouse_pos = d3.mouse(d3.select("#feature_application_panel").select('svg').select('g').node());
                let mouseX = mouse_pos[0]; 
                let mouseY = mouse_pos[1];                       
                if(!this.contextMenu){
                    this.contextMenu = new ContextMenu(this);
                }
                this.contextMenu.showMenu(d.data, mouse_pos);
            });
    }

    update_base_feature_satisfaction(){
        // To be implemented
    }
        
    dragStart(d){
        // Dragging disabled in the root node
        if(d.depth === 0) { 
        	return;
        }

        if(d3.event.sourceEvent.which != 1) { 
        	return; 
        }

        d3.event.sourceEvent.stopPropagation();

        this.dragStarted = true;    
        this.draggingNode = d;

        let id = d.id;

        // Hide all descendant nodes and links
        if(d.data.type !== "leaf"){
            this.remove_descendants(id);
        }

        // Remove the link to the parent node
        let linksToHide = d3.selectAll('.treeLink').filter((d) => {
            if(d.id === id){
                return true;
            }else{
                return false;
            }        
        });

        linksToHide.select("path")
            .attr('d', (d) => {
                let o = {x: d.parent.x, y: d.parent.y}
                return this.diagonal(o, o)
            })
            .style('opcaity',0);

        linksToHide.select("text").style('opacity',0);

        // EXPERIMENT
        let pass = false;
        if(this.experimentCondition){
            if(this.experimentCondition.indexOf("automated") !== -1){
                pass = true;
            }
        }
        if(!pass){
            d3.selectAll('.nodeRange').filter((d) => {
                if(d.type === 'leaf'){
                    return false;
                }else{
                    // You can only add new nodes to logic nodes
                    return true;
                }
            }).style('opacity',0.2);
        }




        // d3.selectAll('.nodeRange').filter((d) => {
        //     if(d.type === 'leaf'){
        //         return false;
        //     }else{
        //         // You can only add new nodes to logic nodes
        //         return true;
        //     }
        // }).style('opacity',0.2);

        this.select_treeNode_by_id(id).attr('pointer-events','none');
    }

    drag(d){
        if(this.dragStarted){    
	        let mouse_pos = d3.mouse(d3.select("#feature_application_panel").select('svg').select('g').node());
	        let mouseX = mouse_pos[0]; 
	        let mouseY = mouse_pos[1];        
            this.select_treeNode_by_id(d.id).attr("transform","translate("+ mouseX + "," + mouseY + ")");

            // EXPERIMENT
            if(this.experimentCondition){
                if(this.experimentCondition.indexOf("automated") !== -1){
                    return;
                }
            }

            this.updateTempConnector(d.id, mouseX, mouseY);          
        }
    }

    dragEnd(d){
        if(this.dragStarted){
            this.select_treeNode_by_id(d.id).attr('pointer-events','');

            // Remove the circle around the logic nodes
            d3.selectAll('.nodeRange')
                .style('opacity',0);

            // Remove links that were generated temporarily
            d3.selectAll(".tempTreeLink").remove();  


            // EXPERIMENT
            if(this.experimentCondition){
                if(this.experimentCondition.indexOf("automated") !== -1){
                    // No node selected (all nodes go back to the previous positions)
                    d3.selectAll('.nodeRange')
                        .on('mouseover', function(d){
                            that.selectedNode = that.select_treeNode_by_id(d.id).node().__data__;
                        })
                        .attr('r',40);
                    let updateOption = {add_to_feature_space_plot: true, replace_equivalent_feature: true};
                    this.update(updateOption);
                    this.dragStarted = false;
                    this.draggingNode = null;
                    return;
                }
            }
            
            if(this.selectedNode){
                let selectedNode = this.select_dataNode_by_id(this.selectedNode.id);
                let draggingNode = this.select_dataNode_by_id(this.draggingNode.id);            

                // Remove the element from the parent, and insert it into the new elements children
                let index = draggingNode.parent.children.indexOf(draggingNode);

                if (index > -1) {
                    draggingNode.parent.children.splice(index, 1);
                }

                if (typeof selectedNode.children != 'undefined') {
                    selectedNode.children.push(draggingNode);
                } else {
                    selectedNode.children = [];
                    selectedNode.children.push(draggingNode);
                }

                if(draggingNode.parent !== selectedNode){
                    // EXPERIMENT 
                    PubSub.publish(EXPERIMENT_TUTORIAL_EVENT, "node_drag_end"); 
                }

            }else{
                // No node selected (all nodes go back to the previous positions)
                d3.selectAll('.nodeRange')
                    .on('mouseover', function(d){
                        that.selectedNode = that.select_treeNode_by_id(d.id).node().__data__;
                    })
                    .attr('r',40);
            }

            let updateOption = {add_to_feature_space_plot: true, replace_equivalent_feature: true};
            this.update(updateOption);

            this.dragStarted = false;
            this.draggingNode = null;
        }
    }

    adjust_vertical_location(){
        let that = this;

        function get_nodes_given_depth(depth, includeLeafNodesOnly){
            let nodes = d3.selectAll(".treeNode").nodes().filter((d) => {
                if(includeLeafNodesOnly){
                    if(d.__data__.data.type !== "leaf"){
                        return false;
                    }
                }

                if(d.__data__.depth === depth){
                    return true;
                }else{
                    return false;
                }
                return false;
            });
            return nodes;
        }

        function get_vertical_location_of_nodes(nodes){
            let vertical_loc = [];
            nodes.forEach((d)=>{
                vertical_loc.push(d.__data__.x);
            });
            return vertical_loc;
        }

        let nodes_at_depth_1 = get_nodes_given_depth(1, true);
        let nodes_of_same_feature_type = {};

        nodes_at_depth_1.forEach((d) => {
            let type = that.label.pp_feature_type(d.__data__.data.name);
            if(!(type in nodes_of_same_feature_type)){
                nodes_of_same_feature_type[type] = [];
            }
            nodes_of_same_feature_type[type].push(d);
        });

        let vertical_offset = 40;

        // Iterate over each feature type
        for (let type in nodes_of_same_feature_type) {
            if (nodes_of_same_feature_type.hasOwnProperty(type)) {  

                let nodes = nodes_of_same_feature_type[type];
                let numNodes = nodes.length;

                if(numNodes < 2){
                    continue;
                }

                let evenNum = false;
                let midPoint = null;

                if(numNodes % 2 === 0){
                    evenNum = true;
                    let index1 = numNodes / 2 - 1;
                    let index2 = numNodes / 2;
                    midPoint = (nodes[index1].__data__.x + nodes[index2].__data__.x) / 2;
                }else{
                    evenNum = false;
                    let index = Math.floor(numNodes / 2);
                    midPoint = nodes[index].__data__.x;
                }

                for(let i = 0; i < Math.floor(numNodes / 2); i++){
                    nodes[i].__data__.x = midPoint - vertical_offset * (Math.floor(numNodes / 2) - i);
                }

                for(let i = Math.ceil(numNodes / 2); i < numNodes; i++){
                    if(evenNum){
                        if(i === Math.ceil(numNodes / 2)){
                            nodes[i].__data__.x = midPoint;
                        }else{
                            nodes[i].__data__.x = midPoint + vertical_offset * (i - Math.ceil(numNodes / 2));
                        }
                    }else{
                        nodes[i].__data__.x = midPoint + vertical_offset * (i - Math.ceil(numNodes / 2) + 1);
                    }
                }
            }
        }

        let nodes_vertical_loc_cumulated = get_vertical_location_of_nodes(get_nodes_given_depth(1, true));
        let depth = 2;
        let nodes = get_nodes_given_depth(depth);

        let offset = 33;

        while(nodes.length !== 0){

            let vertical_loc_current_depth = [];

            for(let i = 0; i < nodes.length; i++){
                let node = nodes[i];
                let vertical_loc = node.__data__.x;
                let parent_vertical_loc = node.__data__.parent.x;

                let minDiffIndex = 0;
                let minDiff = 9999999999;
                for(let j = 0; j < nodes_vertical_loc_cumulated.length; j++){
                    let test = nodes_vertical_loc_cumulated[j];
                    if(Math.abs(test - vertical_loc) < minDiff){
                        minDiffIndex = j;
                        minDiff = Math.abs(test - vertical_loc);
                    }
                }

                if(minDiff < 10){
                    let diff = vertical_loc - nodes_vertical_loc_cumulated[minDiffIndex];
                    let positive_offset = false;

                    if(Math.abs(diff) < 0.3){
                        if(parent_vertical_loc - vertical_loc > 0){
                            positive_offset = true;
                        }else{
                            positive_offset = false;
                        }
                    }else if(diff > 0){
                        positive_offset = true;
                    }else{
                        positive_offset = false;
                    }

                    if(vertical_loc_current_depth.length !== 0){
                        let last_node_loc = vertical_loc_current_depth[vertical_loc_current_depth.length - 1];
                        let temp_loc;
                        if(positive_offset){
                            temp_loc = vertical_loc + offset;
                        }else{
                            temp_loc = vertical_loc - offset;
                        }  
                        if(Math.abs(last_node_loc - temp_loc) < 1){
                            positive_offset = positive_offset === false;
                        }
                    }

                    if(positive_offset){
                        node.__data__.x = vertical_loc + offset;
                    }else{
                        node.__data__.x = vertical_loc - offset;
                    }        
                }

                vertical_loc_current_depth.push(node.__data__.x);
                if(node.__data__.data.type === "leaf"){
                    nodes_vertical_loc_cumulated.push(node.__data__.x);
                }   
            }

            depth = depth + 1;
            nodes = get_nodes_given_depth(depth);
        }
    }

    check_tree_structure(){
        // Checks and ensures that the tree structure is correct

        if(this.data === null){
            return;
        }   

        let that = this;

        let update_parent_info = (node) => {
            if(node.children){
                for(let i = 0; i < node.children.length; i++){
                    let child = node.children[i];
                    child.parent = node;    
                }
            }
        }

        let update_depth_info = (node) => {
            if(!node.parent){
                node.depth = 0;
            }else{
                node.depth = node.parent.depth + 1;
            }
        }

        let delete_logic_node_without_children = (node) => {
            
            if(node.type === 'logic'){
                // If a logic node does not have any child node
                if (node.children.length === 0){

                    if(!node.parent){ 
                        // The root node is a logical connective but has no children
                        this.data = null;
                        d3.selectAll('.treeNode').remove();

                    }else{
                        let index = node.parent.children.indexOf(node);
                        // Remove the current node
                        if (index > -1) {
                            node.parent.children.splice(index, 1);
                        }
                    }

                }
            }        
        }

        let remove_redundant_logical_connectives = (node) => {

            if(node.type === "logic" && node.parent){
                
                if(node.name === node.parent.name){
                    let children = node.children;
                    let parent = node.parent;
                    let index = parent.children.indexOf(node);

                    // Remove the current node
                    node.parent.children.splice(index,1);

                    // Add the children nodes to their grandparent node
                    for(let i = 0; i < children.length; i++){
                        parent.children.splice(index, 0, children[i]);
                    }
                }
            }
        }

        let remove_redundant_features = (node) => {

            if(node.type === "logic" && node.children){

                let list_of_features = [];
                let indices_to_delete = [];
                let children = node.children;

                for(let i = 0; i < children.length; i++){

                    if(children[i].type === "logic"){
                       continue;
                    }

                    let this_feature = children[i];

                    if(list_of_features.indexOf(this_feature.name) === -1){
                        list_of_features.push(this_feature.name);                    
                    }else{
                        indices_to_delete.push(i);
                    }
                }

                indices_to_delete.reverse();

                for(let j = 0; j < indices_to_delete.length; j++){
                    node.children.splice(indices_to_delete[j], 1);
                }
            }
        }

        let collapse_feature_with_same_types = (node) => {

            if(node.type === "logic" && node.children){ // current node is a logic node

                let indices_to_delete = [];
                let children = node.children;
                let depth = children[0].depth;
                let temp = node.temp;

                let feature_type_to_node_index = {};
                for(let i = 0; i < children.length; i++){

                    if(children[i].type === "logic"){
                       continue;
                    }

                    let base_feature = children[i];
                    let feature_type = that.label.pp_feature_type(base_feature.name);

                    if(Object.keys(feature_type_to_node_index).indexOf(feature_type) === -1){
                        feature_type_to_node_index[feature_type] = [];
                    }
                    feature_type_to_node_index[feature_type].push(i);
                }

                for(let i = 0; i < Object.keys(feature_type_to_node_index).length; i++){

                    let feature_type = Object.keys(feature_type_to_node_index)[i];
                    let corresponding_node_indices = feature_type_to_node_index[feature_type];

                    if(corresponding_node_indices.length > 1){

                        indices_to_delete = indices_to_delete.concat(corresponding_node_indices);

                        let newNode = that.construct_node(that, depth, "featType", feature_type, [], node);
                        newNode.temp = temp;

                        let corresponding_nodes = [];
                        for(let j = 0; j < corresponding_node_indices.length; j++){
                            let node = children[corresponding_node_indices[j]];
                            node.depth = depth + 1;
                            node.parent = newNode;
                            corresponding_nodes.push(node);
                        }
                        newNode.children = corresponding_nodes;
                        node.children.push(newNode);
                    }
                }

                indices_to_delete.reverse();

                for(let j = 0; j < indices_to_delete.length; j++){
                    node.children.splice(indices_to_delete[j], 1);
                }
            }
        }

        // this.visit_nodes(this.data, collapse_feature_with_same_types);

        this.visit_nodes(this.data, update_parent_info);
        this.visit_nodes(this.data, update_depth_info);

        this.visit_nodes(this.data, delete_logic_node_without_children);
        this.visit_nodes(this.data, remove_redundant_logical_connectives);
        this.visit_nodes(this.data, remove_redundant_features); 

        this.visit_nodes(this.data, update_parent_info);
        this.visit_nodes(this.data, update_depth_info);     
        this.sort_feature_types(this.data);   
    }

    get_node_matches_between_features(testRoot, stashedRoot){
        let that = this;

        if(testRoot.name !== stashedRoot.name || testRoot.type !== "logic"){
            // Return if the logical connective types are different
            return;
        }

        for(let i = 0; i < testRoot.children.length; i++){
            let nodeExpression = that.parse_tree(testRoot.children[i]);
            let foundMatch = false;
            for(let j = 0; j < stashedRoot.children.length; j++){
                if(nodeExpression === that.parse_tree(stashedRoot.children[j])){
                    foundMatch = true;
                    break;
                }
            }
            if(foundMatch){
                testRoot.children[i].matched = true;
            }else{
                testRoot.children[i].matched = false;
            }
        }
    }
 
    visit_nodes(source, func, reverse){
        if(source === null){
            return;
        }

        function recursive(source, func, reverse){
            let re;
            if(typeof func != 'undefined'){
                re = func(source);
                // If func is a function that returns something, stop traversing tree and return. 
                //Otherwise, apply func and keep traversing the tree
                if(re) return re; 
            }
            if(reverse){
                if(source.parent){
                    re = recursive(source.parent,func,true);
                    if(re) return re;  
                }
            }else{
                if(source){
                    if(source.children){
                        for(let i = 0; i < source.children.length; i++){
                            re = recursive(source.children[i],func)
                            if(re) return re;
                        }   
                    }  
                }
            }
            return null;
        }
        return recursive(source, func, reverse);
    }
    
    update_feature_application(option, expression){
        let that = this;

        // EXPERIMENT
        if(this.experimentCondition){
            if(this.experimentCondition.indexOf("design_inspection") !== -1){
                if(this.experimentStage === "learning" || this.experimentStage === "tutorial"){

                    // If there is no feature tree, return
                    if(!experiment || experiment === ""){
                        return;
                    }
                    // Apply the feature expression
                    PubSub.publish(APPLY_FEATURE_EXPRESSION, {expression: expression, option: option});

                    // Do not display any feature tree
                    return;
                }
            }
        }
        
        if(option === "temp"){ // Mouseover on the feature plot
            if(this.data){ // There already exists a feature tree
                // Stash the current root 
                this.stashed_root = this.construct_tree(this, this.parse_tree(this.data));  

                // Draw a new feature tree
                this.draw_feature_application_tree(expression, {is_temporary: true});
                
            }else{
                // There is no tree. Build a new one
                this.stashed_root = null;
                this.draw_feature_application_tree(expression, {is_temporary: true});
            }

        }else if(option === "restore"){ // Restore the stashed tree

            if(this.stashed_root !== null){
                if(jQuery.isEmptyObject(this.stashed_root)){
                    // There was no tree before
                    this.data = null;
                }else{
                    // The whole tree is stashed
                    this.data = this.stashed_root;  
                    if(this.data.type === "leaf"){
                        let root = this.construct_node(this, 0, "logic", "AND", [this.data], null);
                        this.data.depth = 1;
                        this.data.parent = root;
                        this.data = root;
                    }
                }
                this.stashed_root = null;
                this.update({add_to_feature_space_plot: false, replace_equivalent_feature: false});
            
            } else {
                if(this.data.temp){
                    this.data = null;
                    this.update(); 
                }
            }
            
        } else if(option === 'update'){
            this.stashed_root = null;
            this.visit_nodes(this.data, (d) => {
                d.temp = false;
            })  
            this.update({add_to_feature_space_plot: true, replace_equivalent_feature: false});

            if(this.data_mining.localSearchOn){
                this.data_mining.run_local_search("BOTH");
            }else if(this.data_mining.generalizationOn){
                let rootExpression = this.parse_tree(this.data);
                this.data_mining.generalize_feature(rootExpression);
            }
            
            // EXPERIMENT 
            PubSub.publish(EXPERIMENT_TUTORIAL_EVENT, "feature_clicked");

        } else if(option === 'direct-update'){ // Make a direct update to the feature application status
            // Remove the stashed information                
            this.stashed_root = null;    
            let updateOption = {is_temporary: false, add_to_feature_space_plot: true, replace_equivalent_feature: true};
            this.draw_feature_application_tree(expression, updateOption);
        }
    }
    
    get_node_ids(source,IDList){
        if(!source){
            return [];
        }

        let id = source.id;
        if(IDList.indexOf(id)==-1){
           IDList.push(id);
        }
        let children = source.children;
        if(children){
            for(let i = 0; i < children.length; i++){
                this.get_node_ids(children[i],IDList);
            }
        }
        return IDList;
    }
    
    remove_descendants(nodeID){
        let descendantNodesID = [nodeID];
        let parentNode = this.select_treeNode_by_id(nodeID).node().__data__.parent;

        this.visit_nodes(this.data, (d) => {
            if(d.parent){
                if(descendantNodesID.indexOf(d.parent.id) != -1){
                    descendantNodesID.push(d.id);
                }
            }
        });

        let linksToHide = d3.selectAll('.treeLink').filter((d) => {
            if (descendantNodesID.indexOf(d.id) != -1){
                return true;
            }else{
                return false;
            }
        });

        linksToHide.select("path")
            .attr('d', (d) => {
                let o = {x: parentNode.x, y: parentNode.y}
                return this.diagonal(o, o)
            })
            .style('opacity', 0);

        linksToHide.select("text").style("opacity", 0);

        let descendantNodes = d3.selectAll('.treeNode').filter((d) => {
            if(d.id === nodeID){
                return false;
            }else if(descendantNodesID.indexOf(d.id) != -1){
                return true;
            }else{
                return false;
            }
        });

        descendantNodes
            .attr('transform','translate('+ parentNode.y + "," + parentNode.x + ")")
            .style('opacity', 0);

        descendantNodes
            .select('.nodeRange')
            .on('mouseover', null)
            .attr('r',0);
    }

    construct_node(self, depth, type, name, children, parent){
        if(self === null){
            self = this;
        }
        return {id:self.i++, depth:depth, type:type, name:name, children:children, parent:parent};
    }

    construct_tree(self, expression, depth){

        if(!depth){
           depth = 0;
        }

        if(expression === null){
            return {};
        }

        if(!self){
            self = this;
        }

        let d = depth;
        let e = expression;
        let _e = null;

        // Remove outer parenthesis
        let parentheses_removed = remove_outer_parentheses(e,d);
        e = parentheses_removed.expression;

        if(get_nested_parenthesis_depth(e) === 0){ // Given expression does not have a nested structure

            if(e.indexOf("&&") === -1 && e.indexOf("||") === -1){
                // There is no logical connective: return single feature (leaf node)
                return self.construct_node(self, d, "leaf", e, null, null);
            }else{
                // There are logical connectives
                _e = e;
            }

        }else{
            // Hide the nested structure by replacing whatever's inside parentheses with special characters (currently using X's).
            _e = collapse_paren_into_symbol(e);
        }    

        let first = true;
        let logic = null;
        let thisNode = null;

        if(_e.indexOf("_IF_") !== -1 && _e.indexOf("_THEN_") !== -1){
            e = e.substring("_IF_".length);

            let conditional, consequent, alternative;
            conditional = e.split("_THEN_")[0];
            let rightHandSide = e.split("_THEN_")[1];
            if(rightHandSide.indexOf("_ELSE_") === -1){
                consequent = rightHandSide;
                alternative = null;
            }else{
                consequent = rightHandSide.split("_ELSE_")[0];
                alternative = rightHandSide.split("_ELSE_")[1];
            }
            
            let conditionalNode = self.construct_tree(self, conditional, d+1);
            let consequentNode = self.construct_tree(self, consequent, d+1);
            let alternativeNode = null;
            if(alternative != null){
                alternativeNode = self.construct_tree(self, alternative, d+1);
            }
            thisNode = self.construct_node(self, d, "logic", "IF_THEN", [], null);
            
            // Add children to the current node
            thisNode.children.push(conditionalNode);
            thisNode.children.push(consequentNode);
            if(alternative != null){
                thisNode.children.push(alternativeNode);
                alternativeNode.parent = thisNode;
            }
            conditionalNode.parent = thisNode;
            consequentNode.parent = thisNode;

        }else{
            while(true){

                let temp = null;
                let _temp = null;

                if(first){

                    // The first filter in a series to be applied
                    first = false;
                    let name = null;

                    if (_e.indexOf("&&") != -1){
                        logic = "&&";
                        name="AND";
                    }else{
                        logic = "||";
                        name="OR";
                    }            
                    thisNode = self.construct_node(self, d, "logic", name, [], null);

                }else{
                    _e = _e.substring(2);
                    e = e.substring(2);
                }

                if(_e.indexOf(logic) === -1){
                    // Last element in the list
                    let child = this.construct_tree(self, e, d+1);
                    thisNode.children.push(child);
                    child.parent = thisNode;
                    break;
                }else{
                    // Not last

                    // Get the current feature expression
                    _temp = _e.split(logic,1)[0];
                    temp = e.substring(0,_temp.length);

                    // Add the child to the current node
                    let child = this.construct_tree(self, temp, d+1);
                    thisNode.children.push(child);
                    child.parent = thisNode;

                    // Get the rest of the expression for the next loop
                    _e = _e.substring(_temp.length);
                    e = e.substring(temp.length);            
                }

            }
        }
        return thisNode;
    }
    
    parse_tree(root, placeholderNode){

        let _parse_tree = function(root, placeholderNode){

            function deactivated(node){
                // Check if all of the children nodes have been deactivated. If so, then the current node is also deactivated
                if(node.deactivated){
                    return true;
                    
                }else{
                    if(node.children){
                        let children = node.children;
                        let activated = false;
                        for(let i = 0; i < children.length; i++){
                            if(!children[i].deactivated){
                                activated = true;
                            }
                        }
                        if(!activated){
                            node.deactivated = true;
                            return true;
                        }
                    }
                }
                return false;
            }

            let expression = null;

            if(!root){
                // If the current node is null, return null    
                expression = null;

            }else if(root.type === "leaf"){
                // If the current node is a leaf node

                if(deactivated(root)){
                    expression = "";
                    
                }else{
                    if(placeholderNode){
                        // If placeholder exists
                        if(placeholderNode === root.parent && root.parent.children.indexOf(root) === 0){ 
                            // If the current node is the first child of the placeholderNode
                            
                            if(root.parent.name === "AND"){
                                expression = "{PLACEHOLDER}&&"+root.name;
                            }else{
                                expression = "{PLACEHOLDER}||"+root.name;
                            }                        
                                                    
                        }else if(placeholderNode === root){ // If the current node is the placeholderNode itself
                            
                            if(root.parent.name === "AND"){
                                // When a leaf node is set as a placeholderNode, change the logical connective
                                expression = "({PLACEHOLDER}||"+root.name + ")";
                            }else{
                                expression = "({PLACEHOLDER}&&"+root.name + ")";
                            } 
                            
                        }else{
                            // If the current node has nothing to do with the placeholder
                            expression = root.name;
                        }
                    }else{
                        // If there is no placeholder, simply return its name
                        expression = root.name;
                    }
                }

            } else if (root.type === "logic" && (deactivated(root) || !root.children)){
                // Current node is a logic node but its children are either all emtpy or deactivated
                expression = "";

            } else {
                // Current node is a logical node and is not deactivated
                expression = "";
                if(root.type === "logic" && root.name === "IF_THEN"){ // IF_THEN
                    let conditional = root.children[0];
                    let consequent = root.children[1];
                    let alternative = null;
                    if(root.children.length === 3){
                        alternative = root.children[2];
                    }

                    let conditionalExpression = _parse_tree(conditional, placeholderNode);
                    let consequentExpression = _parse_tree(consequent, placeholderNode);
                    let alternativeExpression = null;
                    if(alternative != null){
                        if(alternative.deactivated){
                            alternative = null;
                            alternativeExpression = null;
                        }else{
                            alternativeExpression = _parse_tree(alternative, placeholderNode);
                        }
                    }

                    if(!conditionalExpression.startsWith("(")){
                        conditionalExpression = "(" + conditionalExpression + ")";
                    }
                    if(!consequentExpression.startsWith("(")){
                        consequentExpression = "(" + consequentExpression + ")";
                    }
                    if(alternative != null){
                        if(!alternativeExpression.startsWith("(")){
                            alternativeExpression = "(" + alternativeExpression + ")";
                        }
                    }
                    
                    expression = "_IF_" + conditionalExpression
                            + "_THEN_" + consequentExpression;  

                    if(alternative != null){
                        expression = expression + "_ELSE_" + alternativeExpression;
                    }

                } else { // AND or OR
                    let logic = null;
                    if(root.type === "featType"){
                        if(root.parent.name === "AND"){
                            logic = "&&";
                        }else{
                            logic = "||";
                        }
                    }else{
                        if(root.name === "AND"){
                            logic = "&&";
                        }else{
                            logic = "||";
                        }
                    }

                    let children;
                    if(root.type === "featType" && root.children.length === 0){
                        children = root._children;
                    }else{
                        children = root.children;
                    }

                    for(let i = 0; i < children.length; i++){
                        let child = children[i];
                        let new_expression = _parse_tree(child, placeholderNode);
                        if(expression !== "" && new_expression !== ""){
                            expression = expression + logic;
                        }
                        expression = expression + new_expression;    
                    }
                }

                if(expression !== ""){
                    expression = "(" + expression + ")"; 
                }
            }
            return expression;
        }

        return _parse_tree(root, placeholderNode);
    }    
  
    updateTempConnector(nodeID, xCoord, yCoord){

    	let that = this;
        let data = [];
        let node = null;

        if (this.draggingNode != null && this.selectedNode != null) {
        	node = this.select_treeNode_by_id(nodeID).node().__data__;
        	node.x = yCoord;
        	node.y = xCoord;
            data = [node];
        }

        let link = d3.select('#feature_application_panel')
                        .select('svg')
                        .select('g')
                        .selectAll(".tempTreeLink").data(data);

        let linkEnter = link.enter()
        	.append("path")
            .attr("class", "tempTreeLink")
            .attr('d', (d) => {
                let o = {x: that.selectedNode.x0, y: that.selectedNode.y0};
                return that.diagonal(d, o);
            })
            .attr('pointer-events', 'none')
            .style('fill','none')
            .style('stroke','red')
            .style('stroke-width','3px');

        // Transition nodes to their new position.
        let tempLinkUpdate = linkEnter.merge(link);

        // Transition links to their new position.
        tempLinkUpdate.transition()
            .duration(0)
            .attr('d', (d) => {
                let o = null;
                o = {x: that.selectedNode.x0, y: that.selectedNode.y0};
                return that.diagonal(d, o);
            });

        link.exit().remove();
    }

	update_feature_expression(expression){
	    let logic_color = "#FF9500";
	    let bracket_color = "#FF0000";

		if(expression === null){
	       expression = "";

      	}else if(expression != ""){

       		expression = this.label.pp_feature(expression);
	        expression = expression.replace(/{/g,'');
	        expression = expression.replace(/}/g,'');

	        expression = expression.replace(/\(/g,'<span style="color:'+bracket_color+';font-weight:bold;font-size:28px">(</span>');
	        expression = expression.replace(/\)/g,'<span style="color:'+bracket_color+';font-weight:bold;font-size:28px">)</span>');
	        expression = expression.replace(/&&/g,' <span style="color:'+logic_color+';">AND</span> ');
	        expression = expression.replace(/\|\|/g,' <span style="color:'+logic_color+';">OR</span> ');
	    }

   		d3.select('#feature_expression').html("<p>"+expression+"</p>");
	}

    start_loading_animation(){
        // Show loading animation while generalization search is on
        d3.select('#feature_application_loader').style('display','block');

        if(this.data){ // If there exists a feature tree, change the color to gray
            this.update_feature_application("temp", this.parse_tree(this.data));
        }
    }

    end_loading_animation(){
        d3.select('#feature_application_loader').style('display','none');
    }

    get_num_literal(node){
        let counter = 0;
        this.visit_nodes(node, (d) => {
            if(d.type === "leaf"){
                counter += 1;
            }
        });
        return counter;
    }

    get_num_literal_from_expression(expression){
        let root = this.construct_tree(this, expression);
        return this.get_num_literal(root);
    }
    
    clear_feature_application(){
        this.data = null;
        this.update();
        this.update_feature_expression(null);
        PubSub.publish(REMOVE_FEATURE_CURSOR, null);
    }
    
    diagonal(s, d) {
        let path = `M ${s.y} ${s.x}
                C ${(s.y + d.y) / 2} ${s.x},
                  ${(s.y + d.y) / 2} ${d.x},
                  ${d.y} ${d.x}`;
        return path;
    }

    select_dataNode_by_id(id){
        return this.visit_nodes(this.data, (d) => {
            if(d.id === id){
                return d;
            }else{
                return null;
            }
        });
    }
    
    select_treeNode_by_id(id){
    	let nodes = d3.selectAll('.treeNode').nodes();
    	let node = null;

    	for (let i = 0; i < nodes.length; i++){
    		if (nodes[i].__data__.id === id){
    			node = d3.select(nodes[i]);
    		}
    	}
    	return node;
    }

    convert_to_CNF(){

        let feature = this.parse_tree(this.data);
        let CNF_expression = "";
        let that = this;

        $.ajax({
            url: "/api/data-mining/convert-to-CNF",
            type: "POST",
            data: {
                    expression: feature,
                  },
            async: false,
            success: function (data, textStatus, jqXHR)
            {
                CNF_expression = data;
                that.update_feature_application("direct-update", CNF_expression);
            },
            error: function (jqXHR, textStatus, errorThrown)
            {alert("error");}
        });
    }

    simplify_feature(){

        let feature = this.parse_tree(this.data);
        let simplified_feature = "";
        let that = this;

        $.ajax({
            url: "/api/data-mining/simplify-feature-expression",
            type: "POST",
            data: {
                    problem: that.metadata.problem,
                    expression: feature,
                  },
            async: false,
            success: function (data, textStatus, jqXHR)
            {
                simplified_feature = data;
                that.update_feature_application("direct-update", simplified_feature);
            },
            error: function (jqXHR, textStatus, errorThrown)
            {alert("error");}
        });
    }

    convert_to_DNF(){

        let feature = this.parse_tree(this.data);
        let DNF_expression = "";
        let that = this;

        $.ajax({
            url: "/api/data-mining/convert-to-DNF",
            type: "POST",
            data: {
                    expression: feature,
                  },
            async: false,
            success: function (data, textStatus, jqXHR)
            {
                DNF_expression = data;
                that.update_feature_application("direct-update", DNF_expression);
            },
            error: function (jqXHR, textStatus, errorThrown)
            {alert("error");}
        });
    }

    compute_algebraic_complexity(feature){

        if(!feature){
            feature = this.parse_tree(this.data);
        }
        let complexity = "";

        $.ajax({
            url: "/api/data-mining/compute-complexity",
            type: "POST",
            data: {
                    expression: feature,
                  },
            async: false,
            success: function (data, textStatus, jqXHR)
            {
                complexity = data;
            },
            error: function (jqXHR, textStatus, errorThrown)
            {alert("error");}
        });    
    }

    compute_algebraic_typicality(input, feature){

        if(!feature){
            feature = this.parse_tree(this.data);
        }
        let complexity = "";
        
        $.ajax({
            url: "/api/data-mining/compute-typicality",
            type: "POST",
            data: {
                    input: JSON.stringify(input),
                    expression: feature,
                  },
            async: false,
            success: function (data, textStatus, jqXHR)
            {
                let typicality = data;
            },
            error: function (jqXHR, textStatus, errorThrown)
            {alert("error");}
        });    
    }

    shuffle_branch_order(root){

        let update = false;
        if(!root){
            root = this.data;
            update = true;
        }        
        let children = root.children;

        if(children){
            shuffle(children);

            for(let i = 0; i < children.length; i++){
                this.shuffle_branch_order(children[i]);
            }
        }

        if(update){
            this.update();
        }
    }

    get_node_color(node){
        if(node.data.deactivated){
            return this.color.deactivated;

        }else if(node.data.temp){
            if(typeof node.data.matched === "undefined" || node.data.matched === null){
                return this.color.temp;
            }else{
                if(node.data.matched){
                    return this.color.tempMatched;
                }else{
                    return this.color.tempUnmatched;
                }
            }

        } else if(node.data.unsatisfied){
            return this.color.unsatisfied;

        }else if(node.data.highlighted){
            return this.color.highlighted;

        }else{
            if(node.data.type === "logic"){
                if(node.data.add){
                    return this.color.add;

                }else if(node.data.name === "IF_THEN"){
                    return this.color.ifThen;

                }else {
                    return this.color.logic;
                }
            }else{
                return this.color.default;
            }
        }
    }
}

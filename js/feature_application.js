
class FeatureApplication{

    constructor(DataMiningScheme, filteringScheme, labelingScheme){

        this.filter = filteringScheme;
        this.label = labelingScheme;
        this.data_mining = DataMiningScheme;

        this.data = [];
        
        this.color = {"default":"#616161",
                     "logic":"#2383FF",
                     "add":"#FF7979",
                     "deactivated":"#E3E3E3",
                     "temp":"#C6F3B6"};
        
        this.stashed_root = null;
        this.stashed_node_ids = null;

        this.tree = null;
        this.data = null; 
        this.root = null;
        this.i = 0;

        // top  right bottem left
        this.margin = {left:70,right:20,top:10,bottom:20},
        this.width = 1200 - this.margin.left - this.margin.right,
        this.height = 800 - this.margin.top - this.margin.bottom;


        this.draggingNode = null;
        this.selectedNode = null;
        this.dragStarted = false;
        this.contextMenu = null;  
        
	   	// this.dragListener = d3.drag()
	    //     .on('start', (d) => { this.dragStart(d); })
	    //     .on('drag', (d) => { this.drag(d); })
	    //     .on('end', (d) => { this.dragEnd(d); });

        
//    PubSub.subscribe(CANCEL_ADD_FEATURE, (msg, data) => {
//        
//        self.visit_nodes(self.root, function(d){
//            // Find the node to which to add new features
//            if(d.add){
//                d.add=false;
//                return d;
//            }     
//        });
//        self.update(); 
//    }); 
//    

        PubSub.subscribe(INITIALIZE_FEATURE_APPLICATION, (msg, data) => {
            this.clear_feature_application()
        });   

        PubSub.subscribe(UPDATE_FEATURE_APPLICATION, (msg, data) => {
            this.update_feature_application(data.option, data.expression);
        });       
   
        // Remove all features
        d3.select('#clear_all_features').on('click', (d) => { 
            this.clear_feature_application(); 
        }); 

        d3.select('#conjunctive_local_search').on('click', (d) => {
            this.data_mining.run();
        }); 
       
        d3.select('#disjunctive_local_search').on('click',(d) => {
            this.data_mining.run("asdf");
        }); 

		PubSub.publish(FEATURE_APPLICATION_LOADED, this);
    }
    
    draw_feature_application_tree(expression){

        let margin = this.margin;
        let width = this.width;
        let height = this.height;
        
        this.tree = d3.tree().size([height, width]);

        d3.select('#feature_application_panel').select('#feature_application').select('svg').remove();

        let svg = d3.select('#feature_application_panel').select('#feature_application')
                    .append('svg')
                    .attr('width', width + margin.left + margin.right)
                    .attr('height', height + margin.bottom + margin.top)
                    .append('g')
                    .attr('transform','translate('+ margin.left + "," + margin.top + ")");

        this.i = 0;
        this.data = this.construct_tree(this, expression);  
                                
        this.visit_nodes(this.data, (d) => {
            d.temp = true;
        });

        this.update();  
    }
    

    update(featureMargin){

        // Check the tree structure and make sure that it is correct
        this.check_tree_structure();
                
        if(this.data === null){
            d3.selectAll('.treeNode').remove();
            d3.selectAll('.treeLink').remove();
            this.i = 0;
            PubSub.publish(APPLY_FEATURE_EXPRESSION, null);
            return;
        }    

        if(!featureMargin){
            featureMargin = 180;
        }

        let that = this;   
                
        // Apply the feature expression
        PubSub.publish(APPLY_FEATURE_EXPRESSION, this.parse_tree(this.data));
        
        let duration = d3.event && d3.event.altKey ? 5000 : 600;
        let margin = this.margin;

        let root = d3.hierarchy(this.data, function(d) { return d.children; }); 

        // Root node
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
            d.y = d.depth * featureMargin;
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
            .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
            .attr("dy", ".40em")
            .style("font-size","14px")
            .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
            .style("fill-opacity", 1e-6);
        
        nodeEnter.filter((d) => {
                if(d.data.type === "leaf"){
                    return false;
                }else{
                    return true;
                };
            })
            .append('circle')
            .attr('class','nodeRange')
            .attr('r',40)
            .attr('opacity',0)
            .style('fill','red');
        
        // Transition nodes to their new position.
        let nodeUpdate = nodeEnter.merge(node);
        
        nodeUpdate.transition()
            .duration(duration)
            .attr("transform", (d) => { 

                if(d.parent){         
                    if(d.verticalOffset){
                        // pass

                    }else{
                        // Adjust the vertical location of each node so that it doesn't overlap with other nodes
                        let offset = 28;
                        let sibling = d.parent.children;
                        let depth = d.depth;

                        if(sibling.length % 2 === 1 && depth % 2 === 0){
                            // When the number of children is odd, add offset to the vertical position
                            let index = sibling.indexOf(d);
                            let mid = (sibling.length - 1) / 2;
                            if(index === mid){
                                // Do nothing, as this one is in the middle
                            }else if(index < mid){
                                d.x = d.x - offset;
                            }else{
                                d.x = d.x + offset;
                            }

                            d.verticalOffset = true;
                        }
                    }
                }
                return "translate(" + d.y+ "," + d.x + ")";  
            })
            .style('opacity', 1.0);
        
        nodeUpdate.select("circle")
            .attr("r", 9.5)
            .style("fill", function(d) { 
                if(d.data.deactivated){
                    return that.color.deactivated;

                }else if(d.data.temp){
                    return that.color.temp;

                }else{
                    if(d.data.type === "logic"){
                        if(d.data.add){
                            return that.color.add;
                        
                        }else{
                            return that.color.logic;
                        }
                    }else{
                        return that.color.default;
                    }
                }
             });

        nodeUpdate.select("text")
            .attr("x",function(d){
                if(d.children){ return -10; }
                else{ return 10; }
            })
            .attr("text-anchor", function(d) { 
                if(d.children){ return "end"; }
                else{ return "start"; }
            })
            .text(function(d) {
                return that.label.pp_feature_single(d.data.name);
            })
            .style("fill",function(d){
                if(d.data.type=="logic" && d.data.add){
                    return that.color.add;
                }else{
                    return "black";
                }
            })
            .style("font-size",23)
            .style("fill-opacity", 1);  

        d3.selectAll('.nodeRange')
            .attr('pointer-events','mouseover')
            .on('mouseover',function(d){
                that.selectedNode = that.select_treeNode_by_id(d.id).node().__data__;
            })
            .on('mouseout',function(d){
                that.selectedNode = null;
            });

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

        // Update the links…
        let link = svg.selectAll("path.treeLink")
            .data(links, function(d){
            	return d.id;
            });

        // Enter any new links at the parent's previous position.
        let linkEnter = link.enter().insert("path", "g")
            .attr("class", "treeLink")
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
            .style('fill','none');
        
        var linkUpdate = linkEnter.merge(link);
        
        linkUpdate.transition()
            .duration(duration)
            .attr('d', function(d){ return that.diagonal(d, d.parent) })
            .style("stroke",function(d){
                if(d.data.deactivated){
                    return that.color.deactivated;
                }else if(d.data.temp){
                    return that.color.temp; 
                }else{
                    return that.color.default;
                }
            })
            .style('opacity', 1.0);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr('d', function(d) {
	        	var o = {x: d.parent.x, y: d.parent.y}
	        	return that.diagonal(o, o)
	      	})
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });    

      //   d3.selectAll('.treeNode')
   			// .call(this.dragListener);

        // d3.selectAll('.treeNode')
        //     .on('contextmenu', (d) => { 
            
        //         d3.event.preventDefault();
        //         var context = d.type;
        //         let mouse_pos = d3.mouse(d3.select("#feature_application_panel").select('svg').select('g').node());
        //         let mouseX = mouse_pos[0]; 
        //         let mouseY = mouse_pos[1];                       
           
        //         if(!this.contextMenu){
        //             this.contextMenu = new ContextMenu(this);
        //         }
               
        //         this.contextMenu.showMenu(d.data, mouse_pos);
        //     });
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

        // Remove the link to the parent node
        d3.selectAll('.treeLink').filter((d) => {
            if(d.id === id){
                return true;
            }else{
                return false;
            }        
        })
        .attr('d', (d) => {
            let o = {x: d.parent.x, y: d.parent.y}
            return this.diagonal(o, o)
        })
        .style('opcaity',0);

        d3.selectAll('.nodeRange').filter((d) => {
            if(d.type === 'leaf'){
                return false;
            }else{
                // You can only add new nodes to logic nodes
                return true;
            }
        }).style('opacity',0.2);

        this.select_treeNode_by_id(id).attr('pointer-events','none');

        if(d.data.type === "leaf"){
            return;
        }else{
            // Hide all descendant nodes and links
            this.remove_descendants(id);
        }
    }


    drag(d){
        if(this.dragStarted){    

	        let mouse_pos = d3.mouse(d3.select("#feature_application_panel").select('svg').select('g').node());
	        let mouseX = mouse_pos[0]; 
	        let mouseY = mouse_pos[1];        

            this.select_treeNode_by_id(d.id).attr("transform","translate("+ mouseX + "," + mouseY + ")");
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
            }else{
                // No node selected (all nodes go back to the previous positions)
            }

            this.update();
            
            PubSub.publish(ADD_FEATURE, this.parse_tree(this.data));
            //this.update_feature_expression(this.parse_tree(this.data));            
            //ifeed.data_mining.draw_venn_diagram();  

            this.dragStarted = false;
            this.draggingNode = null;
        }
    }


    check_tree_structure(){
        // Checks and ensures that the tree structure is correct

        if(this.data === null){
            return;
        }   

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

        this.visit_nodes(this.data, update_parent_info);
        this.visit_nodes(this.data, update_depth_info);

        this.visit_nodes(this.data, delete_logic_node_without_children);
        this.visit_nodes(this.data, remove_redundant_logical_connectives);
        this.visit_nodes(this.data, remove_redundant_features); 

        this.visit_nodes(this.data, update_parent_info);
        this.visit_nodes(this.data, update_depth_info);        
    }

 
    visit_nodes(source,func,reverse){

        if(source === null){
            return;
        }

        function recursive(source, func, reverse){
            let re;
            if(typeof func != 'undefined'){
                re = func(source);
                // If func is a function that returns something, stop traversing tree and return. Otherwise, apply func and keep traversing the tree
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
                        for(var i=0;i<source.children.length;i++){
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
        
        var get_node_to_add_features = function(d){
            // Find the node to which to add new features
            if(d.add){
                return d;
            }else{
                return null;
            }
        }

        let direct_update = false;
        
        if(option=='direct-update'){ // Make the direct update to the feature application status
            option='temp';
            direct_update = true;
        }
        
        let that = this;
                
        if(option === 'temp'){
            // Mouseover on the feature plot

            let parentNode = null;
            
            if(this.data){
                // There already exists a tree: Find the node to add new features and append children temporarily
                parentNode = this.visit_nodes(this.data, get_node_to_add_features)

                if(parentNode){
                    // parentNode exists

                    // Stash the currently existing node ID's
                    this.stashed_node_ids = this.get_node_ids(this.data,[]);

                    // Construct a subtree and append it as a child to the parent node
                    let subtree = this.construct_tree(this, expression, parentNode.depth+1);
                    
                    if(!direct_update){
                        this.visit_nodes(subtree,function(d){
                            d.temp = true;
                        })                        
                    }

                    // Add to the parent node
                    parentNode.children.push(subtree); 
                    subtree.parent = parentNode;
                    
                    this.update();  
                }else{ 
                    // No parentNode

                    // Stash the current root 
                    this.stashed_root = this.construct_tree(this, this.parse_tree(this.data));  

                    // Re-draw the whole tree
                    this.draw_feature_application_tree(expression);
                }

            }else{
                // There is no tree. Build a new one
                this.stashed_node_ids = [];
                this.stashed_root = {};
                this.draw_feature_application_tree(expression)
            }
            
            
            if(direct_update){ // Make a direct update to the feature application status; not temporary

                // Remove the stashed information                
                this.stashed_node_ids = null;
                this.stashed_root = null;    

                this.visit_nodes(this.data, (d) => {
                    d.temp = false;
                })

                this.update();
                
                PubSub.publish(ADD_FEATURE, this.parse_tree(this.data));
                //PubSub.publish(CANCEL_ADD_FEATURE, null);
            }
            

        }else if(option=='restore'){
            // Restore the stashed tree

            // If there is no stashed root
            if(this.stashed_root != null && this.stashed_node_ids != null){ 

                if(jQuery.isEmptyObject(this.stashed_root) && this.stashed_node_ids.length === 0){
                    // There was no tree before
                    this.data = null;
                }

            }else if(this.stashed_root != null){
                
                // The whole tree is stashed
                this.data = this.stashed_root;  

            }else if(this.stashed_node_ids != null){
                // Tree has been modified by the temporary update
                // Visit each node, and if stashed_node_id.indexOf(nodeID) === -1, remove the index        

                let parentNode = null;
                let indices = []; // Indices of the nodes to be removed from the parent node

                this.visit_nodes(this.data, (d) => {  

                    if(d.children){
                        for(let i = 0; i < d.children.length; i++){
                            if(this.stashed_node_ids.indexOf(d.children[i].id) === -1){
                                parentNode = d;
                                let index = d.children.indexOf(d.children[i]);
                                indices.push(index);
                            }
                        }

                        indices.reverse();
                        for(let i = 0; i < indices.length; i++){
                            parentNode.children.splice(indices[i],1);
                        }
                    }
                });

            }else{
                // Both are null: No stashed information
                // Do nothing
            }

            if(this.data){
                this.visit_nodes(this.data,function(d){
                    d.temp=false;
                })
            }

            this.update();

            this.stashed_root = null;
            this.stashed_node_ids=null;


        }else if(option=='update'){

            this.stashed_node_ids = null;
            this.stashed_root = null;
            this.visit_nodes(this.data, (d) => {
                d.temp = false;
            })
            
            PubSub.publish(ADD_FEATURE, this.parse_tree(this.data));
            //PubSub.publish(CANCEL_ADD_FEATURE, null);
        }
        

        //this.update_feature_expression(this.parse_tree(this.data));
        //ifeed.data_mining.draw_venn_diagram();   
    }
    
    get_node_ids(source,IDList){

        if(!source){
            return [];
        }

        var id = source.id;
        if(IDList.indexOf(id)==-1){
           IDList.push(id);
        }
        var children = source.children;
        if(children){
            for(var i=0;i<children.length;i++){
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

        d3.selectAll('.treeLink').filter((d) => {
            if (descendantNodesID.indexOf(d.id) != -1){
                return true;
            }else{
                return false;
            }
        })
        .attr('d', (d) => {
            let o = {x: parentNode.x, y: parentNode.y}
            return this.diagonal(o, o)
        })
        .style('opacity', 0);

        d3.selectAll('.treeNode').filter((d) => {
            if(d.id === nodeID){
                return false;
            }else if(descendantNodesID.indexOf(d.id) != -1){
                return true;
            }else{
                return false;
            }
        })
        .attr('transform','translate('+ parentNode.y + "," + parentNode.x + ")")
        .style('opacity', 0);
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
        d = +parentheses_removed.level;

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

        while(true){

            let temp=null;
            let _temp=null;

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

            if(_e.indexOf(logic)==-1){
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
                                activated=true;
                            }
                        }
                        if(!activated){
                            node.deactivated=true;
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

            }else if(root.type=="leaf"){
                // If the current node is a leaf node

                if(deactivated(root)){
                    expression="";
                    
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

            }else if(root.type === "logic" && (deactivated(root) || !root.children)){
                // Current node is a logic node but its children are either all emtpy or deactivated
                expression = "";

            }else{
                // Current node is a logical node and is not deactivated
                expression = "";

                for(let i = 0; i < root.children.length; i++){

                    let child = root.children[i];
                    let logic = null;

                    if(root.name === "AND"){
                        logic = "&&";
                    }else{
                        logic = "||";
                    }

                    let new_expression = _parse_tree(child,placeholderNode);

                    if(expression != "" && new_expression != ""){
                        expression = expression + logic;
                    }
                    expression = expression + new_expression;    
                }

                if(expression!=""){
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
                let o = null;
                o = {x: that.selectedNode.x0, y: that.selectedNode.y0};
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
    
    clear_feature_application(){
        this.data = null;
        this.update();
        this.update_feature_expression(null);
        
        PubSub.publish(ADD_FEATURE, null);
        //ifeed.data_mining.draw_venn_diagram(); 
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
                console.log(data);
                CNF_expression = data;
                that.update_feature_application("direct-update", CNF_expression);
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
                console.log(data);
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
                console.log(data);
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
                console.log(data);
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

}

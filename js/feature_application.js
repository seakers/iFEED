
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
        this.i=0;

        this.last_modified_tree_node = null;

        // top  right bottem left
        this.margin = {left:70,right:20,top:10,bottom:20},
        this.width = 1000 - this.margin.left - this.margin.right,
        this.height = 800 - this.margin.top - this.margin.bottom;


        this.draggingNode = null;
        this.selectedNode = null;
        this.dragStarted = false;
        this.contextMenu = null;  
        
	   	this.dragListener = d3.drag()
	        .on('start', (d) => { this.dragStart(d); })
	        .on('drag', (d) => { this.drag(d); })
	        .on('end', (d) => { this.dragEnd(d); });

        
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
//    
        PubSub.subscribe(INITIALIZE_FEATURE_APPLICATION, (msg, data) => {
            this.clear_feature_application()
        });   

        PubSub.subscribe(UPDATE_FEATURE_APPLICATION, (msg, data) => {
            this.update_feature_application(data.option,data.expression);
        });       
   
        // Remove all features
        d3.select('#clear_all_features').on('click', (d) => { this.clear_feature_application(); }); 

        d3.select('#conjunctive_local_search').on('click', (d) => {
            this.data_mining.run();
        }); 
       
        d3.select('#disjunctive_local_search').on('click',(d) => {
            this.data_mining.run("asdf");
        }); 

		PubSub.publish(FEATURE_APPLICATION_LOADED, this);
    }
    

    
    draw_feature_application_tree(expression){

        var margin = this.margin;
        var width = this.width;
        var height = this.height;
        
        this.tree = d3.tree().size([height, width]);

        d3.select('#feature_application_panel').select('#feature_application').select('svg').remove();

        var svg = d3.select('#feature_application_panel').select('#feature_application')
                    .append('svg')
                    .attr('width',width + margin.left + margin.right)
                    .attr('height',height + margin.bottom + margin.top)
                    .append('g')
                    .attr('transform','translate('+ margin.left + "," + margin.top + ")");

        this.i = 0;
        
        this.data = this.construct_tree(expression);         
                
        let that = this;
        
        this.visit_nodes(this.data, (d) => {
            d.temp = true;
            d.id = this.i++;
        });

        this.update();  
    }
    
    
    update(){
                
        if(this.data === null){
            d3.selectAll('.treeNode').remove();
            d3.selectAll('.treeLink').remove();
            
            PubSub.publish(APPLY_FEATURE_EXPRESSION, null);
            return;
        }    
        
        this.check_tree_structure();
                
        PubSub.publish(APPLY_FEATURE_EXPRESSION, this.parse_tree(this.data));

        
        let duration = d3.event && d3.event.altKey ? 5000 : 500;
        let margin = this.margin;
        
        let root = d3.hierarchy(this.data, function(d) { return d.children; });  

        root.x0 = this.height / 2;
        root.y0 = 0;           
        
        let treeStructure = this.tree(root);

        // Compute the new tree layout.
        let nodes = treeStructure.descendants();
        let links = treeStructure.descendants().slice(1);
        
        // Normalize for fixed-depth.
        nodes.forEach(function(d) { d.y = d.depth * 180; });
        
        let svg = d3.select('#feature_application_panel')
                        .select('svg').select('g');
                        
        let that = this;                

        // Update the nodes…
        let node = svg.selectAll("g.treeNode")
                        .data(nodes, function(d) {return d.id || (d.id = d.data.id); });
        
        // Enter any new nodes at the parent's previous position.
        let nodeEnter = node.enter()
            .append("g")
            .attr("class", "treeNode")
            .attr("transform", function(d) { 
                if(d.depth === 0) {
                    return "translate(" + d.y0 + "," + d.x0 + ")";
                } else {
                    if(!d.parent.x0){
                        //console.log(d);
                    }else{
                        return "translate(" + d.parent.y0+ "," + d.parent.x0 + ")";
                    }
                }
            });

        nodeEnter.append("circle")
            .attr("r", 1e-6);

        nodeEnter.append("svg:text")
            .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
            .attr("dy", ".40em")
            .style("font-size","14px")
            .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
            //.text(function(d){d.name})
            .style("fill-opacity", 1e-6);
        
        nodeEnter.filter(function(d){
                if(d.data.type=="leaf"){return false};
                return true;
            })
            .append('circle')
            .attr('class','nodeRange')
            .attr('r',40)
            .attr('opacity',0)
            .style('fill','red')
            .attr('pointer-events','mouseover')
            .on('mouseover',function(d){
                that.selectedNode = d;  
            })
            .on('mouseout',function(d){
                that.selectedNode = null;
            });
        
        // Transition nodes to their new position.
        var nodeUpdate = nodeEnter.merge(node);
        
        nodeUpdate.transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + d.y+ "," + d.x + ")"; });
        
        nodeUpdate.select("circle")
            .attr("r", 9.5)
            .style("fill", function(d) { 
                if(d.data.deactivated){
                    return that.color.deactivated;
                }else if(d.data.temp){
                    return that.color.temp;
                }else{
                     if(d.data.type=="logic"){
                         if(d.data.add){
                             return that.color.add;
                         }
                         else{
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

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) { 
                if(d.depth==0) return "translate(" + d.y + "," + d.x + ")";
                else return "translate(" + d.parent.y + "," + d.parent.x + ")";                
            })
            .remove();          

        nodeExit.select("circle")
            .attr("r", 1e-6);

        nodeExit.select("text")
            .style("fill-opacity", 1e-6);

        // Update the links…
        var link = svg.selectAll("path.treeLink")
            .data(links, function(d){
            	return d.id;
            });

        // Enter any new links at the parent's previous position.
        let linkEnter = link.enter().insert("path", "g")
            .attr("class", "treeLink")
            .attr('d', function(d){
        		var o = {x: root.x0, y: root.y0}
        		return that.diagonal(o, o)
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
            });

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
            if(d.id==that.i-1){
                that.last_modified_tree_node=d;
            }
        });    

        d3.selectAll('.treeNode')
   			.call(this.dragListener);

        d3.selectAll('.treeNode')
            .on('contextmenu', (d) => { 
            
                d3.event.preventDefault();
                var context = d.type;
                let mouse_pos = d3.mouse(d3.select("#feature_application_panel").select('svg').select('g').node());
                let mouseX = mouse_pos[0]; 
                let mouseY = mouse_pos[1];                       
           
                if(!this.contextMenu){
                    this.contextMenu = new ContextMenu(this);
                }
               
                this.contextMenu.showMenu(d.data, mouse_pos);
            });

        //self.update_feature_expression(self.parse_tree(self.root));
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
        d3.selectAll('.treeLink').filter(function(d){
            if(d.id === id){
                return true;
            }else{
                return false;
            }        
        }).remove();

        d3.selectAll('.nodeRange').filter(function(d){
            if(d.type === 'leaf'){
                return false;
            }else{
                return true;
            }
        }).style('opacity',0.2);

        this.select_treeNode_by_id(id).attr('pointer-events','none');

        if(d.data.type=="leaf"){
            return;
        }else{
            // Remove all descendant nodes and links
            this.remove_descendants(id);
        }
    }


    drag(d){
        if(this.dragStarted){    
	        let mouse_pos = d3.mouse(d3.select("#feature_application_panel").select('svg').select('g').node());
	        let mouseX = mouse_pos[0]; 
	        let mouseY = mouse_pos[1];        

            var node = this.select_treeNode_by_id(d.id);
            node.attr("transform","translate("+ mouseX + "," + mouseY + ")");

            this.updateTempConnector(node, mouseX, mouseY);            
        }

    }

    dragEnd(d){

    	let id = d.id;

        if(this.dragStarted){

            d3.selectAll('.nodeRange')
                .style('opacity',0);

            this.select_treeNode_by_id(id).attr('pointer-events','');

            d3.selectAll(".tempTreeLink").remove();  

            if(this.selectedNode){

                // Remove the element from the parent, and insert it into the new elements children
                var index = this.draggingNode.parent.children.indexOf(this.draggingNode);
                if (index > -1) {
                    this.draggingNode.parent.children.splice(index, 1);
                }
                if (typeof this.selectedNode.children !== 'undefined') {
                    this.selectedNode.children.push(this.draggingNode);
                } else {
                    this.selectedNode.children = [];
                    this.selectedNode.children.push(this.draggingNode);
                }
            }else{
            	//console.log('selectedNode undefined');            
            }

            this.update();
            
            //PubSub.publish(ADD_FEATURE, this.parse_tree(this.data));
            //this.update_feature_expression(this.parse_tree(this.data));            
            //ifeed.data_mining.draw_venn_diagram();  

            this.dragStarted= false;
            this.draggingNode=null;

        }
    }


    check_tree_structure(){

        if(this.data === null){
            return;
        }   

        let delete_logic_node_without_children = function(node){

            if(!node){
                return;
            }else if(!node.children && node.type=='logic'){

                if(node.depth==0){ // The root node is a logical connective but has no children
                    self.root=null;
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

        let remove_redundant_logical_connectives = function(node){

            if(!node){
                return;      
                
            }else if(node.type === "logic" && node.parent){
                
                if(node.name === node.parent.name){

                    let children = node.children;
                    let parent = node.parent;
                    let index = parent.children.indexOf(node);

                    node.parent.children.splice(index,1);

                    for(let i = 0; i < children.length; i++){
                        parent.children.splice(index,0,children[i]);
                    }
                }
            }
        }

        let remove_redundant_features = function(node){

            if(!node){
                return;
            }else if(node.type=="logic" && node.children){

                var list_of_features = [];
                var indices_to_delete = [];
                var children = node.children;

                for(var i=0;i<children.length;i++){

                    if(children[i].type=="logic"){
                       continue;
                    }

                    var this_feature = children[i];

                    if(list_of_features.indexOf(this_feature.name)==-1){
                        list_of_features.push(this_feature.name);                    
                    }else{
                        indices_to_delete.push(i);
                    }
                }

                indices_to_delete.reverse();

                for(var j=0;j<indices_to_delete.length;j++){
                    node.children.splice(indices_to_delete[j],1);
                }

            }

        }

        this.visit_nodes(this.data, delete_logic_node_without_children);
        this.visit_nodes(this.data, remove_redundant_logical_connectives);
        this.visit_nodes(this.data, remove_redundant_features); 
        
    }

 
    visit_nodes(source,func,reverse){

        function recursive(source, func, reverse){
            var re;
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
    
    update_feature_application(option,expression){
        
        var get_node_to_add_features = function(d){
            // Find the node to which to add new features
            if(d.add){
                return d;
            }else{
                return null;
            }
        }

        var direct_update = false;
        
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
                    let subtree = this.construct_tree(expression,parentNode.depth+1);
                    
                    if(!direct_update){
                        this.visit_nodes(subtree,function(d){
                            d.temp=true;
                            d.id = that.i++;
                        })                        
                    }

                    // Add to the parent node
                    parentNode.children.push(subtree); 
                    subtree.parent = parentNode;
                    
                    this.update();  
                }else{    
                    // No parentNode

                    // Stash the current root 
                    this.stashed_root = this.construct_tree(this.parse_tree(this.data));  

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
                
                //PubSub.publish(ADD_FEATURE, self.parse_tree(self.root));
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
            this.visit_nodes(this.data,function(d){
                d.temp=false;
            })
            
//            PubSub.publish(ADD_FEATURE, self.parse_tree(self.root));
//            PubSub.publish(CANCEL_ADD_FEATURE, null);
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

        let descendantNodesID = [];

        d3.selectAll('.treeLink').filter(function(d){
            if (d.parent.id === nodeID){
                descendantNodesID.push(d.id);
                return true; // remove
            }
            else if(descendantNodesID.indexOf(d.parent.id) != -1){
                descendantNodesID.push(d.id);
                return true;
            }else{
                return false;
            }
        }).remove();

        if(descendantNodesID.length === 0){
            return;
        }

        d3.selectAll('.treeLink').filter((d) =>{
            if (d.parent.id === nodeID){
                descendantNodesID.push(d.id);
                return true; // remove
            }
            else if(descendantNodesID.indexOf(d.parent.id) != -1){
                descendantNodesID.push(d.id);
                return true;
            }else{
                return false;
            }
        }).remove();

        d3.selectAll('.treeNode').filter((d) => {
            if(descendantNodesID.indexOf(d.id) != -1){
                return true;
            }else{
                return false;
            }
        }).remove();



        // d3.selectAll('.treeNode')[0].forEach((d) => {

        //     if(descendantNodesID.indexOf(d.id) != -1){
        //         d3.select(d).remove();
        //         self.remove_descendants(id);
        //     }
        // });
    }

    construct_tree(expression, depth){

        if(depth==null){
           depth = 0;
        }

        if(expression==null){
            return {};
        }

        var d=depth;
        var e=expression;
        var _e = null;

        // Remove outer parenthesis
        var parentheses_removed = remove_outer_parentheses(e,d);
        e = parentheses_removed.expression;
        d = +parentheses_removed.level;

        if(get_nested_parenthesis_depth(e)==0){ // Given expression does not have a nested structure

            if(e.indexOf("&&") == -1 && e.indexOf("||") == -1){
                // There is no logical connective: return single feature (leaf node)
                return {depth:d,type:"leaf",name:e,children:null};
            }else{
                // There are logical connectives
                _e = e;
            }

        }else{
            // Hide the nested structure by replacing whatever's inside parentheses with special characters (currently using X's).
            _e = collapse_paren_into_symbol(e);
        }    

        var first = true;
        var logic = null;
        var thisNode = null;

        while(true){

            var temp=null;
            var _temp=null;

            if(first){

                // The first filter in a series to be applied
                first = false;
                var name = null;

                if (_e.indexOf("&&") != -1){
                    logic = "&&";
                    name="AND";
                }else{
                    logic = "||";
                    name="OR";
                }            
                thisNode = {depth:d,type:"logic",name:name,children:[], parent:null};

            }else{
                _e = _e.substring(2);
                e = e.substring(2);
            }

            if(_e.indexOf(logic)==-1){
                // Last element in the list
                var child = this.construct_tree(e,d+1);
                thisNode.children.push(child);
                child.parent = thisNode;
                break;
            }else{
                // Not last

                // Get the current feature expression
                _temp = _e.split(logic,1)[0];
                temp = e.substring(0,_temp.length);

                // Add the child to the current node
                var child = this.construct_tree(temp,d+1);
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

        function deactivated(node){
            // Check if all of the children nodes have been deactivated. If so, then the current node is also deactivated
            if(node.deactivated){
                return true;
                
            }else{
                if(node.children){

                    var children = node.children;
                    var activated = false;
                    for(var i=0;i<children.length;i++){
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

        var expression = null;

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
                    if(placeholderNode==root.parent && root.parent.children.indexOf(root)==0){ 
                        // If the current node is the first child of the placeholderNode
                        
                        if(root.parent.name=="AND"){
                            expression="{PLACEHOLDER}&&"+root.name;
                        }else{
                            expression="{PLACEHOLDER}||"+root.name;
                        }                        
                                                
                    }else if(placeholderNode==root){ // If the current node is the placeholderNode itself
                        
                        if(root.parent.name=="AND"){
                            // When a leaf node is set as a placeholderNode, change the logical connective
                            expression="({PLACEHOLDER}||"+root.name + ")";
                        }else{
                            expression="({PLACEHOLDER}&&"+root.name + ")";
                        } 
                        
                    }else{
                        // If the current node has nothing to do with the placeholder
                        expression=root.name;
                    }
                }else{
                    // If there is no placeholder, simply return its name
                    expression=root.name;
                }
            }

        }else if(root.type=="logic" && (deactivated(root) || !root.children)){
            // Current node is a logic node but its children are either all emtpy or deactivated
            expression="";

        }else{
            // Current node is a logical node and is not deactivated
            expression = "";

            for(var i=0;i<root.children.length;i++){

                var child = root.children[i];
                var logic = null;

                if(root.name=="AND"){
                    logic="&&";
                }else{
                    logic="||";
                }

                var new_expression = this.parse_tree(child,placeholderNode);

                if(expression!="" && new_expression!=""){
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
  
    updateTempConnector(node, xCoord, yCoord){

    	let that = this;
        let data = [];

        if (this.draggingNode !== null && this.selectedNode !== null) {
        	node = node.node().__data__;
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
            .attr("d", function(d) {
        		return that.diagonal(d,d.parent);
            })
            .attr('pointer-events', 'none')
            .style('fill','none')
            .style('stroke','red')
            .style('stroke-width','3px');

        link.exit().remove();
    }

	update_feature_expression(expression){

	    let logic_color = "#FF9500";
	    let bracket_color = "#FF0000";

		if(expression==null){
	       expression=="";

      	}else if(expression != ""){

       		expression = ifeed.label.pp_feature(expression);
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
        
        //PubSub.publish(ADD_FEATURE, null);
        //ifeed.data_mining.draw_venn_diagram(); 
    }
    
    diagonal(s, d) {
        let path = `M ${s.y} ${s.x}
                C ${(s.y + d.y) / 2} ${s.x},
                  ${(s.y + d.y) / 2} ${d.x},
                  ${d.y} ${d.x}`;
        return path;
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
}

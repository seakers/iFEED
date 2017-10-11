

function FeatureApplication(ifeed){
    
    var self = this;
    
    
    self.color = {"default":"#616161",
                 "logic":"#2383FF",
                 "add":"#FF7979",
                 "deactivated":"#E3E3E3",
                 "temp":"#C6F3B6"}
    

    self.stashed_root = null;
    self.stashed_node_ids = null;
    
    self.root = null; 
    self.tree = null;
    self.i_tree=0;
    self.diagonal = d3.svg.diagonal()
                        .projection(function(d) { return [d.y, d.x]; });

    self.last_modified_tree_node = null;
    
    // top  right bottem left
    self.margin = {left:70,right:20,top:20,bottom:20},
    self.width = 800 - self.margin.left - self.margin.right,
    self.height = 780 - self.margin.top - self.margin.bottom;
    
    
    self.draggingNode = null;
    self.selectedNode = null;
    
    self.dragStarted = false;
    
    self.contextMenu = null;
    
    
    self.draw_feature_application_tree = function(expression){

        var margin = self.margin;
        var width = self.width;
        var height = self.height;
        
        self.tree = d3.layout.tree().size([height, width]);

        d3.select('#feature_application').select('svg').remove();

        var svg = d3.select('#feature_application')
                    .append('svg')
                    .attr('width',width + margin.left + margin.right)
                    .attr('height',height + margin.bottom + margin.top)
                    .append('g')
                    .attr('transform','translate('+ margin.left + "," + margin.top + ")");

        self.i_tree=0;

        self.root = self.construct_tree(expression);
        self.root.x0 = height / 2;
        self.root.y0 = 0;    

        self.visit_nodes(self.root,function(d){
            d.temp=true;
        });

        self.update(self.root);  
    }
    
    
    self.dragStart = function(d){

        if(d==self.root){return;}
        if(d3.event.sourceEvent.which != 1){return;}

        self.dragStarted=true;    

        d3.event.sourceEvent.stopPropagation();

        var id = d.id;
        self.draggingNode=d;

        // Remove the link to the parent node
        d3.selectAll('.treeLink').filter(function(d){
            if(d.target.id == id){
                return true;
            }else{
                return false;
            }        
        }).remove();

        d3.selectAll('.nodeRange').filter(function(d){
            if(d.type=='leaf'){
                return false;
            }else{
                return true;
            }
        }).style('opacity',0.2);

        d3.select(this)
                .select('.nodeRange')
                .style('opacity',0);

        d3.select(this).attr('pointer-events','none');

        if(d.type=="leaf"){
            return;
        }else{
            // Remove all descendant nodes and links
            self.remove_descendants(id);
        }

    }


    self.drag = function(d){

        if(self.dragStarted){        
            var coord = d3.mouse($('#feature_application > svg > g').get(0));   

            d.x0 += coord[0];
            d.y0 += coord[1];        

            var node = d3.select(this);
            node.attr("transform","translate("+ coord[0] + "," + coord[1] + ")");

            var target = {};
            target.x = coord[0];
            target.y = coord[1];
            self.updateTempConnector(target);            
        }

    }

    self.dragEnd = function(d){

        if(self.dragStarted){

            d3.selectAll('.nodeRange')
                .style('opacity',0);

            d3.select(this).attr('pointer-events', '');

            d3.selectAll(".tempTreeLink").remove();  


            if(self.selectedNode){

                // Remove the element from the parent, and insert it into the new elements children
                var index = self.draggingNode.parent.children.indexOf(self.draggingNode);
                if (index > -1) {
                    self.draggingNode.parent.children.splice(index, 1);
                }
                if (typeof self.selectedNode.children !== 'undefined') {
                    self.selectedNode.children.push(self.draggingNode);
                } else {
                    self.selectedNode.children = [];
                    self.selectedNode.children.push(self.draggingNode);
                }
            }else{
                //console.log('selectedNode undefined');            
            }

            self.update(self.root);

            self.check_tree_structure();

            ifeed.data_mining.add_feature_to_plot(self.parse_tree(self.root));
            
            self.update_feature_expression(self.parse_tree(self.root));            

            ifeed.data_mining.draw_venn_diagram();  

            self.dragStarted= false;
            self.draggingNode=null;

        }
    }
    
    
    self.dragListener = d3.behavior.drag()
                        .on('dragstart',self.dragStart)
                        .on('drag',self.drag)
                        .on('dragend',self.dragEnd);


    self.update = function(source) {
        
        if(source==null){
            d3.selectAll('.treeNode').remove();
            d3.selectAll('.treeLink').remove();
            return;
        }    

        var duration = d3.event && d3.event.altKey ? 5000 : 500;
        // Compute the new tree layout.
        var nodes = self.tree.nodes(self.root);


        // Normalize for fixed-depth.
        nodes.forEach(function(d) { d.y = d.depth * 140; });
        

        var svg = d3.select('#feature_application')
                        .select('svg').select('g');


        // Update the nodes…
        var node = svg.selectAll("g.treeNode")
                        .data(nodes, function(d) { 
                            return d.id || (d.id = self.i_tree++); 
                        });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("g")
            .attr("class", "treeNode")
            .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; });

        nodeEnter.append("svg:circle")
            .attr("r", 1e-6);

        nodeEnter.append("svg:text")
            .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
            .attr("dy", ".40em")
            .style("font-size","14px")
            .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
            //.text(function(d){d.name})
            .style("fill-opacity", 1e-6);

        nodeEnter.filter(function(d){
                if(d.type=="leaf"){return false};
                return true;
            })
            .append('circle')
            .attr('class','nodeRange')
            .attr('r',40)
            .attr('opacity',0)
            .style('fill','red')
            .attr('pointer-events','mouseover')
            .on('mouseover',function(d){
                self.selectedNode=d;  
            })
            .on('mouseout',function(d){
                self.selectedNode=null;
            })

        
        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
            .remove();

        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

        nodeExit.select("circle")
            .attr("r", 1e-6);

        nodeExit.select("text")
            .style("fill-opacity", 1e-6);


        nodeUpdate.select("circle")
            .attr("r", 9.5)
            .style("fill", function(d) { 
                if(d.deactivated){
                    return self.color.deactivated;
                }else if(d.temp){
                    return self.color.temp;
                }else{
                     if(d.type=="logic"){
                         if(d.add){
                             return self.color.add;
                         }
                         else{
                             return self.color.logic;
                         }
                     }else{
                        return self.color.default;
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
                return ifeed.label.pp_feature_single(d.name);
            })
            .style("fill",function(d){
                if(d.type=="logic" && d.add){
                    return self.color.add;
                }else{
                    return "black";
                }
            })
            .style("font-size",23)
            .style("fill-opacity", 1);



        // Update the links…
        var link = svg.selectAll("path.treeLink")
            .data(self.tree.links(nodes), function(d){
                    return d.target.id;
                });

        var path_scale = d3.scale.pow().exponent(0.6);
        path_scale.range([2,10])
                    .domain([1,3]);

        // Enter any new links at the parent's previous position.
        link.enter().insert("svg:path", "g")
            .attr("class", "treeLink")
            .attr("d", function(d) {
              var o = {x: source.x0, y: source.y0};
              return self.diagonal({source: o, target: o});
            })
            .style("stroke-width",function(d){
                    return 8;
                })
            .style("fill-opacity", 0.94)
            .style('fill','none');

        link.transition()
            .duration(duration)
            .attr("d", self.diagonal)
            .style("stroke",function(d){
                if(d.target.deactivated){
                    return self.color.deactivated;
                }else if(d.target.temp){
                    return self.color.temp; 
                }else{
                    return self.color.default;
                }
            });

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function(d) {
              var o = {x: source.x, y: source.y};
              return self.diagonal({source: o, target: o});
            })
            .remove();


    //
    //    // Update the link labels
    //    var link_label = vis.selectAll(".linkLabel")
    //    		.data(tree.links(nodes), function(d) { return d.target.id; });
    //  
    //    link_label.enter().append("text")
    //		    .attr("class", "linkLabel")
    //		    .attr("x",function(d){
    //		        return (d.source.y + d.target.y)/2;
    //		    })
    //		    .attr("y", function(d){
    //		    	return (d.source.x + d.target.x)/2;
    //		    })
    //		    .text(function(d){
    //		    	if(d.target.cond){
    //		    		return "Yes";
    //		    	}else{
    //		    		return "No";
    //		    	}
    //		    })
    //			.style("fill-opacity",0)
    //			.transition()
    //			.duration(duration)
    //			.style("fill-opacity",1);
    //
    //    // Transition links to their new position.
    //    link_label.transition()
    //        		.duration(duration)
    //				.attr("x",function(d){
    //			        return (d.source.y + d.target.y)/2;
    //			    })
    //			    .attr("y", function(d){
    //			    	return (d.source.x + d.target.x)/2;
    //			    })
    //			    .style("fill-opacity",1);
    //    
    //    link_label.exit().transition()
    //		    .duration(duration)
    //		    .style("fill-opacity",0)
    //		    .remove();


        // Stash the old positions for transition.
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;

            if(d.id==self.i_tree-1){
                self.last_modified_tree_node=d;
            }

        });    


        d3.selectAll('.treeNode')
            .call(self.dragListener);

        d3.selectAll('.treeNode')
            .on('contextmenu', function(d){ 
            
                d3.event.preventDefault();
                var coord = d3.mouse($('#feature_application > svg > g').get(0)); 
                var context = d.type;
            
                if(!self.contextMenu){
                    self.contextMenu = new ContextMenu(ifeed);
                }
                
                self.contextMenu.showMenu(d, coord);
            
            });

        // Highlight the node in which to add new features
        d3.selectAll('.treeNode')[0].forEach(function(d){
            if(d.__data__.add){
               d3.select(d).select('circle').style('fill',self.color.add);
            }
        });    


        self.update_feature_expression(self.parse_tree(self.root));
    }



    // Toggle children.
    function toggle_tree(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
    }

    
    
    
 
    self.visit_nodes = function(source,func,reverse){

        var re;

        if(typeof func != 'undefined'){
            re = func(source);
            // If func is a function that returns something, stop traversing tree and return. Otherwise, apply func and keep traversing the tree
            if(re) return re; 
        }

        if(reverse){
            if(source.parent){
                re = self.visit_nodes(source.parent,func,true);
                if(re) return re;  
            }
        }else{
            if(source.children){
                for(var i=0;i<source.children.length;i++){
                    re = self.visit_nodes(source.children[i],func)
                    if(re) return re;
                }   
            }  
        }

        return null;
    }
    



    

    
    self.update_feature_application = function(option,expression){

        var get_node_to_add_features = function(d){
            // Find the node to which to add new features
            if(d.add){
                return d;
            }else{
                return null;
            }
        }

        if(option=='temp'){
            // Mouseover

            var parentNode = null;
            if(self.root){
                // There already exists a tree: Find the node to add new features and append children temporarily
                parentNode = self.visit_nodes(self.root, get_node_to_add_features)

                if(parentNode){
                    // parentNode exists

                    // Stash the currently existing node ID's
                    self.stashed_node_ids = self.get_node_ids(self.root,[]);

                    // Construct a subtree and append it as a child to the parent node
                    var subtree = self.construct_tree(expression,parentNode.depth+1);

                    self.visit_nodes(subtree,function(d){
                        d.temp=true;
                    })

                    parentNode.children.push(subtree);    
                    self.update(self.root);
                    self.check_tree_structure();

                }else{    

                    // No parentNode

                    // Stash the current root 
                    self.stashed_root = self.construct_tree(self.parse_tree(self.root)); 
                    self.stashed_root.x0 = self.root.x0;
                    self.stashed_root.y0 = self.root.y0;     

                    // Re-draw the whole tree
                    self.draw_feature_application_tree(expression);
                }

            }else{

                self.stashed_node_ids = [];
                self.stashed_root = {};

                // There is no tree. Build a new one
                self.draw_feature_application_tree(expression)
            }

            ifeed.filter.apply_filter_expression(self.parse_tree(self.root));
            
        }else if(option=='restore'){
            // Restore the stashed tree

            if(self.stashed_root != null && self.stashed_node_ids != null){ 

                if(jQuery.isEmptyObject(self.stashed_root) && self.stashed_node_ids.length==0){
                    // There was no tree before
                    self.root = null;
                }

            }else if(self.stashed_root != null){
                // The whole tree is stashed
                self.root = self.stashed_root;  

            }else if(self.stashed_node_ids != null){
                // Tree has been modified by the temporary update
                // Visit each node, and if node.indexOf(id)==-1, remove the index        

                var parentNode = null;
                indices = [];

                self.visit_nodes(self.root,function(d){  
                    if(self.stashed_node_ids.indexOf(d.id)==-1){
                        parentNode = d.parent;
                        var index = d.parent.children.indexOf(d);
                        indices.push(index);
                    }
                });

                indices.reverse();
                for(var i=0;i<indices.length;i++){
                    parentNode.children.splice(indices[i],1);
                }

            }else{
                // Both are null
                // Do nothing
            }

            if(self.root){
                self.visit_nodes(self.root,function(d){
                    d.temp=false;
                })
            }

            self.update(self.root);

            self.stashed_root = null;
            self.stashed_node_ids=null;

            self.check_tree_structure();

            ifeed.filter.apply_filter_expression(self.parse_tree(self.root));
            
        }else if(option=='update'){

            self.stashed_node_ids = null;
            self.stashed_root = null;

            ifeed.data_mining.add_feature_to_plot(self.parse_tree(self.root));
        }

        self.update_feature_expression(self.parse_tree(self.root));
        
        ifeed.data_mining.draw_venn_diagram();   
    }
    
    
    
    
    
    
    self.get_node_ids = function(source,IDList){

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
                self.get_node_ids(children[i],IDList);
            }
        }

        return IDList;
    }
    
    
    
    
    
    
    self.remove_descendants = function(nodeID){

        var childrenNodeID = [];

        d3.selectAll('.treeLink').filter(function(d){
            if(d.source.id == nodeID){
                childrenNodeID.push(d.target.id);
                return true;
            }else{
                return false;
            }        
        }).remove();

        if(childrenNodeID.length==0){
            return;
        }

        d3.selectAll('.treeNode')[0].forEach(function(d){

            var id = d.__data__.id;

            if(childrenNodeID.indexOf(id)!=-1){
                d3.select(d).remove();
                self.remove_descendants(id);
            }
        });
    }
    
    


    self.construct_tree = function(expression,depth){

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
                thisNode = {depth:d,type:"logic",name:name,children:[]};

            }else{
                _e = _e.substring(2);
                e = e.substring(2);
            }

            if(_e.indexOf(logic)==-1){
                // Last element in the list
                var child = self.construct_tree(e,d+1);
                thisNode.children.push(child);
                break;
            }else{
                // Not last

                // Get the current feature expression
                _temp = _e.split(logic,1)[0];
                temp = e.substring(0,_temp.length);

                // Add the child to the current node
                var child = self.construct_tree(temp,d+1);
                thisNode.children.push(child);

                // Get the rest of the expression for the next loop
                _e = _e.substring(_temp.length);
                e = e.substring(temp.length);            
            }

        }
        return thisNode;
    }
    
    
    
    self.parse_tree = function(root){

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

        if(!root || root==""){
            // If the current node is "" or null, return null    
            expression = null;

        }else if(root.type=="leaf"){
            // If the current node is a leaf node

            if(deactivated(root)){
                expression="";
            }
            else{
                expression=root.name;
            }

        }else if(root.type=="logic" && (deactivated(root) || !root.children)){
            expression="";

        }else{
            // Current node is a logical connective node and is not deactivated
            expression = "";

            for(var i=0;i<root.children.length;i++){

                var child = root.children[i];
                var logic = null;

                if(root.name=="AND"){
                    logic="&&";
                }else{
                    logic="||";
                }

                var new_expression = self.parse_tree(child);

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
    
    


    self.check_tree_structure = function(){

        if(self.root==null){
            return;
        }   

        var delete_logic_node_without_children = function(node){

            if(!node){
                return;
            }else if(!node.children && node.type=='logic'){

                if(node.depth==0){ // The root node is a logical connective but has no children
                    self.root=null;
                    d3.selectAll('.treeNode').remove();
                }else{
                    var index = node.parent.children.indexOf(node);
                    // Remove the current node
                    if (index > -1) {
                        node.parent.children.splice(index, 1);
                    }
                }
            }        
        }

        var remove_redundant_logical_connectives = function(node){

            if(!node){
                return;            
            }else if(node.type=="logic" && node.parent){
                if(node.name==node.parent.name){

                    var children = node.children;
                    var parent = node.parent;
                    var index = parent.children.indexOf(node);

                    node.parent.children.splice(index,1);

                    for(var i=0;i<children.length;i++){
                        parent.children.splice(index,0,children[i]);
                    }
                }
            }
        }

        var remove_redundant_features = function(node){

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

        self.visit_nodes(self.root, delete_logic_node_without_children);
        self.visit_nodes(self.root, remove_redundant_logical_connectives);
        self.visit_nodes(self.root, remove_redundant_features); 

        self.update(self.root);

    }
    
    
    
    



    self.updateTempConnector = function(target){

        var data = [];
        if (self.draggingNode !== null && self.selectedNode !== null) {
            data = [{
                source: {
                    x: self.selectedNode.y0,
                    y: self.selectedNode.x0
                },
                target: {
                    x: target.x,
                    y: target.y
                }
            }];
        }

        var link = d3.select('#feature_application')
                        .select('svg')
                        .select('g')
                        .selectAll(".tempTreeLink").data(data);

        link.enter().append("path")
            .attr("class", "tempTreeLink")
            .attr("d", d3.svg.diagonal())
            .attr('pointer-events', 'none')
            .style('fill','none')
            .style('stroke','red')
            .style('stroke-width','3px');

        link.attr("d", d3.svg.diagonal());
        link.exit().remove();  
    }




    self.update_feature_expression = function(expression){

        var logic_color = "#FF9500";
        var bracket_color = "#FF0000";

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



    // Remove all features
    d3.select('#clear_all_features').on('click',function(){

        self.root = null;
        self.update(self.root);
        
        ifeed.data_mining.add_feature_to_plot(self.parse_tree(self.root));
        self.update_feature_expression(self.parse_tree(self.root));
        ifeed.data_mining.draw_venn_diagram();      

    }); 
    
    

    
    
    
}









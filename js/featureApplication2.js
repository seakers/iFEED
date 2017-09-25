function temp(){
    draw_feature_application_tree("(F1&&F2)||F3||(F4&&(F5||F6)&&F7)");
}

function reset(){
    d3.select('#feature_application_status').select('svg').remove();
    temp();
}















function update_feature_application(option,expression){
        
    var get_node_to_add_features = function(d){
        if(d.add){
            return d;
        }else{
            return null;
        }
    }
        
    var parentNode = null;
    
    if(root){
        // There already exists a tree
        
        parentNode = visit_nodes(root,get_node_to_add_features)
        
        if(parentNode){
            
            var subtree = construct_tree(expression,parentNode.depth+1);
            parentNode.children.push(subtree);    
            
            update(root);
            check_tree_structure();
            
        }else{
            
            // Re-draw the whole tree
            draw_feature_application_tree(expression);
            
        }
        
    }else{
        // There is no tree. Build a new one
        
        draw_feature_application_tree(expression)
    }
}







//
//
//
//function tree_create_placeholder(){
//
//    draw_feature_application_tree("");
//    
////    var features = current_feature_application;
////    
////    // If the placeholder already exists, return
////    for(var i=0;i<features.length;i++){
////        var expression = features[i].expression;
////        if(expression.indexOf('FeatureToBeAdded')>-1){
////            return;
////        }
////    }
////    
////    // Add a new feature
////    var feature = {activation:true, expression:'{FeatureToBeAdded}', logic:'&&', level:0, logic_indent_level:0};
////    features.push(feature);
////    
////    // Make an update to the display
////    display_feature_application_status([feature]);
////    update_feature_expression();
//}
//
//
//
/////*
////Updates feature application status displayed
////*/
////function tree_update_feature_application(expression,option){
////    
////    if(option=='create_placeholder'){
////        // Newly create a new placeholder if it doesn't exist already
////        tree_create_placeholder();
////        return;
////
////    }else if(option=='replace_placeholder'){
////                
////        return;
////        
////    }else if(option=='update_placeholder'){
////        
////        return;
////        
////    }else if(['new','add','within','deactivated'].indexOf(option)!=-1){
////        
////        return;
////    }
////    else{        
////        // Update everything up-to-date: 
////        //        1) Feature plot 
////        //        2) Feature expression 
////        //        3) Design space plot
////        
////        current_feature_application = get_feature_application_status();
////        apply_current_feature_scheme();
////        adjust_logical_connective();
////        update_feature_expression();
////    }
////    
////}
//
//
//
//







var draggingNode = null;
var selectedNode = null;

var dragStarted = false;
var dragListener = d3.behavior.drag()
                    .on('dragstart',dragStart)
                    .on('drag',drag)
                    .on('dragend',dragEnd);


function remove_descendants(nodeID){
    
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
            remove_descendants(id);
        }
    });
}




function dragStart(d){
    
    if(d==root){return;}
    if(d3.event.sourceEvent.which != 1){return;}
    
    dragStarted=true;    

    d3.event.sourceEvent.stopPropagation();
    
    var id = d.id;
    draggingNode=d;

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
        remove_descendants(id);
    }

}


function drag(d){
    
    if(dragStarted){        
        var coord = d3.mouse($('#feature_application_status > svg > g').get(0));   
        
        d.x0 += coord[0];
        d.y0 += coord[1];        
                
        var node = d3.select(this);
        node.attr("transform","translate("+ coord[0] + "," + coord[1] + ")");
                        
        var target = {};
        target.x = coord[0];
        target.y = coord[1];
        updateTempConnector(target);            
    }
    
}

function dragEnd(d){
    
    if(dragStarted){
        
        d3.selectAll('.nodeRange')
            .style('opacity',0);
                
        d3.select(this).attr('pointer-events', '');
        
        d3.selectAll(".tempTreeLink").remove();  
        
        
        if(selectedNode){
                    
            // Remove the element from the parent, and insert it into the new elements children
            var index = draggingNode.parent.children.indexOf(draggingNode);
            if (index > -1) {
                draggingNode.parent.children.splice(index, 1);
            }
            if (typeof selectedNode.children !== 'undefined') {
                selectedNode.children.push(draggingNode);
            } else {
                selectedNode.children = [];
                selectedNode.children.push(draggingNode);
            }
        }else{
            //console.log('selectedNode undefined');            
        }
        
        update(root);
        
        check_tree_structure();
        
        dragStarted= false;
        draggingNode=null;
        
    }
}






var tree=null;
var root=null;
var i_tree=0;
var diagonal = d3.svg.diagonal()
                    .projection(function(d) { return [d.y, d.x]; });

var last_modified_tree_node = null;

function draw_feature_application_tree(expression){
    
	// top  right bottem left
	var margin = {left:70,right:20,top:50,bottom:50},
	    width = 800 - margin.left - margin.right,
	    height = 900 - margin.top - margin.bottom;

	tree = d3.layout.tree().size([height, width]);
    
    d3.select('#feature_application_status').select('svg').remove();
	
    var svg = d3.select('#feature_application_status')
                .append('svg')
                .attr('width',width + margin.left + margin.right)
                .attr('height',height + margin.bottom + margin.top)
                .append('g')
                .attr('transform','translate('+ margin.left + "," + margin.top + ")");
    
    i_tree=0;
    
    root = construct_tree(expression);
    root.x0 = height / 2;
    root.y0 = 0;    
    
//    edgeLabelLoc = [];
//    
//    function toggleAll(d) {
//        if (d.children) {
//            d.children.forEach(toggleAll);
//            toggle_tree(d);
//          }
//    }
//    root.children.forEach(toggleAll);
//    // Initialize the display to show a few nodes.
//    toggle_tree(root.children[0]);
//    toggle_tree(root.children[1]);
    
    
    update(root);  
}


function update(source) {
    
    if(source==null){
        d3.selectAll('.treeNode').remove();
        d3.selectAll('.treeLink').remove();
        return;
    }    

	var duration = d3.event && d3.event.altKey ? 5000 : 500;
    // Compute the new tree layout.
    var nodes = tree.nodes(root);
    
    
    // Normalize for fixed-depth.
    nodes.forEach(function(d) { d.y = d.depth * 120; });
    
    var svg = d3.select('#feature_application_status')
                    .select('svg').select('g');
        
    
    // Update the nodes…
    var node = svg.selectAll("g.treeNode")
                    .data(nodes, function(d) { 
                        return d.id || (d.id = i_tree++); 
                    });
    
    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
        .attr("class", "treeNode")
        .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; });
    
    nodeEnter.append("svg:circle")
        .attr("r", 1e-6)
         .style("fill", function(d) { 
        	 if(d.children){
                 return "#2383FF";
        	 }else{
        		 return "#A3A3A3";
        	 }
    	 });
    
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
            selectedNode=d;  
        })
        .on('mouseout',function(d){
            selectedNode=null;
        })
    

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
        .remove();

    nodeExit.select("circle")
        .attr("r", 1e-6);

    nodeExit.select("text")
        .style("fill-opacity", 1e-6);
    
    
    nodeUpdate.select("circle")
        .attr("r", 9.5)
        .style("fill", function(d) { 
        	 if(d.children){
                 if(d.add){
                     return "red";
                 }
                 else{
                     return "#2383FF";
                 }
        	 }else{
                return "#A3A3A3";
        	 }
    	 });
//        .style("fill", function(d) { return d._children ? "#3A3A3A" : "#A3A3A3"; });

    nodeUpdate.select("text")
            .attr("x",function(d){
                if(d.children){ return -10; }
                else{ return 10; }
            })
        .attr("text-anchor", function(d) { 
            if(d.children){ return "end"; }
            else{ return "start"; }
        })
        .text(function(d) {return d.name})
        .style("font-size",23)
        .style("fill-opacity", 1);
 


    // Update the links…
    var link = svg.selectAll("path.treeLink")
    	.data(tree.links(nodes), function(d){
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
          return diagonal({source: o, target: o});
        })
        .style("stroke",function(d){
                return "#1CAB00";
            })
        .style("stroke-width",function(d){
                return 8;
            })
        .style("fill-opacity", 0.94)
        .style('fill','none');
    
    link.transition()
        .duration(duration)
        .attr("d", diagonal);

//    // Transition links to their new position.
//    link.transition()
//        .duration(duration)
//        .attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr("d", function(d) {
          var o = {x: source.x, y: source.y};
          return diagonal({source: o, target: o});
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
        
        if(d.id==i_tree-1){
            last_modified_tree_node=d;
        }
        
    });    
    

    d3.selectAll('.treeNode')
        .call(dragListener);
    
    d3.selectAll('.treeNode')
        .on('contextmenu', function(d){ 
            d3.event.preventDefault();
            var coord = d3.mouse($('#feature_application_status > svg > g').get(0)); 
            var context = d.type;
            menu(context, coord, d);
        });
    
    // Highlight the node in which to add new features
    d3.selectAll('.treeNode')[0].forEach(function(d){
        if(d.__data__.add){
           d3.select(d).select('circle').style('fill','red');
        }
    });    
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




function visit_nodes(source,func){
    
    var re;
    
    if(typeof func != 'undefined'){
        re = func(source)
        if(re) return re;
    }
    
    if(source.children){
        for(var i=0;i<source.children.length;i++){
            re = visit_nodes(source.children[i],func)
            if(re) return re;
        }   
    }
    
    return null;
}


function check_tree_structure(){
    
    if(root==null){
        return;
    }   
        
    var delete_node_with_single_child = function(node){
        
        if(node.children){
            
            if(node.depth == 0){
                return;
            }else if(node.children.length==1){
                var grandChild = node.children[0];
                var index = node.parent.children.indexOf(node);

                // Remove the current node
                if (index > -1) {
                    node.parent.children.splice(index, 1,grandChild);
                }
                
            }else if(node.children.length==0){
                if(node.type=='logic'){

                    var index = node.parent.children.indexOf(node);
                    // Remove the current node
                    if (index > -1) {
                        node.parent.children.splice(index, 1);
                    }
                }
            }
        }else{
            
            if(node.type=='logic' && node.depth==0){
                // The root node is a logical connective but has no children
                root=null;
                d3.selectAll('.treeNode').remove();
            }
        }
    }
    
    var remove_redundant_logical_connectives = function(node){
        
        if(node.type=="logic" && node.parent){
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
        
        if(node.type=="logic" && node.children){
            
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
        
    visit_nodes(root, delete_node_with_single_child);
    visit_nodes(root, remove_redundant_logical_connectives);
    visit_nodes(root, remove_redundant_features); 
    
    update(root);
}




var updateTempConnector = function(target){
    
    var data = [];
    if (draggingNode !== null && selectedNode !== null) {
        data = [{
            source: {
                x: selectedNode.y0,
                y: selectedNode.x0
            },
            target: {
                x: target.x,
                y: target.y
            }
        }];
    }
    
    var link = d3.select('#feature_application_status')
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






//## Node: 
//{depth:33,type:logic,name:AND,children:[N1,N2,...]}
//{depth:14,type:leaf,name:present[A],childreen:null}


function parse_tree(root){
    
    var expression = null;
    if(root.type=="leaf"){
        // Leaf node: feature
        expression=root.name;
        
    }else{
        expression = "";
        
        for(var i=0;i<root.children.length;i++){
            
            var child = root.children[i];
            var logic = null;
            
            if(root.name=="AND"){
                logic="&&";
            }else{
                logic="||";
            }
            
            if(i!=0){
               expression = expression + logic;
            }
            expression = expression + parse_tree(child);    
        }
        
        expression = "(" + expression + ")";
    }
    
    return expression;
}


function construct_tree(expression,depth){
    
    if(depth==null){
       depth = 0;
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
            var child = construct_tree(e,d+1);
            thisNode.children.push(child);
            break;
        }else{
            // Not last
            
            // Get the current feature expression
            _temp = _e.split(logic,1)[0];
            temp = e.substring(0,_temp.length);
            
            // Add the child to the current node
            var child = construct_tree(temp,d+1);
            thisNode.children.push(child);
            
            // Get the rest of the expression for the next loop
            _e = _e.substring(_temp.length);
            e = e.substring(temp.length);            
        }
        
    }
    return thisNode;
}



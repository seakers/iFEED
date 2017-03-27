/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


function buildClassificationTree(){
	
	var output;
    $.ajax({
        url: "/server/ifeed",
        type: "POST",
        data: {ID: "build_classification_tree"},
        async: false,
        success: function (data, textStatus, jqXHR)
        {
        	output = JSON.parse(data);
        },
        error: function (jqXHR, textStatus, errorThrown)
        {alert("error");}
    });
    
    return output;
}



function constructNestedTreeStructure(tree_objs){
	var root = tree_objs[0];
	addBranches(root,tree_objs);
	return root;
}
function addBranches(parent,objs){
	
	if (parent.name==="leaf"){
		return;
	} 
	var c1 = searchByNodeID(parent.id_c1,objs);
	var c2 = searchByNodeID(parent.id_c2,objs);
	
	if(c1!==null && c2!==null){
		c1.cond=true;
		addBranches(c1,objs);
		c2.cond=false;
		addBranches(c2,objs);
		parent.children = [c1, c2];
	}

}
function searchByNodeID(id,objs){
	for(var i=0;i<objs.length;i++){
		if(objs[i].nodeID===id){
			return objs[i];
		}
	}
	return null;
}






var i_tree = 0;
var root;
var tree;
var jsonObj_tree_nested;

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

var edgeLabelLoc;

function display_classificationTree(source){
	
	// top  right bottem left
	var margin_tree = [15, 120, 20, 350],
	    width_tree = 3280 - margin_tree[1] - margin_tree[3],
	    height_tree = 630 - margin_tree[0] - margin_tree[2];

	tree = d3.layout.tree().size([height_tree, width_tree]);
	
	d3.select("[id=basicInfoBox_div]").select("[id=view4]").select("g").remove();
    var infoBox = d3.select("[id=basicInfoBox_div]").select("[id=view4]")
            .append("g");
    
    var feature_status = infoBox.append('div')
    		.attr('id','classification_tree_feature_status');
    feature_status.append('div')
    		.attr('id','classification_tree_applied_feature_div');
    feature_status.append('div')
    		.attr('id','classification_tree_applied_feature_options');

    
	var svg_tree = infoBox.append("svg")
    			.attr("width", width_tree + margin_tree[1] + margin_tree[3])
				.attr("height", height_tree + margin_tree[0] + margin_tree[2])
				.append("svg:g")
				.attr("transform", "translate(" + margin_tree[3] + "," + margin_tree[0] + ")");
	
	jsonObj_tree_nested = constructNestedTreeStructure(source);
    root = jsonObj_tree_nested;
    root.x0 = height / 2;
    root.y0 = 0;
    edgeLabelLoc = [];
    
    function toggleAll(d) {
        if (d.children) {
            d.children.forEach(toggleAll);
            toggle_tree(d);
          }
    }
    root.children.forEach(toggleAll);
    // Initialize the display to show a few nodes.
    toggle_tree(root.children[0]);
    toggle_tree(root.children[1]);
    update(root);   
}



function update(source) {

	var duration = d3.event && d3.event.altKey ? 5000 : 500;
    // Compute the new tree layout.
    var nodes = tree.nodes(root);
    // Normalize for fixed-depth.
    nodes.forEach(function(d) { d.y = d.depth * 170; });
    
    var vis = d3.select("[id=basicInfoBox_div]").select("[id=view4]").select("svg").select("g");
    
    // Update the nodes…
    var node = vis.selectAll("g.node")
        .data(nodes, function(d) { return d.id || (d.id = ++i_tree); });
    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("svg:g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
        .on("click", function(d) { 
        	toggle_tree(d); 
        	update(d);
    	})
        .on("mouseover",tree_node_mouse_over)
        .on("mouseout", function (d) {
            var highlighted = d3.selectAll("[status=highlighted]");
            highlighted.attr("status", "default")
                    .style("fill", function (d) {
                            return "#000000";
                    });     
            d3.selectAll("[status=selected_and_highlighted]")
            		.attr("status", "selected")
                    .style("fill","#19BAD7");     
        });
    
    nodeEnter.append("svg:circle")
        .attr("r", 1e-6)
         .style("fill", function(d) { 
        	 if(d._children){
        		 if(d.num_nb > d.num_b){
        			 return "#343434";
        		 }else{
        			 return "#2383FF"
        		 }
        	 }else{
        		 return "#A3A3A3";
        	 }
    	 });
    
    nodeEnter.append("svg:text")
        .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
        .attr("dy", ".40em")
        .style("font-size","14px")
        .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
        .text("default")
        .style("fill-opacity", 1e-6);

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

    nodeUpdate.select("circle")
        .attr("r", 9.5)
        .style("fill", function(d) { 
        	 if(d._children){
        		 if(d.num_nb > d.num_b){
        			 return "#343434";
        		 }else{
        			 return "#2383FF"
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
        .text(function(d) { 
            var out="";

            if(d.children){
            	out += ppdf(d.name) + "?";
            }else { // leafNode
            	if(d.num_b >= d.num_nb){
            		// classified as selected
            		var weight = d.num_b + d.num_nb;
            		var accuracy = d.num_b / weight;
            		out += "selected (" + round_num_2_perc(accuracy) + "%) - Weight: " + weight;
            	}else{
            		// classified as not selected
            		var weight = d.num_b + d.num_nb;
            		var accuracy = d.num_nb / weight;
            		out += "not selected (" + round_num_2_perc(accuracy) + "%) - Weight: " + weight;
            	}
            }
            
            return out;
        })
        .style("font-size",23)
        .style("fill-opacity", 1);
 
    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
        .remove();

    nodeExit.select("circle")
        .attr("r", 1e-6);

    nodeExit.select("text")
        .style("fill-opacity", 1e-6);

    // Update the links…
    var link = vis.selectAll("path.treeLink")
    	.data(tree.links(nodes), function(d) { return d.target.id; });

    
//    var path_scale = d3.scale.pow().exponent(0.8);
    var path_scale = d3.scale.pow().exponent(0.6);
    path_scale.range([2,27])
              	.domain([1,jsonObj_tree_nested.numDat]);


    // Enter any new links at the parent's previous position.
    link.enter().insert("svg:path", "g")
        .attr("class", "treeLink")
        .attr("d", function(d) {
          var o = {x: source.x0, y: source.y0};
          return diagonal({source: o, target: o});
        })
        .style("stroke",function(d){
            if(d.target.cond === true){
                return "#1CAB00";
            } else{
                return "#FF2238";
            }
        })
        .style("stroke-width",function(d){
            return path_scale(d.target.numDat);
        })
        .style("fill-opacity", 0.94)
        .transition()
        .duration(duration)
        .attr("d", diagonal);

    // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr("d", function(d) {
          var o = {x: source.x, y: source.y};
          return diagonal({source: o, target: o});
        })
        .remove();
    

    
    
    
    
    
    
    
    // Update the link labels
    var link_label = vis.selectAll(".linkLabel")
    		.data(tree.links(nodes), function(d) { return d.target.id; });
  
    link_label.enter().append("text")
		    .attr("class", "linkLabel")
		    .attr("x",function(d){
		        return (d.source.y + d.target.y)/2;
		    })
		    .attr("y", function(d){
		    	return (d.source.x + d.target.x)/2;
		    })
		    .text(function(d){
		    	if(d.target.cond){
		    		return "Yes";
		    	}else{
		    		return "No";
		    	}
		    })
			.style("fill-opacity",0)
			.transition()
			.duration(duration)
			.style("fill-opacity",1);

    // Transition links to their new position.
    link_label.transition()
        		.duration(duration)
				.attr("x",function(d){
			        return (d.source.y + d.target.y)/2;
			    })
			    .attr("y", function(d){
			    	return (d.source.x + d.target.x)/2;
			    })
			    .style("fill-opacity",1);
    
    link_label.exit().transition()
		    .duration(duration)
		    .style("fill-opacity",0)
		    .remove();



    // Stash the old positions for transition.
    nodes.forEach(function(d) {
      d.x0 = d.x;
      d.y0 = d.y;
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





function tree_node_double_click(d){
		
//	var condition = d.cond;
//	var currentNode = d.parent;
//	var name = currentNode.name;
//
//	var expression = "";
//
//	for(var i=0;i<d.depth;i++){
//		if(i>0){
//			expression = expression + "&&";
//		}
//		
//		if(condition){ // true
//			expression = expression + name;
//		}else{ // false
//			expression = expression + "{~" + name.substring(1,name.length);
//		}
//		if (currentNode.depth==0){
//			break;
//		}
//		condition = currentNode.cond;
//		currentNode = currentNode.parent;
//		name = currentNode.name;
//	}
//	
//	update_filter_application_status(expression,'deactivated');	
}

function tree_node_mouse_over(d){

	if(d.children==null){
		if(d.depth==0){
			return;
		}
		
		// Remove remaining traces of actions from driving features tab
		remove_df_application_status();		
		
		var condition = d.cond;
		var currentNode = d.parent;
		var name = currentNode.name;

		var expression = "";
		

		for(var i=0;i<d.depth;i++){
			if(i>0){
				expression = expression + "&&";
			}
			
			if(condition){ // true
				expression = expression + name;
			}else{ // false
				expression = expression + "{~" + name.substring(1,name.length);
			}
			if (currentNode.depth==0){
				break;
			}
			condition = currentNode.cond;
			currentNode = currentNode.parent;
			name = currentNode.name;
		}
		
		console.log(expression);
		classification_tree_update_applied_feature(expression);

		var ids = [];
		var bitStrings = [];
		var paretoRankings = [];
		d3.selectAll('.dot')[0].forEach(function(d){
			ids.push(d.__data__.id);
			bitStrings.push(d.__data__.bitString);
		    paretoRankings.push(parseInt(d3.select(d).attr("paretoRank")));
		});  

		var arch_info = {bitStrings:bitStrings,paretoRankings:paretoRankings};
		var indices = [];
		for(var i=0;i<ids.length;i++){
			indices.push(i);
		}
		// Note that indices and ids are different!
		var matchedIndices = processFilterExpression(expression, indices, "&&", arch_info);
		var matchedIDs = [];
		for(var i=0;i<matchedIndices.length;i++){
			var index = matchedIndices[i];
			matchedIDs.push(ids[index]);
		}
		
		
		
	    d3.selectAll("[class=dot]")[0].forEach(function (d) {
	    	var status = d3.select(d).attr('status');
	    	if(status=='default' || status=='highlighted'){
	        	if(matchedIDs.indexOf(d.__data__.id)>-1){
	        		d3.select(d).attr("status", "highlighted")
	    				.style("fill", "#F75082");
	    		}else{
	        		d3.select(d).attr("status", "default")
	    				.style("fill", "#000000");
	    		}
	    	}else if(status=='selected' || status=='selected_and_highlighted'){
	        	if(matchedIDs.indexOf(d.__data__.id)>-1){
	        		d3.select(d).attr("status", "selected_and_highlighted")
	    				.style("fill", "#F75082");
	    		}else{
	        		d3.select(d).attr("status", "selected")
	    				.style("fill", "#19BAD7");
	    		}
	    	}

	    });
		
		
		
		//console.log(highlighted);
		
	}else{
		return;
	}
}

function classification_tree_update_applied_feature(expression){

	if(d3.select('#classification_tree_applied_feature_expression')[0][0]==null){
		d3.select('#classification_tree_applied_feature_div').append('div')
			.attr('id','classification_tree_applied_feature_expression')
			.attr('expression',expression)
			.text(ppdf(expression));
		d3.select('#classification_tree_applied_feature_options')
			.append('button')
			.attr('id','classification_tree_applied_feature_add_button')
			.text('Add to filter settings')
			.on('click',function(d){
		        update_filter_application_status(expression,'deactivated');
			});
	}else{
		d3.select('#classification_tree_applied_feature_expression')
			.attr('expression',expression)
			.text(ppdf(expression));
		d3.select('#classification_tree_applied_feature_add_button')
			.on('click',function(d){
		        update_filter_application_status(expression,'deactivated');
			});		
	}
	
	
}





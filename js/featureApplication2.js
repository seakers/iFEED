

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
    
    dragStarted=true;    
    d3.event.sourceEvent.stopPropagation();

    var id = d.id;

    // Remove the link to the parent node
    d3.selectAll('.treeLink').filter(function(d){
        if(d.target.id == id){
            return true;
        }else{
            return false;
        }        
    }).remove();
    
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
    }
    
}

function dragEnd(d){
    
    if(dragStarted){
        
        dragStarted= false;
        update(root);
        
    }
}






//
//
//
//
//        .on("drag", function(d) {
//            if (d == root) {
//                return;
//            }
//            if (dragStarted) {
//                domNode = this;
//                initiateDrag(d, domNode);
//            }
//
//            // get coords of mouseEvent relative to svg container to allow for panning
//            relCoords = d3.mouse($('svg').get(0));
//            if (relCoords[0] < panBoundary) {
//                panTimer = true;
//                pan(this, 'left');
//            } else if (relCoords[0] > ($('svg').width() - panBoundary)) {
//
//                panTimer = true;
//                pan(this, 'right');
//            } else if (relCoords[1] < panBoundary) {
//                panTimer = true;
//                pan(this, 'up');
//            } else if (relCoords[1] > ($('svg').height() - panBoundary)) {
//                panTimer = true;
//                pan(this, 'down');
//            } else {
//                try {
//                    clearTimeout(panTimer);
//                } catch (e) {
//
//                }
//            }
//
//            d.x0 += d3.event.dy;
//            d.y0 += d3.event.dx;
//            var node = d3.select(this);
//            node.attr("transform", "translate(" + d.y0 + "," + d.x0 + ")");
//            updateTempConnector();
//        }).on("dragend", function(d) {
//            if (d == root) {
//                return;
//            }
//            domNode = this;
//            if (selectedNode) {
//                // now remove the element from the parent, and insert it into the new elements children
//                var index = draggingNode.parent.children.indexOf(draggingNode);
//                if (index > -1) {
//                    draggingNode.parent.children.splice(index, 1);
//                }
//                if (typeof selectedNode.children !== 'undefined' || typeof selectedNode._children !== 'undefined') {
//                    if (typeof selectedNode.children !== 'undefined') {
//                        selectedNode.children.push(draggingNode);
//                    } else {
//                        selectedNode._children.push(draggingNode);
//                    }
//                } else {
//                    selectedNode.children = [];
//                    selectedNode.children.push(draggingNode);
//                }
//                // Make sure that the node being added to is expanded so user can see added node is correctly moved
//                expand(selectedNode);
//                sortTree();
//                endDrag();
//            } else {
//                endDrag();
//            }
//        });
//
//    function endDrag() {
//        selectedNode = null;
//        d3.selectAll('.ghostCircle').attr('class', 'ghostCircle');
//        d3.select(domNode).attr('class', 'node');
//        // now restore the mouseover event or we won't be able to drag a 2nd time
//        d3.select(domNode).select('.ghostCircle').attr('pointer-events', '');
//        updateTempConnector();
//        if (draggingNode !== null) {
//            update(root);
//            centerNode(draggingNode);
//            draggingNode = null;
//        }
//    }
//
//
//    var overCircle = function(d) {
//        selectedNode = d;
//        updateTempConnector();
//    };
//    var outCircle = function(d) {
//        selectedNode = null;
//        updateTempConnector();
//    };
//
//
//// Function to update the temporary connector indicating dragging affiliation
//    var updateTempConnector = function() {
//        var data = [];
//        if (draggingNode !== null && selectedNode !== null) {
//            // have to flip the source coordinates since we did this for the existing connectors on the original tree
//            data = [{
//                source: {
//                    x: selectedNode.y0,
//                    y: selectedNode.x0
//                },
//                target: {
//                    x: draggingNode.y0,
//                    y: draggingNode.x0
//                }
//            }];
//        }
//        var link = svgGroup.selectAll(".templink").data(data);
//
//        link.enter().append("path")
//            .attr("class", "templink")
//            .attr("d", d3.svg.diagonal())
//            .attr('pointer-events', 'none');
//
//        link.attr("d", d3.svg.diagonal());
//
//        link.exit().remove();
//    };
//
//    // Function to center node when clicked/dropped so node doesn't get lost when collapsing/moving with large amount of children.
//
//    function centerNode(source) {
//        scale = zoomListener.scale();
//        x = -source.y0;
//        y = -source.x0;
//        x = x * scale + viewerWidth / 2;
//        y = y * scale + viewerHeight / 2;
//        d3.select('g').transition()
//            .duration(duration)
//            .attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");
//        zoomListener.scale(scale);
//        zoomListener.translate([x, y]);
//    }
//
//
//
//
//













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

	var duration = d3.event && d3.event.altKey ? 5000 : 500;
    // Compute the new tree layout.
    var nodes = tree.nodes(root);
    // Normalize for fixed-depth.
    nodes.forEach(function(d) { d.y = d.depth * 100; });
    
    
    var svg = d3.select('#feature_application_status')
                    .select('svg').select('g');
        
    
    // Update the nodes…
    var node = svg.selectAll("treeNode")
                    .data(nodes, function(d) { return d.id || (d.id = i_tree++ ); });
    
    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
        .remove();

    nodeExit.select("circle")
        .attr("r", 1e-6);

    nodeExit.select("text")
        .style("fill-opacity", 1e-6);
    
    
    
    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("svg:g")
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

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

    nodeUpdate.select("circle")
        .attr("r", 9.5)
        .style("fill", function(d) { 
        	 if(d.children){
                return "#2383FF";
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




































//
//
//
//
//// Get JSON data
//treeJSON = d3.json("flare.json", function(error, treeData) {
//
//    // Calculate total nodes, max label length
//    var totalNodes = 0;
//    var maxLabelLength = 0;
//    // variables for drag/drop
//    var selectedNode = null;
//    var draggingNode = null;
//    // panning variables
//    var panSpeed = 200;
//    var panBoundary = 20; // Within 20px from edges will pan when dragging.
//    // Misc. variables
//    var i = 0;
//    var duration = 750;
//    var root;
//
//    // size of the diagram
//    var viewerWidth = $(document).width();
//    var viewerHeight = $(document).height();
//
//    var tree = d3.layout.tree()
//        .size([viewerHeight, viewerWidth]);
//
//    // define a d3 diagonal projection for use by the node paths later on.
//    var diagonal = d3.svg.diagonal()
//        .projection(function(d) {
//            return [d.y, d.x];
//        });
//
//    // A recursive helper function for performing some setup by walking through all nodes
//
//    function visit(parent, visitFn, childrenFn) {
//        if (!parent) return;
//
//        visitFn(parent);
//
//        var children = childrenFn(parent);
//        if (children) {
//            var count = children.length;
//            for (var i = 0; i < count; i++) {
//                visit(children[i], visitFn, childrenFn);
//            }
//        }
//    }
//
//    // Call visit function to establish maxLabelLength
//    visit(treeData, function(d) {
//        totalNodes++;
//        maxLabelLength = Math.max(d.name.length, maxLabelLength);
//
//    }, function(d) {
//        return d.children && d.children.length > 0 ? d.children : null;
//    });
//
//
//    // sort the tree according to the node names
//
//    function sortTree() {
//        tree.sort(function(a, b) {
//            return b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1;
//        });
//    }
//    // Sort the tree initially incase the JSON isn't in a sorted order.
//    sortTree();
//
//    // TODO: Pan function, can be better implemented.
//
//    function pan(domNode, direction) {
//        var speed = panSpeed;
//        if (panTimer) {
//            clearTimeout(panTimer);
//            translateCoords = d3.transform(svgGroup.attr("transform"));
//            if (direction == 'left' || direction == 'right') {
//                translateX = direction == 'left' ? translateCoords.translate[0] + speed : translateCoords.translate[0] - speed;
//                translateY = translateCoords.translate[1];
//            } else if (direction == 'up' || direction == 'down') {
//                translateX = translateCoords.translate[0];
//                translateY = direction == 'up' ? translateCoords.translate[1] + speed : translateCoords.translate[1] - speed;
//            }
//            scaleX = translateCoords.scale[0];
//            scaleY = translateCoords.scale[1];
//            scale = zoomListener.scale();
//            svgGroup.transition().attr("transform", "translate(" + translateX + "," + translateY + ")scale(" + scale + ")");
//            d3.select(domNode).select('g.node').attr("transform", "translate(" + translateX + "," + translateY + ")");
//            zoomListener.scale(zoomListener.scale());
//            zoomListener.translate([translateX, translateY]);
//            panTimer = setTimeout(function() {
//                pan(domNode, speed, direction);
//            }, 50);
//        }
//    }
//
//    // Define the zoom function for the zoomable tree
//
//    function zoom() {
//        svgGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
//    }
//
//
//    // define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
//    var zoomListener = d3.behavior.zoom().scaleExtent([0.1, 3]).on("zoom", zoom);
//
//    function initiateDrag(d, domNode) {
//        draggingNode = d;
//        d3.select(domNode).select('.ghostCircle').attr('pointer-events', 'none');
//        d3.selectAll('.ghostCircle').attr('class', 'ghostCircle show');
//        d3.select(domNode).attr('class', 'node activeDrag');
//
//        svgGroup.selectAll("g.node").sort(function(a, b) { // select the parent and sort the path's
//            if (a.id != draggingNode.id) return 1; // a is not the hovered element, send "a" to the back
//            else return -1; // a is the hovered element, bring "a" to the front
//        });
//        // if nodes has children, remove the links and nodes
//        if (nodes.length > 1) {
//            // remove link paths
//            links = tree.links(nodes);
//            nodePaths = svgGroup.selectAll("path.link")
//                .data(links, function(d) {
//                    return d.target.id;
//                }).remove();
//            // remove child nodes
//            nodesExit = svgGroup.selectAll("g.node")
//                .data(nodes, function(d) {
//                    return d.id;
//                }).filter(function(d, i) {
//                    if (d.id == draggingNode.id) {
//                        return false;
//                    }
//                    return true;
//                }).remove();
//        }
//
//        // remove parent link
//        parentLink = tree.links(tree.nodes(draggingNode.parent));
//        svgGroup.selectAll('path.link').filter(function(d, i) {
//            if (d.target.id == draggingNode.id) {
//                return true;
//            }
//            return false;
//        }).remove();
//
//        dragStarted = null;
//    }
//
//    // define the baseSvg, attaching a class for styling and the zoomListener
//    var baseSvg = d3.select("#tree-container").append("svg")
//        .attr("width", viewerWidth)
//        .attr("height", viewerHeight)
//        .attr("class", "overlay")
//        .call(zoomListener);
//
//
//    // Define the drag listeners for drag/drop behaviour of nodes.
//    dragListener = d3.behavior.drag()
//        .on("dragstart", function(d) {
//            if (d == root) {
//                return;
//            }
//            dragStarted = true;
//            nodes = tree.nodes(d);
//            d3.event.sourceEvent.stopPropagation();
//            // it's important that we suppress the mouseover event on the node being dragged. Otherwise it will absorb the mouseover event and the underlying node will not detect it d3.select(this).attr('pointer-events', 'none');
//        })
//        .on("drag", function(d) {
//            if (d == root) {
//                return;
//            }
//            if (dragStarted) {
//                domNode = this;
//                initiateDrag(d, domNode);
//            }
//
//            // get coords of mouseEvent relative to svg container to allow for panning
//            relCoords = d3.mouse($('svg').get(0));
//            if (relCoords[0] < panBoundary) {
//                panTimer = true;
//                pan(this, 'left');
//            } else if (relCoords[0] > ($('svg').width() - panBoundary)) {
//
//                panTimer = true;
//                pan(this, 'right');
//            } else if (relCoords[1] < panBoundary) {
//                panTimer = true;
//                pan(this, 'up');
//            } else if (relCoords[1] > ($('svg').height() - panBoundary)) {
//                panTimer = true;
//                pan(this, 'down');
//            } else {
//                try {
//                    clearTimeout(panTimer);
//                } catch (e) {
//
//                }
//            }
//
//            d.x0 += d3.event.dy;
//            d.y0 += d3.event.dx;
//            var node = d3.select(this);
//            node.attr("transform", "translate(" + d.y0 + "," + d.x0 + ")");
//            updateTempConnector();
//        }).on("dragend", function(d) {
//            if (d == root) {
//                return;
//            }
//            domNode = this;
//            if (selectedNode) {
//                // now remove the element from the parent, and insert it into the new elements children
//                var index = draggingNode.parent.children.indexOf(draggingNode);
//                if (index > -1) {
//                    draggingNode.parent.children.splice(index, 1);
//                }
//                if (typeof selectedNode.children !== 'undefined' || typeof selectedNode._children !== 'undefined') {
//                    if (typeof selectedNode.children !== 'undefined') {
//                        selectedNode.children.push(draggingNode);
//                    } else {
//                        selectedNode._children.push(draggingNode);
//                    }
//                } else {
//                    selectedNode.children = [];
//                    selectedNode.children.push(draggingNode);
//                }
//                // Make sure that the node being added to is expanded so user can see added node is correctly moved
//                expand(selectedNode);
//                sortTree();
//                endDrag();
//            } else {
//                endDrag();
//            }
//        });
//
//    function endDrag() {
//        selectedNode = null;
//        d3.selectAll('.ghostCircle').attr('class', 'ghostCircle');
//        d3.select(domNode).attr('class', 'node');
//        // now restore the mouseover event or we won't be able to drag a 2nd time
//        d3.select(domNode).select('.ghostCircle').attr('pointer-events', '');
//        updateTempConnector();
//        if (draggingNode !== null) {
//            update(root);
//            centerNode(draggingNode);
//            draggingNode = null;
//        }
//    }
//
//    // Helper functions for collapsing and expanding nodes.
//
//    function collapse(d) {
//        if (d.children) {
//            d._children = d.children;
//            d._children.forEach(collapse);
//            d.children = null;
//        }
//    }
//
//    function expand(d) {
//        if (d._children) {
//            d.children = d._children;
//            d.children.forEach(expand);
//            d._children = null;
//        }
//    }
//
//    var overCircle = function(d) {
//        selectedNode = d;
//        updateTempConnector();
//    };
//    var outCircle = function(d) {
//        selectedNode = null;
//        updateTempConnector();
//    };
//
//    // Function to update the temporary connector indicating dragging affiliation
//    var updateTempConnector = function() {
//        var data = [];
//        if (draggingNode !== null && selectedNode !== null) {
//            // have to flip the source coordinates since we did this for the existing connectors on the original tree
//            data = [{
//                source: {
//                    x: selectedNode.y0,
//                    y: selectedNode.x0
//                },
//                target: {
//                    x: draggingNode.y0,
//                    y: draggingNode.x0
//                }
//            }];
//        }
//        var link = svgGroup.selectAll(".templink").data(data);
//
//        link.enter().append("path")
//            .attr("class", "templink")
//            .attr("d", d3.svg.diagonal())
//            .attr('pointer-events', 'none');
//
//        link.attr("d", d3.svg.diagonal());
//
//        link.exit().remove();
//    };
//
//    // Function to center node when clicked/dropped so node doesn't get lost when collapsing/moving with large amount of children.
//
//    function centerNode(source) {
//        scale = zoomListener.scale();
//        x = -source.y0;
//        y = -source.x0;
//        x = x * scale + viewerWidth / 2;
//        y = y * scale + viewerHeight / 2;
//        d3.select('g').transition()
//            .duration(duration)
//            .attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");
//        zoomListener.scale(scale);
//        zoomListener.translate([x, y]);
//    }
//
//    // Toggle children function
//
//    function toggleChildren(d) {
//        if (d.children) {
//            d._children = d.children;
//            d.children = null;
//        } else if (d._children) {
//            d.children = d._children;
//            d._children = null;
//        }
//        return d;
//    }
//
//    // Toggle children on click.
//
//    function click(d) {
//        if (d3.event.defaultPrevented) return; // click suppressed
//        d = toggleChildren(d);
//        update(d);
//        centerNode(d);
//    }
//
//    function update(source) {
//        // Compute the new height, function counts total children of root node and sets tree height accordingly.
//        // This prevents the layout looking squashed when new nodes are made visible or looking sparse when nodes are removed
//        // This makes the layout more consistent.
//        var levelWidth = [1];
//        var childCount = function(level, n) {
//
//            if (n.children && n.children.length > 0) {
//                if (levelWidth.length <= level + 1) levelWidth.push(0);
//
//                levelWidth[level + 1] += n.children.length;
//                n.children.forEach(function(d) {
//                    childCount(level + 1, d);
//                });
//            }
//        };
//        childCount(0, root);
//        var newHeight = d3.max(levelWidth) * 25; // 25 pixels per line  
//        tree = tree.size([newHeight, viewerWidth]);
//
//        // Compute the new tree layout.
//        var nodes = tree.nodes(root).reverse(),
//            links = tree.links(nodes);
//
//        // Set widths between levels based on maxLabelLength.
//        nodes.forEach(function(d) {
//            d.y = (d.depth * (maxLabelLength * 10)); //maxLabelLength * 10px
//            // alternatively to keep a fixed scale one can set a fixed depth per level
//            // Normalize for fixed-depth by commenting out below line
//            // d.y = (d.depth * 500); //500px per level.
//        });
//
//        // Update the nodes…
//        node = svgGroup.selectAll("g.node")
//            .data(nodes, function(d) {
//                return d.id || (d.id = ++i);
//            });
//
//        // Enter any new nodes at the parent's previous position.
//        var nodeEnter = node.enter().append("g")
//            .call(dragListener)
//            .attr("class", "node")
//            .attr("transform", function(d) {
//                return "translate(" + source.y0 + "," + source.x0 + ")";
//            })
//            .on('click', click);
//
//        nodeEnter.append("circle")
//            .attr('class', 'nodeCircle')
//            .attr("r", 0)
//            .style("fill", function(d) {
//                return d._children ? "lightsteelblue" : "#fff";
//            });
//
//        nodeEnter.append("text")
//            .attr("x", function(d) {
//                return d.children || d._children ? -10 : 10;
//            })
//            .attr("dy", ".35em")
//            .attr('class', 'nodeText')
//            .attr("text-anchor", function(d) {
//                return d.children || d._children ? "end" : "start";
//            })
//            .text(function(d) {
//                return d.name;
//            })
//            .style("fill-opacity", 0);
//
//        // phantom node to give us mouseover in a radius around it
//        nodeEnter.append("circle")
//            .attr('class', 'ghostCircle')
//            .attr("r", 30)
//            .attr("opacity", 0.2) // change this to zero to hide the target area
//        .style("fill", "red")
//            .attr('pointer-events', 'mouseover')
//            .on("mouseover", function(node) {
//                overCircle(node);
//            })
//            .on("mouseout", function(node) {
//                outCircle(node);
//            });
//
//        // Update the text to reflect whether node has children or not.
//        node.select('text')
//            .attr("x", function(d) {
//                return d.children || d._children ? -10 : 10;
//            })
//            .attr("text-anchor", function(d) {
//                return d.children || d._children ? "end" : "start";
//            })
//            .text(function(d) {
//                return d.name;
//            });
//
//        // Change the circle fill depending on whether it has children and is collapsed
//        node.select("circle.nodeCircle")
//            .attr("r", 4.5)
//            .style("fill", function(d) {
//                return d._children ? "lightsteelblue" : "#fff";
//            });
//
//        // Transition nodes to their new position.
//        var nodeUpdate = node.transition()
//            .duration(duration)
//            .attr("transform", function(d) {
//                return "translate(" + d.y + "," + d.x + ")";
//            });
//
//        // Fade the text in
//        nodeUpdate.select("text")
//            .style("fill-opacity", 1);
//
//        // Transition exiting nodes to the parent's new position.
//        var nodeExit = node.exit().transition()
//            .duration(duration)
//            .attr("transform", function(d) {
//                return "translate(" + source.y + "," + source.x + ")";
//            })
//            .remove();
//
//        nodeExit.select("circle")
//            .attr("r", 0);
//
//        nodeExit.select("text")
//            .style("fill-opacity", 0);
//
//        // Update the links…
//        var link = svgGroup.selectAll("path.link")
//            .data(links, function(d) {
//                return d.target.id;
//            });
//
//        // Enter any new links at the parent's previous position.
//        link.enter().insert("path", "g")
//            .attr("class", "link")
//            .attr("d", function(d) {
//                var o = {
//                    x: source.x0,
//                    y: source.y0
//                };
//                return diagonal({
//                    source: o,
//                    target: o
//                });
//            });
//
//        // Transition links to their new position.
//        link.transition()
//            .duration(duration)
//            .attr("d", diagonal);
//
//        // Transition exiting nodes to the parent's new position.
//        link.exit().transition()
//            .duration(duration)
//            .attr("d", function(d) {
//                var o = {
//                    x: source.x,
//                    y: source.y
//                };
//                return diagonal({
//                    source: o,
//                    target: o
//                });
//            })
//            .remove();
//
//        // Stash the old positions for transition.
//        nodes.forEach(function(d) {
//            d.x0 = d.x;
//            d.y0 = d.y;
//        });
//    }
//
//    // Append a group which holds all nodes and which the zoom Listener can act upon.
//    var svgGroup = baseSvg.append("g");
//
//    // Define the root
//    root = treeData;
//    root.x0 = viewerHeight / 2;
//    root.y0 = 0;
//
//    // Layout the tree initially and center on the root node.
//    update(root);
//    centerNode(root);
//});





































































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



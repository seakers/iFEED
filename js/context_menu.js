
// Context info: node, depth, logic(AND or OR)

class ContextMenu {
    
    constructor(feature_application){

        this.feature_application = feature_application;
        this.root = feature_application.data;
    
        this.marginRatio = 0.13;

        this.style = {
            'rect': {
                'mouseout': {
                    'fill': 'rgb(244,244,244)', 
                    'stroke': 'white', 
                    'stroke-width': '1px'
                }, 
                'mouseover': {
                    'fill': 'rgb(200,200,200)'
                }
            }, 
            'text': {
                'fill': 'steelblue', 
                'font-size': '17'
            }
        };      
        
        this.contextItems = {
            
            'logic':[{'value':'addChild','text':'Add feature'},
                     {'value':'toggle-logic','text':'Change to X'}],

            'logic-if-then':[{'value':'addToConditional','text':'Add feature to conditional'},
                    {'value':'addToConsequent','text':'Add feature to consequent'},
                    {'value':'cancelAddNode','text':'Cancel adding new node'},
                    {'value':'switchIfThen','text':'Switch conditional and consequent'}],

            'leaf':[],

            'featType': [{'value':'toggle-col-exp','text':'Collapse/Expand'}],
            
            'default':[{'value':'addParent','text':'Add parent branch'},
                        {'value':'addIfThen','text':'Add if-then statement'},
                        {'value':'duplicate','text':'Duplicate'},
                        {'value':'toggle-activation','text':'Activate/Deactivate'},
                        {'value':'delete','text':'Delete'}]
        };

        this.contextMenuSize = {
            
            'logic':{'height':null,
                    'width':null,
                    'margin':0.15,
                    'scaled':false},

            'ifThen':{'height':null,
                    'width':null,
                    'margin':0.15,
                    'scaled':false},

            'featType':{'height':null,
                    'width':null,
                    'margin':0.15,
                    'scaled':false},
            
            'leaf':{'height':null,
                    'width':null,
                    'margin':0.15,
                    'scaled':false}
        };
    }    

    showMenu (context, coord) {

        let parent = context.parent;
        let type = context.type;
        let logic = context.name;
        let depth = context.depth;    
        let add = context.add;
        let deactivated = context.deactivated;

        let hasChildren;
        if(context.children){
            hasChildren = context.children.length !== 0;
        }else{
            hasChildren = false;
        }

        let items = [];
        if(type === "logic" && logic === "IF_THEN"){
            items = this.contextItems["logic-if-then"];
        }else{
            items = this.contextItems[type];
        }        
        items = items.concat(this.contextItems['default']);
        
        let x,y;

        if(coord[0] >= 240){
            x = coord[0] - 105;
        } else{
            x = coord[0] + 80;
        }
        if(coord[1] < 370){
            y = coord[1] + 40;
        } else{
            if(type=="logic"){
                if(depth==0){
                    y = coord[1] - 180;
                }else{
                    y = coord[1] - 150;
                }                
            }else{
                y = coord[1]  - 120;
            }
        }

        d3.select('.context-menu').remove();
        this.scaleItems(context,items);
        
        // If the node is a logical connective, remove the 'addParent' and 'addIfThen' options. 
        // If the node is the root node, then keep the option 'addParent'
        if(type === 'logic' && depth != 0){
            let index;
            for(let i = 0; i < items.length; i++){
                if(items[i].value === 'addParent'){
                    index = i;
                    break;
                }
            }
            items.splice(index,1);
        } 

        if(type === 'logic'){
            let index;
            for(let i = 0; i < items.length; i++){
                if(items[i].value === 'addIfThen'){
                    index = i;
                    break;
                }
            }
            items.splice(index,1);
        }  

        if(parent){
            if(parent.type === "logic" && parent.name === "IF_THEN"){
                let index;
                for(let i = 0; i < items.length; i++){
                    if(items[i].value === 'addIfThen'){
                        index = i;
                        break;
                    }
                }
                items.splice(index,1);
            }
        }
        
        if(parent){
            if(type === 'leaf' 
                && parent.type === "logic" 
                && parent.name === "IF_THEN"){

                let index;
                for(let i = 0; i < items.length; i++){
                    if(items[i].value === 'duplicate'){
                        index = i;
                        break;
                    }
                }
                items.splice(index,1);
            }   
        }

        if(deactivated){
            let index;
            for(let i = 0; i < items.length; i++){
                if(items[i].value === 'duplicate'){
                    index = i;
                    break;
                }
            }
            items.splice(index,1);
        }

 
        let size;
        if(type === "logic" && logic === "IF_THEN"){
            size = this.contextMenuSize["ifThen"];
        }else{
            size = this.contextMenuSize[type];
        }
        let width = size.width;
        let height = size.height;
        let margin = size.margin;
        
        // Draw the menu
        let menu = d3.select('#feature_application')
            .select('svg')
            .append('g')
            .attr('class', 'context-menu')
            .selectAll('.tmp')
            .data(items)
            .enter()
            .append('g')
            .attr('class', 'menu-entry')
            .styles({'cursor': 'pointer'});

        let that = this;

        d3.selectAll('.menu-entry')
            .on('mouseover', function(d){ 
                d3.select(this).select('rect').styles(that.style.rect.mouseover) })
            .on('mouseout', function(d){ 
                d3.select(this).select('rect').styles(that.style.rect.mouseout) })
            .on('click', (d) => {
                this.ContextMenuAction(context, d.value);
            });
        
        d3.selectAll('.menu-entry')
            .append('rect')
            .attr('x', x)
            .attr('y', function(d, i){ return y + (i * height); })
            .attr('width', width)
            .attr('height', height)
            .styles(this.style.rect.mouseout);
        
        d3.selectAll('.menu-entry')
            .append('text')
            .text(function(d){             
                if(d.value === 'addChild'){
                    if(add){
                        return 'Cancel Add Feature';
                    }else{
                        return 'Add Feature';
                    }
                   
                }else if(d.value === 'toggle-logic'){
                    if(logic === 'AND'){
                        return 'Change to OR';
                    }else{
                        return 'Change to AND';
                    }
                }else if(d.value === 'toggle-activation'){
                    if(deactivated){
                        return 'Activate';
                    }else{
                        return 'Deactivate';
                    }
                }else if(d.value === 'toggle-col-exp'){
                    if(hasChildren){
                        return 'Collapse';
                    }else{
                        return 'Expand';
                    }
                }else{
                    return d.text; 
                }
            })
            .attr('x', x)
            .attr('y', function(d, i){ return y + (i * height); })
            .attr('dy', height - margin / 2)
            .attr('dx', margin)
            .styles(this.style.text);

        // Other interactions
        d3.select('body')
            .on('click', function() {
                d3.select('.context-menu').remove();
            });
    }
    
    // Automatically set width, height, and margin;
    scaleItems(context, items) {
        
        let type = context.type;
        let logic = context.name;
        let depth = context.depth;

        if(type === "logic" && logic === "IF_THEN"){
            type = "ifThen";
        }         
        
        if(!this.contextMenuSize[type]['scaled']){

            let temp = d3.select('#feature_application')
                .select('svg')
                .select('g')
                .selectAll('.tmp')
                .data(items)
                .enter()
                .append('text')
                .text(function(d){ return d.text; });

            temp.attr('x', -1000)
                .attr('y', -1000)
                .attr('class', 'tmp');

            temp.styles(this.style.text);

            let z = d3.select('#feature_application')
                .select('svg')
                .select('g')
                .selectAll('.tmp')
                .nodes()
                .map(function(x){ return x.getBBox(); });
            
            let width = d3.max(z.map(function(x){ return x.width; }));
            let margin = this.marginRatio * width;
            width =  width + 2 * margin;
            let height = d3.max(z.map(function(x){ return x.height + margin / 2; }));

            this.contextMenuSize[type]['width'] = width;
            this.contextMenuSize[type]['height'] = height;
            this.contextMenuSize[type]['margin'] = margin;
            this.contextMenuSize[type]['scaled'] = true;

            // cleanup
            d3.select('#feature_application').selectAll('.tmp').remove();                        
        }
    }
    
    ContextMenuAction(context, option){

        let feature_application = this.feature_application;
        let root = feature_application.data;
        
        let visit_nodes = feature_application.visit_nodes;
        let construct_tree = feature_application.construct_tree;
        let construct_node = feature_application.construct_node;
        let parse_tree = feature_application.parse_tree;

        let node = context;
        let nodeID = node.id;
        let parent = node.parent;

        // 'logic':[addChild, toggle-logic],     
        // 'leaf':[],
        // 'default':[addParent,duplicate,toggle-activation,delete]

        if(node.type === 'logic'){

            switch(option) { // Logical connective node
                case 'addChild':
                    if(node.add){
                        node.add = false;
                    }else{
                        visit_nodes(feature_application.data, (d) => {
                            if(d.id === nodeID){
                                d.add = true;
                            }else{
                                d.add = false;
                            }
                        });
                    }
                    break;

                case 'toggle-logic':
                    if(node.name === 'AND'){
                        node.name = 'OR';
                    }else{
                        node.name = 'AND';
                    }
                    break;

                case 'addToConditional':
                    visit_nodes(feature_application.data, (d) => {
                        d.add = false;
                    });
                    node.add = true;
                    node.addToConditional = true;
                    node.addToConsequent = false;
                    break;

                case 'addToConsequent':
                    visit_nodes(feature_application.data, (d) => {
                        d.add = false;
                    });
                    node.add = true;
                    node.addToConditional = false;
                    node.addToConsequent = true;
                    break;

                case 'cancelAddNode':
                    node.add = false;
                    node.addToConditional = false;
                    node.addToConsequent = false;
                    break;

                case 'switchIfThen':
                    let conditional = node.children[0];
                    let consequent = node.children[1];
                    node.children = [consequent, conditional];

                default:
                    break;
            }
        }else{
            switch(option) { // Leaf node
                default:
                    break;
            }

        }

        // Default options
        switch(option) {

            case 'addParent':

                if(parent){ 
                    // This is a leaf node because of the condition set up previously (logic nodes do not have option to add parent)
                    let index = parent.children.indexOf(node);

                    let logic = parent.name;
                    let depth = node.depth;

                    if(logic === "AND"){
                        logic = "OR";    
                    }else{
                        logic = "AND";
                    }
                    let tempNode = construct_node(feature_application, depth, "logic", logic, [node], parent);
                    parent.children.splice(index, 1, tempNode);

                }else{ 
                    // The current node is either the root node or a leaf node without parent
                    let logic = node.name; 
                    if(logic === "AND"){
                        logic = "OR";    
                    }else{
                        logic = "AND";
                    }
                    feature_application.data = construct_node(feature_application, 0, "logic", logic, [node], null);
                }
                break;

            case 'addIfThen':

                if(parent){ 
                    let index = parent.children.indexOf(node);
                    let logic = parent.name;
                    let depth = node.depth;
                    let tempIfThenNode = construct_node(feature_application, depth, "logic", "IF_THEN", [node], parent);
                    parent.children.splice(index, 1, tempIfThenNode);

                    // Deactivate if-then node as it is missing either the conditional or the consequent part
                    visit_nodes(tempIfThenNode, function(d){
                        d.deactivated = true;
                    });

                }else{ 
                    feature_application.data = construct_node(feature_application, 0, "logic", "IF_THEN", [node], null);

                    // Deactivate if-then node as it is missing either the conditional or the consequent part
                    visit_nodes(feature_application.data, function(d){
                        d.deactivated = true;
                    });
                }

                this.display_ifThen_deactivation_message();
                break;

            case 'duplicate':
                if(parent){
                    let index = parent.children.indexOf(node);
                    let logic = parent.name;
                    let depth = node.depth;

                    if(logic=="AND"){
                        logic = "OR";    
                    }else{
                        logic = "AND";
                    }

                    let duplicate = construct_tree(feature_application, parse_tree(node), depth);     
                    let tempNode = construct_node(feature_application, depth, "logic", logic, [duplicate], parent);
                    parent.children.splice(index, 0, tempNode);
                    tempNode.parent = parent;
                    duplicate.parent = tempNode;
                }
                break;

            case 'toggle-activation':

                if(node.deactivated){
                    // Activate all parent nodes
                    visit_nodes(node,function(d){
                        d.deactivated = false;
                    }, true);

                    // Activate all children nodes
                    visit_nodes(node,function(d){
                        d.deactivated = false;
                    });

                }else{                
                    // Deactivate all descendant nodes
                    visit_nodes(node,function(d){
                        d.deactivated = true;
                    });

                    // Deactivate a node whose children are all deactivated
                    visit_nodes(node, function(d){
                        if(d.children){
                            let all_children_deactivated = true;
                            for(let i = 0; i < d.children.length; i++){
                                if(d.children[i].deactivated !== true){
                                    all_children_deactivated = false;
                                }
                            }
                            if(all_children_deactivated){
                                d.deactivated = true;
                            }
                        }
                    }, true);
                }

                // Deactivate IF_THEN node if either the conditional or the consequent parts are missing
                let deactivated_ifThen_nodes = [];
                visit_nodes(node, function(d){
                    if(d.type === 'logic' && d.name === 'IF_THEN'){
                        if(d.children.length >= 2){
                            if(d.children[0].deactivated === true || d.children[1].deactivated === true){
                                d.deactivated = true; 
                                deactivated_ifThen_nodes.push(d);                               
                            }
                        }else{
                            d.deactivated = true;
                            deactivated_ifThen_nodes.push(d);          
                        }
                    }
                }, true);

                if(deactivated_ifThen_nodes.length !== 0){
                    for(let i = 0; i < deactivated_ifThen_nodes.length; i++){
                        let thisNode = deactivated_ifThen_nodes[i];
                        // deactivate all children nodes
                        visit_nodes(thisNode, function(d){
                            d.deactivated = true;
                        });
                    }
                }
                break;

            case 'toggle-col-exp':
                if(node.children){
                    node._children = node.children;
                    node.children = [];

                }else{                
                    node.children = node._children;
                    node._children = [];
                } 
                break;

            case 'delete':
                if(node.depth === 0){
                    feature_application.data = null;

                }else{
                    let index = parent.children.indexOf(node);
                    if (index > -1) {
                        parent.children.splice(index, 1);
                    }

                    if(parent.type === 'logic' && parent.name === 'IF_THEN'){
                        if(parent.children.length < 2){
                            // Deactivate if-then node as it does not have either the conditional or the consequent part
                            visit_nodes(parent, function(d){
                                d.deactivated = true;
                            });
                            this.display_ifThen_deactivation_message();
                        }
                    }
                }
                break;

            default:
                break;
        }    

        feature_application.update();   
        PubSub.publish(ADD_FEATURE_FROM_EXPRESSION, {expression:feature_application.parse_tree(root), replaceEquivalentFeature:true});       
    }

    display_ifThen_deactivation_message(){
        iziToast.show({
            theme: 'dark',
            icon: 'icon-person',
            title: 'To activate IF-THEN node: ',
            titleSize: 22,
            message: 'please add a feature in the conditional part by right-clicking '
                        + 'the IF-THEN node and selecting add "Add feature to conditional" option.',
            messageSize: 18,
            messageLineHeight: 30,
            position: 'bottomRight', // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter
            progressBarColor: 'rgb(0, 255, 184)',
            timeout: 6000,
        });
    }
}

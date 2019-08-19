
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
            'logic':[{'value':'addChild','text':'Add child node here'},
                     {'value':'toggle-logic','text':'Change to X'}],

            'logic-if-then':[{'value':'addToConditional','text':'Add feature to conditional'},
                    {'value':'addToConsequent','text':'Add feature to consequent'},
                    {'value':'cancelAddNode','text':'Cancel adding new node'},
                    {'value':'switchIfThen','text':'Switch conditional and consequent'},
                    ],

            'leaf':[
                    {'value': 'modifyBaseFeature', 'text': 'toggle feature modification mode'},
                    {'value': 'copyToFilter', 'text': 'Copy this to filter setting'}
                    ],

            'featType': [{'value':'toggle-col-exp','text':'Collapse/Expand'}],
            
            'default':[
                        {'value': 'generalizeFeature', 'text': 'Generalize this feature'},
                        {'value': 'applyFeatureBranch', 'text': 'Apply this feature'},
                        {'value':'addParent','text':'Add parent node'},
                        // {'value':'addIfThen','text':'Add if-then statement'},
                        // {'value':'duplicate','text':'Duplicate'},
                        {'value':'toggle-activation','text':'Activate/Deactivate'},
                        {'value':'delete','text':'Delete'}
                    ]
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

        // EXPERIMENT
        this.experimentStage = feature_application.experimentStage;
        this.experimentCondition = feature_application.experimentCondition;;
        this.experimentGeneralizationEnabled = feature_application.experimentGeneralizationEnabled;;
    }    

    showMenu (context, coord) {
        let parent = context.parent;
        let type = context.type;
        let logic = context.name;
        let depth = context.depth;    
        let deactivated = context.deactivated;

        let hasChildren = null;
        if(context.children){
            hasChildren = context.children.length !== 0;
        }else{
            hasChildren = false;
        }

        let isBeingModified = false;
        if(this.feature_application.featureModificationModeOn){
            if(type === "leaf"){
                if(context.highlighted){
                    isBeingModified = true;
                }
            }else if(type === "logic"){
                if(context.highlighted){
                    let childNodeHighlighted = false;
                    for(let i = 0; i < context.children.length; i++){
                        if(context.children[i].highlighted){
                            // Child node is being modified, not the current node
                            childNodeHighlighted = true;
                            break;
                        }
                    }
                    if(!childNodeHighlighted){
                        isBeingModified = true;
                    }
                }
            }
        }

        let items = [];
        if(type === "logic" && logic === "IF_THEN"){
            items = this.contextItems["logic-if-then"];
        }else{
            items = this.contextItems[type];
        }        
        items = items.concat(this.contextItems['default']);
        
        let x,y;
        let containerHeight = parseInt(d3.select("#feature_application_panel").select("svg").style("height"), 10);
        let containerWidth = parseInt(d3.select("#feature_application_panel").style("width"), 10);

        if(coord[0] < containerWidth * 1.00){
            x = coord[0] + 90;
        } else{
            x = coord[0] - 200;
        }
    
        if(coord[1] < containerHeight * 0.6){
            y = coord[1] + 40;
        } else{
            if(type === "logic"){
                y = coord[1] - 150;               
            }else{
                y = coord[1]  - 250;
            }
        }

        d3.selectAll('#tooltip_g').remove();
        d3.select('.context-menu').remove();
        this.scaleItems(context,items);
        
        // If the node is a logical connective, remove the 'addParent' and 'addIfThen' options. 
        // If the node is the root node, then keep the option 'addParent'
        if(type === 'logic' && depth !== 0){
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
            let index = null;
            for(let i = 0; i < items.length; i++){
                if(items[i].value === 'addIfThen'){
                    index = i;
                    break;
                }
            }
            if(index){
               items.splice(index,1); 
            }   
        }

        if(parent){
            if(parent.type === "logic" && parent.name === "IF_THEN"){
                let index = null;
                for(let i = 0; i < items.length; i++){
                    if(items[i].value === 'addIfThen'){
                        index = i;
                        break;
                    }
                }
                if(index){
                    items.splice(index,1);
                }
            }
        }
        
        if(parent){
            if(type === 'leaf' 
                && parent.type === "logic" 
                && parent.name === "IF_THEN"){

                let index = null;
                for(let i = 0; i < items.length; i++){
                    if(items[i].value === 'duplicate'){
                        index = i;
                        break;
                    }
                }
                if(index){
                    items.splice(index,1);
                }
            }   
        }

        if(deactivated){
            let index = null;
            for(let i = 0; i < items.length; i++){
                if(items[i].value === 'duplicate'){
                    index = i;
                    break;
                }
            }
            if(index){
                items.splice(index,1);
            }   
        }

        // EXPERIMENT
        if(this.experimentStage){ // Remove option to interactively generalize a feature
            let removeGeneralizationOption = false;
            if(!this.experimentGeneralizationEnabled){
                removeGeneralizationOption = true;
            } else {
                if(this.experimentStage !== "tutorial" && this.experimentStage !== "learning"){
                    removeGeneralizationOption = true;
                }

                if(this.experimentCondition.indexOf("interactive") === -1){
                    removeGeneralizationOption = true;
                }
            }

            if(removeGeneralizationOption){
                let index = null;
                for(let i = 0; i < items.length; i++){
                    if(items[i].value === 'generalizeFeature'){
                        index = i;
                        break;
                    }
                }
                if(index){
                    items.splice(index,1);
                } 
            }
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
                    if(isBeingModified){
                        return 'Cancel adding child node';
                    }else{
                        return 'Add child node here';
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
                }else if(d.value === 'modifyBaseFeature'){
                    if(isBeingModified){
                        return 'Cancel modifying this feature';
                    }else{
                        return 'Modify this feature';
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
        let that = this;

        let feature_application = this.feature_application;
        let root = feature_application.data;
        
        let visit_nodes = feature_application.visit_nodes;
        let construct_tree = feature_application.construct_tree;
        let construct_node = feature_application.construct_node;
        let parse_tree = feature_application.parse_tree;

        let node = context;
        let type = node.type;
        let nodeID = node.id;
        let parent = node.parent;

        let isBeingModified = false;
        if(feature_application.featureModificationModeOn){
            if(type === "leaf"){
                if(node.highlighted){
                    isBeingModified = true;
                }
            }else if(type === "logic"){
                if(node.highlighted){
                    let childNodeHighlighted = false;
                    for(let i = 0; i < node.children.length; i++){
                        if(node.children[i].highlighted){
                            // Child node is being modified, not the current node
                            childNodeHighlighted = true;
                            break;
                        }
                    }
                    if(!childNodeHighlighted){
                        isBeingModified = true;
                    }
                }
            }
        }

        feature_application.visit_nodes(root, function(d){
            d.highlighted = false;
        });

        let updateOption = {add_to_feature_space_plot: true, replace_equivalent_feature: true};

        if(node.type === 'logic'){

            switch(option) { // Logical connective node
                case 'addChild':
                    if(isBeingModified){ // Cancel adding child node to the current logical connective node
                        PubSub.publish(END_FEATURE_MODIFICATION_MODE, null);

                    }else{
                        feature_application.featureModificationModeOn = false;
                        visit_nodes(root, function(d){
                            d.highlighted = false;
                        });

                        // Highlight the current node
                        node.highlighted = true;

                        let data = {
                            root: feature_application.parse_tree(root), 
                            parent: feature_application.parse_tree(node),
                            node: null,
                            addition: true    
                        }

                        // Send information to the filter
                        PubSub.publish(SET_FEATURE_MODIFICATION_MODE, data); 
                    }
                    updateOption.add_to_feature_space_plot = false;

                    // EXPERIMENT 
                    PubSub.publish(EXPERIMENT_TUTORIAL_EVENT, "contextmenu_add_feature");
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

                case 'modifyBaseFeature':
                    if(isBeingModified){ // 
                        PubSub.publish(END_FEATURE_MODIFICATION_MODE, null);

                    }else{
                        feature_application.featureModificationModeOn = false;
                        visit_nodes(root, function(d){
                            d.highlighted = false;
                        });

                        // Highlight the parent node and the node being modified
                        node.highlighted = true;
                        if(node.parent){
                            node.parent.highlighted = true;
                        }

                        let data = {
                            root: feature_application.parse_tree(root), 
                            parent: feature_application.parse_tree(node),
                            node: node.name,
                            addition: false    
                        }

                        // Send information to the filter
                        PubSub.publish(SET_FEATURE_MODIFICATION_MODE, data); 
                    }
                    updateOption.add_to_feature_space_plot = false;


                    // EXPERIMENT 
                    PubSub.publish(EXPERIMENT_TUTORIAL_EVENT, "contextmenu_modify_feature");  
                    break;

                case 'copyToFilter':
                    // Send information to the filter
                    PubSub.publish(COPY_BASE_FEATURE_TO_FILTER, node.name); 
                    updateOption.add_to_feature_space_plot = false;
                    break;

                default:
                    break;
            }
        }

        // Default options
        switch(option) {
            case 'generalizeFeature':
                feature_application.start_loading_animation();
                let rootExpression = feature_application.parse_tree(root);
                let nodeExpression = feature_application.parse_tree(node);
                let userInitiated = true;
                feature_application.data_mining.generalize_feature(rootExpression, nodeExpression, userInitiated);
                break;

            case 'applyFeatureBranch':
                feature_application.update_feature_application('direct-update', feature_application.parse_tree(node));
                updateOption = null;
                break;

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

                updateOption.add_to_feature_space_plot = false;
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

        if(!updateOption){
            return;
        } else {
            feature_application.update(updateOption);   
        }        
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

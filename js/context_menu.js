
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
            
            'logic':[{'value':'addChild','text':'Add Feature'},
                     {'value':'toggle-logic','text':'Change to X'}],
            
            'leaf':[],
            
            'default':[{'value':'addParent','text':'Add Parent Branch'},{'value':'duplicate','text':'Duplicate'},{'value':'toggle-activation','text':'Activate/Deactivate'},{'value':'delete','text':'Delete'}]
        };

        this.contextMenuSize = {
            
            'logic':{'height':null,
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

        let type = context.type;
        let logic = context.name;
        let depth = context.depth;    
        let add = context.add;
        let deactivated = context.deactivated;

        let items = this.contextItems[type];
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
        
        if(type === 'logic' && depth != 0){
            // If the node is a logical connective, remove the 'addParent' option. If the node is the root node, then keep the option
            let index;
            for(let i = 0; i < items.length; i++){
                if(items[i].value === 'addParent'){
                    index = i;
                    break;
                }
            }
            items.splice(index,1);
        }    
        
        let size = this.contextMenuSize[type];
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
    scaleItems(context,items) {
        
        let type = context.type;
        let logic = context.name;
        let depth = context.depth;         
        
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
    
    
    ContextMenuAction(context,option){

        let node = context;

        let visit_nodes = this.feature_application.visit_nodes;
        let construct_tree = this.feature_application.construct_tree;
        let parse_tree = this.feature_application.parse_tree;

        let nodeID = node.id;
        let parent = node.parent;

    // 'logic':[addChild, toggle-logic],     
    // 'leaf':[],
    // 'default':[addParent,duplicate,toggle-activation,delete]

        if(node.type=='logic'){

            switch(option) { // Logical connective node
                case 'addChild':

                    if(node.add){
                        node.add = false;
                        
                    }else{
                        visit_nodes(this.feature_application.data, (d) => {
                            if(d.id === nodeID){
                                d.add = true;
                            }else{
                                d.add = false;
                            }
                        })
                    }
                    break;

                case 'toggle-logic':

                    if(node.name === 'AND'){
                        node.name = 'OR';
                    }else{
                        node.name = 'AND';
                    }
                    break;

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
                    parent.children.splice(index, 1, {id:this.feature_application.i++, depth:depth, type:"logic", name:logic, children:[node], parent: parent});

                }else{ 
                    // This is the root node
                    let logic = node.name; 

                    if(logic === "AND"){
                        logic = "OR";    
                    }else{
                        logic = "AND";
                    }
                    this.feature_application.data = {id:this.feature_application.i++, depth:0, type:"logic", name:logic, children:[node], parent: null};
                }
  
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

                    let duplicate = construct_tree(parse_tree(node));     
                    duplicate.id = this.feature_application.i++;

                    parent.children.splice(index, 0, {id:this.feature_application.i++, depth:depth, type:"logic",name:logic, children:[duplicate], parent:parent});
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
                }     

                break;

            case 'delete':

                if(node.depth === 0){
                    this.feature_application.data = null;

                }else{
                    let index = parent.children.indexOf(node);
                    if (index > -1) {
                        parent.children.splice(index, 1);
                    }
                }
                break;

            default:
                break;
        }    

        let root = this.feature_application.data;
        let exp = this.feature_application.parse_tree(root);

        this.feature_application.update();
        
        PubSub.publish(ADD_FEATURE, this.feature_application.parse_tree(root));
        
        //PubSub.publish(DRAW_VENN_DIAGRAM, this.feature_application.parse_tree(root)); 
    }
    




}








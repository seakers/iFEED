
// Context info: node, depth, logic(AND or OR)

function ContextMenu(feature_application) {
    
    
    var self = this;
    
    var marginRatio = 0.13,
        //items = [], 
        style = {
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
        },
    
    
        contextItems = {
            
            'logic':[{'value':'addChild','text':'Add Feature'},
                     {'value':'toggle-logic','text':'Change to X'}],
            
            'leaf':[],
            
            'default':[{'value':'addParent','text':'Add Parent Branch'},{'value':'duplicate','text':'Duplicate'},{'value':'toggle-activation','text':'Activate/Deactivate'},{'value':'delete','text':'Delete'}]
        }, 
    

    
        contextMenuSize = {
            
            'logic':{'height':null,
                    'width':null,
                    'margin':0.15,
                    'scaled':false},
            
            'leaf':{'height':null,
                    'width':null,
                    'margin':0.15,
                    'scaled':false}
        };

    
    
    function menu(context, coord) {
        
        var type = context.type;
        var logic = context.name;
        var depth = context.depth;    
        var add = context.add;
        var deactivated = context.deactivated;
        
        var items = contextItems[type];
        items = items.concat(contextItems['default']);
        
        var x,y;
        if(type=='logic' || depth==0){
            x = coord[0]+80;
            y = coord[1]+40;
        }else{
            x = coord[0]-105;
            y = coord[1]+40;
        }
        
        d3.select('.context-menu').remove();
        scaleItems(context,items);
        
        if(type=='logic' && depth != 0){
            // If the node is a logical connective, remove the 'addParent' option. If the node is the root node, then keep the option
            var index;
            for(var i=0;i<items.length;i++){
                if(items[i].value=='addParent'){
                   index=i;
                    break;
                }
            }
            items.splice(index,1);
        }    
        
        var size = contextMenuSize[type];
        var width = size.width;
        var height = size.height;
        var margin = size.margin;

        
        // Draw the menu
        d3.select('#feature_application_status').select('svg')
            .append('g').attr('class', 'context-menu')
            .selectAll('tmp')
            .data(items).enter()
            .append('g').attr('class', 'menu-entry')
            .style({'cursor': 'pointer'})
            .on('mouseover', function(){ 
                d3.select(this).select('rect').style(style.rect.mouseover) })
            .on('mouseout', function(){ 
                d3.select(this).select('rect').style(style.rect.mouseout) })
            .on('click', function(d){
                ContextMenuAction(context,d.value);
            });
        
        d3.selectAll('.menu-entry')
            .append('rect')
            .attr('x', x)
            .attr('y', function(d, i){ return y + (i * height); })
            .attr('width', width)
            .attr('height', height)
            .style(style.rect.mouseout);
        
        d3.selectAll('.menu-entry')
            .append('text')
            .text(function(d){ 
            
                if(d.value=='addChild'){
                    
                    if(add){
                        return 'Cancel Add Feature';
                    }else{
                        return 'Add Feature';
                    }
                   
                }else if(d.value=='toggle-logic'){
                    if(logic=='AND'){
                        return 'Change to OR';
                    }else{
                        return 'Change to AND';
                    }
                }else if(d.value=='toggle-activation'){
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
            .style(style.text);

        // Other interactions
        d3.select('body')
            .on('click', function() {
                d3.select('.context-menu').remove();
            });
        
    }
    
    
    // Automatically set width, height, and margin;
    function scaleItems(context,items) {
        
        var type = context.type;
        var logic = context.name;
        var depth = context.depth;         
        
        if(!contextMenuSize[type]['scaled']){

            d3.select('#feature_application_status')
                .select('svg').select('g')
                .selectAll('tmp')
                .data(items).enter()
                .append('text')
                .text(function(d){ return d.text; })
                .style(style.text)
                .attr('x', -1000)
                .attr('y', -1000)
                .attr('class', 'tmp');

            var z = d3.select('#feature_application_status').select('svg').select('g').selectAll('.tmp')[0]
                      .map(function(x){ return x.getBBox(); });
            
            var width = d3.max(z.map(function(x){ return x.width; }));
            var margin = marginRatio * width;
            width =  width + 2 * margin;
            var height = d3.max(z.map(function(x){ return x.height + margin / 2; }));

            contextMenuSize[type]['width'] = width;
            contextMenuSize[type]['height'] = height;
            contextMenuSize[type]['margin'] = margin;
            contextMenuSize[type]['scaled'] = true;

            // cleanup
            d3.select('#feature_application_status').selectAll('.tmp').remove();                        
        }

    }
    return menu;
    
    



    function ContextMenuAction(context,option){

        var node = context;

    // 'logic':[addChild, toggle-logic],     
    // 'leaf':[],
    // 'default':[addParent,duplicate,toggle-activation,delete]

        if(node.type=='logic'){

            switch(option) { // Logical connective node
                case 'addChild':

                    if(node.add){
                        node.add=false;
                    }else{
                        var id = node.id;
                        feature_application.visit_nodes(feature_application.root,function(d){
                            if(d.id==id){
                                d.add=true;
                            }else{
                                d.add=false;
                            }
                        })
                    }
                    break;

                case 'toggle-logic':

                    if(node.name=='AND'){
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
                if(node.parent){ // This is a leaf node because of the condition set up previously

                    var index = node.parent.children.indexOf(node);
                    var logic = node.parent.name;
                    var depth = node.depth;

                    if(logic=="AND"){
                        logic = "OR";    
                    }else{
                        logic = "AND";
                    }
                    node.parent.children.splice(index,1,{depth:depth,type:"logic",name:logic,children:[node]});

                }else{ // This is the root node

                    var logic = node.name; 
                    if(logic=="AND"){
                        logic = "OR";    
                    }else{
                        logic = "AND";
                    }

                    var x0 = root.x0;
                    var y0 = root.y0;

                    root = {depth:0,type:"logic",name:logic,children:[node],x0:x0,y0:y0};
                }

                break;


            case 'duplicate':
                if(node.parent){
                    var index = node.parent.children.indexOf(node);
                    var logic = node.parent.name;
                    var depth = node.depth;

                    if(logic=="AND"){
                        logic = "OR";    
                    }else{
                        logic = "AND";
                    }

                    var duplicate = feature_application.construct_tree(feature_application.parse_tree(node));                
                    node.parent.children.splice(index,0,{depth:depth,type:"logic",name:logic,children:[duplicate]});

                }              
                break;

            case 'toggle-activation':

                if(node.deactivated){
                    // Activate all parent nodes
                    visit_nodes(node,function(d){
                        d.deactivated=false;
                    },true);

                }else{                
                    // Deactivate all descendant nodes
                    visit_nodes(node,function(d){
                        d.deactivated=true;
                    });
                }     

                break;

            case 'delete':

                if(node.depth==0){
                    root=null;
                }else{
                    var index = node.parent.children.indexOf(node);
                    if (index > -1) {
                        node.parent.children.splice(index, 1);
                    }
                }
                break;

            default:
                break;
        }    

        feature_application.update(feature_application.root);
        feature_application.check_tree_structure();
        
//        applyComplexFilter(parse_tree(root));
//        add_feature_to_plot(parse_tree(root));
//        draw_venn_diagram();   

    }




    
    
    
    
    
}








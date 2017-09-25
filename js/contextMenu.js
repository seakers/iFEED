

function contextMenu() {
    
    var marginRatio = 0.13,
        items = [], 
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
        }
    
        contextOptions = ['logic','leaf'];
        contextItems = {'logic':[{'value':'add','text':'Add new features here'},{'value':'toggle','text':'Toggle logical connective'},{'value':'deactivate','text':'Deactivate this branch'},{'value':'delete','text':'Delete this branch'}],
                 'leaf':[{'value':'deactivate','text':'Deactivate this node'},{'value':'delete','text':'Delete this node'}]}; 
    
        contextMenuSize = {'logic':{
                                'height':null,
                                'width':null,
                                'margin':0.15,
                                'scaled':false
                            },
                            'leaf':{
                                'height':null,
                                'width':null,
                                'margin':0.15,
                                'scaled':false
                            }};

    
    function menu(context,coord, data) {
        
        items = contextItems[context]
        var x,y;
        
        if(context=='logic'){
            x = coord[0]+80;
            y = coord[1]+55;
        }else{
            x = coord[0]-135;
            y = coord[1]+55;
        }
        
        d3.select('.context-menu').remove();
        scaleItems(context);
        
        var size = contextMenuSize[context];
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
                contextMenuAction(context,d.value,data);
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
            .text(function(d){ return d.text; })
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
    function scaleItems(context) {
        
        if(!contextMenuSize[context]['scaled']){

            d3.select('#feature_application_status')
                .select('svg').select('g')
                .selectAll('tmp')
                .data(contextItems[context]).enter()
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

            contextMenuSize[context]['width'] = width;
            contextMenuSize[context]['height'] = height;
            contextMenuSize[context]['margin'] = margin;
            contextMenuSize[context]['scaled'] = true;

            // cleanup
            d3.select('#feature_application_status').selectAll('.tmp').remove();                        
        }

    }

    return menu;
}




var menu = contextMenu();



function contextMenuAction(context,option,data){
    
    var node = data;
    
    if(context=='logic'){
        
        switch(option) {
            case 'add':
                
                var id = node.id;
                visit_nodes(root,function(d){
                    if(d.id==id){
                        d.add=true;
                    }else{
                        d.add=false;
                    }
                })
                break;
                
            case 'toggle':
                if(node.name=='AND'){
                    node.name = 'OR';
                }else{
                    node.name = 'AND';
                }
                break;
                
            default:
                break;
        }
    }
    
    switch(option) {
        case 'deactivate':
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
    
    update(root);
    check_tree_structure();
}


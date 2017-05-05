
var features_activation_store = [];
var featureID = 0;    
var indentation_margin = 30;


function decompose_feature(input_level, input_logic, input_expression, feature_list, logic_indent_levels){
    
    //var individual_feature = {level:null,logic:null,expression:null};
    
	var e = input_expression;
    var lo = input_logic;
    var l = +input_level;
    
    // Remove outer parenthesis
	var paren_removed = remove_outer_parentheses(e,l);
    e = paren_removed.expression;
    l = +paren_removed.level;
    
    var first = true;
    var e_collapsed;
        
    if(get_nested_parenthesis_depth(e)==0){
        // Given expression does not have a nested structure
        if(e.indexOf("&&")>-1 || e.indexOf("||")>-1){
        	// Logical connectives are present
            e_collapsed=e; 
        }else{
            feature_list.push({level:l,logic:lo,expression:e}); 
            return {features:feature_list,logic_indent_levels:logic_indent_levels};
        }
    }else{
        // Removes the nested structure
        e_collapsed = collapse_paren_into_symbol(e);
    }

    while(true){
        var current_collapsed;
        var prev;
        
        if(first){
            // The first filter in a series to be applied
            prev = input_logic;
            first = false;
        }else{
            logic_indent_levels.push(l);
            prev = e_collapsed.substring(0,2);
            e_collapsed = e_collapsed.substring(2);
            e = e.substring(2);
        }
        
        var next; // The imediate next logical connective
        var and = e_collapsed.indexOf("&&");
        var or = e_collapsed.indexOf("||");
        if(and==-1 && or==-1){
            next = "";
        } else if(and==-1){ 
            next = "||";
        } else if(or==-1){
            next = "&&";
        } else if(and < or){
            next = "&&";
        } else{
            next = "||";
        }
        
        if(next.length!==0){
            if(next=="||"){
                current_collapsed = e_collapsed.split("||",1)[0];
            }else{
                current_collapsed = e_collapsed.split("&&",1)[0];
            }
            var current = e.substring(0,current_collapsed.length);
            e_collapsed = e_collapsed.substring(current_collapsed.length);
            e = e.substring(current_collapsed.length);
            out = decompose_feature(l,prev,current,feature_list,logic_indent_levels);
            feature_list = out.features;
        }else{         
            out = decompose_feature(l,prev,e,feature_list,logic_indent_levels);
            feature_list = out.features;
            break;
        }
    }
    return {features:feature_list,logic_indent_levels:logic_indent_levels};
}



function create_feature_placeholder(){

    var features = current_feature_application;
    
    // If the placeholder already exists, return
    for(var i=0;i<features.length;i++){
        var expression = features[i].expression;
        if(expression.indexOf('FeatureToBeAdded')>-1){
            return;
        }
    }
    
    // Add a new feature
    var feature = {activation:true, expression:'{FeatureToBeAdded}', logic:'&&', level:0, logic_indent_level:0};
    features.push(feature);
    
    // Make an update to the display
    display_feature_application_status([feature]);
    update_feature_expression();
}
     


function add_feature(input_level, input_logic, input_expression, activation, logic_indent_level){    
        
    var applied_features = d3.select('#applied_feature_div');
    var id = featureID++;
    var this_feature;
    

    // If the placeholder is not given, create a new entry
    this_feature = applied_features
            .append('div');
    
    // Define new feature id
    this_feature.attr('id',function(){
                return 'applied_feature_' + id;
            })
            .attr('class','applied_feature');
    
    var logical_connective = this_feature.append('div')
                                .attr('class','logical_connective');
    
    var feature_expression = this_feature.append('div')
                                .attr('class','feature_expression');
    
    // Append activation checkbox
    feature_expression
            .append('input')
            .attr('type','checkbox')
            .attr('class','feature_application_activate')
            .on("change",function(d){

                // If the checkbox is checked, color it black. Otherwise, make it gray
                var activated = this_feature.select('.feature_application_activate')[0][0].checked;
        
                this_feature.select('.feature_application_expression').style("color",function(d){
                    if(activated){
                        return "#000000"; //black
                    }else{
                        return "#989898"; // gray
                    }
                });
        
                // Store the change in the variable
                current_feature_application = get_feature_application_status();
        
                adjust_logical_connective();

                // Reflect the change in the scatter plot
                apply_current_feature_scheme();
                
                // Reflect the change in the displayed expression
                update_feature_expression();
            });
    

    var is_first_feature = null;
    
    if(d3.selectAll('.applied_feature')[0].length==1){
        // This is the first feature to be added
        // Skip adding the logical connective
        is_first_feature = true;
    }else{
        is_first_feature = false;
        
        logical_connective.append('select')
                .attr('class','feature_application_logical_connective')
                .selectAll('option')
                .data([{value:"&&",text:"AND"},{value:"||",text:"OR"}])
                .enter()
                .append("option")
                .attr("value",function(d){
                    return d.value;
                })
                .text(function(d){
                    return d.text;
                }); 
        
        logical_connective.select('.feature_application_logical_connective').on("change",function(d){

            current_feature_application = get_feature_application_status();
            apply_current_feature_scheme();

            update_feature_expression();

        });

        // Append arrows for adjusting the location of each expression
        logical_connective.append('img')
                .attr('src','img/left.png')
                .attr('id',function(){
                    return 'left_arrow_' + id;
                })
                .attr('class','left_arrow arrow')
                .attr('width','20')
                .attr('height','17')
                .on("click",function(d){
                    click_left_arrow(this.parentNode);
                });

        logical_connective.append('img')
                .attr('src','img/right.png')
                .attr('id',function(){
                    return 'right_arrow_' + id;
                })
                .attr('class','right_arrow arrow')
                .attr('width','20')
                .attr('height','17')
                .on("click",function(d){
                   click_right_arrow(this.parentNode);
                });
    }

    var displayed_text = "";
    if(input_expression=='{FeatureToBeAdded}'){
        // If the current feature is a temp feature, display some pre-defined text
        displayed_text='Placeholder for new feature';
    }else{
        // For normal feature expression, convert the variable indices into actual names
        displayed_text = pp_feature(input_expression);
    }
    
    
    feature_expression.append('div')
            .attr('class','feature_application_expression')
            .attr('expression',function(d){
                return input_expression;
            })
            .text(displayed_text);
    
    
    
    // Append arrows for adjusting the location of each expression
    feature_expression.append('img')
            .attr('src','img/left.png')
            .attr('id',function(){
                return 'left_arrow_' + id;
            })
            .attr('class','left_arrow arrow')
            .attr('width','20')
            .attr('height','17')
            .on("click",function(d){
    	       click_left_arrow(this.parentNode);
            });
    
    feature_expression.append('img')
            .attr('src','img/down.png')
            .attr('id',function(){
                return 'down_arrow_' + id;
            })
            .attr('class','down_arrow arrow')
            .attr('width','20')
            .attr('height','17')
            .on("click",function(d){
    	       click_down_arrow(this.parentNode);
            });
    
    feature_expression.append('img')
            .attr('src','img/up.png')
            .attr('id',function(){
                return 'up_arrow_' + id;
            })
            .attr('class','up_arrow arrow')
            .attr('width','20')
            .attr('height','17')
            .on("click",function(d){
    	       click_up_arrow(this.parentNode);
            });
    
    feature_expression.append('img')
            .attr('src','img/right.png')
            .attr('id',function(){
                return 'right_arrow_' + id;
            })
            .attr('class','right_arrow arrow')
            .attr('width','20')
            .attr('height','17')
            .on("click",function(d){
               click_right_arrow(this.parentNode);
            });
    
    feature_expression.append('img')
            .attr('src','img/minus.png')
            .attr('id',function(){
                return 'minus_' + id;
            })
            .attr('class','delete_feature arrow')
            .attr('width','20')
            .attr('height','17')
            .on("click",function(d){
                
                var activated = d3.select(this.parentNode).select('.feature_application_activate')[0][0].checked;
                // Remove the current feature
                this_feature.remove();
                // Store the change in the variable
                current_feature_application = get_feature_application_status();
                // If the removed feature was the first feature, then the next feature needs to have logical connective removed
                adjust_logical_connective();

                // Re-apply the current feature scheme if the feature to be deleted was activated
                if(activated){
                    // Reflect the change in the scatter plot
                    apply_current_feature_scheme();
                    // Update the displayed expression
                    update_feature_expression();
                }
            });
    


    // Adjust the indentation
    logical_connective.attr('level',+logic_indent_level);
    feature_expression.attr('level',+input_level);
    
    this_feature.select('.feature_application_logical_connective').style('margin-left',function(){
        var margin = 28 + logic_indent_level*indentation_margin;
        return margin+"px";
    });
    this_feature.select('.feature_application_expression').style('margin-left',function(){
        var margin = 10 + input_level*indentation_margin;
        return margin+"px";
    });

    
    // Set logical connective
    if(!is_first_feature){
        if(input_logic=='&&'){
            this_feature.select('.feature_application_logical_connective')[0][0].value="&&";
        }else{
            this_feature.select('.feature_application_logical_connective')[0][0].value="||";
        }   
    }
    
    // Set activation
    if(activation){
        this_feature.select('.feature_application_activate')[0][0].checked=true;
        this_feature.select('.feature_application_expression').style("color","#000000"); // black
    }else{
        this_feature.select('.feature_application_activate')[0][0].checked=false;
        this_feature.select('.feature_application_expression').style("color","#989898"); // gray     
    } 
    
    return this_feature;
}
            
       


function click_left_arrow(node){
    
    var this_feature = d3.select(node.parentNode);
    
    var level = d3.select(node).attr('level');
    if(level==0){
        // Do nothing
        return;
    }else{
        level = level-1;
        d3.select(node).attr('level',level);
    }
    
    if(d3.select(node).classed('logical_connective')){
        // logical connective
        this_feature.select('.feature_application_logical_connective').style('margin-left',function(){
            var margin = 28 + level*indentation_margin;
            return margin+"px";
        });

    }else{
        // feature expression
        this_feature.select('.feature_application_expression').style('margin-left',function(){
            var margin = 12 + level*indentation_margin;
            return margin+"px";
        });
    }
    
    current_feature_application = get_feature_application_status();

    adjust_logical_connective();
    
    apply_current_feature_scheme();
    
    update_feature_expression();
}
        

function click_right_arrow(node){
    
    var this_feature = d3.select(node.parentNode);
    var level = +d3.select(node).attr('level');

    if(d3.select(node).classed('logical_connective')){

        var all_features = d3.selectAll('.applied_feature')
        var this_id = d3.select(node.parentNode).attr('id');
        var index = -1;
        all_features[0].forEach(function(d,i){
            if(d3.select(d).attr('id')==this_id){
                index = i;
            }
        });
        
        var prev_feature_level=-1;
        for(var j=index-1;j>-1;j--){

            if(current_feature_application[j].activation){
                prev_feature_level = +current_feature_application[j].level; 
                break;
            }
        }
        var this_feature_level = +current_feature_application[index].level;
        if(prev_feature_level==-1){
            prev_feature_level = this_feature_level;
        }
        
        // The indentation level of logical connectives cannot be higher than the neighboring feature indentation levels
        // They should be smaller or equal to the neighboring feature indentation levels
        if(Math.min(prev_feature_level,this_feature_level)==level){
            return;
        }

        level = level+1;
        d3.select(node).attr('level',level);
        // logical connective
        this_feature.select('.feature_application_logical_connective').style('margin-left',function(){
            var margin = 28 + level*indentation_margin;
            return margin+"px";
        });

    }else{
        level = level+1;
        d3.select(node).attr('level',level);
        // feature expression
        this_feature.select('.feature_application_expression').style('margin-left',function(){
            var margin = 12 + level*indentation_margin;
            return margin+"px";
        });
    }
    
    current_feature_application = get_feature_application_status();
	apply_current_feature_scheme();
    
    update_feature_expression();
}
                     
            
function click_up_arrow(node){
    
    var all_features = d3.selectAll('.applied_feature')
	var source_id = d3.select(node.parentNode).attr('id');
    
    var index = -1;
    all_features[0].forEach(function(d,i){
        if(d3.select(d).attr('id')==source_id){
            index = i;
        }
    });
        
    if(index==0){
        return;
    }

    var features = current_feature_application;
    var target_copy = features[index-1];
    features[index-1] = features[index];
    features[index] = target_copy;
    
    
    d3.selectAll('.applied_feature').remove();
    
    display_feature_application_status(current_feature_application);

    adjust_logical_connective();

	apply_current_feature_scheme();

    update_feature_expression();
}   





            
            
function click_down_arrow(node){
	
    var all_features = d3.selectAll('.applied_feature')
	var source_id = d3.select(node.parentNode).attr('id');
    
    var index = -1;
    
    all_features[0].forEach(function(d,i){
        if(d3.select(d).attr('id')==source_id){
            index = i;
        }
    });
        
    if(index==-1 || index==current_feature_application.length-1){
        return;
    }
    
    var features = current_feature_application;
    var target_copy = features[index+1];
    features[index+1] = features[index];
    features[index] = target_copy;
    
    d3.selectAll('.applied_feature').remove();
    
    display_feature_application_status(current_feature_application);
    
    adjust_logical_connective();
	apply_current_feature_scheme();
    
    update_feature_expression();
}     
            
            
            

            
function adjust_logical_connective(){
    
    var all_features = d3.selectAll('.applied_feature')[0];
    
    var first_feature = d3.select(all_features[0]);
    var second_feature = d3.select(all_features[1]);
    
    if(first_feature[0][0]==null){
        return;
    }else if(first_feature.select('.feature_application_logical_connective')[0][0]){ 
        // If the first feature has a logical connective, remove it
        first_feature.select('.feature_application_logical_connective').remove();
        first_feature.select('.logical_connective').selectAll('.arrow').remove();
    }
    
    if(second_feature[0][0]==null){
        return;
    }else if(second_feature.select('.feature_application_logical_connective')[0][0]==null){
        
        var logical_connective_div = second_feature.select('.logical_connective');
        
        var level = +second_feature.select('.feature_expression').attr('level');
        logical_connective_div.attr('level',level);
        
        // If the second feature does not contain a logical connective, add it
        logical_connective_div.append('select')
                .attr('class','feature_application_logical_connective')
                .selectAll('option')
                .data([{value:"&&",text:"AND"},{value:"||",text:"OR"}])
                .enter()
                .append("option")
                .attr("value",function(d){
                    return d.value;
                })
                .text(function(d){
                    return d.text;
                }); 
        
        logical_connective_div.select('.feature_application_logical_connective').on("change",function(d){

            current_feature_application = get_feature_application_status();
            apply_current_feature_scheme();

            update_feature_expression();

        });
        
        
        // Append arrows for adjusting the location of each expression
        logical_connective_div.append('img')
                .attr('src','img/left.png')
                .attr('id',function(){
                    return 'left_arrow_' + id;
                })
                .attr('class','left_arrow arrow')
                .attr('width','20')
                .attr('height','17')
                .on("click",function(d){
                    click_left_arrow(this.parentNode);
                });

        logical_connective_div.append('img')
                .attr('src','img/right.png')
                .attr('id',function(){
                    return 'right_arrow_' + id;
                })
                .attr('class','right_arrow arrow')
                .attr('width','20')
                .attr('height','17')
                .on("click",function(d){
                   click_right_arrow(this.parentNode);
                });
    }

    
    for(var i=1;i<all_features.length;i++){
        
        var this_feature = all_features[i];
        var index = i;
        
        var prev_feature_level=-1;
        for(var j=i-1;j>-1;j--){
            if(current_feature_application[j].activation){
                prev_feature_level = +current_feature_application[j].level; 
                break;
            }
        }
        
        var this_feature_level = +current_feature_application[index].level;
        var this_feature_logic_indent_level = +current_feature_application[index].logic_indent_level;
        
        if(prev_feature_level==-1){
            prev_feature_level = this_feature_level;
        }

        var min_level = Math.min(prev_feature_level,this_feature_level);
        if( this_feature_logic_indent_level > min_level ){
            
            var diff = this_feature_logic_indent_level - min_level;
            for(var j=0;j<diff;j++){
                click_left_arrow(d3.select(this_feature).select('.logical_connective')[0][0]);
            }
        }
    }

    update_feature_expression();
}
            
            
function get_last_feature_level(){

    var features = current_feature_application;
    var last_feature = features[features.length-1];
    return last_feature.level;
} 


function get_feature_application_status(){

    var application_status = d3.select('#applied_feature_div');
    
    var out = [];
    
    application_status.selectAll('.applied_feature')[0].forEach(function(d){
    	
        var activated = d3.select(d).select('.feature_application_activate')[0][0].checked;
        var expression = d3.select(d).select('.feature_application_expression').attr('expression');
        var logic;
        if(d3.select(d).select('.feature_application_logical_connective')[0][0]){
            logic = d3.select(d).select('.feature_application_logical_connective')[0][0].value; 
        }else{
            logic = '&&';
        }
        var level = +d3.select(d).select('.feature_expression').attr('level');
        var logic_level = +d3.select(d).select('.logical_connective').attr('level');
        
        if(logic_level==null){
            logic_level = level;
        }
        
        out.push({activation:activated, expression:expression, logic:logic, level:level, logic_indent_level:logic_level});
    });
    
    return out;
}


function display_feature_application_status(features){
    
    if(features==null){
        features = current_feature_application;
    }
    
    for(var i=0;i<features.length;i++){
        var activation = features[i].activation;
        var expression = features[i].expression;
        var logic = features[i].logic;
        var level = +features[i].level;
        var logic_indent_level;
        if(i==0){
            logic_indent_level = +level;
        }else{
            logic_indent_level = +features[i].logic_indent_level;
        }
        add_feature(level, logic, expression, activation, logic_indent_level);
    }
}


function get_feature_application_expression(features){

    if(features==null){
        features = current_feature_application;
    }
    
    var expressions = [];
    var logical_connectives = [];
    var levels = [];
    var logic_indent_levels = [];
    
    for(var i=0;i<features.length;i++){
        var activation = features[i].activation;
        var expression = features[i].expression;
        var logic = features[i].logic;
        var level = +features[i].level;
        var logic_indent_level = +features[i].logic_indent_level; 
            
        if(activation){
        	if(expression.indexOf('&&')!=-1 || expression.indexOf('||')!=-1){
        		expression = '('+expression+')';
        	}
            
            expressions.push(expression);
            logical_connectives.push(logic);
            levels.push(level);
            logic_indent_levels.push(logic_indent_level);
        }
    }

    
    var filterExpression = "";
    var prev_level = 0;
    
    for(var i=0;i<expressions.length;i++){
    	var level = +levels[i];
        var logic_indent_level = +logic_indent_levels[i];
        
        if(i > 0){
            
            if(logic_indent_level < prev_level){
                var diff = prev_level-logic_indent_level;
            	for(var j=0;j<diff;j++){
            		filterExpression = filterExpression + ")";
            	}
                filterExpression = filterExpression + logical_connectives[i];
            }else{
                // logic_indent_level == prev_level 
                filterExpression = filterExpression + logical_connectives[i];
            }
            
            if(logic_indent_level < level){
                var diff = level - logic_indent_level;
            	for(var j=0;j<diff;j++){
            		filterExpression = filterExpression + "(";
            	}
            }
            prev_level = level;
            
        }else if(i==0){ // i=0
            if(level > 0){
            	while(prev_level < level){
	            	filterExpression = filterExpression + "(";
	            	prev_level++;
            	}
        	}
        }
        
        filterExpression = filterExpression + expressions[i];
    }

    if(prev_level>0){
    	while(prev_level!=0){
        	filterExpression = filterExpression + ")";
        	prev_level--;
    	}
    }
    
    //console.log(filterExpression);
    return filterExpression;
}

       
  

// Apply the current feature scheme
function apply_current_feature_scheme(){

    var expression = get_feature_application_expression(current_feature_application);
    
    if(expression==""){
        cancelDotSelections('remove_highlighted');
    }else{
        applyComplexFilter(expression);
    }
    // Draw venn diagram
    draw_venn_diagram();
    current_feature_expression = expression;
}
                

            
function test_feature(){

    var application_status = d3.select('#applied_feature_div');
    var count = application_status.selectAll('.applied_feature').size();
    var first_expression = application_status
                                .select('.applied_feature')
                                .select('.feature_application_expression').text();
    
    if(count==0){
        return;
    }else if(count==1 && first_expression.indexOf('FeatureToBeAdded')>-1){
        return;
    }else{
        apply_current_feature_scheme();
        add_current_feature_to_DF_plot();
    }
}




function toggle_feature_activation(){

    if(features_activation_store.length==0){
        
        d3.selectAll('.applied_feature')[0].forEach(function(d,i){
            var activation = d3.select(d).select('.feature_application_activate')[0][0].checked;
            var expression = d3.select(d).select('.feature_application_expression').attr('expression');
            
            features_activation_store.push(expression);
            if(activation && expression.indexOf('FeatureToBeAdded')==-1){
                // Deactivate the activated features. If the feature is the placeholder, don't deactivate it
                d3.select(d).select('.feature_application_activate')[0][0].checked = false;
                d3.select(d).select('.feature_application_expression').style('color',"#989898");
            }
        });
        d3.select('#toggle_feature_scheme').text('Restore all features');
        
    }else{
        
        d3.selectAll('.applied_feature')[0].forEach(function(d,i){
            var expression = d3.select(d).select('.feature_application_expression').attr('expression');
            
            if(features_activation_store.indexOf(expression)!=-1){
                d3.select(d).select('.feature_application_activate')[0][0].checked = true;
                d3.select(d).select('.feature_application_expression').style('color',"#000000");
            }
        });
        reset_feature_activation();
    }
    
    current_feature_application = get_feature_application_status();
    apply_current_feature_scheme();
    update_feature_expression();
}

            
function reset_feature_activation(){
    d3.select('#toggle_feature_scheme').text('Deactivate all features');
    features_activation_store = [];
}         



function update_feature_expression(features){
    
    var logic_color = "#FF9500";
    var bracket_color = "#FF0000";
    var expression;
    if(features==null){
        features = current_feature_application;
    }
    expression = get_feature_application_expression(features);
    
    expression = pp_feature(expression);
    expression = expression.replace(/{/g,'');
    expression = expression.replace(/}/g,'');
    
    expression = expression.replace(/\(/g,'<span style="color:'+bracket_color+';font-weight:bold;font-size:28px">(</span>');
    expression = expression.replace(/\)/g,'<span style="color:'+bracket_color+';font-weight:bold;font-size:28px">)</span>');
    expression = expression.replace(/&&/g,' <span style="color:'+logic_color+';">AND</span> ');
    expression = expression.replace(/\|\|/g,' <span style="color:'+logic_color+';">OR</span> ');
    
    d3.select('#featureApplicationExpressionPanel_body').html("<p>"+expression+"</p>");
    
}


function update_feature_application_status(expression,option){
    
    if(option=='create_placeholder'){
        // Newly create a new placeholder if it doesn't exist already
        create_feature_placeholder();
        return;

    }else if(option=='replace_placeholder'){
        
        current_feature_application = stashed_feature_application;
        return;
        
    }else if(option=='update_placeholder'){
        
        if(expression==''){
            stashed_feature_application = [];
            display_feature_application_status(current_feature_application);
            update_feature_expression(current_feature_application);
            return;
        }
        
        // Create a new placeholder if it does not exist
        create_feature_placeholder();
        
        // Deep copy of the feature application, since the change is temporary
        var features = JSON.parse(JSON.stringify(current_feature_application));
        
        var placeholder = null;
        var placeholder_index = -1;
        
        for(var i=0;i<features.length;i++){
            var exp = features[i].expression;
            if(exp.indexOf('FeatureToBeAdded')!=-1){
                placeholder = features[i];
                placeholder_index = i;
            }
        }
        
        var first_logic = placeholder.logic;
        var last_feature_level = +placeholder.level;
        var activation = placeholder.activation;
        var last_feature_logic_level = +placeholder.logic_indent_level;
        
        var logic_indent_levels = [];
        var decomposed = decompose_feature(0, '&&', expression, [], logic_indent_levels);
        var individual_features = decomposed.features;
        logic_indent_levels = decomposed.logic_indent_levels;
        
        // Add individual features
        for(var i=0;i<individual_features.length;i++){
            
            var exp = individual_features[i].expression;
            var level, logic, logic_level;
            var level = +individual_features[i].level;
            level = level+last_feature_level;
            
            if(i==0){
                logic = first_logic;
                logic_level = last_feature_logic_level;
                features.splice(placeholder_index,1,{activation:true, expression:exp, logic:logic, level:level, logic_indent_level:logic_level});
            }else{
                logic = individual_features[i].logic;
                logic_level = logic_indent_levels[i-1] + last_feature_level;
                features.splice(placeholder_index+i,0,{activation:true, expression:exp, logic:logic, level:level, logic_indent_level:logic_level});
            }
        }
        
        stashed_feature_application = features;
        
        d3.selectAll('.applied_feature').remove();
        
        display_feature_application_status(stashed_feature_application);
        
        update_feature_expression(stashed_feature_application);
        return;
        
    }else{ 
        // Add a new preset feature from the filter settings
        // option: {'new','add','within','deactivated'}
        
        var features = current_feature_application;

        var logic_indent_levels = [];
        var decomposed = decompose_feature(0, '&&', expression, [], logic_indent_levels);
        var individual_features = decomposed.features;
        var logic_indent_levels = decomposed.logic_indent_levels;

        var first_logic = '&&';
        var last_feature_level = 0;
        var activation = true;

        
        // Different configuration depending on what option is used
        switch(option) {
            case 'new':
                // Activate only the current filter
                for(var i=0;i<features.length;i++){
                    features[i].activation = false;
                }
                break;
            case 'add':
                first_logic = '||';
                last_feature_level = get_last_feature_level();
                break;
            case 'within':
                last_feature_level = get_last_feature_level();
                break;
            case 'deactivated':
                activation=false;
                break;
            default:
                // Do nothing
                break;
        }

        // Add individual features
        for(var i=0;i<individual_features.length;i++){
            var logic;
            if(i==0){
                logic = first_logic;
                logic_level = +last_feature_level;
            }else{
                logic = individual_features[i].logic;
                logic_level = +logic_indent_levels[i-1] + last_feature_level;
            }
            var level = individual_features[i].level + last_feature_level;
            var exp = individual_features[i].expression;
            
            var feature = {activation:activation, expression:exp, logic:logic, level:level, logic_indent_level:logic_level};
            features.push(feature);
        }
                
        // Remove all curently shown features
        d3.selectAll('.applied_feature').remove();
        // Display features
        display_feature_application_status(features);
        // Update the displayed expression
        update_feature_expression();
        
        adjust_logical_connective();
        return;
    }
    
}



d3.select('#clear_deactivated_features').on('click',function(){
    d3.selectAll('.applied_feature')[0].forEach(function(d){
        var activation = d3.select(d).select('.feature_application_activate')[0][0].checked;
        var expression = d3.select(d).select('.feature_application_expression').attr('expression');
        if(!activation&& expression.indexOf('FeatureToBeAdded')==-1){
            d3.select(d).remove();
        }
    });
    current_feature_application = get_feature_application_status();
    apply_current_feature_scheme();
    adjust_logical_connective();
    update_feature_expression();
});
d3.select('#toggle_feature_scheme').on('click',toggle_feature_activation);
d3.select('#test_feature_scheme').on('click',test_feature);     
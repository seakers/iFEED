
var features_activation_store = [];
var featureID = 0;    
      


function decompose_feature(input_level, input_logic, input_expression, feature_list){
    
    //var individual_feature = {level:null,logic:null,expression:null};
    
	var e = input_expression;
    var lo = input_logic;
    var l = input_level;
    
    // Remove outer parenthesis
	var paren_removed = remove_outer_parentheses(e,l);
    e = paren_removed.expression;
    l = paren_removed.level;
    
    
    var first = true;
    var e_collapsed;
        
    if(get_nested_parenthesis_depth(e)==0){
        // Given expression does not have a nested structure
        if(e.indexOf("&&")>-1 || e.indexOf("||")>-1){
        	// Logical connectives are present
           e_collapsed=e; 
        }else{
        	// Single filter expression
            if(e.indexOf('tempFeature') > -1){
                return feature_list;
            }else{
                feature_list.push({level:l,logic:lo,expression:e}); 
                return feature_list;
            }
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
            prev = '&&';
            first = false;
        }else{
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
            
            feature_list = decompose_feature(l,prev,current,feature_list);
            
        }else{            
            feature_list = decompose_feature(l,prev,e,feature_list);
            break;
        }
    }
    return feature_list;
}


      
function create_feature_placeholder(){
    // If the placeholder already exists, return
    if(d3.select('.applied_feature.placeholder')[0][0]){
        return;
    }

    // Add a new feature
    this_feature = add_feature(0, '&&', '{tempFeature}', true);
    
    this_feature.classed('placeholder',true);
    
    this_feature.select('.feature_application_expression')
                .text('New driving feature to be added');
                // Pink color by default
                //.style("color","#F67C9B");
}
     


function add_feature(input_level, input_logic, input_expression, activation, placeholder_selector){    
        
    var applied_features = d3.select('#applied_feature_div');
    var id = featureID++;
    var this_feature;
    
    if(placeholder_selector){
        this_feature = applied_features
                .insert('div', placeholder_selector);
    }else{
        this_feature = applied_features
                .append('div');
    }
    
    this_feature.attr('id',function(){
                return 'applied_feature_' + id;
            })
            .attr('class','applied_feature');
    
    this_feature.append('input')
            .attr('type','checkbox')
            .attr('class','feature_application_activate');
    
    this_feature.append('select')
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

    var first_feature_id = d3.select('.applied_feature').attr('id'); 
    if('applied_feature_'+id==first_feature_id){
        // this feature is the first feature set the margin-top
        this_feature.select('.feature_application_logical_connective').style('margin-top','13px');
    }
    
    if(input_expression=='{tempFeature}'){
        this_feature.append('div')
                .attr('class','feature_application_expression')
                .attr('expression',function(d){
                    return '{tempFeature}';
                })
                .text('New driving feature to be added')
                // Gray color by default
                .style("color","#FFB8CA");
    }else{
        this_feature.append('div')
                .attr('class','feature_application_expression')
                .attr('expression',function(d){
                    return input_expression;
                })
                .text(pp_feature(input_expression));
    }
    

    this_feature.append('img')
            .attr('src','img/left_arrow.png')
            .attr('id',function(){
                return 'left_arrow_' + id;
            })
            .attr('class','left_arrow arrow')
            .attr('width','20')
            .attr('height','20')
            .style('float','left')
            .style('margin-left','13px')
            .on("click",function(d){
    	       click_left_arrow(id);
            });
    
    this_feature.append('img')
            .attr('src','img/left_arrow.png')
            .attr('id',function(){
                return 'down_arrow_' + id;
            })
            .attr('class','img-rot-270-deg down_arrow arrow')
            .attr('width','20')
            .attr('height','20')
            .style('margin-left','5px')
            .style('float','left')
            .on("click",function(d){
    	       click_down_arrow(id);
            });
    
    this_feature.append('img')
            .attr('src','img/left_arrow.png')
            .attr('id',function(){
                return 'up_arrow_' + id;
            })
            .attr('class','img-rot-90-deg up_arrow arrow')
            .attr('width','20')
            .attr('height','20')
            .style('margin-left','5px')
            .style('float','left')
            .on("click",function(d){
    	       click_up_arrow(id);
            });
    
    this_feature.append('img')
            .attr('src','img/left_arrow.png')
            .attr('id',function(){
                return 'right_arrow_' + id;
            })
            .attr('class','img-hor-vert right_arrow arrow')
            .attr('width','20')
            .attr('height','20')
            .style('margin-left','5px')
            .style('float','left')
            .style('margin-right','7px')
            .on("click",function(d){
               click_right_arrow(id);
            });
    
    this_feature.append('button')
            .attr('class','feature_application_delete')
            .text('Remove');


    this_feature.select(".feature_application_delete").on("click",function(d){
        var activated = this_feature.select('.feature_application_activate')[0][0].checked;
        this_feature.remove();
        
        adjust_margin_logical_connective();
        
        if(activated){
            apply_current_feature_scheme();
        }
    });
    

    this_feature.select('.feature_application_activate').on("change",function(d){
        
        var id = this_feature.attr('id');
        var n = id.substring(id.length-1);
        if(n < features_activation_store.length){
            reset_feature_activation();
        }
        
        var activated = this_feature.select('.feature_application_activate')[0][0].checked;
        this_feature.select('.feature_application_expression').style("color",function(d){
            if(activated){
                return "#000000"; //black
            }else{
                return "#989898"; // gray
            }
        });
        apply_current_feature_scheme();
    });

    
    this_feature.select('.feature_application_logical_connective').on("change",function(d){
        apply_current_feature_scheme();
    });
    

    // Adjust the indentation
    for(var i=0;i<input_level;i++){
        click_right_arrow(id);
    }
    
    // Set logical connective
    if(input_logic=='&&'){
        this_feature.select('.feature_application_logical_connective')[0][0].value="&&";
    }else{
        this_feature.select('.feature_application_logical_connective')[0][0].value="||";
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
            
            
            

            
function remove_feature(expression){
    
    var applied_features = d3.select('#applied_feature_div');
    applied_features.selectAll('.applied_feature')[0].forEach(function(d){
        var this_feature = d3.select(d);
        if(this_feature.select('.feature_application_expression').attr('expression')==expression){
            this_feature.remove();
        }
    });
}
            
            

var arrow_margin = 30;
function click_right_arrow(n){
	var id = "" + n;
	var appliedFilter = d3.select("#applied_feature_"+id);
	if(appliedFilter.attr('level')==null){
		appliedFilter.attr('level',1);
	}
	else{
		var level = +appliedFilter.attr('level');
		appliedFilter.attr('level',function(){
			return level+1;
		});
	}
	var level = +appliedFilter.attr('level');
	
	appliedFilter.select('.feature_application_activate').style('margin-right',function(){
		var margin = 12 + level*arrow_margin;
		return margin+"px";
	});
	apply_current_feature_scheme();
}
                     
            
function click_up_arrow(n){
	var source_selector_id = "applied_feature_" + n;
    var target_selector_id = null;
    var temp_id = null;
    
    var applied_features = d3.selectAll('.applied_feature')[0];
    
    applied_features.forEach(function(d){
        var this_id = d3.select(d).attr('id');
        if(source_selector_id == this_id){
            target_selector_id = temp_id;
        }else{
            temp_id = this_id;
        }
    })
    
    // If the target selector is null, that means it cannot go further up
    if(target_selector_id==null){
        return;
    }
    
    var target_selector_id = '#' + target_selector_id;
    var source_feature = d3.select('#'+source_selector_id);
    
    var activated = source_feature.select('.feature_application_activate')[0][0].checked;
    var expression = source_feature.select('.feature_application_expression').attr('expression');
    var logic = source_feature.select('.feature_application_logical_connective')[0][0].value;
    var level = source_feature.attr('level');
        
    add_feature(level,logic,expression,activated,target_selector_id);
    
    d3.select('#'+source_selector_id).remove();
    
    adjust_margin_logical_connective();
    
	apply_current_feature_scheme();
}   
            
            
function click_down_arrow(n){
	var source_selector_id = "applied_feature_" + n;
    var target_selector_id = null;

    var source_found = false;
    var target_found = false;
    
    var applied_features = d3.selectAll('.applied_feature')[0];
    
    applied_features.forEach(function(d){
        
        var this_id = d3.select(d).attr('id');
                
        if(source_selector_id == this_id){
            source_found = true;
        }
        else if(source_found && !target_found){
            // element right after the source
            target_found = true;
            target_selector_id = this_id;
        }
    })
    
    // If the target selector is null, that means it cannot go further down
    if(target_selector_id==null){
        return;
    }
    
    // Copy the source selector and locate it right after the target selector
    //http://stackoverflow.com/questions/28249941/how-to-insert-after-a-sibling-element-in-d3-js
    var target_selector_id = '#' + target_selector_id + '+ *';
    var source_feature = d3.select('#'+source_selector_id);
    
    var activated = source_feature.select('.feature_application_activate')[0][0].checked;
    var expression = source_feature.select('.feature_application_expression').attr('expression');
    var logic = source_feature.select('.feature_application_logical_connective')[0][0].value;
    var level = source_feature.attr('level');
        
    add_feature(level,logic,expression,activated,target_selector_id);
    
    d3.select('#'+source_selector_id).remove();
    
    adjust_margin_logical_connective();
    
	apply_current_feature_scheme();
}     
            
            
function click_left_arrow(n){
	var id = "" + n;
	var appliedFilter = d3.select("#applied_feature_"+id);
	if(appliedFilter.attr('level')==null){
		appliedFilter.attr('level',0);
	}else if(appliedFilter.attr('level')==0){
		// do nothing
	}else{
		var level = +appliedFilter.attr('level');
		appliedFilter.attr('level',function(){
			return level-1;
		});
	}
	var level = +appliedFilter.attr('level');
	appliedFilter.select('.feature_application_activate').style('margin-right',function(){
		var margin = 12 + level*arrow_margin;
		return margin+"px";
	});
	apply_current_feature_scheme();
}
        
            
            
function adjust_margin_logical_connective(){
    
    var all_features = d3.selectAll('.applied_feature')[0];
    var first_feature = d3.select(all_features[0]).select('.feature_application_logical_connective').style('margin-top','13px');
    var second_feature = d3.select(all_features[1]).select('.feature_application_logical_connective').style('margin-top','0px');
}
            
            
function get_last_feature_level(){

    var applied_features = d3.select('#applied_feature_div');

    var last_feature = applied_features[0][applied_features.length-1];
    
    var last_feature_level = d3.select(last_feature).attr('level');
    
    return last_feature_level;
} 

       
function parse_feature_application_status(){
	
    var application_status = d3.select('#applied_feature_div');
    var count = application_status.selectAll('.applied_feature').size();
    var filter_expressions = [];
    var filter_logical_connective = [];
    var filter_level = [];
    
    application_status.selectAll('.applied_feature')[0].forEach(function(d){
    	
        var activated = d3.select(d).select('.feature_application_activate')[0][0].checked;
        var expression = d3.select(d).select('.feature_application_expression').attr('expression');
        var logic = d3.select(d).select('.feature_application_logical_connective')[0][0].value; 
        var level = d3.select(d).attr('level');
        

        if(activated){
        	if(expression.indexOf('&&')!=-1 || expression.indexOf('||')!=-1){
        		expression = '('+expression+')';
        	}
            filter_expressions.push(expression);
            filter_logical_connective.push(logic);
        	if(level==null){
        		filter_level.push(0);
        	}else{
        		var levelNum = + level;
        		filter_level.push(levelNum);
        	}
        }
    });

    
    
    var filterExpression = "";
    var prev_level = 0;
    
    for(var i=0;i<filter_expressions.length;i++){
    	var level = filter_level[i];
        if(i > 0){
            if(level > prev_level){
            	filterExpression = filterExpression + filter_logical_connective[i];
            	while(prev_level != level){
            		filterExpression = filterExpression + "(";
            		prev_level++;
            	}
            }else if(level < prev_level){
            	while(prev_level > level){
            		filterExpression = filterExpression + ")";
            		prev_level--;
            	}
            	filterExpression = filterExpression + filter_logical_connective[i];
            }else{
            	filterExpression = filterExpression + filter_logical_connective[i];
            }
        }else if(i==0){ // i=0
            if(level > 0){
            	while(prev_level < level){
	            	filterExpression = filterExpression + "(";
	            	prev_level++;
            	}
        	}
        }
        filterExpression = filterExpression + filter_expressions[i];
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

    var expression = parse_feature_application_status();
    
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
    }else if(count==1 && first_expression.indexOf('tempFeature')>-1){
        return;
    }else{
        apply_current_feature_scheme();
        add_current_feature_to_DF_plot();
    }
}




function toggle_feature_activation(){

    if(features_activation_store.length==0){
        d3.selectAll('.applied_feature')[0].forEach(function(d){
            var activated = d3.select(d).select('.feature_application_activate')[0][0].checked;
            features_activation_store.push(activated);
            
            if(activated){
                d3.select(d).select('.feature_application_activate')[0][0].checked = false;
                d3.select(d).select('.feature_application_expression').style('color',"#989898");
            }
        });
        d3.select('#toggle_feature_scheme').text('Restore all features');
    }else{
        d3.selectAll('.applied_feature')[0].forEach(function(d,i){
            if(i < features_activation_store.length){
                d3.select(d).select('.feature_application_activate')[0][0].checked = features_activation_store[i];
                if(features_activation_store[i]){
                    d3.select(d).select('.feature_application_expression').style('color',"#000000");
                }
            }
        });
        reset_feature_activation();
    }
    apply_current_feature_scheme();
}

            
function reset_feature_activation(){
    d3.select('#toggle_feature_scheme').text('Deactivate all features');
    features_activation_store = [];
}         






function update_feature_application_status(expression,option){

    if(option=='remove'){
        // Remove a given feature from the application list
        remove_feature(expression);

    }else if(option=='create_placeholder'){
        // Newly create a new placeholder if it doesn't exist already
        create_feature_placeholder();

    }else if(option=='update_placeholder'){
        // Replace the placeholder with the actual feature expression

        var placeholder = d3.select('.applied_feature.placeholder');
        var replace_placeholder = true;
        var individual_features;

        if(placeholder[0][0]==null){
            // If the placeholder does not exist, simply add a new feature using conjunction
            individual_features = decompose_feature(0, '&&', expression, []);
            var first_logic = '&&';
            var last_feature_level = 0;
            var activation = true;
            replace_placeholder = false;

        }else{
            // If the placeholder exists, define new features in the placeholder's position
            var placeholder_logic = placeholder.select('.feature_application_logical_connective')[0][0].value;
            var placeholder_level = placeholder.attr('level');
            var placeholder_activated = placeholder.select('.feature_application_activate')[0][0].checked;

            individual_features = decompose_feature(0, '&&', expression, []);
            var first_logic;
            var last_feature_level = placeholder_level;
            var activation = placeholder_activated;

            if(placeholder_logic=='&&'){
                first_logic = '&&';
            }else{
                first_logic = '||';
            }
        }

        // Add individual features
        for(var i=0;i<individual_features.length;i++){
            var logic = individual_features[i].logic;
            if(i==0) logic = first_logic;
            var level = individual_features[i].level + last_feature_level;
            var exp = individual_features[i].expression;

            if(replace_placeholder){
                var placeholder_selector = '.applied_feature.placeholder';
            }

            add_feature(level,logic,exp,activation,placeholder_selector);
        }

        placeholder.remove();
        create_feature_placeholder();

    }else{ 
        // Add a new preset feature from the filter settings
        // option: {'new','add','within','deactivated'}

        var individual_features = decompose_feature(0, '&&', expression, []);
        var first_logic = '&&';
        var last_feature_level = 0;
        var activation = true;

        // Different configuration depending on what option is used
        switch(option) {
            case 'new':
                // Activate only the current filter
                d3.selectAll('.feature_application_activate')[0].forEach(function(d){
                    d3.select(d)[0][0].checked=false;
                })
                d3.selectAll('.feature_application_expression').style("color","#989898"); // gray
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
            var logic = individual_features[i].logic;
            if(i==0) logic = first_logic;
            var level = individual_features[i].level + last_feature_level;
            var exp = individual_features[i].expression;
            add_feature(level,logic,exp,activation);
        }
    }   
    
    current_feature_expression = parse_feature_application_status();
}

            
d3.select('#toggle_feature_scheme').on('click',toggle_feature_activation);
d3.select('#test_feature_scheme').on('click',test_feature);     
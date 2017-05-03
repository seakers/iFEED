
var features_activation_store = [];
var featureID = 0;    
      


function decompose_feature(input_level, input_logic, input_expression, feature_list){
    
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
        	// Single filter expression
//            if(e.indexOf('FeatureToBeAdded') > -1){
//                return feature_list;
//            }else{
                feature_list.push({level:l,logic:lo,expression:e}); 
                return feature_list;
//            }
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

    var features = current_feature_application;
    
    // If the placeholder already exists, return
    for(var i=0;i<features.length;i++){
        var expression = features[i].expression;
        if(expression.indexOf('FeatureToBeAdded')>-1){
            return;
        }
    }
    
    // Add a new feature
    var feature = {activation:true, expression:'{FeatureToBeAdded}', logic:'&&', level:0};
    features.push(feature);
    display_feature_application_status(feature);
    update_feature_expression();
}
     


function add_feature(input_level, input_logic, input_expression, activation){    
        
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
    
    this_feature.append('input')
            .attr('type','checkbox')
            .attr('class','feature_application_activate');
    
    
    var is_first_feature = null;
    var logical_connectives_options = [];
    
    if(d3.selectAll('.applied_feature')[0].length==1){

        logical_connectives_options = [{value:'N/A',text:'N/A'}];
        is_first_feature = true;
    }else{
        logical_connectives_options = [{value:"&&",text:"AND"},{value:"||",text:"OR"}];
        is_first_feature = false;
    }
    
    this_feature.append('select')
            .attr('class','feature_application_logical_connective')
            .selectAll('option')
            .data(logical_connectives_options)
            .enter()
            .append("option")
            .attr("value",function(d){
                return d.value;
            })
            .text(function(d){
                return d.text;
            }); 
    
    if(is_first_feature){
        this_feature.select('.feature_application_logical_connective').style('margin-top','15px');
    }
    

    // If the current feature is a temp feature
    if(input_expression=='{FeatureToBeAdded}'){
        this_feature.append('div')
                .attr('class','feature_application_expression')
                .attr('expression',function(d){
                    return '{FeatureToBeAdded}';
                })
                .text('Placeholder for new feature')
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
            .attr('src','img/left.png')
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
            .attr('src','img/down.png')
            .attr('id',function(){
                return 'down_arrow_' + id;
            })
            .attr('class','down_arrow arrow')
            .attr('width','20')
            .attr('height','20')
            .style('margin-left','4px')
            .style('float','left')
            .on("click",function(d){
    	       click_down_arrow(id);
            });
    
    this_feature.append('img')
            .attr('src','img/up.png')
            .attr('id',function(){
                return 'up_arrow_' + id;
            })
            .attr('class','up_arrow arrow')
            .attr('width','20')
            .attr('height','20')
            .style('margin-left','4px')
            .style('float','left')
            .on("click",function(d){
    	       click_up_arrow(id);
            });
    
    this_feature.append('img')
            .attr('src','img/right.png')
            .attr('id',function(){
                return 'right_arrow_' + id;
            })
            .attr('class','right_arrow arrow')
            .attr('width','20')
            .attr('height','20')
            .style('margin-left','4px')
            .style('float','left')
            .on("click",function(d){
               click_right_arrow(id);
            });
    
    this_feature.append('img')
            .attr('src','img/minus.png')
            .attr('id',function(){
                return 'minus_' + id;
            })
            .attr('class','feature_application_delete')
            .attr('width','20')
            .attr('height','20')
            .style('margin-left','5px')
            .style('float','left')
            .on("click",function(d){
        
                var activated = this_feature.select('.feature_application_activate')[0][0].checked;
                this_feature.remove();

                current_feature_application = get_feature_application_status();

                adjust_logical_connective();

                // Re-apply the current feature scheme if the feature to be deleted was activated
                if(activated){
                    apply_current_feature_scheme();
                }

                update_feature_expression();
            });
    

    this_feature.select('.feature_application_activate').on("change",function(d){
        
        var expression = this_feature.select('.feature_application_expression').attr('expression');
        if(features_activation_store.indexOf(expression)!=-1){
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
        
        current_feature_application = get_feature_application_status();
        apply_current_feature_scheme();
        
        update_feature_expression();
    });

    
    this_feature.select('.feature_application_logical_connective').on("change",function(d){
        
        current_feature_application = get_feature_application_status();
        apply_current_feature_scheme();
        
        update_feature_expression();
        
    });
    

    // Adjust the indentation
    this_feature.attr('level',+input_level);
    this_feature.select('.feature_application_activate').style('margin-right',function(){
        var margin = 12 + input_level*arrow_margin;
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
            
            
        
            
function remove_feature(expression){
    
    if(expression==null){
        current_feature_application = [];
        return;
    }
    
    var features = current_feature_application;
    
    for(var i=0;i<features.length;i++){
        if(features[i].expression==expression){
            // Remove the feature
            features.splice(i,1);
        }
    }
    
    update_feature_expression();
}
            
            

var arrow_margin = 30;

function click_right_arrow(n){
	var id = "" + n;
	var this_feature = d3.select("#applied_feature_"+id);
    var level = null;
    
	if(this_feature.attr('level')==null){
		this_feature.attr('level',1);
        level = 1;
	}else{
		var l = +this_feature.attr('level');
		this_feature.attr('level',function(){
			return l+1;
		});
        level = l+1;
	}
	
	this_feature.select('.feature_application_activate').style('margin-right',function(){
		var margin = 12 + level*arrow_margin;
		return margin+"px";
	});
    
    current_feature_application = get_feature_application_status();
	apply_current_feature_scheme();
    
    update_feature_expression();
}
                     
            
function click_up_arrow(n){
    
	var source_selector_id = "applied_feature_" + n;
    
    var applied_features = d3.selectAll('.applied_feature')[0];
    var index = -1;
    
    applied_features.forEach(function(d,i){
        if(d3.select(d).attr('id')==source_selector_id){
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
            
            
function click_down_arrow(n){
	
    var source_selector_id = "applied_feature_" + n;
    
    var applied_features = d3.selectAll('.applied_feature')[0];
    var index = -1;
    
    applied_features.forEach(function(d,i){
        if(d3.select(d).attr('id')==source_selector_id){
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
            
            
function click_left_arrow(n){

	var id = "" + n;
	var this_feature = d3.select("#applied_feature_"+id);
    var level = null;
    
	if(this_feature.attr('level')==null){
		this_feature.attr('level',0);
        level = 0;
	}else if(this_feature.attr('level')==0){
        // Do nothing
        return;
    }else{
		var l = +this_feature.attr('level');
		this_feature.attr('level',function(){
			return l-1;
		});
        level = l-1;
	}
	
	this_feature.select('.feature_application_activate').style('margin-right',function(){
		var margin = 12 + level*arrow_margin;
		return margin+"px";
	});
    
    current_feature_application = get_feature_application_status(current_feature_application);
	apply_current_feature_scheme();
    
    update_feature_expression();
}
        
            

            
function adjust_logical_connective(){
    
    var all_features = d3.selectAll('.applied_feature')[0];
    
    var first_feature_select = d3.select(all_features[0]).select('.feature_application_logical_connective');
    var second_feature_select = d3.select(all_features[1]).select('.feature_application_logical_connective');
    
    if(first_feature_select[0][0]){ 
        if(first_feature_select.selectAll('option')[0].length==2){

            first_feature_select.selectAll('option').remove();
            first_feature_select    
                .selectAll('option')
                .data([{value:'N/A',text:'N/A'}])
                .enter()
                .append("option")
                .attr("value",function(d){
                    return d.value;
                })
                .text(function(d){
                    return d.text;
                }); 
            first_feature_select.style('margin-top','15px');
        }
    }
    

    if(second_feature_select[0][0]){
        if(second_feature_select.selectAll('option')[0].length==1){

            second_feature_select.selectAll('option').remove();
            second_feature_select      
                .selectAll('option')
                .data([{value:"&&",text:"AND"},{value:"||",text:"OR"}])
                .enter()
                .append("option")
                .attr("value",function(d){
                    return d.value;
                })
                .text(function(d){
                    return d.text;
                }).on("change",function(d){
                    current_feature_application = get_feature_application_status();
                    apply_current_feature_scheme();
                });
            second_feature_select.style('margin-top','0px');
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
        var logic = d3.select(d).select('.feature_application_logical_connective')[0][0].value; 
        if(logic=='N/A'){
            logic = '&&';
        }
        var level = +d3.select(d).attr('level');
        
        out.push({activation:activated, expression:expression, logic:logic, level:level});
    });
    
    return out;
}


function display_feature_application_status(features){
    
    if(features==null){
        features = get_feature_application_status();
    }
    
    for(var i=0;i<features.length;i++){
        var activation = features[i].activation;
        var expression = features[i].expression;
        var logic = features[i].logic;
        var level = +features[i].level;
        add_feature(level, logic, expression, activation)
    }
}


function get_feature_application_expression(features){

    if(features==null){
        features = current_feature_application;
    }
    
    var expressions = [];
    var logical_connectives = [];
    var levels = [];
    
    for(var i=0;i<features.length;i++){
        var activation = features[i].activation;
        var expression = features[i].expression;
        var logic = features[i].logic;
        var level = +features[i].level;

        if(activation){
        	if(expression.indexOf('&&')!=-1 || expression.indexOf('||')!=-1){
        		expression = '('+expression+')';
        	}
            expressions.push(expression);
            logical_connectives.push(logic);
        	if(level==null){
        		levels.push(0);
        	}else{
        		var levelNum = + level;
        		levels.push(levelNum);
        	}
        }
    }

    var filterExpression = "";
    var prev_level = 0;
    
    for(var i=0;i<expressions.length;i++){
    	var level = +levels[i];
        if(i > 0){
            if(level > prev_level){
            	filterExpression = filterExpression + logical_connectives[i];
            	while(prev_level != level){
            		filterExpression = filterExpression + "(";
            		prev_level++;
            	}
            }else if(level < prev_level){
            	while(prev_level > level){
            		filterExpression = filterExpression + ")";
            		prev_level--;
            	}
            	filterExpression = filterExpression + logical_connectives[i];
            }else{
            	filterExpression = filterExpression + logical_connectives[i];
            }
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
                // Deactivate the activated features. If the feature is FeatureToBeAdded, don't deactivate it
                d3.select(d).select('.feature_application_activate')[0][0].checked = false;
                d3.select(d).select('.feature_application_expression').style('color',"#989898");
                current_feature_application[i].activation = false;
            }
        });
        d3.select('#toggle_feature_scheme').text('Restore all features');
    }else{
        
        d3.selectAll('.applied_feature')[0].forEach(function(d,i){
            
            var expression = d3.select(d).select('.feature_application_expression').attr('expression');
            
            if(features_activation_store.indexOf(expression)!=-1){
                d3.select(d).select('.feature_application_activate')[0][0].checked = true;
                d3.select(d).select('.feature_application_expression').style('color',"#000000");
                current_feature_application[i].activation = true;
            }
        });
        reset_feature_activation();
    }
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
    
    expression = expression.replace(/\(/g,'<span style="color:'+bracket_color+';font-weight:bold">(</span>');
    expression = expression.replace(/\)/g,'<span style="color:'+bracket_color+';font-weight:bold">)</span>');
    expression = expression.replace(/&&/g,' <span style="color:'+logic_color+';">AND</span> ');
    expression = expression.replace(/\|\|/g,' <span style="color:'+logic_color+';">OR</span> ');
    
    d3.select('#featureApplicationExpressionPanel').html("<p>"+expression+"</p>");
    
}


function update_feature_application_status(expression,option){
    
    if(option=='remove'){
        // Remove a given feature from the application list
        remove_feature(expression);
        return;
        
    }else if(option=='create_placeholder'){
        // Newly create a new placeholder if it doesn't exist already
        create_feature_placeholder();
        return;

    }else if(option=='replace_placeholder'){
        
        current_feature_application = stashed_feature_application;
        
        var min_level = 100;
        for(var i=0;i<current_feature_application.length;i++){
            if(current_feature_application[i].level < min_level){
                min_level = current_feature_application[i].level;
            }
        }
        if(min_level > 0){
            for(var i=0;i<current_feature_application.length;i++){
                current_feature_application[i].level = current_feature_application[i].level-min_level;
            }
        }
        
        return;
        
    }else if(option=='update_placeholder'){
        
        if(expression==''){
            stashed_feature_application = [];
            display_feature_application_status(current_feature_application);
            update_feature_expression(current_feature_application);
            return;
        }
        
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
        
        
        if(!placeholder){
            // If placeholder does not exist, simply add it using conjunction at level 0
            placeholder = {activation:true, expression:'{FeatureToBeAdded}', logic:'&&', level:0};
            placeholder_index = features.length;
            features.push(placeholder);
            current_feature_application.push(placeholder);
        }
        
        var first_logic = placeholder.logic;
        var last_feature_level = +placeholder.level;
        var activation = placeholder.activation;
        
        var individual_features = decompose_feature(0, '&&', expression, []);

        // Add individual features
        for(var i=0;i<individual_features.length;i++){
            var logic = individual_features[i].logic;
            var level = +individual_features[i].level;
            level = +last_feature_level;
            var exp = individual_features[i].expression;
            if(i==0){
                logic = first_logic;
                features.splice(placeholder_index,1,{activation:true, expression:exp, logic:logic, level:level});
            }else{
                features.splice(placeholder_index+i,0,{activation:true, expression:exp, logic:logic, level:level});
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
        
        var individual_features = decompose_feature(0, '&&', expression, []);
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
            var logic = individual_features[i].logic;
            if(i==0) logic = first_logic;
            var level = individual_features[i].level + last_feature_level;
            var exp = individual_features[i].expression;

            var feature = {activation:activation, expression:exp, logic:logic, level:level};
            features.push(feature);
        }
        
        d3.selectAll('.applied_feature').remove();
        display_feature_application_status(current_feature_application);
        
        update_feature_expression();
        return;
    }
    
}



            
d3.select('#toggle_feature_scheme').on('click',toggle_feature_activation);
d3.select('#test_feature_scheme').on('click',test_feature);     
/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */




function openFilterOptions(){
    
    buttonClickCount_filterOptions += 1;
    
    document.getElementById('tab2').click();
    d3.select("[id=basicInfoBox_div]").select("[id=view2]").select("g").remove();

    var archInfoBox = d3.select("[id=basicInfoBox_div]").select("[id=view2]").append("g");
    archInfoBox.append("div")
            .attr("id","filter_title")
            .append("p")
            .text("Filter Setting");

    var applied_filter_div = archInfoBox
    		.append('div')
            .attr('id','filter_application_status');
    var filterApplicationStatusTitle = applied_filter_div.append('div')
			.attr('id','applied_filter_title_div');
    var filterApplicationStatus = applied_filter_div.append('div')
    		.attr('id','applied_filter_div');
    var filterApplicationStatusButton = applied_filter_div.append('div')
    		.attr('id','applied_filter_button_div');

    var filterOptions = archInfoBox.append("div")
            .attr("id","filter_options");
    var filterInputs = archInfoBox.append("div")
            .attr('id','filter_inputs');
    var filterAppendSlots = archInfoBox.append("div")
            .attr('id','filter_inputs_append_slots');
    var filterHints = archInfoBox.append('div')
            .attr('id','filter_hints');
    var filterButtons = archInfoBox.append('div')
            .attr('id','filter_buttons');
    
    var filterDropdownMenu = d3.select("#filter_options")
            .append("select")
            .attr('id','filter_options_dropdown_1')
            .attr("class","filter_options_dropdown");
    

    filterDropdownMenu.selectAll("option").remove();
    filterDropdownMenu.selectAll("option")
            .data(preset_filter_options)
            .enter()
            .append("option")
            .attr("value",function(d){
                return d.value;
            })
            .text(function(d){
                return d.text;
            });    
    
    d3.select("#filter_buttons").append("button")
            .attr("id","applyFilterButton_new")
            .attr("class","filter_options_button")
            .text("Apply filter");
//    d3.select("#filter_buttons").append("button")
//            .attr("class","filter_options_button")
//            .attr("id","applyFilterButton_add")
//            .style("margin-left","6px")
//            .style("float","left")
//            .text("Add to selection");
//    d3.select("#filter_buttons").append("button")
//            .attr("id","applyFilterButton_within")
//            .attr("class","filter_options_button")
//            .text("Search within selection");
    
    d3.select("#filter_options_dropdown_1").on("change",filter_options_dropdown_preset_filters);    

    d3.select("#applyFilterButton_add").on("click",function(d){
        applyFilter("add");
    });
    d3.select("#applyFilterButton_new").on("click",function(d){
        applyFilter("new");
    });
    d3.select("#applyFilterButton_within").on("click",function(d){
        applyFilter("within");
    });
    
    highlight_basic_info_box()
}


function remove_filter_option_inputs(level){
    
    d3.selectAll('.filter_inputs_div').remove(); 
    d3.selectAll('.filter_hints_div').remove();
    
    d3.select('#filter_options_dropdown_4').remove();
    if(level==3){return;}
    d3.select('#filter_options_dropdown_3').remove();
    if(level==2){return;}        
    d3.select('#filter_options_dropdown_2').remove();
    if(level==1){return;}
}



function filter_options_dropdown_preset_filters(){
    
    remove_filter_option_inputs(2);
    var selectedOption = d3.select('#filter_options_dropdown_1')[0][0].value;
    
    if (selectedOption==="not_selected"){return;}
    else{
        filter_input_preset(selectedOption,false); 
        d3.select("[id=saveFilter]").attr('disabled', true);
    }
}

function filter_input_preset(selectedOption,userDefOption){

    var filter_inputs = d3.select("[id=filter_inputs]");

    if (selectedOption=="present"){
        append_filterInputField_singleInstInput();
        d3.select("#filter_hints")
                .append("div")
                .attr("id","filter_hints_div_1")
                .attr('class','filter_hints_div')
                .text("(Hint: Designs that have the specified instrument are selected)");
   
    }
    else if (selectedOption=="absent"){
        append_filterInputField_singleInstInput();
        d3.select("#filter_hints")
                .append("div")
                .attr("id","filter_hints_div_1")
                .attr('class','filter_hints_div')
                .text("(Hint: Designs that do not have the specified instrument are selected)");   
    }
    else if (selectedOption=="inOrbit"){
    	append_filterInputField_orbitAndMultipleInstInput();
        d3.select("#filter_hints")
                .append("div")
                .attr("id","filter_hints_div_1")
                .attr('class','filter_hints_div')
                .text("(Hint: Designs that have the specified instruments inside the chosen orbit are selected)");
    }
    else if (selectedOption=="notInOrbit"){
        append_filterInputField_orbitAndInstInput();
        d3.select("#filter_hints")
                .append("div")
                .attr("id","filter_hints_div_1")
                .attr('class','filter_hints_div')
                .text("(Hint: Designs that do not have the specified instrument inside the chosen orbit are selected)");    
    }
    else if (selectedOption=="together"){
        append_filterInputField_multipleInstInput();
        d3.select("#filter_hints")
                .append("div")
                .attr("id","filter_hints_div_1")
                .attr('class','filter_hints_div')
                .text("(Hint: Designs that have the specified instruments in any one orbit are chosen)");    
    } 
    else if (selectedOption=="separate"){
        append_filterInputField_multipleInstInput();
        d3.select("#filter_hints")
                .append("div")
                .attr("id","filter_hints_div_1")
                .attr('class','filter_hints_div')
                .text("(Hint: Designs that do not have the specified instruments in the same orbit are chosen)");    
    } 
    else if (selectedOption=="emptyOrbit"){
        append_filterInputField_orbitInput();
        d3.select("#filter_hints")
                .append("div")
                .attr("id","filter_hints_div_1")
                .attr('class','filter_hints_div')
                .text("(Hint: Designs that have no instrument inside the specified orbit are chosen)");       
    } 
    else if (selectedOption=="numOrbits"){
        append_filterInputField_numOrbitInput();
        d3.select("#filter_hints")
                .append("div")
                .attr("id","filter_hints_div_1")
                .attr('class','filter_hints_div')
                .text("(Hint: Designs that have the specified number of non-empty orbits are chosen)");      
    } 
    else if (selectedOption=="numOfInstruments"){
    	append_filterInputField_numOfInstruments();
        d3.select("#filter_hints")
                .append("div")
                .attr("id","filter_hints_div_1")
                .attr('class','filter_hints_div')
                .text("(Hint: This highlights all the designs with the specified number of instruments. If you specify an orbit name, it will count all instruments in that orbit. If you can also specify an instrument name, and only those instruments will be counted across all orbits. If you leave both instruments and orbits blank, all instruments across all orbits will be counted.)"); 
    } 
    
    else if(selectedOption=="subsetOfInstruments"){
        append_filterInputField_subsetOfInstruments();
        d3.select("#filter_hints")
                .append("div")
                .attr("id","filter_hints_div_1")
                .attr('class','filter_hints_div')
                .text("(Hint: The specified orbit should contain at least m number and at maximum M number of instruments from the specified instrument set. m is the first entry and M is the second entry in the second field)");  
    } else if(selectedOption=="defineNewFilter"){
    	
    } else if(selectedOption=="paretoFront"){
        d3.select('#filter_inputs')
	        .append("div")
	        .attr("id","filter_inputs_div_1")
	        .attr('class','filter_inputs_div')
	        .text("Input Pareto Ranking (Integer number between 0-15): ")
	        .append("input")
	        .attr("class","filter_inputs_textbox")
	        .attr("type","text");
    }else{
    

    }  
    
    d3.select("#filter_hints")
        .append("div")
        .attr("id","filter_hints_div_2")
        .attr('class','filter_hints_div')
        .html('<p>Valid orbit names: 1000, 2000, 3000, 4000, 5000</p>'
                        +'Valid instrument names: A, B, C, D, E, F, G, H, I, J, K, L');      
}



function append_filterInputField_singleInstInput(){
    d3.select("#filter_inputs")
            .append("div")
            .attr("id","filter_inputs_div_1")
            .attr('class','filter_inputs_div')
            .append('div')
            .attr('class','filter_inputs_supporting_comments_begin')
            .text("Input single instrument name: ");
    d3.select('#filter_inputs_div_1')
            .append("input")
            .attr("class","filter_inputs_textbox")  
            .attr("type","text");
}


function append_filterInputField_orbitInput(){
    d3.select('#filter_inputs')
            .append("div")
            .attr("id","filter_inputs_div_1")
            .attr('class','filter_inputs_div')
            .append('div')
            .attr('class','filter_inputs_supporting_comments_begin')
            .text("Input orbit name");
    d3.select('#filter_inputs_div_1')
            .append("input")
            .attr("class","filter_inputs_textbox")
            .attr("type","text");
}
function append_filterInputField_orbitAndInstInput(){

        d3.select('#filter_inputs')
            .append("div")
            .attr("id","filter_inputs_div_1")
            .attr('class','filter_inputs_div')
            .append('div')
            .attr('class','filter_inputs_supporting_comments_begin')
            .text("Input orbit name: ");
        d3.select('#filter_inputs_div_1')
            .append("input")
            .attr("class","filter_inputs_textbox")
            .attr("type","text");

        d3.select('#filter_inputs')
            .append("div")
            .attr("id","filter_inputs_div_2")
            .attr('class','filter_inputs_div')
            .append('div')
            .attr('class','filter_inputs_supporting_comments_begin')
            .text("Input single instrument name: ");
        d3.select('#filter_inputs_div_2')
            .append("input")
            .attr("class","filter_inputs_textbox")
            .attr("type","text");
    
}
function append_filterInputField_multipleInstInput(){
        d3.select('#filter_inputs')
            .append("div")
            .attr("id","filter_inputs_div_1")
            .attr('class','filter_inputs_div')
            .append('div')
            .attr('class','filter_inputs_supporting_comments_begin')
            .text("Input instrument names (2 or 3) separated by comma:");
        d3.select('#filter_inputs_div_1')
            .append("input")
            .attr("class","filter_inputs_textbox")
            .attr("type","text");
}
function append_filterInputField_orbitAndMultipleInstInput(){
        d3.select('#filter_inputs')
            .append("div")
            .attr('id','filter_inputs_div_1')
            .attr('class','filter_inputs_div')
            .append('div')
            .attr('class','filter_inputs_supporting_comments_begin')
            .text("Input orbit name: ");
        d3.select('#filter_inputs_div_1')
            .append("input")
            .attr("class","filter_inputs_textbox")
            .attr("type","text");

        d3.select('#filter_inputs')
            .append("div")
            .attr("id","filter_inputs_div_2")
            .attr('class','filter_inputs_div')
            .append('div')
            .attr('class','filter_inputs_supporting_comments_begin')
            .text("Input instrument names (minimum 1, and maximum 3) separated by comma: ");
        d3.select('#filter_inputs_div_2')
            .append("input")
            .attr("class","filter_inputs_textbox")
            .attr("type","text");
}


function append_filterInputField_numOfInstruments(){
    d3.select('#filter_inputs')
            .append("div")
            .attr("id","filter_inputs_div_1")
            .attr('class','filter_inputs_div')
            .append('div')
            .attr('class','filter_inputs_supporting_comments_begin')
            .text("Input an orbit name (Could be N/A): ");
    d3.select('#filter_inputs_div_1')
            .append("input")
            .attr("class","filter_inputs_textbox")
            .attr("type","text")
            .attr("value","N/A");    
    
    d3.select('#filter_inputs')
            .append("div")
            .attr("id","filter_inputs_div_2")
            .attr('class','filter_inputs_div')
            .append('div')
            .attr('class','filter_inputs_supporting_comments_begin')
            .text("Input instrument name (Could be N/A): ");
    d3.select('#filter_inputs_div_2')
            .append("input")
            .attr("class","filter_inputs_textbox")
            .attr("type","text")
            .attr("value","N/A");

    d3.select('#filter_inputs').append("div")
            .attr("id","filter_inputs_div_3")
            .attr('class','filter_inputs_div')
            .append('div')
            .attr('class','filter_inputs_supporting_comments_begin')
	    .text("Input a number of instrument used (should be greater than or equal to 0): ");
    d3.select('#filter_inputs_div_3')
            .append("input")
            .attr('class',"filter_inputs_textbox")
            .attr("type","text");
}
function append_filterInputField_numOrbitInput(){
        d3.select('#filter_inputs')
                .append("div")
                .attr("id","filter_inputs_div_1")
                .attr('class','filter_inputs_div')
                .append('div')
                .attr('class','filter_inputs_supporting_comments_begin')
                .text("Input number of orbits");
        d3.select('#filter_inputs_div_1')
                .append("input")
                .attr("class","filter_inputs_textbox")
                .attr("type","text");
}
function append_filterInputField_subsetOfInstruments(){
        d3.select('#filter_inputs')
                .append("div")
                .attr("id","filter_inputs_div_1")
                .attr('class','filter_inputs_div')
                .append('div')
                .attr('class','filter_inputs_supporting_comments_begin')
                .text("Input orbit name: ");
        d3.select('#filter_inputs_div_1')
                .append("input")
                .attr("class","filter_inputs_textbox")
                .attr("type","text");

        d3.select('#filter_inputs')
                .append("div")
                .attr("id","filter_inputs_div_2")
                .attr('class','filter_inputs_div')
                .append('div')
                .attr('class','filter_inputs_supporting_comments_begin')
                .text("Input the min and the max (optional) number of instruments in the subset, separated by comma: ");
        d3.select('#filter_inputs_div_2')
                .append("input")
                .attr("class","filter_inputs_textbox")
                .attr("type","text");

        d3.select('#filter_inputs')
                .append("div")
                .attr("id","filter_inputs_div_3")
                .attr('class','filter_inputs_div')
                .append('div')
                .attr('class','filter_inputs_supporting_comments_begin')
                .text("Input a set of instrument names, separated by comma: ");
        d3.select('#filter_inputs_div_3')
                .append("input")
                .attr("class","filter_inputs_textbox")
                .attr("type","text");
}


function get_number_of_inputs(){
    return d3.selectAll('.filter_inputs_div')[0].length;
}



















function remove_outer_parentheses(expression){
	
	if(expression[0]!="(" || expression[expression.length-1]!=")"){
		// Return if the expression does not start with "(" or ")".
		return expression;
	}else{
		var leng = expression.length;
		var level = 0;
		var paren_end = -1;
		for(var i=0;i<leng;i++){
			if(expression[i]==="("){
				level++;
			}
			else if(expression[i]===")"){
				level--;
				if(level==0){
					paren_end = i;
					break;
				}
			}
		}
		if(paren_end == leng-1){
			var new_expression = expression.substring(1,leng-1);
			return remove_outer_parentheses(new_expression);
		}else{
			return expression;
		}
	}
}


function get_nested_parenthesis_depth(expression){
	var leng = expression.length;
	var level = 0;
	var maxLevel = 0;
	for(var i=0;i<leng;i++){
		if(expression[i]==="("){
			level++;
			if(level>maxLevel) maxLevel=level;
		}
		else if(expression[i]===")"){
			level--;
		}
	}
	return maxLevel;
}
function collapse_paren_into_symbol(expression){
	var leng = expression.length;
	var modified_expression = "";
	var level = 0;
	for(var i=0;i<leng;i++){

		if(expression[i]==="("){
			level++;
		}
		else if(expression[i]===")"){
			level--;
		}
		if(expression[i]==="(" && level==1){
			modified_expression=modified_expression + expression[i];
		}
		else if(level>=1){
			modified_expression=modified_expression + "X";
		}else{
			modified_expression=modified_expression + expression[i];
		}
	}
	return modified_expression;
}


function compareMatchedIDSets(logic,set1,set2){
	var output = [];
    if(logic=="&&"){
        for(var i=0;i<set1.length;i++){
            if(set2.indexOf(set1[i])>-1){
                output.push(set1[i]);
            }
        }
    }else{ // OR
        for(var i=0;i<set1.length;i++){
            output.push(set1[i]);
        }
        for(var j=0;j<set2.length;j++){
            if(output.indexOf(set2[j])==-1){
                output.push(set2[j]);
            }
        }
    }
    return output;
}



//({absent[;9;]}&&{numOfInstruments[;11;1]}&&{emptyOrbit[2;;]}&&{emptyOrbit[3;;]})&&({numOfInstruments[;;2]}||{numOfInstruments[;;3]}||{numOfInstruments[;;4]}||{numOfInstruments[;;5]}||{numOfInstruments[;;6]})


function processFilterExpression(expression, prev_matched, prev_logic, arch_info){

	var e=expression;
    // Remove outer parenthesis
	e = remove_outer_parentheses(e);
    var current_matched = [];
    var first = true;
    var e_collapsed;
        
    if(get_nested_parenthesis_depth(e)==0){
        // Given expression does not have a nested structure
        if(e.indexOf("&&")>-1 || e.indexOf("||")>-1){
        	// Logical connectives are present
           e_collapsed=e; 
        }else{
        	// Single filter expression
        	var matched = [];
        	for(var i=0;i<prev_matched.length;i++){
        		var index = prev_matched[i];
        		//archInfo = {bitStrings:bitStrings,paretoRankings:paretoRankings};
        		if(applyPresetFilter(e,arch_info.bitStrings[index],arch_info.paretoRankings[index])){
        			matched.push(index);
        		}
        	}
        	current_matched = matched;
            return compareMatchedIDSets(prev_logic, current_matched, prev_matched);
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
            prev = '&&'
            current_matched = prev_matched;
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
            if(prev=="||"){
                var temp_matched = processFilterExpression(current,prev_matched,'&&',arch_info); 
                current_matched = compareMatchedIDSets(prev, current_matched, temp_matched);
            }else{
                current_matched = processFilterExpression(current,current_matched,prev,arch_info); 
            }
        }else{
            if(prev=="||"){
                var temp_matched = processFilterExpression(e, prev_matched,'&&',arch_info); 
                current_matched = compareMatchedIDSets(prev, current_matched, temp_matched);
            }else{
                current_matched = processFilterExpression(e,current_matched,prev,arch_info); 
            }        	
            break;
        }
    }
    return current_matched;
}
 





function applyPresetFilter(expression,bitString,rank){
	
	// Preset filter: {presetName[orbits;instruments;numbers]}   
	expression = expression.substring(1,expression.length-1);
	
	var flip=false;
	if(expression.startsWith("~")){
		flip=true;
		expression = expression.substring(1,expression.length);
	}
	
	var type = expression.split("[")[0];
	
	if(type==="paretoFront"){
		var arg = +expression.substring(0,expression.length-1).split("[")[1];
		if(rank<= +arg && rank >=0) return true;
		else return false;
	}
	
	var condition = expression.substring(0,expression.length-1).split("[")[1];
	var condSplit = condition.split(";");
	var orbit, instr, numb;
	if(condSplit[0].length > 0){
		orbit = +condSplit[0];
	}else{
		orbit = condSplit[0];
	}
	if(condSplit[1].length > 0){
		if(condSplit[1].indexOf(",")==-1){
			instr = +condSplit[1];
		}else{
			instr = condSplit[1];
		}
	}else{
		instr = condSplit[1];
	}
	if(condSplit[2].length > 0){
		if(condSplit[2].length==1) numb = +condSplit[2];
		else numb = condSplit[2];
	}else{
		numb = condSplit[2];
	}

	var resu;
	switch(type) {
    case "present":
    	if(instr==-1) return false;
    	resu=false;
        for(var i=0;i<norb;i++){
            if(bitString[ninstr*i+instr]===true){
                resu=true;break;
            }
        }
        break;
    case "absent":
    	if(instr==-1) return false;
    	resu=true;
        for(var i=0;i<norb;i++){
            if(bitString[ninstr*i+instr]===true){
                resu=false;break;
            }
        }
        break;
    case "inOrbit":
    	var instrument_temp = instr + '';
    	if(instrument_temp.indexOf(',')==-1){
    		// One instrument
        	resu=false;
            if(bitString[orbit*ninstr + instr]===true){
            	resu=true;
            }
            break;    		
    	}else{
    		// Multiple instruments
        	resu=true;
        	var instruments = instrument_temp.split(",");
    		for(var j=0;j<instruments.length;j++){
    			var temp = +instruments[j];
    			if(bitString[orbit*ninstr + temp]===false){
    				resu= false;break;
    			}
    		}    		
    	}
    	break;
    case "notInOrbit":
    	resu=true;
        if(bitString[orbit*ninstr + instr]===true){
        	resu=false;
        }
        break;
    case "together":
    	resu=false;
    	var instruments = instr.split(",");
    	for(var i=0;i<norb;i++){
    		var found = true;
    		for(var j=0;j<instruments.length;j++){
    			var temp = +instruments[j];
    			if(bitString[i*ninstr+temp]===false){
    				found=false;
    			}
    		}
    		if(found===true){
    			resu=true;break;
    		}
    	}
        break;

    case "separate":
    	resu=true;
    	var instruments = instr.split(",");
    	for(var i=0;i<norb;i++){
    		var together = true;
    		for(var j=0;j<instruments.length;j++){
    			var temp = +instruments[j];
    			if(bitString[i*ninstr+temp]===false){
    				together=false;
    			}
    		}
    		if(together===true){
    			resu= false;break;
    		}
    	}
        break;

    case "emptyOrbit":
    	resu=true;
    	for(var i=0;i<ninstr;i++){
    		if(bitString[orbit*ninstr+i]===true){
    			resu= false;break;
    		}
    	}
        break;

    case "numOrbits":
    	var count=0;
    	resu=false;
    	for(var i=0;i<norb;i++){
    		for(var j=0;j<ninstr;j++){
    			if(bitString[i*ninstr+j]===true){
    				count++;
    				break;
    			}
    		}
    	}
    	if(numb===count){
    		resu= true;
    	}
        break;

    case "subsetOfInstruments":
    	var count = 0;    	
    	var instruments = instr.split(",");
    	var numbers = "" + numb;
    	var numbers = numbers.split(",");
    	resu=false;
    	
		for(var j=0;j<instruments.length;j++){
			var temp = +instruments[j];
			if(bitString[orbit*ninstr + temp]===true){
				count++;
			}
		}
		if(numbers.length==1){
			if(count >= +numbers[0]){
				resu= true;
			}
		}else{
			if(count >= +numbers[0] && count <= +numbers[1]){
				resu= true;
			}
		}
        break;

    case "numOfInstruments":
    	var count=0;
    	resu=false;
    	if(orbit===""){
			// num of instruments across all orbits
    		if(instr===""){
    			// num of specified instrument
    			for(var i=0;i<norb;i++){
    				for(var j=0;j<ninstr;j++){
    					if(bitString[i*ninstr+j]===true) count++;
    				}
    			}
    		}else{
    			// num of all instruments
    			for(var i=0;i<norb;i++){
    				if(bitString[i*ninstr+instr]===true){
    					count++;
    				}
    			}
    		}
    	}else{
    		// number of instruments in a specified orbit
    		for(var i=0;i<ninstr;i++){
    			if(bitString[orbit*ninstr+i]===true){
    				count++;
    			}
    		}
    	}
		if(count===+numb) resu= true;
        break;
    	
    default:
    	return false;
	}

	if(flip==true){
		return !resu;
	}else{
		return resu;
	}
	
}
   
   
   




function applyFilter(option){


    var dropdown = d3.select("#filter_options_dropdown_1")[0][0].value;
    
	
	
	// Remove remaining traces of actions from driving features tab
	remove_df_application_status();
	
    buttonClickCount_applyFilter += 1;
    
    var wrong_arg = false;
    
    var filterExpression;
    var matchedArchIDs = [];


    var numInputs = get_number_of_inputs();
    var input_textbox = [];
    var input_select = [];
    var inputObj =  d3.selectAll('.filter_inputs_div')[0];
    
    inputObj.forEach(function(d,i){
        var textboxObj = d3.select(d).select('.filter_inputs_textbox')[0][0];
        var selectObj = d3.select(d).select('.filter_inputs_select')[0][0];
        if(textboxObj!==null){
        	// Remove all white spaces
        	var input = textboxObj.value.replace(/\s+/g, "");
            input_textbox.push(input);
        }else{
            input_textbox.push(null);
        }
        if(selectObj!==null){
            input_select.push(selectObj.value);
        }else{
            input_select.push(null);
        }
    })

    
    // Example of an filter expression: {presetName[orbits;instruments;numbers]} 
    var presetFilter = dropdown;
    if(presetFilter=="present" || presetFilter=="absent" || presetFilter=="together" || presetFilter=="separate"){
        var instrument = input_textbox[0];
        filterExpression = presetFilter + "[;" + DisplayName2Index(instrument.toUpperCase(),"instrument") + ";]";
    }else if(presetFilter == "inOrbit" || presetFilter == "notInOrbit"){
        var orbit = input_textbox[0].trim();
        var instrument = input_textbox[1];
        filterExpression = presetFilter + "["+ DisplayName2Index(orbit,"orbit") + ";" + DisplayName2Index(instrument.toUpperCase(),"instrument")+ ";]";
    }else if(presetFilter =="emptyOrbit"){
        var orbit = input_textbox[0].trim();
        filterExpression = presetFilter + "[" + DisplayName2Index(orbit,"orbit") + ";;]";
    }else if(presetFilter=="numOrbits"){
        var number = input_textbox[0].trim();
        filterExpression = presetFilter + "[;;" + number + "]";
    }else if(presetFilter=="subsetOfInstruments"){
    	var orbit = input_textbox[0].trim();
    	var instrument = input_textbox[2];
    	var numbers = input_textbox[1].trim().replace(/\s+/g, "");
        filterExpression = presetFilter + "["+ DisplayName2Index(orbit,"orbit") + ";" + DisplayName2Index(instrument.toUpperCase(),"instrument")+ ";"+ numbers+"]";
    }else if(presetFilter=="numOfInstruments"){
        var orbit = input_textbox[0];
        var instrument = input_textbox[1];
        var number = input_textbox[2];
        // There are 3 possibilities
        
        var orbitEmpty = false; 
        var instrumentEmpty = false;
        
        if(orbit=="N/A" || orbit.length==0){
            orbitEmpty=true;
        }
        if(instrument=="N/A" || instrument.length==0){
            instrumentEmpty = true;
        }
        if(orbitEmpty && instrumentEmpty){
            // Count all instruments across all orbits
            filterExpression=presetFilter + "[;;" + number + "]";
        }else if(orbitEmpty){
            // Count the number of specified instrument
            filterExpression=presetFilter + "[;" + DisplayName2Index(instrument.toUpperCase(),"instrument") + ";" + number + "]";
        }else if(instrumentEmpty){
            // Count the number of instruments in an orbit
        	orbit = orbit.trim();
            filterExpression=presetFilter + "[" + DisplayName2Index(orbit,"orbit") + ";;" + number + "]";
        }
    } else if(dropdown==="paretoFront"){
        // To be implemented    
        var filterInput = d3.select("#filter_inputs_div_1").select('.filter_inputs_textbox')[0][0].value;
        filterExpression = "paretoFront["+filterInput+"]";
    }
    else{// not selected
        return;
    }
    filterExpression = "{" + filterExpression + "}";
    update_filter_application_status(filterExpression,option);

    
    if(filterExpression.indexOf('paretoFront')!=-1){
    	var filterInput = d3.select("#filter_inputs_div_1").select('.filter_inputs_textbox')[0][0].value;
    	applyParetoFilter(option,filterInput);
    }else{
        if(option==="new"){
            cancelDotSelections();
            d3.selectAll('.dot')[0].forEach(function(d){
                var bitString = d.__data__.bitString;
                if(applyPresetFilter(filterExpression,bitString)){
                	if(d3.select(d).attr('status')=='selected'){
                        d3.select(d).attr('status','selected_and_highlighted')
                        	.style("fill", "#F75082");
                	}else{
                        d3.select(d).attr('status','highlighted')
                        .style("fill", "#F75082");
                    }
                }
            });
        }else if(option==="add"){
            d3.selectAll('.dot')[0].forEach(function(d){
                var bitString = d.__data__.bitString;
                if(applyPresetFilter(filterExpression,bitString)){
                	if(d3.select(d).attr('status')=='selected'){
                        d3.select(d).attr('status','selected_and_highlighted')
                        	.style("fill", "#F75082");
                	}else{
                        d3.select(d).attr('status','highlighted')
                        .style("fill", "#F75082");
                    }
                }
            });
        }else if(option==="within"){
            d3.selectAll('[status=highlighted]')[0].forEach(function(d){
                var bitString = d.__data__.bitString;
                if(!applyPresetFilter(filterExpression,bitString)){
                    d3.select(d).attr('status','default')
                    	.style("fill", function (d) {return "#000000";});   
                }
            }); 
            d3.selectAll('[status=selected_and_highlighted]')[0].forEach(function(d){
                var bitString = d.__data__.bitString;
                if(!applyPresetFilter(filterExpression,bitString)){
                    d3.select(d).attr('status','selected')
                    	.style("fill", function (d) {return "#19BAD7";});   
                }
            });              
        }
    }


    if(wrong_arg){
    	alert("Invalid input argument");
    }
    d3.select("[id=numOfSelectedArchs_inputBox]").text("" + numOfSelectedArchs());  

}




function applyParetoFilter(option, arg){
    if(option==="new"){
        cancelDotSelections();
        d3.selectAll(".dot")[0].forEach(function (d) {
            var rank = parseInt(d3.select(d).attr("paretoRank"));
            if (rank <= +arg && rank >= 0){
            	if(d3.select(d).attr('status')=='selected'){
                    d3.select(d).attr('status','selected_and_highlighted')
                    	.style("fill", "#F75082");
            	}else{
                    d3.select(d).attr('status','highlighted')
                    .style("fill", "#F75082");
                }
            }
        });  
    }else if(option==="add"){
        d3.selectAll(".dot")[0].forEach(function (d) {
            var rank = parseInt(d3.select(d).attr("paretoRank"));
            if (rank <= +arg && rank >= 0){
            	if(d3.select(d).attr('status')=='selected'){
                    d3.select(d).attr('status','selected_and_highlighted')
                    	.style("fill", "#F75082");
            	}else{
                    d3.select(d).attr('status','highlighted')
                    .style("fill", "#F75082");
                }
            }
        });  
    }else if(option==="within"){
        d3.selectAll("[status=highlighted]")[0].forEach(function (d) {
            var rank = parseInt(d3.select(d).attr("paretoRank"));
            if (rank > +arg || rank < 0){
                d3.select(d).attr('status','default')
                	.style("fill", "#000000");
            }
        }); 
        d3.selectAll("[status=selected_and_highlighted]")[0].forEach(function (d) {
            var rank = parseInt(d3.select(d).attr("paretoRank"));
            if (rank > +arg || rank < 0){
                d3.select(d).attr('status','selected')
                	.style("fill", "#19BAD7");
            }
        }); 
    }
}





function applyComplexFilter(input_expression){
	
	// Remove remaining traces of actions from driving features tab
	remove_df_application_status();
	
	
    var filterExpression
    
    if(input_expression==null){
    	filterExpression = parse_filter_application_status();
    }else{
    	filterExpression = input_expression;
    }
    
    if(filterExpression===""){
        cancelDotSelections();
        return;
    }

	cancelDotSelections();

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
    var matchedIndices = processFilterExpression(filterExpression, indices, "&&", arch_info);
                
    var matchedIDs = [];
    for(var i=0;i<matchedIndices.length;i++){
    	var index = matchedIndices[i];
    	matchedIDs.push(ids[index]);
    }


    d3.selectAll('.dot')[0].forEach(function(d){
    	if(matchedIDs.indexOf(d.__data__.id)>-1){
    		if(d3.select(d).attr('status')=='default'){
                d3.select(d).attr('status','highlighted')
            		.style("fill", "#F75082");
    		}else{
                d3.select(d).attr('status','selected_and_highlighted')
            		.style("fill", "#F75082");
    		}
    	}
    });  
    
    d3.select("[id=numOfSelectedArchs_inputBox]").text("" + numOfSelectedArchs());  
}




function save_user_defined_filter(expression){
	var expression_to_save;
    if(expression){
        if(expression.substring(0,1)!=="{"){
            expression = "{" + expression + "}";
        }
        expression_to_save=expression;
    }else{
        var filterExpression = parse_filter_application_status();        
        expression_to_save=filterExpression;
    }
    
    if(userdef_features.indexOf(expression_to_save)==-1){
        userdef_features.push(expression_to_save);
    }
    d3.select('#filter_application_save')
    		.attr('disabled',true)
    		.text('Current filter scheme saved');
	
    initialize_tabs_driving_features();
    initialize_tabs_classification_tree();
}



function update_filter_application_status(inputExpression,option){    
    
    var application_status = d3.select('#applied_filter_div');
    var count = application_status.selectAll('.applied_filter').size();
    
    var thisFilter = application_status.append('div')
            .attr('id',function(){
                var num = count+1;
                return 'applied_filter_' + num;
            })
            .attr('class','applied_filter');
    
    thisFilter.append('input')
            .attr('type','checkbox')
            .attr('class','filter_application_activate');
    thisFilter.append('select')
            .attr('class','filter_application_logical_connective')
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
    thisFilter.append('div')
            .attr('class','filter_application_expression')
            .attr('expression',function(d){
            	return inputExpression;
            })
            .text(ppdf(inputExpression));
    
    thisFilter.append('img')
            .attr('src','img/left_arrow.png')
            .attr('id',function(){
                var num = count+1;
                return 'leftarrow_' + num;
            })
            .attr('width','20')
            .attr('height','20')
            .style('float','left')
            .style('margin-left','13px');
    thisFilter.append('img')
            .attr('src','img/left_arrow.png')
            .attr('id',function(){
                var num = count+1;
                return 'rightarrow_' + num;
            })
            .attr('class','img-hor-vert')
            .attr('width','20')
            .attr('height','20')
            .style('float','left')
            .style('margin-left','4px')
            .style('margin-right','7px'); 
    
    
    var num = count+1;
    d3.selectAll("#leftarrow_"+num).on("click",function(d){
    	click_left_arrow(num);
    });
    d3.selectAll("#rightarrow_"+num).on("click",function(d){
    	click_right_arrow(num);
    });
    
    thisFilter.append('button')
            .attr('class','filter_application_delete')
            .text('Remove');
    
    
    if(option==="new"){
        // Activate only the current filter
        d3.selectAll('.filter_application_activate')[0].forEach(function(d){
            d3.select(d)[0][0].checked=false;
        })        
        d3.selectAll('.filter_application_expression').style("color","#989898"); // gray
        thisFilter.select('.filter_application_expression').style("color","#000000"); // black
        thisFilter.select('.filter_application_activate')[0][0].checked=true;
        thisFilter.select('.filter_application_logical_connective')[0][0].value="&&";
    }else if(option==="add"){ // or
        thisFilter.select('.filter_application_activate')[0][0].checked=true;
        thisFilter.select('.filter_application_logical_connective')[0][0].value="||";
    }else if(option==="within"){ // and
        thisFilter.select('.filter_application_activate')[0][0].checked=true;
        thisFilter.select('.filter_application_logical_connective')[0][0].value="&&";
    }else if(option==="deactivated"){
        thisFilter.select('.filter_application_activate')[0][0].checked=false;
        thisFilter.select('.filter_application_logical_connective')[0][0].value="&&";
        thisFilter.select('.filter_application_expression').style("color","#989898"); // gray        
    }
    
    thisFilter.select(".filter_application_delete").on("click",function(d){
        var activated = thisFilter.select('.filter_application_activate')[0][0].checked;
        thisFilter.remove();
        if(activated){
            applyComplexFilter();
        }
        if(d3.selectAll('.applied_filter')[0].length===0){
            d3.select('#filter_application_save').remove();
        	d3.select('#applied_filter_title_div')
    			.select('div').remove();
        }
    });
    
    thisFilter.select('.filter_application_activate').on("change",function(d){
        var activated = thisFilter.select('.filter_application_activate')[0][0].checked;
        thisFilter.select('.filter_application_expression').style("color",function(d){
            if(activated){
                return "#000000"; //black
            }else{
                return "#989898"; // gray
            }
        });
        applyComplexFilter();
    });
    thisFilter.select('.filter_application_logical_connective').on("change",function(d){
        applyComplexFilter();
    });
    
    
    if(d3.select('#filter_application_save')[0][0]){
    	// If save button exists, activate it
        d3.select('#filter_application_save')
	    	.text("Save currently applied filter scheme");    
    }else{
    	// If save button does not exist, add it
    	d3.select('#applied_filter_title_div')
    		.append('div')
    		.text('Filter application status');
        d3.select("#applied_filter_button_div")
        	.append("button")
		    .attr("id","filter_application_save")
		    .attr("class","filter_options_button")
		    .text("Save currently applied filter scheme");
    }
    d3.select("#filter_application_save")[0][0].disabled = false;
    d3.select('#filter_application_save')
            .on('click',function(d){
                save_user_defined_filter(null);
            });        
}


var arrow_margin = 30;
function click_right_arrow(n){
	var id = "" + n;
	var appliedFilter = d3.select("#applied_filter_"+id);
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
	
	appliedFilter.select('.filter_application_activate').style('margin-right',function(){
		var margin = level*arrow_margin
		return level*arrow_margin+"px";
	});
	applyComplexFilter();
}
function click_left_arrow(n){
	var id = "" + n;
	var appliedFilter = d3.select("#applied_filter_"+id);
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
	appliedFilter.select('.filter_application_activate').style('margin-right',function(){
		var margin = level*arrow_margin
		return level*arrow_margin+"px";
	});
	applyComplexFilter();
}



function parse_filter_application_status(){
	
    var application_status = d3.select('#applied_filter_div');
    var count = application_status.selectAll('.applied_filter').size();
    var filter_expressions = [];
    var filter_logical_connective = [];
    var filter_level = [];
    
    application_status.selectAll('.applied_filter')[0].forEach(function(d){
    	
        var activated = d3.select(d).select('.filter_application_activate')[0][0].checked;
        var expression = d3.select(d).select('.filter_application_expression').attr('expression');
        var logic = d3.select(d).select('.filter_application_logical_connective')[0][0].value;
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
    //console.log(prev_level);
    if(prev_level>0){
    	while(prev_level!=0){
        	filterExpression = filterExpression + ")";
        	prev_level--;
    	}
    }
    
    console.log(filterExpression);
    return filterExpression;
}
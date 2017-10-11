/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */




function openFilterOptions(){
    
    buttonClickCount_filterOptions += 1;
    
    document.getElementById('tab2').click();
    d3.select("#supportPanel").select("[id=view2]").select("g").remove();

    var supportPanel = d3.select("#supportPanel").select("[id=view2]").append("g");
    supportPanel.append("div")
            .attr("id","filter_title")
            .append("p")
            .text("Filter Setting");

    var filterOptions = supportPanel.append("div")
            .attr("id","filter_options");
    var filterInputs = supportPanel.append("div")
            .attr('id','filter_inputs');
    var filterAppendSlots = supportPanel.append("div")
            .attr('id','filter_inputs_append_slots');
    var filterHints = supportPanel.append('div')
            .attr('id','filter_hints');
    var filterButtons = supportPanel.append('div')
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
            .attr("id","applyFilterButton")
            .attr("class","filter_options_button")
            .text("Apply Filter")
            .on("click",applyFilter);
    
    d3.select("#filter_options_dropdown_1").on("change",filter_options_dropdown_preset_filters);    

    
    highlight_support_panel()
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
        append_filterInputField_orbitAndMultipleInstInput();
        d3.select("#filter_hints")
                .append("div")
                .attr("id","filter_hints_div_1")
                .attr('class','filter_hints_div')
                .text("(Hint: Designs that do not have the specified instruments inside the chosen orbit are selected)");    
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
        
    } else if(selectedOption=="ifInstrumentExists"){
    	
        append_filterInputField_ifInstrumentExists();
        d3.select("#filter_hints")
                .append("div")
                .attr("id","filter_hints_div_1")
                .attr('class','filter_hints_div')
                .text("(Hint: The specified instrument may not be used. If it is present, it must be assigned to one of the specified orbits)"); 
        
    }else if(selectedOption=="paretoFront"){
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



function append_filterInputField_ifInstrumentExists(){
    
        d3.select('#filter_inputs')
                .append("div")
                .attr("id","filter_inputs_div_1")
                .attr('class','filter_inputs_div')
                .append('div')
                .attr('class','filter_inputs_supporting_comments_begin')
                .text("Input a single instrument name: ");
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
                .text("Input orbit name (for multiple orbit inputs, separate using comma): ");

        d3.select('#filter_inputs_div_2')
                .append("input")
                .attr("class","filter_inputs_textbox")
                .attr("type","text");
    
}







function get_number_of_inputs(){
    return d3.selectAll('.filter_inputs_div')[0].length;
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

// processFilterExpression(filter_expression, indices, "&&", arch_info);

function processFilterExpression(expression, prev_matched_ids, prev_logic, arch_info){

	var e=expression;
    // Remove outer parenthesis
	e = remove_outer_parentheses(e);
    
    var current_matched_ids = [];
    var first = true;
    var e_collapsed;
        
    if(get_nested_parenthesis_depth(e)==0){
        // Given expression does not have a nested structure
        if(e.indexOf("&&")>-1 || e.indexOf("||")>-1){
        	// Logical connectives are present
           e_collapsed=e; 
        }else{
        	// Single filter expression
            if(e.indexOf('FeatureToBeAdded') > -1){
                // Skip matching if the current feature is a FeatureToBeAdded
                return prev_matched_ids;
            }
        	var matched = [];
        	for(var i=0;i<prev_matched_ids.length;i++){
        		var index = prev_matched_ids[i];
        		//archInfo = {bitStrings:bitStrings,paretoRankings:paretoRankings};
        		if(applyPresetFilter(e,arch_info.bitStrings[index],arch_info.paretoRankings[index])){
        			matched.push(index);
        		}
        	}
        	current_matched_ids = matched;
            return compareMatchedIDSets(prev_logic, current_matched_ids, prev_matched_ids);
        }
    }else{
        // Removes the nested structure
        e_collapsed = collapse_paren_into_symbol(e);
    }

    while(true){
        var current_collapsed;
        var current_logic;
        
        if(first){
            // The first filter in a series to be applied
            current_logic = prev_logic;
            current_matched_ids = prev_matched_ids;
            first = false;
        }else{
            current_logic = e_collapsed.substring(0,2);
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
            
            if(current_logic=="||"){
                var skip = false;
                if(current.indexOf('{FeatureToBeAdded}')!=-1){
                    if(remove_outer_parentheses(current)=='{FeatureToBeAdded}'){
                        // If the current filter is {FeatureToBeAdded}, then skip processing it
                        skip=true;
                    }
                }
                if(!skip){
                    var temp_matched = processFilterExpression(current,prev_matched_ids,'&&',arch_info); 
                    current_matched_ids = compareMatchedIDSets(current_logic, current_matched_ids, temp_matched);  
                }
            }else{
                current_matched_ids = processFilterExpression(current,current_matched_ids,current_logic,arch_info); 
            }
        }else{       
            // Last expression in a series
            if(current_logic=="||"){
                var skip = false;
                if(e.indexOf('{FeatureToBeAdded}')>-1){
                    if(remove_outer_parentheses(e)=='{FeatureToBeAdded}'){
                        // If the current filter is {FeatureToBeAdded}, then skip processing it
                        skip=true;
                    }
                }
                if(!skip){
                    var temp_matched = processFilterExpression(e,prev_matched_ids,'&&',arch_info); 
                    current_matched_ids = compareMatchedIDSets(current_logic, current_matched_ids, temp_matched);  
                }
            }else{
                current_matched_ids = processFilterExpression(e,current_matched_ids,current_logic,arch_info); 
            }        	
            break;
        }
    }
    return current_matched_ids;
}
 


/*
    Compares the preset filter to a single architecture
    @param expression: A filter expression string
    @param bitString: A string representing a binary array
    @param rank: The pareto ranking of the architecture
    
    @return: A boolean indicating whether the input architecture passes the filter
*/
function applyPresetFilter(input_expression,bitString,rank){
	
    var expression = remove_outer_parentheses(input_expression);
    
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

    orbit = condSplit[0];
    instr = condSplit[1];
    numb = condSplit[2];

	var resu;
	switch(type) {
    case "present":
    	if(instr=='-1') return false;
    	resu=false;
        instr = +instr;
        for(var i=0;i<norb;i++){
            if(bitString[ninstr*i+instr]===true){
                resu=true;break;
            }
        }
        break;
    case "absent":
    	if(instr==-1) return false;
    	resu=true;
        instr = + instr;
        for(var i=0;i<norb;i++){
            if(bitString[ninstr*i+instr]===true){
                resu=false;break;
            }
        }
        break;
    case "inOrbit":
        orbit = + orbit;
        if(instr.indexOf(',')==-1){
    		// One instrument
        	resu=false;
            instr = + instr;
            if(bitString[orbit*ninstr + instr]===true){
            	resu=true;
            }
            break;    		
    	}else{
    		// Multiple instruments
        	resu=true;
        	var instruments = instr.split(",");
    		for(var j=0;j<instruments.length;j++){
    			var temp = +instruments[j];
    			if(bitString[orbit*ninstr + temp]===false){
    				resu= false;break;
    			}
    		}    		
    	}
    	break;
    case "notInOrbit":
    	orbit = + orbit;
    	if(instr.indexOf(',')==-1){
    		// One instrument
            instr = + instr;
        	resu=true;
            if(bitString[orbit*ninstr + instr]===true){
            	resu=false;
            }
            break;    		
    	}else{
    		// Multiple instruments
        	resu=true;
        	var instruments = instr.split(",");
    		for(var j=0;j<instruments.length;j++){
    			var temp = +instruments[j];
    			if(bitString[orbit*ninstr + temp]===true){
    				resu= false;break;
    			}
    		}    		
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
        orbit = +orbit;
    	for(var i=0;i<ninstr;i++){
    		if(bitString[orbit*ninstr+i]===true){
    			resu= false;break;
    		}
    	}
        break;

    case "numOrbits":
    	var count=0;
    	resu=false;
        numb = + numb;
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
    	var numbers = numb.split(",");
    	orbit = +orbit;
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
        numb = +numb;
        
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
                instr = +instr;
    			// num of all instruments
    			for(var i=0;i<norb;i++){
    				if(bitString[i*ninstr+instr]===true){
    					count++;
    				}
    			}
    		}
    	}else{
            orbit = +orbit;
    		// number of instruments in a specified orbit
    		for(var i=0;i<ninstr;i++){
    			if(bitString[orbit*ninstr+i]===true){
    				count++;
    			}
    		}
    	}
		if(count===numb) resu= true;
        break;
    
    case "ifInstrumentExists":
        
        
        var absent = applyPresetFilter('{absent[;'+instr+';]}',bitString,rank);
        if(orbit.indexOf(',')==-1){
            //Single orbit
            var inOrbit = applyPresetFilter('{inOrbit['+orbit+';'+instr+';]}',bitString,rank);
            resu = absent || inOrbit;
            
        }else{
            // Multiple orbits
            resu = absent;
            var orbitSplit = orbit.split(',');
            for(var i=0;i<orbitSplit.length;i++){
                var inOrbit = applyPresetFilter('{inOrbit['+orbitSplit[i]+';'+instr+';]}',bitString,rank);
                // If the instrument is assigned to any of the orbits, return true
                resu = resu || inOrbit;
            }
        }
        
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
   
   
   




function applyFilter(){

    var dropdown = d3.select("#filter_options_dropdown_1")[0][0].value;
	
    buttonClickCount_applyFilter += 1;
    
    var wrong_arg = false;
    
    var filter_expression;
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
            // If textbox is empty, push null
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
        filter_expression = presetFilter + "[;" + DisplayName2Index(instrument.toUpperCase(),"instrument") + ";]";
    }else if(presetFilter == "inOrbit" || presetFilter == "notInOrbit"){
        var orbit = input_textbox[0].trim();
        var instrument = input_textbox[1];
        filter_expression = presetFilter + "["+ DisplayName2Index(orbit,"orbit") + ";" + DisplayName2Index(instrument.toUpperCase(),"instrument")+ ";]";
    }else if(presetFilter =="emptyOrbit"){
        var orbit = input_textbox[0].trim();
        filter_expression = presetFilter + "[" + DisplayName2Index(orbit,"orbit") + ";;]";
    }else if(presetFilter=="numOrbits"){
        var number = input_textbox[0].trim();
        filter_expression = presetFilter + "[;;" + number + "]";
    }else if(presetFilter=="subsetOfInstruments"){
    	var orbit = input_textbox[0].trim();
    	var instrument = input_textbox[2];
    	var numbers = input_textbox[1].trim().replace(/\s+/g, "");
        filter_expression = presetFilter + "["+ DisplayName2Index(orbit,"orbit") + ";" + DisplayName2Index(instrument.toUpperCase(),"instrument")+ ";"+ numbers+"]";
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
            filter_expression=presetFilter + "[;;" + number + "]";
        }else if(orbitEmpty){
            // Count the number of specified instrument
            filter_expression=presetFilter + "[;" + DisplayName2Index(instrument.toUpperCase(),"instrument") + ";" + number + "]";
        }else if(instrumentEmpty){
            // Count the number of instruments in an orbit
        	orbit = orbit.trim();
            filter_expression=presetFilter + "[" + DisplayName2Index(orbit,"orbit") + ";;" + number + "]";
        }
    } else if(dropdown==="paretoFront"){
        
        // To be implemented    
        var filterInput = d3.select("#filter_inputs_div_1").select('.filter_inputs_textbox')[0][0].value;
        filter_expression = "paretoFront["+filterInput+"]";
        
    }else if(dropdown==='ifInstrumentExists'){
        
        // Currently not used
        
        var instrument = input_textbox[0].trim();
        var orbit = input_textbox[1].trim().replace(/\s+/g, "");
        filter_expression = "ifInstrumentExists["+ DisplayName2Index(orbit,"orbit") + ";" + DisplayName2Index(instrument.toUpperCase(),"instrument")+ ";]"; 
        
    }
    else{// not selected
        return;
    }
    filter_expression = "{" + filter_expression + "}";

    
    
    
    
    if(filter_expression.indexOf('paretoFront')!=-1){
        
    	var filterInput = d3.select("#filter_inputs_div_1").select('.filter_inputs_textbox')[0][0].value;
    	applyParetoFilter(filterInput);
        
    }else{
        
        update_feature_application('temp',filter_expression);
        update_feature_application('update',filter_expression);
    
    }

    
    document.getElementById('tab2').click();
    if(wrong_arg){
    	alert("Invalid input argument");
    }
        
}






function applyParetoFilter(arg,option){
    if(option==="new"){
        cancelDotSelections('remove_highlighted');
        d3.selectAll(".dot.archPlot")[0].forEach(function (d) {
            var rank = parseInt(d3.select(d).attr("paretoRank"));
            if (rank <= +arg && rank >= 0){
                
                var dot = d3.select(d);
                dot.classed('highlighted',true);
                
                if(dot.classed('selected')){
                    // selected and highlighted
                    dot.style("fill", overlapColor);
                }else{
                    // not selected
                    dot.style("fill", highlightedColor);
                }
            }
        });  
    }else if(option==="add"){
        d3.selectAll(".dot.archPlot:not(.highlighted)")[0].forEach(function (d) {
            var rank = parseInt(d3.select(d).attr("paretoRank"));
            if (rank <= +arg && rank >= 0){
                
                var dot = d3.select(d);
                dot.classed('highlighted',true);
                if(dot.classed('selected')){
                    // selected and highlighted
                    dot.style("fill", overlapColor);
                }else{
                    // not selected
                    dot.style("fill", highlightedColor);
                }
            }
        });  
    }else if(option==="within"){
        d3.selectAll(".dot.archPlot.highlighted")[0].forEach(function (d) {
            var rank = parseInt(d3.select(d).attr("paretoRank"));
            if (rank > +arg || rank < 0){
                
                var dot = d3.select(d);
                dot.classed('highlighted',false);
                
                if(dot.classed('selected')){
                    // was selected and highlighted
                    dot.style("fill", selectedColor);
                }else{
                    // was not selected
                    dot.style("fill", defaultColor);
                }	
            }
        }); 
    }
}


function applyComplexFilter(input_expression){

    var filter_expression = input_expression;
    
    // Cancel all previous selections
    cancelDotSelections('remove_highlighted');
    
    // If filter expression is empty, return
    if(filter_expression==="" || !filter_expression){
        return;
    }
    

	var ids = [];
	var bitStrings = [];
	var paretoRankings = [];
    
    d3.selectAll('.dot.archPlot')[0].forEach(function(d){
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
    var matchedIndices = processFilterExpression(filter_expression, indices, "&&", arch_info);
                
    var matchedIDs = [];
    for(var i=0;i<matchedIndices.length;i++){
    	var index = matchedIndices[i];
    	matchedIDs.push(ids[index]);
    }
    
    if(filter_expression=='{FeatureToBeAdded}'){
        matchedIDs = [];
    }


    d3.selectAll('.dot.archPlot')[0].forEach(function(d){
    	if(matchedIDs.indexOf(d.__data__.id)>-1){
            
            var dot = d3.select(d);
            dot.classed('highlighted',true);
            
    		if(dot.classed('selected')){
                // selected and highlighted
                dot.style("fill", overlapColor);
    		}else{
                // not selected
                dot.style("fill", highlightedColor);            		
    		}
    	}
    });  
    
    d3.select("[id=numOfSelectedArchs_inputBox]").text("" + numOfSelectedArchs()); 
    
}


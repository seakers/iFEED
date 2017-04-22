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
            .attr("id","applyFilterButton_new")
            .attr("class","filter_options_button")
            .text("Apply as a new filter");
    d3.select("#filter_buttons").append("button")
            .attr("class","filter_options_button")
            .attr("id","applyFilterButton_add")
            .text("Add to current filter");
    d3.select("#filter_buttons").append("button")
            .attr("id","applyFilterButton_within")
            .attr("class","filter_options_button")
            .text("Search within selection");
    
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
            if(e.indexOf('tempFeature') > -1){
                return prev_matched;
            }
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
            prev = '&&';
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
                var skip = false;
                if(current.indexOf('{tempFeature}')!=-1){
                    if(remove_outer_parentheses(current)=='{tempFeature}'){
                        // If the current filter is {tempFeature}, then skip processing it
                        skip=true;
                    }
                }
                if(!skip){
                    var temp_matched = processFilterExpression(current,prev_matched,'&&',arch_info); 
                    current_matched = compareMatchedIDSets(prev, current_matched, temp_matched);  
                }
            }else{
                current_matched = processFilterExpression(current,current_matched,prev,arch_info); 
            }
        }else{            
            if(prev=="||"){
                var skip = false;
                if(e.indexOf('{tempFeature}')>-1){
                    if(remove_outer_parentheses(e)=='{tempFeature}'){
                        // If the current filter is {tempFeature}, then skip processing it
                        skip=true;
                    }
                }
                if(!skip){
                    var temp_matched = processFilterExpression(e,prev_matched,'&&',arch_info); 
                    current_matched = compareMatchedIDSets(prev, current_matched, temp_matched);  
                }
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

    
    if(filterExpression.indexOf('paretoFront')!=-1){
    	var filterInput = d3.select("#filter_inputs_div_1").select('.filter_inputs_textbox')[0][0].value;
    	applyParetoFilter(option,filterInput);
    }else{
        if(option==="new"){
            
            cancelDotSelections('remove_highlighted');
            
            d3.selectAll('.dot.archPlot')[0].forEach(function(d){
                
                var bitString = d.__data__.bitString;
                if(applyPresetFilter(filterExpression,bitString)){
                    
                    var dot = d3.select(d);
                    dot.classed('highlighted',true);
                    
                	if(dot.classed('selected')){
                        // highlighted and selected
                        dot.style("fill", overlapColor);
                	}else{
                        // not selected
                        dot.style("fill", highlightedColor);
                    }
                }
            });
        }else if(option==="add"){
            d3.selectAll('.dot.archPlot:not(.highlighted)')[0].forEach(function(d){
                var bitString = d.__data__.bitString;
                if(applyPresetFilter(filterExpression,bitString)){
                    
                    var dot = d3.select(d);
                    dot.classed('highlighted',true);
                    
                	if(dot.classed('selected')){
                        // highlighted and selected
                        dot.style("fill", overlapColor);
                	}else{
                        // not selected
                        dot.style("fill", highlightedColor);
                    }
                }
            });
        }else if(option==="within"){
            d3.selectAll('.dot.archPlot.highlighted')[0].forEach(function(d){
                var bitString = d.__data__.bitString;
                if(!applyPresetFilter(filterExpression,bitString)){
                    
                    var dot = d3.select(d);
                    dot.classed('highlighted',false);
                    
                    if(dot.classed('selected')){
                        // selected
                        dot.style("fill", function (d) {return selectedColor;}); 
                    }else{
                        // not selected
                        dot.style("fill", function (d) {return defaultColor;});   
                    }                      
                }
            });           
        }
    }

    if(wrong_arg){
    	alert("Invalid input argument");
    }
    d3.select("[id=numOfSelectedArchs_inputBox]").text("" + numOfSelectedArchs()); 
    
    update_feature_application_status(filterExpression, option);
}


function applyParetoFilter(option, arg){
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

    var filterExpression = input_expression;
    
    if(filterExpression===""){
        cancelDotSelections('remove_highlighted');
        return;
    }
    
	cancelDotSelections('remove_highlighted');

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
    var matchedIndices = processFilterExpression(filterExpression, indices, "&&", arch_info);
                
    var matchedIDs = [];
    for(var i=0;i<matchedIndices.length;i++){
    	var index = matchedIndices[i];
    	matchedIDs.push(ids[index]);
    }
    
    if(filterExpression=='{tempFeature}'){
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





function request_feature_application_status(){
    $.ajax({
        url: "/api/ifeed/request-feature-application-status/",
        type: "POST",
        data: {key:key},
        async: false,
        error: function (jqXHR, textStatus, errorThrown)
        {alert("Error in getting the feature application status");}
    });
}




function update_feature_application_status(expression, option){
    
    var request_feature_update = false;
    
    var url = '/api/ifeed/update-feature-application-status/';
    
    
    if(option=='new'){
        current_feature_expression = expression;
    }else if(option=='within' && current_feature_expression!=''){
        current_feature_expression = current_feature_expression + '&&' + expression;
    }else if(option=='add' && current_feature_expression!=''){
        current_feature_expression = current_feature_expression + '||' + expression;
    }else if(option=='deactivated'){
        // pass
    }else if(option=='remove'){
        // Modify the expression after updating
        request_feature_update = true;
    }else if(option=='create_placeholder'){
        request_feature_update=true;
    }else if(option=='update_placeholder'){
         request_feature_update = true;
    }else{
        current_feature_expression = expression;
    }
    

    $.ajax({
        url: url,
        type: "POST",
        data: {key:key,
               expression:expression,
               option:option},
        async: false,
        error: function (jqXHR, textStatus, errorThrown)
        {alert("Error in updating feature application status");}
    });
    
    if(request_feature_update){
        request_feature_application_status();
    }
}





function update_feature_metric_chart(expression){
    
    var url, supp, conf_given_f, conf_given_s, lift;
    
    // If expression is null, reset the plots
    if(expression==null){
        expression = "";
        supp = 0; conf_given_f =0; conf_given_s = 0; lift = 0;
    }
    else{
        var total = numOfArchs();
        var selected = d3.selectAll('.dot.archPlot.selected')[0].length;
        var highlighted = d3.selectAll('.dot.archPlot.highlighted')[0].length;
        var intersection = d3.selectAll('.dot.archPlot.selected.highlighted')[0].length;

        if(selected==0 || highlighted==0){
            return;
        }

        var p_snf = intersection/total;
        var p_s = selected/total;
        var p_f = highlighted/total;

        supp = p_snf;
        conf_given_f = supp / p_f;
        conf_given_s = supp / p_s;
        lift = p_snf/(p_f*p_s); 
    }
    
    $.ajax({
        url: "/api/ifeed/update-feature-metric-chart/",
        type: "POST",
        data: {key:key,
               expression:expression,
               supp:supp,
               conf_given_f:conf_given_f,
               conf_given_s:conf_given_s,
               lift:lift
              },
        async: false,
        error: function (jqXHR, textStatus, errorThrown)
        {alert("Error in updating feature metric chart");}
    });
    
    //add_current_feature_to_DF_plot();
}







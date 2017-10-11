/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

function Filter(ifeed){
    
    var self = this;
        
    // Filter options
    self.preset_options = [{value:"not_selected",text:"Preset Filters"},
                           {value:"paretoFront",text:"Pareto front"},
                           {value:"present",text:"Present",input:"singleInst",hints:"Designs that have the specified instrument are selected"},
                           {value:"absent",text:"Absent",input:"singleInst",hints:"Designs that do not have the specified instrument are selected"},
                           {value:"inOrbit",text:"In orbit",input:"orbitAndMultipleInstInput",hints:"Designs that have the specified instruments inside the chosen orbit are selected"},
                           {value:"notInOrbit",text:"Not in orbit",input:"orbitAndMultipleInstInput",hints:"Designs that do not have the specified instruments inside the chosen orbit are selected",},
                           {value:"together",text:"Together",input:"multipleInstInput",hints:"Designs that have the specified instruments in any one orbit are chose"},
                           {value:"separate",text:"Separate",input:"multipleInstInput",hints:"Designs that do not have the specified instruments in the same orbit are chosen"},
                           {value:"emptyOrbit",text:"Empty orbit",input:"orbitInput",hints:"Designs that have no instrument inside the specified orbit are chosen"},
                           {value:"numOrbits",text:"Number of orbit used",input:"numOrbit",hints:"Designs that have the specified number of non-empty orbits are chosen"},
                           {value:"numOfInstruments",text:"Number of instruments",input:"numOfInstruments",hints:"This highlights all the designs with the specified number of instruments. If you specify an orbit name, it will count all instruments in that orbit. If you can also specify an instrument name, and only those instruments will be counted across all orbits. If you leave both instruments and orbits blank, all instruments across all orbits will be counted."},
                           {value:"subsetOfInstruments",text:"Num of instruments in a subset",input:"subsetOfInstruments",hints:"The specified orbit should contain at least m number and at maximum M number of instruments from the specified instrument set. m is the first entry and M is the second entry in the second field"},
                        ];  
    
    
    self.initialize = function(){
        
        document.getElementById('tab2').click();
        
        d3.select("#support_panel").select("#view2").select("g").remove();

        var support_panel = d3.select("#support_panel").select("#view2").append("g");
        
        support_panel.append("div")
                .attr("class","filter title div")
                .append("p")
                .text("Filter Setting");

        support_panel.append("div")
                .attr("class","filter options div");
        
        support_panel.append("div")
                .attr('class','filter inputs div');
        
        support_panel.append('div')
                .attr('class','filter hints div');
        
        support_panel.append('div')
                .attr('class','filter buttons div');

        
        var dropdown = d3.select(".filter.options.div")
                .append("select")
                .attr("class","filter options dropdown");

        dropdown.selectAll("option").remove();
        dropdown.selectAll("option")
                .data(self.preset_options)
                .enter()
                .append("option")
                .attr("value",function(d){
                    return d.value;
                })
                .text(function(d){
                    return d.text;
                });    

        d3.select(".filter.buttons")
                .append("button")
                .attr("id","apply_filter_button")
                .text("Apply Filter")
                .on("click",self.applyFilter);

        
        d3.select(".filter.options.dropdown").on("change",function(d){
            
            var option = d3.select(this)[0][0].value;            
            self.initialize_preset_filter_input(option); 
            
        });    

        ifeed.main_plot.highlight_support_panel()
        
    }
    
    
    
    self.get_preset_option = function(option){
        for(var i=0;i<self.preset_options.length;i++){
            if(self.preset_options[i].value==option){
                return self.preset_options[i];
            }
        }
        return null;
    }
    
    

    self.initialize_preset_filter_input = function(option){
        
        
        d3.selectAll('.filter.inputs.div').selectAll('div').remove();
        d3.selectAll('.filter.hints.div').selectAll('div').remove();
        
        if (option==="not_selected"){
            return;
            
        }else if(option=="paretoFront"){
            
            d3.select('.filter.inputs.div')
                .append("div")
                .attr("id","filter_input_1")
                .attr('class','filter inputs text')
                .text("Input Pareto Ranking (Integer number between 0-15): ")
                .append("input")
                .attr("type","text");
            
        }else{
            
            var inputType = self.get_preset_option(option).input;
            
            var filter_inputs = d3.select('.filter.inputs.div');
            
            var filter_input_1 = filter_inputs.append('div')
                                                .attr('id','filter_input_1')
                                                .attr('class','filter inputs text');
            
            var filter_input_2 = filter_inputs.append('div')
                                                .attr('id','filter_input_2')
                                                .attr('class','filter inputs text');
            
            var filter_input_3 = filter_inputs.append('div')
                                                .attr('id','filter_input_3')
                                                .attr('class','filter inputs text');
            
            switch(inputType) {
                    
                case "singleInst":
                    filter_input_1.text("Input single instrument name: ");
                    filter_input_1.append("input")
                                .attr("type","text");
                    break;
                    
                case "orbitAndMultipleInstInput":
                    filter_input_1.text("Input orbit name: ");
                    filter_input_1.append("input")
                                .attr("type","text");
                    
                    filter_input_2.text("Input instrument names (minimum 1, and maximum 3) separated by comma: ");
                    filter_input_2.append("input")
                                .attr("type","text");
                    break;
                    
                case "orbitInput":
                    filter_input_1.text("Input orbit name: ");
                    filter_input_1.append("input")
                                .attr("type","text");
                    break;
                    
                case "numOrbit":
                    filter_input_1.text("Input number of orbits");
                    filter_input_1.append("input")
                                .attr("type","text");
                    break;
                
                case "numOfInstruments":
                    filter_input_1.text("Input an orbit name (Could be N/A): ");
                    filter_input_1.append("input")
                                .attr("type","text")
                                .attr("value","N/A");    
                    filter_input_2.text("Input instrument name (Could be N/A): ");
                    filter_input_2.append("input")
                                .attr("type","text")
                                .attr("value","N/A");
                    filter_input_3.text("Input a number of instrument used (should be greater than or equal to 0): ");
                    filter_input_3.append("input")
                                .attr("type","text")
                                .attr("value","N/A");
                    break;
                
                case "subsetOfInstruments":
                    filter_input_1.text("Input orbit name: ");
                    filter_input_1.append("input")
                                .attr("type","text");    
                    filter_input_2.text("Input the min and the max (optional) number of instruments in the subset, separated by comma: ");
                    filter_input_2.append("input")
                                .attr("type","text");
                    filter_input_3.text("Input a set of instrument names, separated by comma: ");
                    filter_input_3.append("input")
                                .attr("type","text");
                    break;
                    
                    
                case "multipleInstInput":
                    filter_input_1.text("Input instrument names (2 or 3) separated by comma:");
                    filter_input_1.append("input")
                        .attr("type","text");
                    break;
                    
                default:
                    break;
            }
        }

        d3.select(".filter.hints.div")
            .append("div")
            .html('<p>Valid orbit names: 1000, 2000, 3000, 4000, 5000</p>'
                    +'Valid instrument names: A, B, C, D, E, F, G, H, I, J, K, L');      
            
    }
    
    
    self.get_number_of_inputs = function(){
        return d3.selectAll('.filter.inputs.div').selectAll('input').length;
    }
    
    
    
    self.applyFilter = function(){

        var dropdown = d3.select(".filter.options.dropdown")[0][0].value;
        
        var filter_expression;
        
        var matchedArchIDs = [];

        var numInputs = self.get_number_of_inputs();
        
        var input_textbox = [];
        var input_select = [];
        var inputDiv =  d3.selectAll('.filter.inputs.div').selectAll('div')[0];

        inputDiv.forEach(function(d,i){
            
            var textboxObj = d3.select(d).select('input')[0][0];
            var selectObj = d3.select(d).select('select')[0][0];

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
        });


        // Example of an filter expression: {presetName[orbits;instruments;numbers]} 
        var option = dropdown;
        
        if(option=="present" || option=="absent" || option=="together" || option=="separate"){
            
            var instrument = input_textbox[0];
            filter_expression = option + "[;" + ifeed.label.displayName2Index(instrument.toUpperCase(),"instrument") + ";]";
            
        }else if(option == "inOrbit" || option == "notInOrbit"){
            
            var orbit = input_textbox[0].trim();
            var instrument = input_textbox[1];
            filter_expression = option + "["+ ifeed.label.displayName2Index(orbit,"orbit") + ";" + ifeed.label.displayName2Index(instrument.toUpperCase(),"instrument")+ ";]";
            
        }else if(option =="emptyOrbit"){
            
            var orbit = input_textbox[0].trim();
            filter_expression = option + "[" + ifeed.label.displayName2Index(orbit,"orbit") + ";;]";
            
        }else if(option=="numOrbits"){
            
            var number = input_textbox[0].trim();
            filter_expression = option + "[;;" + number + "]";
            
        }else if(option=="subsetOfInstruments"){
            
            var orbit = input_textbox[0].trim();
            var instrument = input_textbox[2];
            var numbers = input_textbox[1].trim().replace(/\s+/g, "");
            filter_expression = option + "["+ ifeed.label.displayName2Index(orbit,"orbit") + ";" + ifeed.label.displayName2Index(instrument.toUpperCase(),"instrument")+ ";"+ numbers+"]";
            
        }else if(option=="numOfInstruments"){
            
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
                filter_expression=option + "[;;" + number + "]";
            }else if(orbitEmpty){
                // Count the number of specified instrument
                filter_expression=option + "[;" + ifeed.label.displayName2Index(instrument.toUpperCase(),"instrument") + ";" + number + "]";
            }else if(instrumentEmpty){
                // Count the number of instruments in an orbit
                orbit = orbit.trim();
                filter_expression=option + "[" + ifeed.label.displayName2Index(orbit,"orbit") + ";;" + number + "]";
            }
            
        } else if(dropdown==="paretoFront"){

            // To be implemented    
            var input = d3.selectAll('.filter.inputs.div').select('div').select('input')[0][0].value
            filter_expression = "paretoFront["+input+"]";

        }else{// not selected
            return;
        }
        
        filter_expression = "{" + filter_expression + "}";


        if(filter_expression.indexOf('paretoFront')!=-1){
            
            self.apply_filter_expression(filter_expression);

        }else{

            ifeed.feature_application.update_feature_application('temp',filter_expression);
            ifeed.feature_application.update_feature_application('update',filter_expression);
            self.apply_filter_expression(filter_expression);
        }

        
        document.getElementById('tab2').click();
        if(false){
            alert("Invalid input argument");
        }
    }
    

    
    
    
    self.apply_filter_expression = function(input_expression){

        var feature_expression = input_expression;

        // Cancel all previous selections
        ifeed.main_plot.cancel_selection('remove_highlighted');

        // If filter expression is empty, return
        if(feature_expression==="" || !feature_expression){
            return;
        }

        // Note that indices and ids are different!
        var filtered_data = self.process_filter_expression(feature_expression, ifeed.data, "&&");
        
        var id_list = ifeed.get_data_ids(filtered_data);
        
        d3.selectAll('.dot.main_plot')[0].forEach(function(d){
            
            if(id_list.indexOf(d.__data__.id)!=-1){

                var dot = d3.select(d);
                dot.classed('highlighted',true);

                if(dot.classed('selected')){
                    // selected and highlighted
                    dot.style("fill", ifeed.main_plot.color.overlap);
                }else{
                    // not selected
                    dot.style("fill", ifeed.main_plot.color.highlighted);            		
                }
            }
        });  

        d3.select("#num_of_selected_archs").text(""+ifeed.main_plot.get_num_of_selected_archs());
    }
    
    
    
    
    self.process_filter_expression = function(expression, data, logic){
        
        var e,_e;

        e=expression;
        // Remove outer parenthesis
        e = remove_outer_parentheses(e);
        _e = e;

        var filtered = [];
        var first = true;
        var last = false;

        if(get_nested_parenthesis_depth(e)==0){

            // Given expression does not have a nested structure
            if(e.indexOf("&&") == -1 && e.indexOf("||") == -1){

                // There is no logical connective: Single filter expression
                for(var i=0;i<data.length;i++){
                    if(self.apply_preset_filter(e,data[i])){
                        filtered.push(data[i]);
                    }
                }
                return filtered;

            }
            else{
                // Do nothing
            }

        }else{
            // Removes the nested structure by replacing all the nested expressions using an arbitrary symbol "X"
            _e = collapse_paren_into_symbol(e);
        }


        while(!last){
            var e_temp, _e_temp;

            if(first){
                // The first filter in a series to be applied
                filtered = data;
                first = false;
            }else{
                logic = _e.substring(0,2);
                _e = _e.substring(2);
                e = e.substring(2);
            }


            var next; // The imediate next logical connective
            var and = _e.indexOf("&&");
            var or = _e.indexOf("||");
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

            if(next){
                _e_temp = _e.split(next,1)[0];
                e_temp = e.substring(0,_e_temp.length);

                _e = _e.substring(_e_temp.length);
                e = e.substring(_e_temp.length);
            }else{
                _e_temp = _e;
                e_temp = e;
                last=true;
            }


            if(logic=='||'){
                var filtered_temp = self.process_filter_expression(e_temp,data,logic);
                for(var j=0;j<filtered_temp.length;j++){
                    if(filtered.indexOf(filtered_temp[j])==-1){
                        filtered.push(filtered_temp[j]);
                    }
                }

            }else{
                filtered = self.process_filter_expression(e_temp,filtered,logic); 
            }

        }
        return filtered;
    }
    
    
    
    
    
    
    


    /*
        Compares the preset filter to a single architecture
        @param expression: A filter expression string

        @return: A boolean indicating whether the input architecture passes the filter
    */
    self.apply_preset_filter = function(input_expression,data){

        var expression = remove_outer_parentheses(input_expression);
        
        // Preset filter: {presetName[orbits;instruments;numbers]}   
        expression = expression.substring(1,expression.length-1);

        var flip=false;
        if(expression.startsWith("~")){
            flip=true;
            expression = expression.substring(1,expression.length);
        }
        
        var norb = ifeed.problem.orbit_num;
        var ninstr = ifeed.problem.instrument_num;
        var type = expression.split("[")[0];
        var bitString = data.inputs;

        if(type==="paretoFront"){
            
            if(data.pareto_ranking || data.pareto_ranking==0){
                var rank = +data.pareto_ranking;
                var arg = +expression.substring(0,expression.length-1).split("[")[1];
                if(rank <= arg){
                    return true;
                }else{
                    return false;
                }
            }
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

        default:
            return false;
        }

        if(flip==true){
            return !resu;
        }else{
            return resu;
        }

    }
    
    self.initialize();
    
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









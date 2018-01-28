
let validInputCheck = function(args){

    let valid = false;
    while(true){
        // Check if the input is an array
        if (!isArray(args)){
            break;
        }

        // Check if all arguments are string
        for (let i in args){
            if (typeof args[i] != "string"){
                break;
            }
        }

        // Passed all tests
        valid = true;
        break;
    }
    if(!valid){
        console.log(args);
        throw "Exception in processing filter: Invalid argument";
    }
}

class EOSSFilter extends Filter{
    
    constructor(labelingScheme) {

        let presetFeatures = [];

        let presetFeaturesInfo = [{value:"not_selected",text:"Preset Filters"},
                               {value:"paretoFront",text:"Pareto front"},
                               {value:"present",text:"Present",input:"singleInst",hints:"Designs that have the specified instrument are selected"},
                               {value:"absent",text:"Absent",input:"singleInst",hints:"Designs that do not have the specified instrument are selected"},
                               {value:"inOrbit",text:"In orbit",input:"orbitAndMultipleInstInput",hints:"Designs that have the specified instruments inside the chosen orbit are selected"},
                               {value:"notInOrbit",text:"Not in orbit",input:"orbitAndMultipleInstInput",hints:"Designs that do not have the specified instruments inside the chosen orbit are selected"},
                               {value:"together",text:"Together",input:"multipleInstInput",hints:"Designs that have the specified instruments in any one orbit are chose"},
                               {value:"separate",text:"Separate",input:"multipleInstInput",hints:"Designs that do not have the specified instruments in the same orbit are chosen"},
                               {value:"emptyOrbit",text:"Empty orbit",input:"orbitInput",hints:"Designs that have no instrument inside the specified orbit are chosen"},
                               {value:"numOrbits",text:"Number of orbit used",input:"numOrbit",hints:"Designs that have the specified number of non-empty orbits are chosen"},
                               //{value:"numOfInstruments",text:"Number of instruments",input:"numOfInstruments",hints:"This highlights all the designs with the specified number of instruments. If you specify an orbit name, it will count all instruments in that orbit. If you can also specify an instrument name, and only those instruments will be counted across all orbits. If you leave both instruments and orbits blank, all instruments across all orbits will be counted."},
                               //{value:"subsetOfInstruments",text:"Num of instruments in a subset",input:"subsetOfInstruments",hints:"The specified orbit should contain at least m number and at maximum M number of instruments from the specified instrument set. m is the first entry and M is the second entry in the second field"},
                            ];  

        for (let i in presetFeaturesInfo){
            let f = presetFeaturesInfo[i];
            let thisFeature = new FeatureType(f.text, f.value, f.input, f.hints);
            presetFeatures.push(thisFeature);
        }

        super(presetFeatures, labelingScheme);

        PubSub.subscribe(DATA_PROCESSED, (msg, data) => {
            this.set_application_functions();
        });
    }

    set_application_functions(){
        this.norb = this.label.orbit_list.length;
        this.ninstr = this.label.instrument_list.length;     

        let that = this;

        let match_function = function(name){
            switch(name) {
                case "present":
                    return that.present;
                case "absent":
                    return that.absent;
                case "inOrbit":
                    return that.inOrbit;
                case "notInOrbit":
                    return that.notInOrbit;
                case "together":
                    return that.together;
                case "separate":
                    return that.separate;
                case "emptyOrbit":
                    return that.emptyOrbit;
                case "numOrbits":
                    return that.numOrbits;
                default:
                    return null;
            }
        }
        for (let i = 0; i < this.presetFeatureTypes.length; i++){
            if(this.presetFeatureTypes[i].keyword === "paretoFront" || this.presetFeatureTypes[i].keyword === "not_selected"){
                continue;
            }            
            this.presetFeatureTypes[i].setApply(match_function(this.presetFeatureTypes[i].keyword));
            this.presetFeatureTypes[i].input_list = this.input_list;
        }
    }

    initialize_filter_input_field(option){
        
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
            
            var inputType = this.get_preset_option(option).inputType;
            
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
    
    generate_filter_expression_from_input_field(){

        let invalid_input = false;
        let filter_expression = "";
        let matchedArchIDs = [];

        let dropdown = d3.select(".filter.options.dropdown").node().value;
        let numInputs = this.get_number_of_inputs();
        
        let input_textbox = [];
        let input_select = [];
        let inputDiv =  d3.selectAll('.filter.inputs.div').selectAll('div').nodes();

        inputDiv.forEach(function(d, i){
            
            let textboxObj = d3.select(d).select('input').node();
            let selectObj = d3.select(d).select('select').node();

            if(textboxObj != null){
                // Remove all white spaces
                let input = textboxObj.value.replace(/\s+/g, "");
                input_textbox.push(input);
            }else{
                // If textbox is empty, put in an empty string
                input_textbox.push("");
            }

            if(selectObj != null){
                input_select.push(selectObj.value);
            }else{
                input_select.push(null);
            }
        });

        // Example of an filter expression: {presetName[orbits;instruments;numbers]} 
        let option = dropdown;
        
        if(option=="present" || option=="absent" || option=="together" || option=="separate"){
            
            let instrument = input_textbox[0];
            let inst_relabel = this.label.displayName2Index(instrument.toUpperCase(),"instrument");
            if(inst_relabel==null){
                invalid_input=true;
            }
            filter_expression = option + "[;" + inst_relabel + ";]";
            
        }else if(option == "inOrbit" || option == "notInOrbit"){
            
            let orbit = input_textbox[0].trim();
            let instrument = input_textbox[1];
            
            let orb_relabel = this.label.displayName2Index(orbit,"orbit");
            let inst_relabel = this.label.displayName2Index(instrument.toUpperCase(),"instrument");
            if(inst_relabel==null || orb_relabel==null){
                invalid_input=true;
            }            
            
            filter_expression = option + "["+ orb_relabel + ";" + inst_relabel + ";]";
            
        }else if(option =="emptyOrbit"){
            
            let orbit = input_textbox[0].trim();
            
            let orb_relabel = this.label.displayName2Index(orbit,"orbit");
            if(orb_relabel==null){
                invalid_input=true;
            }         
            
            filter_expression = option + "[" + orb_relabel + ";;]";
            
        }else if(option=="numOrbits"){
            
            let number = input_textbox[0].trim();
            filter_expression = option + "[;;" + number + "]";
            
        }else if(option=="subsetOfInstruments"){
            
            let orbit = input_textbox[0].trim();
            let instrument = input_textbox[2];
            
            let orb_relabel = this.label.displayName2Index(orbit,"orbit");
            let inst_relabel = this.label.displayName2Index(instrument.toUpperCase(),"instrument");
            if(inst_relabel==null || orb_relabel==null){
                invalid_input=true;
            }                    
            
            let numbers = input_textbox[1].trim().replace(/\s+/g, "");
            filter_expression = option + "["+ orb_relabel + ";" + inst_relabel + ";"+ numbers+"]";
            
        }else if(option=="numOfInstruments"){
            
            let orbit = input_textbox[0];
            let instrument = input_textbox[1];
            let number = input_textbox[2];
            // There are 3 possibilities

            let orbitEmpty = false; 
            let instrumentEmpty = false;

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
                
                let inst_relabel = this.label.displayName2Index(instrument.toUpperCase(),"instrument");
                if(inst_relabel==null){
                    invalid_input=true;
                }                
                filter_expression=option + "[;" + inst_relabel + ";" + number + "]";
                
            }else if(instrumentEmpty){
                // Count the number of instruments in an orbit
                orbit = orbit.trim();
                
                let orb_relabel = this.label.displayName2Index(orbit,"orbit");
                if(orb_relabel==null){
                    invalid_input=true;
                }                   
                filter_expression=option + "[" + orb_relabel + ";;" + number + "]";
            }
            
        } else if(dropdown==="paretoFront"){

            let input = d3.selectAll('.filter.inputs.div').select('div').select('input').node().value
            filter_expression = "paretoFront["+input+"]";
            
        }else{// not selected
            return "";
        }
        
        filter_expression = "{" + filter_expression + "}";

        if(invalid_input){
            throw "Invalid input argument";
            return "";
        }        
        return filter_expression;
    }
    
    /*
        Compares the preset filter to a single architecture
        @param expression: A filter expression string

        @return: A boolean indicating whether the input architecture passes the filter
    */
    check_preset_feature_single_sample(input_expression,data){

        let out = false;
        let matched = false;

        let expression = remove_outer_parentheses(input_expression);
        
        // Preset filter: {presetName[orbits;instruments;numbers]}   
        expression = expression.substring(1,expression.length-1);

        let flip=false;
        if(expression.startsWith("~")){
            flip=true;
            expression = expression.substring(1,expression.length);
        }
        
        let type = expression.split("[")[0];
        let inputs = data.inputs;

        if(type==="paretoFront"){

            if(data.pareto_ranking || data.pareto_ranking === 0){
                let rank = data.pareto_ranking;
                var arg = +expression.substring(0,expression.length-1).split("[")[1];
                if(rank <= arg){
                    return true;
                }else{
                    return false;
                }
            }else{
                return false;
            }

        }else{
            let argString = expression.substring(0, expression.length-1).split("[")[1];
            let args = argString.split(";");

            for (let i in this.presetFeatureTypes){
                let featureType = this.presetFeatureTypes[i];
                if (featureType.keyword === type){
                    out = featureType.apply(args, inputs);
                    matched = true;
                    break;
                }
            }
        }

        if(!matched){
            throw "Exception: Matching preset feature not found!";
        }

        if(flip==true){
            return !out;
        }else{
            return out;
        }
    }

    
    // Preset Feature Application Functions
    present(args, inputs){
        validInputCheck(args);
        let out = false;
        let instr = +args[1]
        for(let i = 0;i < this.norb; i++){
            if(inputs[this.ninstr * i + instr] === true){
                out = true;
                break;
            }
        }
        return out;
    }

    absent(args, inputs){
        validInputCheck(args);
        let out = true;
        let instr = + args[1]
        for(let i=0;i<this.norb;i++){
            if(inputs[this.ninstr * i + instr] === true){
                out = false;
                break;
            }
        }
        return out;
    }

    inOrbit(args, inputs){
        validInputCheck(args);
        let orbit = + args[0];
        let instr = args[1];
        let out = null;
        if(instr.indexOf(',') === -1){
            // Single instrument
            out = false;
            instr = + instr;
            if(inputs[orbit * this.ninstr + instr] === true){
                out = true;
            }
        }else{
            // Multiple instruments
            out = true;
            let instruments = instr.split(",");
            for(let j = 0; j < instruments.length; j++){
                let temp = +instruments[j];
                if(inputs[orbit * this.ninstr + temp] === false){
                    out = false;
                    break;
                }
            }           
        }
        return out;
    }

    notInOrbit(args, inputs){
        validInputCheck(args);
        let orbit = + args[0];
        let instr = args[1];
        let out = null;
        if(instr.indexOf(',') === -1){
            // One instrument
            out = true;
            instr = + instr;
            if(inputs[orbit * this.ninstr + instr] === true){
                out = false;
            }
        }else{
            // Multiple instruments
            out = true;
            let instruments = instr.split(",");
            for(let j = 0; j < instruments.length; j++){
                let temp = +instruments[j];
                if(inputs[orbit * this.ninstr + temp] === true){
                    out = false;
                    break;
                }
            }           
        }
        return out;
    }

    together(args, inputs){
        validInputCheck(args);
        let instr = args[1];
        let out = false;

        let instruments = instr.split(",");
        for(let i = 0; i < this.norb; i++){
            let found = true;
            for(var j = 0; j < instruments.length; j++){
                var temp = +instruments[j];
                if(inputs[i * this.ninstr + temp] === false){
                    found = false;
                }
            }
            if(found === true){
                out = true;
                break;
            }
        }
        return out;
    }

    separate(args, inputs){
        validInputCheck(args);
        let instr = args[1];
        let out = true;

        let instruments = instr.split(",");
        for(let i = 0; i < this.norb; i++){
            let found = false;
            for(let j = 0; j < instruments.length; j++){
                let temp = +instruments[j];
                if(inputs[i * this.ninstr + temp] === true){
                    if(found){
                        out = false;
                        break;
                    }else{
                        found = true;
                    }
                }
            }
            if(out === false) {
                break;
            }
        }
        return out;
    }

    emptyOrbit(args, inputs){
        validInputCheck(args);
        let orbit = +args[0];
        let out = true;
        for(let i = 0; i < this.ninstr; i++){
            if(inputs[orbit * this.ninstr + i] === true){
                out = false;
                break;
            }
        }
        return out;
    }

    numOrbits(args, inputs){
        validInputCheck(args);
        let numb = +args[2];
        let out = false;
        let count = 0;

        for(let i = 0; i < this.norb; i++){
            for(let j = 0; j < this.ninstr; j++){
                if(inputs[i * this.ninstr + j] === true){
                    count++;
                    break;
                }
            }
        }
        if(numb === count){
            out = true;
        }
        return out;
    }   
}





class EOSSAssigningFilter extends Filter{
    
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
                               {value:"numOrbits",text:"Number of orbit used",input:"numOrbits",hints:"Designs that have the specified number of non-empty orbits are chosen"},
                               {value:"numInstruments",text:"Number of instruments",input:"numInstruments",hints:"This highlights all the designs with the specified number of instruments. If you specify an orbit name, it will count all instruments in that orbit. If you can also specify an instrument name, and only those instruments will be counted across all orbits. If you leave both instruments and orbits blank, all instruments across all orbits will be counted."},
                               {value:"subsetOfInstruments",text:"Num of instruments in a subset",input:"subsetOfInstruments",hints:"The specified orbit should contain at least m number and at maximum M number of instruments from the specified instrument set. m is the first entry and M is the second entry in the second field"},
                               {value:"absentExceptInOrbit",text:"absentExceptInOrbit",input:"orbitAndInstInput",hints:""},
                               {value:"notInOrbitExceptInstrument",text:"notInOrbitExceptInstrument",input:"orbitAndMultipleInstInput",hints:""},
                               {value:"notInOrbitExceptOrbit",text:"notInOrbitExceptOrbit",input:"multipleOrbitAndInstInput",hints:""},
                            ];  

        for (let i = 0; i < presetFeaturesInfo.length; i++){
            let f = presetFeaturesInfo[i];
            let thisFeature = new FeatureType(f.text, f.value, f.input, f.hints);
            presetFeatures.push(thisFeature);
        }

        super(presetFeatures, labelingScheme);

        PubSub.subscribe(DATA_PROCESSED, (msg, data) => {
            this.set_application_functions();
        });

        PubSub.subscribe(PROBLEM_CONCEPT_HIERARCHY_LOADED, (msg, data) => {
            this.orbit_extended_list = data["params"]["rightSet"];
            this.instrument_extended_list = data["params"]["leftSet"];
            this.instance_map = data["instance_map"];
            this.superclass_map = data["superclass_map"];
            this.instance_index_map = {};
            this.instance_index_map["orbit"] = {};
            this.instance_index_map["instrument"] = {};

            for(let class_name in this.instance_map) {

                let instance_names = this.instance_map[class_name];
                let instance_indices = [];

                let class_type = null;
                let reference_list = null;

                for(let i = 0; i < instance_names.length; i++){
                    let instance_name = instance_names[i];
                    
                    if(i === 0){
                        if(this.orbit_extended_list.indexOf(instance_name) != -1){
                            class_type = "orbit";
                            reference_list = this.orbit_extended_list;

                        }else if(this.instrument_extended_list.indexOf(instance_name) != -1){
                            class_type = "instrument";
                            reference_list = this.instrument_extended_list;

                        }else{
                            throw "Unrecognized instance name: " + instance_name;

                        }
                    }

                    instance_indices.push(reference_list.indexOf(instance_name));
                }

                if(reference_list === null){
                    continue;
                }else{
                    let class_index = reference_list.indexOf(class_name);
                    this.instance_index_map[class_type][class_index] = instance_indices;
                }
            }
        });

        this.define_filter_functions();
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
                case "numInstruments":
                    return that.numInstruments;
                case "subsetOfInstruments":
                    return that.subsetOfInstruments;
                case "absentExceptInOrbit":
                    return that.absentExceptInOrbit;
                case "notInOrbitExceptInstrument":
                    return that.notInOrbitExceptInstrument;
                case "notInOrbitExceptOrbit":
                    return that.notInOrbitExceptOrbit;

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

                case "orbitAndInstInput":
                    filter_input_1.text("Input orbit name: ");
                    filter_input_1.append("input")
                                .attr("type","text");
                    
                    filter_input_2.text("Input instrument name: ");
                    filter_input_2.append("input")
                                .attr("type","text");
                    break;

                case "multipleOrbitAndInstInput":
                    filter_input_1.text("Input multiple orbit names: ");
                    filter_input_1.append("input")
                                .attr("type","text");
                    
                    filter_input_2.text("Input instrument name: ");
                    filter_input_2.append("input")
                                .attr("type","text");
                    break;
                    
                case "orbitInput":
                    filter_input_1.text("Input orbit name: ");
                    filter_input_1.append("input")
                                .attr("type","text");
                    break;
                    
                case "numOrbits":
                    filter_input_1.text("Input number of orbits");
                    filter_input_1.append("input")
                                .attr("type","text");
                    break;
                
                case "numInstruments":
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
        
        if(option === "present" || option === "absent" || option === "together" || option === "separate"){
            
            let instrument = input_textbox[0];
            let inst_relabel = this.label.displayName2Index(instrument,"instrument");
            if(inst_relabel==null){
                invalid_input=true;
            }
            filter_expression = option + "[;" + inst_relabel + ";]";
            
        }else if(option === "inOrbit" || option === "notInOrbit" || 
            option === "absentExceptInOrbit" || option === "notInOrbitExceptInstrument" || option === "notInOrbitExceptOrbit"){
            
            let orbit = input_textbox[0].trim();
            let instrument = input_textbox[1];
            
            let orb_relabel = this.label.displayName2Index(orbit,"orbit");
            let inst_relabel = this.label.displayName2Index(instrument,"instrument");
            if(inst_relabel==null || orb_relabel==null){
                invalid_input=true;
            }            
            
            filter_expression = option + "["+ orb_relabel + ";" + inst_relabel + ";]";

        }else if(option === "emptyOrbit"){
            
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
            let inst_relabel = this.label.displayName2Index(instrument,"instrument");
            if(inst_relabel==null || orb_relabel==null){
                invalid_input=true;
            }                    
            
            let numbers = input_textbox[1].trim().replace(/\s+/g, "");
            filter_expression = option + "["+ orb_relabel + ";" + inst_relabel + ";"+ numbers+"]";
            
        }else if(option=="numInstruments"){
            
            let orbit = input_textbox[0];
            let instrument = input_textbox[1];
            let number = input_textbox[2];

            let orbitEmpty = false; 
            let instrumentEmpty = false;

            // There are 3 possibilities
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
                
                let inst_relabel = this.label.displayName2Index(instrument,"instrument");
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
            
        } else if(dropdown === "paretoFront"){

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
    check_preset_feature_single_sample(input_expression, data){

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

        if(type.indexOf("paretoFront") != -1){

            if(data.pareto_ranking || data.pareto_ranking === 0){
                let rank = data.pareto_ranking;
                let arg = + expression.substring(0,expression.length-1).split("[")[1];
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

            for(let i = 0; i < args.length; i++){
                let temp;
                if(args[i].indexOf(",") != -1){
                    temp = args[i].split(",");

                }else if(args[i].indexOf("-") != -1){
                    temp = args[i].split("-");
                
                }else{
                    temp = args[i].split(",");
                }

                for(let j = 0; j < temp.length; j++){
                    if(temp[j] === ""){
                        temp[j] = -1;
                    }else{
                        temp[j] = +temp[j];
                    }
                }
                args[i] = temp;
            }

            for (let i = 0; i < this.presetFeatureTypes.length; i++){
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

        if(flip){
            return !out;
        }else{
            return out;
        }
    }


    define_filter_functions(){
        let that = this;
    
        // Preset Feature Application Functions
        this.present = (args, inputs) => {
            validInputCheck(args);

            let out = false;
            let instrument = args[1][0];
            let instantiated_args = Array.from(args);

            if(instrument >= this.ninstr){
                let instance_list = this.instance_index_map["instrument"][instrument];
                for(let i = 0; i < instance_list.length; i++){
                    
                    instantiated_args[1] = [instance_list[i]];
                    if(this.present(instantiated_args, inputs)){
                        // If at least one of the test is successful, return true
                        out = true;
                        break;
                    }
                }
            }
            else {
                for(let i = 0; i < this.norb; i++){
                    if(inputs[this.ninstr * i + instrument] === true){
                        out = true;
                        break;
                    }
                } 
            }
            return out;
        }

        this.absent = (args, inputs) => {
            validInputCheck(args);

            let out = true;
            let instrument = args[1][0];
            let instantiated_args = Array.from(args);

            if(instrument >= this.ninstr){
                let instance_list = this.instance_index_map["instrument"][instrument];
                for(let i = 0; i < instance_list.length ;i++){
                    
                    instantiated_args[1] = [instance_list[i]];
                    if(!this.absent(instantiated_args, inputs)){
                        // If at least one of the tests fail, return false
                        out = false;
                        break;
                    }
                }
            }
            else {
                for(let i = 0; i < this.norb; i++){
                    if(inputs[this.ninstr * i + instrument] === true){
                        out = false;
                        break;
                    }
                }
            }
            
            return out;
        }

        this.inOrbit = (args, inputs) => {
            validInputCheck(args);

            let orbit = args[0][0];
            let instruments = args[1];
            let out = false;

            let instantiated_args = Array.from(args);
            if(orbit >= this.norb){
                let instance_list = this.instance_index_map["orbit"][orbit];
                for(let i = 0; i < instance_list.length; i++){
                    instantiated_args[0][0] = instance_list[i];
                    if(this.inOrbit(instantiated_args, inputs)){
                        out = true;
                        break;
                    }
                }
            }
            else{

                let ground_items = [];
                let class_instances = [];
                for(let i = 0; i < instruments.length; i++){
                    let instrument = instruments[i];
                    if(instrument >= this.ninstr){
                        let instance_list = this.instance_index_map["instrument"][instrument];
                        class_instances.push(instance_list);
                    }else{
                        ground_items.push(instrument);
                    }
                }

                if(class_instances.length != 0){
                    let iterator;
                    if(class_instances.length === 1){
                        iterator = class_instances[0];
                    }else{
                        let cartesian_product_list = cartesianProductSet(...class_instances);
                        let cartesian_product_set = new SetOfSets(cartesian_product_list);
                        iterator = cartesian_product_set.getSets();
                    }

                    for(let iter of iterator){
                        let common_element_found = false;

                        if(class_instances.length != 1){ // There exist multiple generalized classes
                            if(iter.size < class_instances.length){ // There exist repeated items in the set
                                continue;
                            }

                            for(let i of iter){
                                if(ground_items.indexOf(i) != -1){
                                    common_element_found = true;
                                    break;
                                }
                            }
                            instantiated_args[1] = [].concat(...ground_items, ...iter);

                        }else{  // There's only one generalized class
                            if(ground_items.indexOf(iter) != -1){
                                common_element_found = true;
                            }
                            instantiated_args[1] = [].concat(...ground_items, iter);
                        }

                        if(common_element_found){
                            continue;
                        }

                        if(this.inOrbit(instantiated_args, inputs)){
                            out = true;
                            break;
                        }
                    }

                }else{
                    out = true;
                    for(let j = 0; j < instruments.length; j++){
                        let instrument = instruments[j];
                        if(inputs[orbit * this.ninstr + instrument] === false){
                            out = false;
                            break;
                        }
                    }  

                }  
            }
            return out;
        }

        this.notInOrbit = (args, inputs) => {
            validInputCheck(args);

            let orbit = args[0][0];
            let instruments = args[1];
            let out = true;
            let instantiated_args = Array.from(args);

            if(orbit >= this.norb){
                let instance_list = this.instance_index_map["orbit"][orbit];
                for(let i = 0; i < instance_list.length; i++){
                    instantiated_args[0][0] = instance_list[i];
                    if(!this.notInOrbit(instantiated_args, inputs)){
                        out = false;
                        break;
                    }
                }
            }
            else{
                let ground_items = [];
                let class_instances = [];
                for(let i = 0; i < instruments.length; i++){
                    let instrument = instruments[i];
                    if(instrument >= this.ninstr){
                        let instance_list = this.instance_index_map["instrument"][instrument];
                        class_instances.push(instance_list);
                    }else{
                        ground_items.push(instrument);
                    }
                }

                if(class_instances.length != 0){
                    let iterator;
                    if(class_instances.length === 1){
                        iterator = class_instances[0];
                    }else{
                        let cartesian_product_list = cartesianProductSet(...class_instances);
                        let cartesian_product_set = new SetOfSets(cartesian_product_list);
                        iterator = cartesian_product_set.getSets();
                    }

                    for(let iter of iterator){
                        let common_element_found = false;

                        if(class_instances.length != 1){ // There exist multiple generalized classes
                            if(iter.size < class_instances.length){ // There exist repeated items in the set
                                continue;
                            }
                            for(let i of iter){
                                if(ground_items.indexOf(i) != -1){
                                    common_element_found = true;
                                    break;
                                }
                            }
                            instantiated_args[1] = [].concat(...ground_items, ...iter);

                        }else{  // There's only one generalized class
                            if(ground_items.indexOf(iter) != -1){
                                common_element_found = true;
                            }
                            instantiated_args[1] = [].concat(...ground_items, iter);
                        }

                        if(common_element_found){
                            continue;
                        }

                        if(!this.notInOrbit(instantiated_args, inputs)){
                            out = false;
                            break;
                        }
                    }

                } else{                    
                    out = true;
                    for(let j = 0; j < instruments.length; j++){
                        let instrument = instruments[j];
                        if(inputs[orbit * this.ninstr + instrument] === true){
                            out = false;
                            break;
                        }
                    } 
                }  
            }
            return out;
        }

        this.absentExceptInOrbit = (args, inputs) => {
            validInputCheck(args);

            let orbits = args[0];
            let instrument = args[1][0];
            let out = true;
            let instantiated_args = Array.from(args);

            if(instrument >= this.ninstr){
                let instrument_instance_list = this.instance_index_map["instrument"][instrument];
                for(let i = 0; i < instrument_instance_list.length; i++){
                    instantiated_args[1][0] = instrument_instance_list[i];
                    if(!this.absentExceptInOrbit(instantiated_args, inputs)){
                        out = false;
                        break;
                    }
                }

            } else{     
                out = true;
                let allowedOrbits = [];
                for(let i = 0; i < orbits.length; i++){
                    let orbit = orbits[i];
                    allowedOrbits.push(orbit);
                    if(orbit >= this.norb){
                        let instance_list = this.instance_index_map["orbit"][orbit];
                        allowedOrbits = allowedOrbits.concat(instance_list);
                    }
                }
                
                for(let o = 0; o < this.norb; o++){
                    if(allowedOrbits.indexOf(o) !== -1){
                        continue;
                    }else{
                        if(inputs[o * this.ninstr + instrument] === true){
                            out = false;
                            break;
                        }
                    }
                }
            }  
            return out;
        }

        this.notInOrbitExceptInstrument = (args, inputs) => {
            validInputCheck(args);

            let orbit = args[0][0];
            let instrumentClass = args[1][0];
            let instrumentExceptions = [];
            for(let i = 1; i < args[1].length; i++){
                instrumentExceptions.push(args[1][i]);
            }
            let out = true;
            let instantiated_args = Array.from(args);

            if(orbit >= this.norb){
                let instance_list = this.instance_index_map["orbit"][orbit];
                for(let i = 0; i < instance_list.length; i++){
                    instantiated_args[0][0] = instance_list[i];
                    if(!this.notInOrbitExceptInstrument(instantiated_args, inputs)){
                        out = false;
                        break;
                    }
                }
            } else {
                out = true;
                let instrument_instance_list = this.instance_index_map["instrument"][instrumentClass];
                for(let i = 0; i < instrument_instance_list.length; i++){
                    let instrIndex = instrument_instance_list[i];
                    if(instrumentExceptions.indexOf(instrIndex) !== -1){
                        continue;
                    }else{
                        if(inputs[orbit * this.ninstr + instrIndex] === true){
                            out = false;
                            break;
                        }
                    }
                }
            }
            return out;
        }

        this.notInOrbitExceptOrbit = (args, inputs) => {
            validInputCheck(args);

            let orbitClass = args[0][0];
            let orbitException = args[0][1];
            let instrument = args[1][0];
            let out = true;
            let instantiated_args = Array.from(args);

            if(instrument >= this.ninstr){
                let instance_list = this.instance_index_map["instrument"][instrument];
                for(let i = 0; i < instance_list.length; i++){
                    instantiated_args[1][0] = instance_list[i];
                    if(!this.notInOrbitExceptOrbit(instantiated_args, inputs)){
                        out = false;
                        break;
                    }
                }
            } else {
                out = true;
                let orbit_instance_list = this.instance_index_map["orbit"][orbitClass];
                for(let i = 0; i < orbit_instance_list.length; i++){
                    let orbitIndex = orbit_instance_list[i];
                    if(orbitIndex === orbitException){
                        continue;
                    }else{
                        if(inputs[orbitIndex * this.ninstr + instrument] === true){
                            out = false;
                            break;
                        }
                    }
                }
                 
            }
            return out;
        }

        this.together = (args, inputs) => {
            validInputCheck(args);

            let instruments = args[1];
            let out = false;

            let instantiated_args = Array.from(args);
            let ground_items = [];
            let class_instances = [];
            for(let i = 0; i < instruments.length; i++){
                let instrument = instruments[i];
                if(instrument >= this.ninstr){
                    let instance_list = this.instance_index_map["instrument"][instrument];
                    class_instances.push(instance_list);
                }else{
                    ground_items.push(instrument);
                }
            }

            if(class_instances.length != 0){
                let iterator;
                if(class_instances.length === 1){
                    iterator = class_instances[0];
                }else{
                    let cartesian_product_list = cartesianProductSet(...class_instances);
                    let cartesian_product_set = new SetOfSets(cartesian_product_list);
                    iterator = cartesian_product_set.getSets();
                }

                for(let iter of iterator){
                    let common_element_found = false;

                    if(class_instances.length != 1){ // There exist multiple generalized classes
                        if(iter.size < class_instances.length){ // There exist repeated items in the set
                            continue;
                        }
                        for(let i of iter){
                            if(ground_items.indexOf(i) != -1){
                                common_element_found = true;
                                break;
                            }
                        }   
                        instantiated_args[1] = [].concat(...ground_items, ...iter);

                    }else{  // There's only one generalized class
                        if(ground_items.indexOf(iter) != -1){
                            common_element_found = true;
                        }
                        instantiated_args[1] = [].concat(...ground_items, iter);
                    }

                    if(common_element_found){
                        continue;
                    }

                    if(this.together(instantiated_args, inputs)){
                        out = true;
                        break;
                    }
                }

            }else{
                for(let i = 0; i < this.norb; i++){
                    let found = true;
                    for(let j = 0; j < instruments.length; j++){
                        let instrument = instruments[j];
                        if(inputs[i * this.ninstr + instrument] === false){
                            found = false;
                            break;
                        }
                    }

                    if(found){
                        out = true;
                        break;
                    }
                }
            }
            return out;
        }

        this.separate = (args, inputs) => {
            validInputCheck(args);

            let instruments = args[1];
            let out = true;

            let instantiated_args = Array.from(args);
            let ground_items = [];
            let class_instances = [];
            for(let i = 0; i < instruments.length; i++){
                let instrument = instruments[i];
                if(instrument >= this.ninstr){
                    let instance_list = this.instance_index_map["instrument"][instrument];
                    class_instances.push(instance_list);
                }else{
                    ground_items.push(instrument);
                }
            }

            if(class_instances.length != 0){
                let iterator;
                if(class_instances.length === 1){
                    iterator = class_instances[0];
                }else{
                    let cartesian_product_list = cartesianProductSet(...class_instances);
                    let cartesian_product_set = new SetOfSets(cartesian_product_list);
                    iterator = cartesian_product_set.getSets();
                }

                for(let iter of iterator){
                    let common_element_found = false;

                    if(class_instances.length != 1){ // There exist multiple generalized classes
                        if(iter.size < class_instances.length){ // There exist repeated items in the set
                            continue;
                        }
                        for(let i of iter){
                            if(ground_items.indexOf(i) != -1){
                                common_element_found = true;
                                break;
                            }
                        }
                        instantiated_args[1] = [].concat(...ground_items, ...iter);

                    }else{  // There's only one generalized class
                        if(ground_items.indexOf(iter) != -1){
                            common_element_found = true;
                        }
                        instantiated_args[1] = [].concat(...ground_items, iter);
                    }

                    if(common_element_found){
                        continue;
                    }

                    if(!this.separate(instantiated_args, inputs)){
                        out = false;
                        break;
                    }
                }

            }else{
                for(let i = 0; i < this.norb; i++){
                    let found = false;
                    for(let j = 0; j < instruments.length; j++){
                        let instrument = instruments[j];
                        if(inputs[i * this.ninstr + instrument] === true){
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
            }
            return out;
        }

        this.emptyOrbit = (args, inputs) => {
            validInputCheck(args);
            let out = true;
            let orbit = args[0][0];
            let instantiated_args = Array.from(args);

            if(orbit >= this.norb){
                let instance_list = this.instance_index_map["orbit"][orbit];
                for(let i = 0; i < instance_list.length; i++){
                    
                    instantiated_args[0][0] = instance_list[i];
                    if(!this.emptyOrbit(instantiated_args, inputs)){
                        out = false;
                        break;
                    }
                }

            }else{
                for(let i = 0; i < this.ninstr; i++){
                    if(inputs[orbit * this.ninstr + i] === true){
                        out = false;
                        break;
                    }
                }
            }
            return out;
        }

        this.numOrbits = (args, inputs) => {
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

        this.numInstruments = (args, inputs) => {
            validInputCheck(args);

            let orb = +args[0];
            let instr = +args[1];
            
            let nBounds = [];
            if(args[2].length === 2){
                nBounds.push( + args[2][0] );
                nBounds.push( + args[2][1] );
            }else{
                nBounds.push( + args[2]);
                nBounds.push( + args[2]);
            }
            let out = false;
            let count = 0;

            if(orb != -1 && instr != -1){
                if(instr >= this.ninstr){
                    let instance_list = this.instance_index_map["instrument"][instr];
                    for(let i = 0; i < instance_list.length; i++){
                        let tempInstr = instance_list[i];
                        if(inputs[orb * this.ninstr + tempInstr] === true){
                            count++;
                        }
                    }
                }else{
                    throw "Instrument argument must be a high-level class";
                }

            } if(orb != -1){
                for(let i = 0; i < this.ninstr; i++){
                    if(inputs[orb * this.ninstr + i] === true){
                        count++;
                    }
                }

            } else if(instr != -1){
                if(instr >= this.ninstr){
                    let instance_list = this.instance_index_map["instrument"][instr];
                    for(let i = 0; i < instance_list.length; i++){
                        let tempInstr = instance_list[i];
                        for(let o = 0; o < this.norb; o++){
                            if(inputs[o * this.ninstr + tempInstr] === true){
                                count++;
                            }
                        }
                    }
                }else{
                    for(let o = 0; o < this.norb; o++){
                        if(inputs[o * this.ninstr + instr] === true){
                            count++;
                        }
                    }
                }
            } else{
                for(let o = 0; o < this.norb; o++){
                    for(let i = 0; i < this.ninstr; i++){
                        if(inputs[o * this.ninstr + i] === true){
                            count++;
                        }   
                    }
                }
            }

            if(count >= nBounds[0] && count <= nBounds[1]){
                out = true;
            }
            return out;
        }  

        this.subsetOfInstruments = (args, inputs) => {
            validInputCheck(args);

            let orb = +args[0];
            let instrumentsString = args[1];
            let numString = args[2];

            instrumentsString = instrumentsString.split(",");
            let instruments = [];
            for(let i = 0; i < instrumentsString.length; i++){
                instruments.push(+instrumentsString[i]);
            }

            let min = 0;
            let max = 0;

            if(numString.indexOf(",") === -1){
                // Only min is provided
                min = +numString;
                max = 9999;
            }else{
                let numStringSplit = numString.split(",");
                min = +numStringSplit[0];
                max = +numStringSplit[1];
            }

            let out = true;
            let cnt = 0;

            for(let i = 0; i < instruments.length; i++){
                if(inputs[orb * this.ninstr + instruments[i]] === true){
                    cnt++;
                }
            }   

            return (cnt >= min && cnt <= max);
        }

    }
}





class GNCFilter extends Filter{
    
    constructor(labelingScheme) {

        let presetFeatures = [];

        let presetFeaturesInfo = [
                                {value:"not_selected",text:"Preset Filters"},
                                {value:"paretoFront",text:"Pareto front"},
                                {value:"numSensors",text:"# of sensors",input:"singleNum",hints:""},
                                {value:"numComputers",text:"# of computers",input:"singleNum",hints:""},
                                {value:"numTotalLinks",text:"# of links",input:"singleNum",hints:""},
                                //{value:"Inat_1",text:"Inat_1",input:"singleNum",hints:""},
                                //{value:"Inat_2",text:"Inat_2",input:"singleNum",hints:""},
                                //{value:"Inat_3",text:"Inat_3",input:"singleNum",hints:""},
                                {value:"minNSNC",text:"Minimum # of sensors and computers",input:"singleNum",hints:""},
                                {value:"numSensorOfType",text:"# of a specific sensor",input:"NameAndNum",hints:""},
                                {value:"numComputerOfType",text:"# of a specific computer",input:"NameAndNum",hints:""},
                                {value:"sensorWithSpecificNumLinks",text:"Sensors with a specific # of links",input:"NameAndNum",hints:""},
                                {value:"computerWithSpecificNumLinks",text:"Computers with a specific # of links",input:"NameAndNum",hints:""},
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

        this.define_filter_functions();
    }

    set_application_functions(){

        this.input_list = this.label.input_list;

        let that = this;

        let match_function = function(name){
            switch(name) {
                case "numSensors":
                    return that.numSensors;
                case "numComputers":
                    return that.numComputers;   
                case "numTotalLinks":
                    return that.numTotalLinks; 
                case "minNSNC":
                    return that.minNSNC; 
                case "numSensorOfType":
                    return that.numSensorOfType;
                case "numComputerOfType":
                    return that.numComputerOfType;
                case "sensorWithSpecificNumLinks":
                    return that.sensorWithSpecificNumLinks;
                case "computerWithSpecificNumLinks":
                    return that.computerWithSpecificNumLinks;

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

            d3.select(".filter.hints.div")
                .append("div")
                .html('<p>Selects the Pareto front</p>');             
            
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
                    
                case "singleNum":
                    filter_input_1.text("Input single integer number: ");
                    filter_input_1.append("input")
                                .attr("type","text");
                    break;
                 case "NameAndNum":
                    filter_input_1.text("Input the name: ");
                    filter_input_1.append("input")
                                .attr("type","text");

                    filter_input_2.text("Input single integer number: ");
                    filter_input_2.append("input")
                                .attr("type","text");
                    break;
                case "NameAndTwoNum":
                    filter_input_1.text("Input single integer number: ");
                    filter_input_1.append("input")
                                .attr("type","text");

                    filter_input_2.text("Input the name: ");
                    filter_input_2.append("input")
                                .attr("type","text");

                    filter_input_3.text("Input single integer number: ");
                    filter_input_3.append("input")
                                .attr("type","text");
                    break;
                default:
                    break;
            }
        }

        // d3.select(".filter.hints.div")
        //     .append("div")
        //     .html('<p>Valid orbit names: 1000, 2000, 3000, 4000, 5000</p>'
        //             +'Valid instrument names: A, B, C, D, E, F, G, H, I, J, K, L');      
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

        if(dropdown==="paretoFront"){

            let input = d3.selectAll('.filter.inputs.div').select('div').select('input').node().value
            filter_expression = "paretoFront["+input+"]";

        }else if(dropdown === "numSensors" || dropdown === "numComputers" || dropdown === "numTotalLinks" ||
            dropdown === "minNSNC"){

            let arg = input_textbox[0];
            if(isNaN(arg)){ // If arg cannot be converted to a number
                invalid_input = true;
            }
            filter_expression = option + "[" + arg + "]";

        }else if(dropdown === "numSensorOfType" || dropdown === "numComputerOfType"|| 
            dropdown === "sensorWithSpecificNumLinks" || dropdown === "computerWithSpecificNumLinks"){

            let type = null;

            if(dropdown === "numSensorOfType" || dropdown === "sensorWithSpecificNumLinks"){
                type = "sensors";
            }else{
                type = "computers";
            }

            let name = this.label.displayName2ActualName(input_textbox[0], type);

            let num = input_textbox[1];

            filter_expression = option + "[" + name + ";" + num + "]";

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


// {value:"NS",text:"# of Sensors",input:"singleNum",hints:""},
//                                 {value:"NC",text:"# of Computers",input:"singleNum",hints:""},
//                                 {value:"numTotalLinks",text:"# of Links",input:"singleNum",hints:""},
//                                 {value:"minNSNC",text:"Minimum # of Sensors and Computers",input:"singleNum",hints:""},
                                // {value:"numSensorOfType",text:"# of a specific sensor",input:"NameAndNum",hints:""},
                                // {value:"numComputerOfType",text:"# of a specific computer",input:"NameAndNum",hints:""},


    define_filter_functions(){

        let that = this;

        this.sensorWithSpecificNumLinks = (args, inputs) => {
            validInputCheck(args);

            let sensorName = args[0] + "";
            let numLinks = + args[1];

            // Save the sensor input information, and make it a string
            //let linkIndexStart = this.input_list.indexOf("Ibin_1");

            let NS = inputs[0];
            let NC = inputs[1];
            let sensors = inputs[2] + "";
            let computers = inputs[3] + "";
            let linkList = inputs.slice(4,13);

            let targetSensors = [];
            for(let i = 0; i < sensors.length; i++){
                if(sensors[i] === sensorName){
                    targetSensors.push(i);
                }
            }

            if(x < 5){
                //console.log();
                x++;
            }

            for(let i=0;i<NS;i++){
                if(targetSensors.indexOf(i) != -1){
                    let cnt = 0;
                    for(let j=0;j<NC;j++){
                        if(linkList[i*NC + j] === 1){
                            cnt++;
                        }
                    }
                    if(cnt === numLinks){
                        return true;
                    }
                }
            }
            return false;
        }

        this.computerWithSpecificNumLinks = (args, inputs) => {
            validInputCheck(args);

            let computerName = args[0] + "";
            let numLinks = + args[1];

            // Save the sensor input information, and make it a string
            //let linkIndexStart = this.input_list.indexOf("Ibin_1");

            let NS = inputs[0];
            let NC = inputs[1];
            let sensors = inputs[2] + "";
            let computers = inputs[3] + "";
            let linkList = inputs.slice(4,13);

            let targetComputers = [];
            for(let i = 0; i < computers.length; i++){
                if(computers[i] === computerName){
                    targetComputers.push(i);
                }
            }

            for(let i=0;i<NC;i++){
                if(targetComputers.indexOf(i) != -1){
                    let cnt = 0;
                    for(let j=0;j<NS;j++){
                        if(linkList[j*NC + i] === 1){
                            cnt++;
                        }
                    }
                    if(cnt === numLinks){
                        return true;
                    }
                }
            }
            return false;
        }

        this.numSensorOfType = (args, inputs) => {
            validInputCheck(args);
            let sensorName = args[0];
            let num = +args[1];
            // Save the sensor input information, and make it a string
            let sensorInputIndex = this.input_list.indexOf("sensors") + "";
            let sensorInput = inputs[sensorInputIndex] + "";

            let cnt = 0;
            for(let i = 0; i < sensorInput.length; i++){
                if(sensorInput[i] === sensorName){
                    cnt += 1;
                }
            }
            return cnt === num; 
        }

        this.numComputerOfType = (args, inputs) => {
            validInputCheck(args);
            let computerName = args[0];
            let num = +args[1];
            // Save the computer input information, and make it a string
            let computerInputIndex = this.input_list.indexOf("computers") + "";
            let computerInput = inputs[computerInputIndex] + "";

            let cnt = 0;
            for(let i = 0; i < computerInput.length; i++){
                if(computerInput[i] === computerName){
                    cnt += 1;
                }
            }

            return cnt === num; 
        }

        this.minNSNC = (args, inputs) => {
            validInputCheck(args);
            let arg = +args[0];
            let NSIndex = this.input_list.indexOf("NS");
            let NCIndex = this.input_list.indexOf("NC");
            let ns = inputs[NSIndex];
            let nc = inputs[NCIndex];
            if(Math.min(ns,nc) === arg){
                return true;
            }else{
                return false;
            }    
        }

        this.numSensors = (args, inputs) => {
            validInputCheck(args);
            let arg = +args[0];
            let NSIndex = this.input_list.indexOf("NS");
            let ns = inputs[NSIndex];
            if(ns === arg){
                return true;
            }else{
                return false;
            }    
        }

        this.numComputers = (args, inputs) => {
            validInputCheck(args);
            let arg = +args[0];
            let NCIndex = this.input_list.indexOf("NC");
            let nc = inputs[NCIndex];
            if(nc === arg){
                return true;
            }else{
                return false;
            }    
        }

        this.numTotalLinks = (args, inputs) => {
            validInputCheck(args);
            let arg = +args[0];
            let nLinks = 0;
            let Ibin_1_index = this.input_list.indexOf("Ibin_1");
            let Ibin_9_index = this.input_list.indexOf("Ibin_9");

            for(let i = Ibin_1_index; i < Ibin_9_index + 1; i++){
                nLinks += inputs[i];
            }

            if(nLinks === arg){
                return true;
            }else{
                return false;
            }  
        }

        this.Inat_1 = (args, inputs) => {
            validInputCheck(args);
            let arg = +args[0];
            let index = this.input_list.indexOf("Inat_1");
            let n = inputs[index];
            if(n === arg){
                return true;
            }else{
                return false;
            }    
        }

        this.Inat_2 = (args, inputs) => {
            validInputCheck(args);
            let arg = +args[0];
            let index = this.input_list.indexOf("Inat_2");
            let n = inputs[index];
            if(n === arg){
                return true;
            }else{
                return false;
            }    
        }

        this.Inat_3 = (args, inputs) => {
            validInputCheck(args);
            let arg = +args[0];
            let index = this.input_list.indexOf("Inat_3");
            let n = inputs[index];
            if(n === arg){
                return true;
            }else{
                return false;
            }    
        }

    }
}

var x = 0;


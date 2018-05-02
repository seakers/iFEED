
class CrisisFilter extends Filter{
    
    constructor(labelingScheme) {

        let presetFeatures = [];

        let presetFeaturesInfo = [
                                {value:"not_selected",text:"Preset Filters"},
                                {value:"paretoFront",text:"Pareto front"},
                                {value:"numPlanes",text:"# of planes",input:"singleNum",hints:""},
                                {value:"semiMajorAxis",text:"Semi-major Axis",input:"lowerUpperBoundAndNum",hints:""},
                                {value:"inclination",text:"Inclination",input:"lowerUpperBoundAndNum",hints:""},
                                {value:"meanDiffRAAN",text:"Mean differences in RAAN",input:"lowerUpperBound",hints:""}
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
                case "numPlanes":
                    return that.numPlanes;
                case "inclination":
                    return that.inclination;
                case "semiMajorAxis":
                    return that.semiMajorAxis;
                case "meanDiffRAAN":
                    return that.meanDiffRAAN;

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

                case "lowerUpperBound":
                    filter_input_1.text("Input the lower bound: ");
                    filter_input_1.append("input")
                                .attr("type","text");

                    filter_input_2.text("Input the upper bound: ");
                    filter_input_2.append("input")
                                .attr("type","text");
                    break;

                case "lowerUpperBoundAndNum":
                    filter_input_1.text("Input the lower bound: ");
                    filter_input_1.append("input")
                                .attr("type","text");

                    filter_input_2.text("Input the upper bound: ");
                    filter_input_2.append("input")
                                .attr("type","text");

                    filter_input_3.text("Input single integer number: ");
                    filter_input_3.append("input")
                                .attr("type","text");

                    d3.select(".filter.hints.div")
                        .append("div")
                        .html('<p>To set the range of values, write in format: \"n1~n2\"</p>');  
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

        }else if(dropdown === "numPlanes"){

            let arg = input_textbox[0];
            if(isNaN(arg)){ // If arg cannot be converted to a number
                invalid_input = true;
            }
            filter_expression = option + "[" + arg + "]";

        }else if(dropdown === "inclination" || dropdown === "semiMajorAxis" || dropdown === "meanDiffRAAN"){

            let type = null;

            if(dropdown === "inclination" || dropdown === "meanDiffRAAN"){
                type = "angle";
            }else if(dropdown === "semiMajorAxis"){
                type = "length";
            }else{
                type = null;
            }

            let lb = this.label.displayName2ActualName(input_textbox[0], type);
            let ub = this.label.displayName2ActualName(input_textbox[1], type);
            let num = input_textbox[2];

            filter_expression = option + "[" + lb + ";" + ub + ";" + num + "]";
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

    define_filter_functions(){

        let that = this;


        this.numPlanes = (args, inputs) => {
            validInputCheck(args);

            let n = + args[0];

            let incIndexStart = null;
            let incIndexEnd = null;
            let raanIndexStart = null;
            let raanIndexEnd = null;
            
            for(let i=0;i<this.input_list.length;i++){

                if(this.input_list[i].indexOf("inc") != -1){
                    if(incIndexStart === null){
                        incIndexStart = i;
                    }else{
                        incIndexEnd = i;
                    }
                    continue;
                }

                if(this.input_list[i].indexOf("raan") != -1){
                    if(raanIndexStart === null){
                        raanIndexStart = i;
                    }else{
                        raanIndexEnd = i;
                    }
                    continue;
                }

            }

            let inclinations = inputs.slice(incIndexStart, incIndexEnd+1);
            let raans = inputs.slice(raanIndexStart, raanIndexEnd+1);

            // Two spacecraft are in the same plane if they have the same inclination and raan (circular orbit)
            let planes = [];

            for(let i = 0; i < inclinations.length; i++){

                let foundMatchingPlane = false;
                let inc = inclinations[i];
                let raan = raans[i];

                for(let j=0;j<planes.length;j++){

                    if( Math.abs(inc - planes[j].inc) <= 0.017  &&  // 0.1 rad difference
                        Math.abs(raan - planes[j].raan) <= 0.017){ // 0.1 rad difference

                        foundMatchingPlane = true;
                        break;
                    }
                }

                if(!foundMatchingPlane){
                    planes.push({"inc": inc, "raan" : raan});
                }
            }

            if(n === planes.length){
                return true;
            }else{
                return false;
            }    
        }

        this.inclination = (args, inputs) => {
            validInputCheck(args);

            let lb = + args[0];
            let ub = + args[1];
            let num = args[2];
            let numRange = [];

            if(num.indexOf("~") != -1){
                let low = + num.split("~")[0];
                let high = + num.split("~")[1];
                numRange = [low, high];
            }else{
                num = +num;
                numRange = [num, num];
            }

            let incIndexStart = null;
            let incIndexEnd = null;
            
            for(let i=0;i<this.input_list.length;i++){

                if(this.input_list[i].indexOf("inc") != -1){
                    if(incIndexStart === null){
                        incIndexStart = i;
                    }else{
                        incIndexEnd = i;
                    }
                    continue;
                }
            }

            let inclinations = inputs.slice(incIndexStart, incIndexEnd+1);

            let cnt = 0;
            for(let i=0;i<inclinations.length;i++){
                let inc = inclinations[i];
                if( inc >= lb && inc <= ub ){
                    cnt++;
                }
            }

            if(cnt >= numRange[0] && cnt <= numRange[1]){
                return true;
            }else{
                return false;
            }    
        }

        this.semiMajorAxis = (args, inputs) => {
            validInputCheck(args);

            let lb = + args[0];
            let ub = + args[1];
            let num = args[2];
            let numRange = [];

            if(num.indexOf("~") != -1){
                let low = + num.split("~")[0];
                let high = + num.split("~")[1];
                numRange = [low, high];
            }else{
                num = +num;
                numRange = [num, num];
            }

            let smaIndexStart = null;
            let smaIndexEnd = null;
            
            for(let i=0;i<this.input_list.length;i++){

                if(this.input_list[i].indexOf("sma") != -1){
                    if(smaIndexStart === null){
                        smaIndexStart = i;
                    }else{
                        smaIndexEnd = i;
                    }
                    continue;
                }
            }

            let sma = inputs.slice(smaIndexStart, smaIndexEnd+1);

            let cnt = 0;
            for(let i=0;i<sma.length;i++){
                let x = sma[i];
                if( x >= lb && x <= ub ){
                    cnt++;
                }
            }

            if(cnt >= numRange[0] && cnt <= numRange[1]){
                return true;
            }else{
                return false;
            }    
        }

        this.meanDiffRAAN = (args, inputs) => {
            validInputCheck(args);

            let lb = + args[0];
            let ub = + args[1];

            let raanIndexStart = null;
            let raanIndexEnd = null;
            
            for(let i = 0; i < this.input_list.length; i++){
                if(this.input_list[i].indexOf("raan") != -1){
                    if(raanIndexStart === null){
                        raanIndexStart = i;
                    }else{
                        raanIndexEnd = i;
                    }
                    continue;
                }
            }

            let raans = inputs.slice(raanIndexStart, raanIndexEnd+1);

            raans.sort((a, b) => {return a - b}); // Sort in non-decreasing order

            let diffSum = 0;
            let cnt = 0;
            for(let i = 0; i < raans.length - 1; i++){
                let diff = Math.abs(raans[i] - raans[i+1]);
                if(diff < 0.01){ // If the difference is less than about 0.6 degrees,
                    //  assume they are the same
                }else{
                    diffSum = diffSum + diff;
                    cnt++;
                }
            }

            let avg = diffSum / cnt;

            if(avg >= lb && avg <= ub){
                return true;
            }else{
                return false;
            }    
        }


        this.numLinks = (args, inputs) => {
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



    }
}


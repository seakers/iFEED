
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

class GNCFilter extends Filter{
    
    constructor(labelingScheme) {

        let presetFeatures = [];

        let presetFeaturesInfo = [
                                {value:"not_selected",text:"Preset Filters"},
                                //{value:"paretoFront",text:"Pareto front"},
                                {value:"numSensors",text:"# of Sensors",input:"singleNum",hints:""},
                                {value:"numComputers",text:"# of Computers",input:"singleNum",hints:""},
                                {value:"numLinks",text:"# of Links",input:"singleNum",hints:""},
                                {value:"Inat_1",text:"Inat_1",input:"singleNum",hints:""},
                                {value:"Inat_2",text:"Inat_2",input:"singleNum",hints:""},
                                {value:"Inat_3",text:"Inat_3",input:"singleNum",hints:""},
                                {value:"minNSNC",text:"Minimum # of Sensors and Computers",input:"singleNum",hints:""},
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
        this.input_list = this.label.input_list;

        let that = this;

        let match_function = function(name){
            switch(name) {
                case "numSensors":
                    return that.numSensors;
                case "numComputers":
                    return that.numComputers;   
                case "numLinks":
                    return that.numLinks; 
                case "minNSNC":
                    return that.minNSNC; 
                case "Inat_1":
                    return that.Inat_1; 
                case "Inat_2":
                    return that.Inat_2; 
                case "Inat_3":
                    return that.Inat_3; 

                default:
                    return null;
            }
        }

        for (let i in this.presetFeatureTypes){
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
                    
                case "singleNum":
                    filter_input_1.text("Input single integer number: ");
                    filter_input_1.append("input")
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
            filter_expression = "paretoFront[" + input + "]";

        }else{

            let arg = input_textbox[0];
            if(isNaN(arg)){ // If arg cannot be converted to a number
                invalid_input = true;
            }
            filter_expression = option + "[" + arg + "]";
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
            // if(data.pareto_ranking || data.pareto_ranking==0){
            //     var rank = +data.pareto_ranking;
            //     var arg = +expression.substring(0,expression.length-1).split("[")[1];
            //     if(rank <= arg){
            //         return true;
            //     }else{
            //         return false;
            //     }
            // }
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
//                                 {value:"NumLinks",text:"# of Links",input:"singleNum",hints:""},
//                                 {value:"minNSNC",text:"Minimum # of Sensors and Computers",input:"singleNum",hints:""},


    minNSNC(args, inputs){
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

    numSensors(args, inputs){
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

    numComputers(args, inputs){
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

    numLinks(args, inputs){
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

    Inat_1(args, inputs){
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

    Inat_2(args, inputs){
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

    Inat_3(args, inputs){
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


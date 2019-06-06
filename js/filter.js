
let validInputCheck = function(args){

    // Checks if the input is an array

    let valid = false;
    while(true){

        // Check if the input is an array
        if (!isArray(args)){
            break;
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

class FeatureType{
    
    constructor(name, keyword, inputType, hints){
        this.name = name;
        this.keyword = keyword;
        this.inputType = inputType;
        this.hints = hints;

        this.apply = null;
        this.toString = null;
    }

    setApply(func){
        this.apply = func;
    }    

    setToString(){
        this.toString = func;
    }
}


class Filter{
    
    constructor(presetFeatureTypes, labelingScheme){

        this.presetFeatureTypes = presetFeatureTypes;
        this.label = labelingScheme;
        this.data = null;

        this.initialize();

        PubSub.subscribe(APPLY_FEATURE_EXPRESSION, (msg, data) => {
            if(this.data !== null){
                this.apply_filter_expression(data);
            }            
        });   

        PubSub.subscribe(DATA_PROCESSED, (msg, data) => {
            this.data = data;
        });
    }

    initialize (){
        
        document.getElementById('tab2').click();
        
        d3.select("#support_panel").select("#view2").select("g").remove();

        let support_panel = d3.select("#support_panel").select("#view2").append("g");
        
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
        
        let dropdown = d3.select(".filter.options.div")
                .append("select")
                .attr("class","filter options dropdown");

        dropdown.selectAll("option")
                .data(this.presetFeatureTypes)
                .enter()
                .append("option")
                .attr("value",function(d){
                    return d.keyword;
                })
                .text(function(d){
                    return d.name;
                });    

        let that = this;

        d3.select(".filter.buttons")
                .append("button")
                .attr("id","apply_filter_button")
                .text("Apply Filter")
                .on("click", () => {
                    that.apply_filter();
                });
        
        d3.select(".filter.options.dropdown").on("change",function(d){
            let option = d3.select(this).node().value;            
            that.initialize_filter_input_field(option); 

            // EXPERIMENT 
            PubSub.publish(EXPERIMENT_TUTORIAL_EVENT, "filter_select_" + option);
        });    
    }
    
    get_preset_option(option){
        for(let i = 0;i < this.presetFeatureTypes.length; i++){
            if(this.presetFeatureTypes[i].keyword === option){
                return this.presetFeatureTypes[i];
            }
        }
        return null;
    }

    get_number_of_inputs(){
        return d3.selectAll('.filter.inputs.div').selectAll('input').length;
    }    
    
    initialize_filter_input_field(option){
        // To be implemented
    }

    generate_filter_expression_from_input_field(){
        // To be implemented
    }

    apply_filter(){
        let expression = this.generate_filter_expression_from_input_field();

        if(expression.indexOf('paretoFront') !== -1){
            this.apply_filter_expression(expression);

        }else{
            PubSub.publish(UPDATE_FEATURE_APPLICATION, {"option": "direct-update", "expression": expression});
        }
        
        document.getElementById('tab2').click();

        // EXPERIMENT
        PubSub.publish(EXPERIMENT_TUTORIAL_EVENT, "filter_applied");

        // EXPERIMENT
        PubSub.publish(EXPERIMENT_EVENT, "filter_applied");

        return true;
    }

    apply_filter_expression(feature_expression){

        // Cancel all previous selections
        this.data.forEach(point => {
            point.highlighted = false;
        });

        let id_list = null;

        // If filter expression is empty, return
        if (feature_expression === "" || !feature_expression){
            id_list = [];

        }else{
            let filtered_data = this.process_filter_expression(feature_expression, this.data);
            id_list = this.get_data_ids(filtered_data);

            this.data.forEach((point) => {
                if(id_list.indexOf(point.id) != -1){
                    point.highlighted = true;
                }
            });
        }
        PubSub.publish(UPDATE_TRADESPACE_PLOT, true);
        return id_list;
    }

    /*
        Compares the preset filter to a single architecture
        @param expression: A filter expression string

        @return: A boolean indicating whether the input architecture passes the filter
    */
    check_preset_feature_single_sample(input_expression,data){
        // To be implemented 
    }
    
    process_filter_expression(expression, data){        
        let e, _e;

        e = expression;
        // Remove outer parenthesis
        e = remove_outer_parentheses(e);
        _e = e;

        let filtered = [];
        let first = true;
        let last = false;
        let logic = null;

        if(get_nested_parenthesis_depth(e) === 0){

            // Given expression does not have a nested structure
            if(e.indexOf("&&") === -1 && e.indexOf("||") === -1){

                // There is no logical connective: Single filter expression
                for(let i = 0; i < data.length; i++){
                    if(this.check_preset_feature_single_sample(e, data[i])){
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

        if(_e.indexOf("_IF_") !== -1 && _e.indexOf("_THEN_") !== -1){
            e = e.substring("_IF_".length);

            let conditional = e.split("_THEN_")[0];
            let rightHandSide = e.split("_THEN_")[1];
            let consequent, alternative;
            if(rightHandSide.indexOf("_ELSE_") === -1){
                consequent = rightHandSide;
                alternative = null;
            }else{
                consequent = rightHandSide.split("_ELSE_")[0];
                alternative = rightHandSide.split("_ELSE_")[1];
            }

            let conditionalFiltered = this.process_filter_expression(conditional, data);
            let consequentFiltered = this.process_filter_expression(consequent, data);
            let alternativeFiltered = null;
            if(alternative !== null){
                alternativeFiltered = this.process_filter_expression(alternative, data);
            }

            if(alternative === null){
                for(let i = 0; i < data.length; i++){
                    if(this.contains_sample(conditionalFiltered, data[i])){
                        if(this.contains_sample(consequentFiltered, data[i])){
                            filtered.push(data[i]);
                        }
                    }else{
                        filtered.push(data[i]);
                    }
                }
            }else{
                for(let i = 0; i < data.length; i++){
                    if(this.contains_sample(conditionalFiltered, data[i])){
                        if(this.contains_sample(consequentFiltered, data[i])){
                            filtered.push(data[i]);
                        }
                    }else{
                        if(this.contains_sample(alternativeFiltered, data[i])){
                            filtered.push(data[i]);
                        }
                    }
                }
            }
            
        }else{
            while(!last){
                let e_temp, _e_temp;

                if(first){
                    // The first filter in a series to be applied
                    filtered = JSON.parse(JSON.stringify(data));
                    first = false;
                }else{
                    logic = _e.substring(0,2);
                    _e = _e.substring(2);
                    e = e.substring(2);
                }

                let next; // The imediate next logical connective
                let and = _e.indexOf("&&");
                let or = _e.indexOf("||");
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

                if(logic == '||'){
                    let filtered_temp = this.process_filter_expression(e_temp, data);
                    for(let j = 0; j < filtered_temp.length; j++){
                        if(!this.contains_sample(filtered, filtered_temp[j])){
                            filtered.push(filtered_temp[j]);
                        }
                    }

                }else{
                    filtered = this.process_filter_expression(e_temp, filtered); 
                }
            }
        }
        return filtered;
    }

    contains_sample(dataset, sample){
        if(!dataset){
            return false;
        }
        for(let i = 0; i < dataset.length; i++){
            if(dataset[i].id === sample.id){
                return true;
            }
        }
        return false;
    }

    get_data_ids(data){
        let ids = [];
        for(let i = 0; i < data.length; i++){
            ids.push(data[i].id);
        }
        return ids;
    }
}

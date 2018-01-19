
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

        this.initialize();

        PubSub.subscribe(APPLY_FEATURE_EXPRESSION, (msg, data) => {
            this.apply_filter_expression(data);
        });   

        PubSub.subscribe(DATA_PROCESSED, (msg, data) => {
            this.data = data;
        });
    }

    initialize (){
        
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
        });    

        //ifeed.tradespace_plot.highlight_support_panel()
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

        this.apply_filter_expression(expression);

        // if(filter_expression.indexOf('paretoFront') != -1){
        //     this.apply_filter_expression(filter_expression);

        // }else{
        //     PubSub.publish(UPDATE_FEATURE_APPLICATION, {"option":"direct-update","expression":filter_expression});
        //     //ifeed.feature_application.update_feature_application('direct-update',filter_expression);
        //     //self.apply_filter_expression(filter_expression);
        // }

        // document.getElementById('tab2').click();
        // return true;
    }

    apply_filter_expression(input_expression){
        let feature_expression = input_expression;

        // Cancel all previous selections
        PubSub.publish(HIGHLIGHT_ARCHITECTURES, null);

        // If filter expression is empty, return
        if (feature_expression === ""){
            return [];
        }else{
            // Note that indices and ids are different!
            let filtered_data = this.process_filter_expression(feature_expression, this.data, "&&");

            let id_list = this.get_data_ids(filtered_data);

            PubSub.publish(HIGHLIGHT_ARCHITECTURES, id_list);

            return id_list;
        }
    }

    /*
        Compares the preset filter to a single architecture
        @param expression: A filter expression string

        @return: A boolean indicating whether the input architecture passes the filter
    */
    check_preset_feature_single_sample(input_expression,data){
        // To be implemented 
    }
    
    process_filter_expression(expression, data, logic){
        
        let e, _e;

        e = expression;
        // Remove outer parenthesis
        e = remove_outer_parentheses(e);
        _e = e;

        var filtered = [];
        var first = true;
        var last = false;

        if(get_nested_parenthesis_depth(e) === 0){

            // Given expression does not have a nested structure
            if(e.indexOf("&&") == -1 && e.indexOf("||") == -1){

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
                var filtered_temp = this.process_filter_expression(e_temp, data, logic);
                for(let j = 0; j < filtered_temp.length; j++){
                    if(filtered.indexOf(filtered_temp[j]) === -1){
                        filtered.push(filtered_temp[j]);
                    }
                }

            }else{
                filtered = this.process_filter_expression(e_temp, filtered, logic); 
            }
        }
        return filtered;
    }

    applyParetoFilter(arg,option){
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

    get_data_ids(data){
        let ids = [];
        for(let i = 0; i < data.length; i++){
            ids.push(data[i].id);
        }
        return ids;
    }
}


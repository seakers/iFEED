
class EOSSAssigningFilter extends Filter{
    
    constructor(labelingScheme) {

        let presetFeatures = [];

        let presetFeaturesInfo = [{value:"not_selected",text:"Preset Filters"},
                                {value:"paretoFront",text:"Pareto front"},
                                {value:"present",text:"Present",input:"singleInst",hints:"Selects designs that use [INSTRUMENT]"},
                                {value:"absent",text:"Absent",input:"singleInst",hints:"Selects designs that do NOT use [INSTRUMENT]"},
                                {value:"inOrbit",text:"InOrbit",input:"orbitAndMultipleInstInput",hints:"Selects designs that assign {[INSTRUMENT]} to [ORBIT]"},
                                {value:"notInOrbit",text:"NotInOrbit",input:"orbitAndMultipleInstInput",hints:"Selects designs that do NOT assign {[INSTRUMENT]} to [ORBIT]"},
                                {value:"together",text:"Together",input:"multipleInstInput",hints:"Selects designs that assign {[INSTRUMENT]} in the same orbit"},
                                {value:"separate",text:"Separate",input:"multipleInstInput",hints:"Selects designs that never assign {[INSTRUMENT]} to the same orbit"},
                                {value:"emptyOrbit",text:"EmptyOrbit",input:"orbitInput",hints:"Selects designs whose orbit [ORBIT] is empty"},
                                {value:"numOrbits",text:"Number of orbit used",input:"numOrbits",hints:"Selects designs that assign instruments to [NUMBER] orbits"},
                                {value:"numInstruments",text:"Number of instruments",input:"numInstruments",hints:"Selects all the designs with the specified "
                                +"number of instruments. If you specify an orbit, it will count all instruments in that orbit. "
                                +"If you specify an instrument name, and only those instruments will be counted across all orbits. "
                                +"If you do not select either instruments or orbits, all instruments across all orbits will be counted."},

                               // {value:"subsetOfInstruments",text:"Num of instruments in a subset",input:"subsetOfInstruments",hints:"The specified orbit should contain at least m number and at maximum M number of instruments from the specified instrument set. m is the first entry and M is the second entry in the second field"},
                               
                                {value:"absent_except",text:"absent_except",input:null, hints:""},
                                {value:"emptyOrbit_except",text:"emptyOrbit_except",input:null, hints:""},
                                {value:"notInOrbit_except",text:"notInOrbit_except",input:null, hints:""},

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

        this.instrumentInputOptions = JSON.parse(JSON.stringify(this.label.instrument_relabeled));
        this.instrumentInputOptions.unshift('select');
        this.orbitInputOptions = JSON.parse(JSON.stringify(this.label.orbit_relabeled));
        this.orbitInputOptions.unshift('select');

        PubSub.subscribe(DATA_PROCESSED, (msg, data) => {
            this.set_application_functions();
        });

        let that = this;
        PubSub.subscribe(COPY_BASE_FEATURE_TO_FILTER, (msg, data) => {
            // Copy the feature expression to filter input
            this.copy_feature_expression_to_filter_input(data);
        });

        PubSub.subscribe(SET_FEATURE_MODIFICATION_MODE, (msg, data) => {
            // data = {
            //     root: feature_expression_string, 
            //     parent: feature_expression_string, 
            //     node: feature_expression_string, 
            //     addition: true_or_false
            // };

            let rootExpression = data.root;
            let parentExpression = data.parent;
            let nodeExpression = data.node;
            let addition = data.addition;

            // Change the text of the apply filter button
            d3.select("#tab2")
                .text(() => {
                    if(addition){
                        return "Feature Addition";
                    }else{
                        return "Feature Modification";
                    }
                });

            d3.select(".filter.title.div").select("p")
                .style("color", "#FF5C5C")
                .style("font-size", "23px")
                .text(() => {
                    if(addition){
                        return "Feature addition mode";
                    }else{
                        return "Feature modification mode";
                    }
                });

            d3.select('#apply_filter_button')
                .style('color', '#FF5C5C')
                .text(() => {
                    if(addition){
                        return "Add new condition";
                    }else{
                        return "Modify the condition";
                    }
                });
            this._apply_filter = this.apply_filter;

            // Reset the callback function for the apply filter button
            this.apply_filter = () => {
                let tempData = {root: rootExpression, 
                                parent_node: parentExpression,
                                node_to_be_replaced: nodeExpression, 
                                new_node: that.generate_filter_expression_from_input_field()};

                PubSub.publish(END_FEATURE_MODIFICATION_MODE, tempData);

                // EXPERIMENT
                PubSub.publish(EXPERIMENT_TUTORIAL_EVENT, "filter_modification");

                // EXPERIMENT
                PubSub.publish(EXPERIMENT_EVENT, "filter_applied");
            }

            if(addition){
                document.getElementById('tab2').click();
            }else{
                // Copy the feature expression to filter input
                this.copy_feature_expression_to_filter_input(nodeExpression);
            }
        });

        PubSub.subscribe(END_FEATURE_MODIFICATION_MODE, (msg, data) => {
            // Reset to the original setting
            d3.select("#tab2")
                .text("Filter Setting");

            d3.select(".filter.title.div").select("p")
                .style("color", "black")
                .style("font-size", "18px")
                .text("Filter Setting");

            d3.select('#apply_filter_button')
                .text('Apply Filter')
                .style('color','black');

            if(this._apply_filter){
                this.apply_filter = this._apply_filter;
                this._apply_filter = null;    
            }
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
            this.reset_variable_options();
        });

        this.define_filter_functions();
    }

    reset_variable_options(){
        this.instrumentInputOptions = JSON.parse(JSON.stringify(this.label.instrument_relabeled));
        this.instrumentInputOptions.unshift('select');
        this.orbitInputOptions = JSON.parse(JSON.stringify(this.label.orbit_relabeled));
        this.orbitInputOptions.unshift('select');
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
                case "absent_except":
                    return that.absentExcept;
                case "emptyOrbit_except":
                    return that.emptyOrbitExcept;
                case "notInOrbit_except":
                    return that.notInOrbitExcept;

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

    add_orbit_select() {
        let that = this;
        d3.select('.filterInputDiv.orbitInput')
            .append('select')
            .attr('class','orbitSelect')
            .on("change", function(){that.input_modification_callback();})
            .selectAll('option')
            .data(this.orbitInputOptions)
            .enter()
            .append('option')              
            .attr("value", (d) => {
                return d;
            })
            .text((d) => {
                return d;
            }); 
    };

    add_instrument_select() { 
        let that = this;
        d3.select('.filterInputDiv.instrumentInput')
            .append('select')
            .attr('class','instrumentSelect')
            .on("change", function(){that.input_modification_callback();})
            .selectAll('option')
            .data(this.instrumentInputOptions)
            .enter()
            .append('option')              
            .attr("value", (d) => {
                return d;
            })
            .text((d) => {
                return d;
            });
    };

    delete_instrument_select() { 
        let numInstrumentSelects = d3.selectAll('.instrumentSelect').nodes().length;
        d3.selectAll('.instrumentSelect').nodes().forEach((d, i) => {
            if(d.value === "select" && i < numInstrumentSelects - 1){
                d3.select(d).remove();
            } 
        });
    };

    input_modification_callback(){}

    instrument_select_callback() {
        let that = this;
        this.input_modification_callback();

        let instrumentSelects = d3.selectAll('.instrumentSelect').nodes();
        let allSelected = true;
        for(let i = 0; i < instrumentSelects.length; i++){
            if(instrumentSelects[i].value === "select"){
                allSelected = false;
            }
        }
        if(allSelected){
            this.add_instrument_select();
            d3.selectAll('.instrumentSelect').on("change", ()=>{
                that.instrument_select_callback();
            });

        }else if(!allSelected){
            this.delete_instrument_select();
        }
        this.instrument_option_set_constraint();
    }

    instrument_option_set_constraint(){
        let that = this;
        let selectedInstruments = [];
        d3.selectAll('.instrumentSelect').nodes().forEach((d) => {
            if(selectedInstruments.indexOf(d.value) === -1 && d.value !== "select"){
                if(that.label.instrument_list.indexOf(d.value) !== -1){
                    selectedInstruments.push(d.value);
                }
            }
        });

        d3.selectAll('.instrumentSelect').nodes().forEach((d) => {
            d3.select(d).selectAll('option').nodes().forEach((d2) => {
                if(selectedInstruments.indexOf(d2.value) !== -1 && d2.value !== "select"){
                    d2.disabled = true;
                }else{
                    d2.disabled = false;
                }
            });
        });
    }

    initialize_filter_input_field(option){
        let that = this;
        d3.selectAll('.filter.inputs.div').selectAll('div').remove();
        d3.selectAll('.filter.hints.div').selectAll('div').remove();

        let filter_input_div = d3.select('.filter.inputs.div');
        let instrument_select_input = null;
        let orbit_select_input = null;
        let number_input = null;

        let helpText = "";

        let disableApplyButton = ()=>{
            d3.select("#apply_filter_button").node().disabled = true;
            d3.select("#apply_filter_button").style('opacity','0.5');
        };
        let enableApplyButton = ()=>{
             d3.select("#apply_filter_button").node().disabled = false;
             d3.select("#apply_filter_button").style('opacity','1.0');
        }
        
        if (option === "not_selected"){
            return;
            
        }else if(option === "paretoFront"){
            number_input = filter_input_div.append('div')
                                            .attr('class','filterInputDiv numInput')

            number_input.text("Input Pareto Ranking (Integer number between 0-15): ");
            number_input.append("input")
                        .attr("type","number")
                        .on("change", function(){
                            that.input_modification_callback();
                            enableApplyButton();
                        });
            
        }else{
            let presetFilter = this.get_preset_option(option);
            let inputType = presetFilter.inputType;

            if(presetFilter.hints !== "" && presetFilter.hints !== null && typeof presetFilter.hints !== "undefined"){
                helpText =  "<p>Filter explanation: " + presetFilter.hints + " </p>";
            }

            switch(inputType) {
                    
                case "singleInst":
                    instrument_select_input = filter_input_div.append('div')
                                                        .attr('class','filterInputDiv instrumentInput');
                    instrument_select_input.text("Select a single instrument: ");
                    this.add_instrument_select();

                    this.input_modification_callback = () => {
                        let instr = d3.select('.filterInputDiv.instrumentInput').select('select').node().value;

                        if(instr === "select"){
                            disableApplyButton();
                        }else{
                            enableApplyButton();
                        }

                        if(instr === "select"){
                            instr = "[INSTRUMENT]";
                        }
                        let newHelpText = helpText.replace('[INSTRUMENT]', instr);
                        d3.select(".filter.hints.div").select('div').html(newHelpText);
                    }
                    break;
                    
                case "orbitAndMultipleInstInput":
                    orbit_select_input = filter_input_div.append('div')
                                                        .attr('class','filterInputDiv orbitInput');
                    
                    orbit_select_input.text("Select an orbit: ");
                    this.add_orbit_select();

                    instrument_select_input = filter_input_div.append('div')
                                                        .attr('class','filterInputDiv instrumentInput');
                    instrument_select_input.text("Select instruments: ");
                    this.add_instrument_select();

                    this.input_modification_callback = () => {
                        let orb = d3.select('.filterInputDiv.orbitInput').select('select').node().value;
                    
                        let instrumentNames = [];
                        let instrSelects = d3.select('.filterInputDiv.instrumentInput').selectAll('select').nodes();
                        for(let i = 0; i < instrSelects.length; i++){
                            let instrName = instrSelects[i].value;
                            if(instrName !== "select"){
                                instrumentNames.push(instrName);
                            }
                        }
                    
                        if(orb === "select" || instrumentNames.length === 0){
                            disableApplyButton();
                        }else{
                            enableApplyButton();
                        }

                        if(orb === "select"){
                            orb = "[ORBIT]";
                        }
                        if(instrumentNames.length === 0){
                            instrumentNames.push("[INSTRUMENT]");
                        }
                        
                        let newHelpText = helpText.replace('[ORBIT]', orb);
                        newHelpText = newHelpText.replace('[INSTRUMENT]', instrumentNames.join(", "));
                        d3.select(".filter.hints.div").select('div').html(newHelpText);
                    }

                    d3.selectAll('.instrumentSelect').on("change", function(){
                        that.instrument_select_callback();
                    });
                    break;

                case "orbitAndInstInput":
                    orbit_select_input = filter_input_div.append('div')
                                                        .attr('class','filterInputDiv orbitInput');
                    
                    orbit_select_input.text("Select an orbit: ");
                    this.add_orbit_select();

                    instrument_select_input = filter_input_div.append('div')
                                                        .attr('class','filterInputDiv instrumentInput');
                    
                    instrument_select_input.text("Select an instrument: ");
                    this.add_instrument_select();

                    this.input_modification_callback = () => {
                        let orb = d3.select('.filterInputDiv.orbitInput').select('select').node().value;
                        let instr = d3.select('.filterInputDiv.instrumentInput').select('select').node().value;
                        
                        if(orb === "select" || instr === "select"){
                            disableApplyButton();
                        }else{
                            enableApplyButton();
                        }

                        if(orb === "select"){
                            orb = "[ORBIT]";
                        }
                        if(instr === "select"){
                            instr = "[INSTRUMENT]";
                        }
                        let newHelpText = helpText.replace('[ORBIT]', orb);
                        newHelpText = newHelpText.replace('[INSTRUMENT]', instr);
                        d3.select(".filter.hints.div").select('div').html(newHelpText);
                    }
                    break;

                case "multipleOrbitAndInstInput":
                    // Not implemented
                    break;
                    
                case "orbitInput":
                    orbit_select_input = filter_input_div.append('div')
                                                        .attr('class','filterInputDiv orbitInput');
                    
                    orbit_select_input.text("Select an orbit: ");
                    this.add_orbit_select();

                    this.input_modification_callback = () => {
                        let orb = d3.select('.filterInputDiv.orbitInput').select('select').node().value;
                        if(orb === "select"){
                            disableApplyButton();
                        }else{
                            enableApplyButton();
                        }

                        if(orb === "select"){
                            orb = "[ORBIT]";
                        }
                        let newHelpText = helpText.replace('[ORBIT]', orb);
                        d3.select(".filter.hints.div").select('div').html(newHelpText);
                    }
                    break;
                    
                case "numOrbits":
                    number_input = filter_input_div.append('div')
                                                    .attr('class','filterInputDiv numInput')

                    number_input.text("Input number of orbits (minimum 1, and maximum 5)");
                    number_input.append("input")
                                .attr("type","number")
                                .on("change", function(){that.input_modification_callback();});

                    this.input_modification_callback = () => {
                        let num = d3.select('.filterInputDiv.numInput').select('input').node().value;

                        if(num && !num.trim()){
                            disableApplyButton();
                            num = "[NUMBER]";
                        }else{
                            enableApplyButton();
                        }
                        let newHelpText = helpText.replace('[NUMBER]', num);
                        d3.select(".filter.hints.div").select('div').html(newHelpText);
                    }
                    break;
                
                case "numInstruments":
                    orbit_select_input = filter_input_div.append('div')
                                                        .attr('class','filterInputDiv orbitInput');
                    
                    orbit_select_input.text("Select orbit (may not be selected): ");
                    this.add_orbit_select();

                    instrument_select_input = filter_input_div.append('div')
                                                        .attr('class','filterInputDiv instrumentInput');
                    instrument_select_input.text("Select an instrument (may not be selected)");
                    this.add_instrument_select();

                    d3.selectAll('.instrumentSelect').on("change", function(){
                        that.instrument_select_callback();
                    });

                    number_input = filter_input_div.append('div')
                                                    .attr('class','filterInputDiv numInput')
                    number_input.text("Input a number of instrument used (fill in both fields to indicate the lower bound and the upper bound): ");
                    number_input.append("input")
                                .attr("type","number")
                                .attr("id","numInputLB")
                                .on("change", function(){that.input_modification_callback();});

                    number_input.append("input")
                                .attr("type","number")
                                .attr("id","numInputUB")
                                .on("change", function(){that.input_modification_callback();});

                    d3.select('.filterInputDiv.numInput').select('#numInputLB').node().value = 1;

                    this.input_modification_callback = () => {
                        disableApplyButton();

                        let orb = d3.select('.filterInputDiv.orbitInput').select('select').node().value;
                        if(orb === "select"){
                            orb = null;
                        }

                        let instrumentText = null;
                        let instruments = [];
                        let instrSelects = d3.select('.filterInputDiv.instrumentInput').selectAll('select').nodes();
                        for(let i = 0; i < instrSelects.length; i++){
                            let instrName = instrSelects[i].value;
                            if(instrName !== "select"){
                                instruments.push(instrName);
                            }
                        }
                        if(instruments.length === 1){
                            instrumentText = instruments[0];
                        }else{
                            instrumentText = "{" + instruments.join(", ") + "}";
                        }

                        let numberInputs = d3.select('.filterInputDiv.numInput').selectAll('input').nodes();
                        let lb = null;
                        let ub = null;
                        if(numberInputs[0].value !== ""){
                            lb = +numberInputs[0].value;
                        }
                        if(numberInputs[1].value !== ""){
                            ub = +numberInputs[1].value;
                        }

                        let numText = null;
                        let isRange = false;
                        if(lb === null && ub === null){
                            numText = "[NUMBER]";
                        }else if(lb && ub === null){
                            numText = "" + lb;
                        }else if(ub && lb === null){
                            numText = "" + ub;
                        }else{
                            if(lb === ub){
                                numText = "" + ub;
                            }else{
                                isRange = true;
                                numText = "minimum " + lb + " and maximum " + ub;
                            }
                        }

                        let newHelpText =  null;
                        if(isRange){
                            if(lb > ub){
                                newHelpText = "INVALID INPUT: the lower bound must be smaller than the upper bound.";
                            }
                        }

                        if(!newHelpText){
                            if(orb === null){
                                newHelpText =  "Filter explanation: selects designs that use ";
                                if(instruments.length === 0){
                                    if(numText === "1"){
                                        newHelpText = newHelpText + " a single instrument.";
                                    }else{
                                        newHelpText = newHelpText + numText + " instruments";
                                    }
                                    enableApplyButton();
                                } else {
                                    if(instruments.length === 1){
                                        if(numText === "1"){
                                            newHelpText = newHelpText + "one of the instrument " + instrumentText;
                                        }else{
                                            newHelpText = newHelpText + numText + " of the instrument " + instrumentText;
                                        }
                                    }else{
                                        if(numText === "1"){
                                            newHelpText = newHelpText + "one instrument out of the set " + instrumentText;
                                        }else{
                                            newHelpText = newHelpText + numText + " instruments out of the set " + instrumentText;
                                        } 
                                    }
                                    enableApplyButton();
                                }
                            }else{
                                newHelpText =  "Filter explanation: selects designs that assign ";
                                if(instruments.length === 0){
                                    if(numText === "1"){
                                        newHelpText = newHelpText + "one instrument in " + orb;
                                    }else{
                                        newHelpText = newHelpText + numText + " instruments in " + orb;
                                    } 
                                    enableApplyButton();
                                } else {
                                    if(instruments.length === 1){
                                        if(numText === "1"){
                                            newHelpText = newHelpText + "one of the instrument " + instrumentText + " in " + orb;
                                        }else{
                                            newHelpText = newHelpText + numText + " of the instrument " + instrumentText + " in " + orb;
                                        }         
                                    }else{
                                        if(numText === "1"){
                                            newHelpText = newHelpText + "one instrument out of the set " + instrumentText + " in " + orb;
                                        }else{
                                            newHelpText = newHelpText + numText + " instruments out of the set " + instrumentText + " in " + orb;
                                        }     
                                    }
                                    enableApplyButton();
                                }
                            }
                        }
                        newHelpText = "<p>" + newHelpText + "</p>";
                        d3.select(".filter.hints.div").select('div').html(newHelpText);
                    }
                    break;
                                
                case "multipleInstInput":
                    instrument_select_input = filter_input_div.append('div')
                                                        .attr('class','filterInputDiv instrumentInput');
                    
                    instrument_select_input.text("Select instruments: ");
                    this.add_instrument_select();

                    this.input_modification_callback = () => {
                        let instrumentNames = [];
                        let instrSelects = d3.select('.filterInputDiv.instrumentInput').selectAll('select').nodes();
                        for(let i = 0; i < instrSelects.length; i++){
                            let instrName = instrSelects[i].value;
                            if(instrName !== "select"){
                                instrumentNames.push(instrName);
                            }
                        }

                        let newHelpText;
                        if(instrumentNames.length === 0 || instrumentNames.length === 1){
                            newHelpText = helpText + "<p>(At least two instruments must be selected!)</p>";
                            disableApplyButton();
                        }else{
                            newHelpText = helpText.replace('[INSTRUMENT]', instrumentNames.join(", "));
                            enableApplyButton();
                        }
                        d3.select(".filter.hints.div").select('div').html(newHelpText);
                    }

                    d3.selectAll('.instrumentSelect').on("change", function(){
                        that.instrument_select_callback();
                    });
                    break;
                    
                default:
                    break;
            }
        }

        if(helpText !== "" && helpText !== null && typeof helpText !== "undefined"){
            d3.select(".filter.hints.div")
                .append("div")
                .html(helpText);  
        }

        // Disable apply button by default
        disableApplyButton();
    }
    
    generate_filter_expression_from_input_field(){
        let invalid_input = false;
        let filter_expression = "";
        let filterType = d3.select(".filter.options.dropdown").node().value;
        let orbitInputs = [];
        let instrumentInputs = [];
        let numberInputs = [];

        d3.select('.filterInputDiv.orbitInput').selectAll('select').nodes().forEach((d) => {
            if(d.value !== "select"){
                orbitInputs.push(d.value);
            }
        });

        d3.select('.filterInputDiv.instrumentInput').selectAll('select').nodes().forEach((d) => {
            if(d.value !== "select"){
                instrumentInputs.push(d.value);
            }
        });

        d3.select('.filterInputDiv.numInput').selectAll('input').nodes().forEach((d) => {
            if(d.value !== ""){
                numberInputs.push(+d.value);
            }
        });

        let instrumentNameString = null;
        let orbitNameString = null;
        let numInputString = null;

        let instrumentNameRelabeled = [];
        for(let i = 0; i < instrumentInputs.length; i++){
            instrumentNameRelabeled.push(this.label.displayName2Index(instrumentInputs[i], "instrument"));
        }
        instrumentNameString = instrumentNameRelabeled.join(",");

        let orbitNameRelabeled = [];
        for(let i = 0; i < orbitInputs.length; i++){
            orbitNameRelabeled.push(this.label.displayName2Index(orbitInputs[i], "orbit"));
        }
        orbitNameString = orbitNameRelabeled.join(",");
        numInputString = numberInputs.join(",");

        // Example of an filter expression: {presetName[orbits;instruments;numbers]} 
        if(filterType === "present" || filterType === "absent" || filterType === "together" || filterType === "separate"){

            if(instrumentInputs.length === 0){
                invalid_input = true;
            }
            filter_expression = filterType + "[;" + instrumentNameString + ";]";
            
        }else if(filterType === "inOrbit" || filterType === "notInOrbit" || 
            filterType === "absentExceptInOrbit" || filterType === "notInOrbitExceptInstrument" || filterType === "notInOrbitExceptOrbit"){
            
            if(orbitInputs.length === 0 || instrumentInputs.length === 0){
                invalid_input = true;
            }
            filter_expression = filterType + "["+ orbitNameString + ";" + instrumentNameString + ";]";

        }else if(filterType === "emptyOrbit"){
                        
            if(orbitInputs.length === 0){
                invalid_input = true;
            }         
            filter_expression = filterType + "[" + orbitNameString + ";;]";
            
        }else if(filterType=="numOrbits"){
            if(numberInputs.length === 0){
                invalid_input = true;
            }     
            filter_expression = filterType + "[;;" + numInputString + "]";
            
        }else if(filterType=="subsetOfInstruments"){
                        
            if(orbitInputs.length === 0 || instrumentInputs.length === 0){
                invalid_input = true;
            }                             
            filter_expression = filterType + "["+ orbitNameString + ";" + instrumentNameString + ";" + numInputString + "]";
            
        }else if(filterType=="numInstruments"){
            let orbitEmpty = false; 
            let instrumentEmpty = false;

            // There are 4 possibilities
            if(orbitInputs.length === 0){
                orbitEmpty = true;
            }
            if(instrumentInputs.length === 0){
                instrumentEmpty = true;
            }

            if(orbitEmpty && instrumentEmpty){
                // Count all instruments across all orbits
                filter_expression = filterType + "[;;" + numInputString + "]";

            }else if(orbitEmpty){
                // Count the number of specified instrument   
                filter_expression = filterType + "[;" + instrumentNameString + ";" + numInputString + "]";
                
            }else if(instrumentEmpty){
                // Count the number of instruments in an orbit                            
                filter_expression = filterType + "[" + orbitNameString + ";;" + numInputString + "]";
            }else{
                filter_expression = filterType + "[" + orbitNameString + ";"+ instrumentNameString +";" + numInputString + "]";
            }
            
        } else if(dropdown === "paretoFront"){
            if(numberInputs.length === 0){
                invalid_input = true;
            }  
            filter_expression = "paretoFront["+ numInputString +"]";
            
        }else{// not selected
            return "";
        }
        
        filter_expression = "{" + filter_expression + "}";

        if(invalid_input){
            alert("Invalid input argument");
            throw "Invalid input argument";
        }        
        return filter_expression;
    }
    
    copy_feature_expression_to_filter_input(expression){
        let that = this;
        expression = remove_outer_parentheses(expression);
        
        // Preset filter: {presetName[orbits;instruments;numbers]}   
        expression = expression.substring(1,expression.length-1);
        
        let type = expression.split("[")[0];
        let inputType = null;
        let found = false;
        for (let i = 0; i < this.presetFeatureTypes.length; i++){
            let featureType = this.presetFeatureTypes[i];
            if (featureType.keyword === type){
                found = true;
                inputType = featureType.inputType;
                break;
            }
        }

        if(found){
            this.initialize_filter_input_field(type);
        }else{
            throw "Exception: Matching filter not found!";
        }

        let argString = expression.substring(0, expression.length - 1).split("[")[1];
        let args = argString.split(";");

        let orbitInputs = [];
        let instrumentInputs = [];
        let numberInputs = [];

        for(let i = 0; i < args.length; i++){
            let argsOfTheSameType = args[i];
            let indivArgs = argsOfTheSameType.split(",");

            for(let j = 0; j < indivArgs.length; j++){
                if(indivArgs[j] === "" || typeof indivArgs === "undefined"){
                    continue;
                } 

                if(i === 0){
                    orbitInputs.push(this.label.index2DisplayName(indivArgs[j], "orbit"));
                }else if(i === 1){
                    instrumentInputs.push(this.label.index2DisplayName(indivArgs[j], "instrument"));
                }else{
                    numberInputs.push(+indivArgs[j]);
                }
            }
        }

        if(d3.select(".filter.options.dropdown").node() === null){
            return;
        } else {
            d3.select(".filter.options.dropdown").node().value = type;
        }

        for(let i = 0; i < orbitInputs.length; i++){
            if(i !== 0){
                this.add_orbit_select();
            }
            d3.select('.filterInputDiv.orbitInput').selectAll('select').nodes()[i].value = orbitInputs[i];
        }  

        for(let i = 0; i < instrumentInputs.length; i++){
            if(i === 0){
                if(inputType === "orbitAndMultipleInstInput" || inputType === "multipleInstInput"){
                    this.add_instrument_select();
                }
            }else{
                this.add_instrument_select();
            }
            d3.select('.filterInputDiv.instrumentInput').selectAll('select').nodes()[i].value = instrumentInputs[i];
        }

        if(inputType === "orbitAndMultipleInstInput" || inputType === "multipleInstInput"){
            d3.selectAll('.instrumentSelect').on("change", function(){
                that.instrument_select_callback();
            });
            this.instrument_option_set_constraint();
        }

        if(numberInputs.length !== 0){
            d3.select('.filterInputDiv.numInput').select('input').node().value = numberInputs[0];
        }

        d3.select("#apply_filter_button").node().disabled = false;
        document.getElementById('tab2').click();
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

        let flip = false;
        if(expression.startsWith("~")){
            flip = true;
            expression = expression.substring(1,expression.length);
        }

        let numComponents = expression.split("[").length - 1;
        let names = [];
        let argSetString = [];
        for(let i = 0; i < numComponents; i++){
            let component = expression.split("]")[i];
            names.push(component.split("[")[0]);
            argSetString.push(component.split("[")[1]);
        }

        let combinedName = names.join("_");
        let inputs = data.inputs;

        if(combinedName.indexOf("paretoFront") != -1){

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
            let argSets = [];
            for(let i = 0; i < argSetString.length; i++){
                let set = [];
                let argSetSplit = argSetString[i].split(";");
                for(let j = 0; j < argSetSplit.length; j++){
                    let args;
                    if(argSetSplit[j].indexOf(",") !== -1){
                        args = argSetSplit[j].split(",");

                    }else if(argSetSplit[j].indexOf("-") !== -1){
                        args = argSetSplit[j].split("-");
                    
                    }else{
                        args = argSetSplit[j].split(",");
                    }

                    for(let k = 0; k < args.length; k++){
                        if(args[k] === ""){
                            args[k] = -1;
                        }else{
                            args[k] = +args[k];
                        }
                    }
                    set.push(args);
                }
                argSets.push(set);
            }

            for (let i = 0; i < this.presetFeatureTypes.length; i++){
                let featureType = this.presetFeatureTypes[i];
                if (featureType.keyword === combinedName){
                    if(argSets.length === 1){
                        out = featureType.apply(argSets[0], inputs);
                    }else{
                        out = featureType.apply(argSets, inputs);
                    }
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
            } else {
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
            } else {
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
            } else {
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

                } else {
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

        this.absentExcept = (args, inputs) => {
            //validInputCheck(args);
            let out = true;

            let mainArgs = args[0];
            let exceptArgs = args[1];

            let instrument = mainArgs[1][0];
            let orbitException = exceptArgs[0];
            let instrumentException = exceptArgs[1];

            let instantiatedArgs = Array.from([mainArgs, exceptArgs]);
            if(instrument >= this.ninstr){
                let instance_list = this.instance_index_map["instrument"][instrument];
                for(let i = 0; i < instance_list.length ;i++){

                    if(instrumentException.indexOf(instance_list[i]) !== -1){
                        continue;
                    }
                    
                    instantiatedArgs[0][1] = [instance_list[i]];
                    if(!this.absentExcept(instantiatedArgs, inputs)){
                        // If at least one of the tests fail, return false
                        out = false;
                        break;
                    }
                }
            } else {
                for(let i = 0; i < this.norb; i++){

                    if(orbitException.indexOf(i) !== -1){
                        continue;
                    }

                    if(inputs[this.ninstr * i + instrument] === true){
                        out = false;
                        break;
                    }
                }
            }
            return out;
        }

        this.emptyOrbitExcept = (args, inputs) => {
            //validInputCheck(args);
            let out = true;

            let mainArgs = args[0];
            let exceptArgs = args[1];

            let orbit = mainArgs[0];
            let orbitException = exceptArgs[0];
            let instrumentException = exceptArgs[1];

            let instantiatedArgs = Array.from([mainArgs, exceptArgs]);
            if(orbit >= this.norb){
                let instance_list = this.instance_index_map["orbit"][orbit];
                for(let i = 0; i < instance_list.length; i++){
                    if(orbitException.indexOf(instance_list[i]) !== -1){
                        continue;
                    }
                    
                    instantiated_args[0][0] = instance_list[i];
                    if(!this.emptyOrbit(instantiated_args, inputs)){
                        out = false;
                        break;
                    }
                }

            }else{
                for(let i = 0; i < this.ninstr; i++){
                    if(instrumentException.indexOf(i) !== -1){
                        continue;
                    }

                    if(inputs[orbit * this.ninstr + i] === true){
                        out = false;
                        break;
                    }
                }
            }
            return out;
        }

        this.notInOrbitExcept = (args, inputs) => {
            //validInputCheck(args);
            let out = true;

            let mainArgs = args[0];
            let exceptArgs = args[1];

            let orbit = mainArgs[0];
            let instruments = mainArgs[1];
            let orbitException = exceptArgs[0];
            let instrumentException = exceptArgs[1];

            let instantiatedArgs = Array.from([mainArgs, exceptArgs]);
            if(orbit >= this.norb){
                let instance_list = this.instance_index_map["orbit"][orbit];
                for(let i = 0; i < instance_list.length; i++){
                    if(orbitException.indexOf(instance_list[i]) !== -1){
                        continue;
                    }
                    
                    instantiatedArgs[0][0] = instance_list[i];
                    if(!this.notInOrbitExcept(instantiatedArgs, inputs)){
                        out = false;
                        break;
                    }
                }

            }else{
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
                            instantiatedArgs[1] = [].concat(...ground_items, ...iter);

                        }else{  // There's only one generalized class
                            if(ground_items.indexOf(iter) != -1){
                                common_element_found = true;
                            }
                            instantiatedArgs[1] = [].concat(...ground_items, iter);
                        }

                        if(common_element_found){
                            continue;
                        }

                        if(!this.notInOrbit(instantiatedArgs, inputs)){
                            out = false;
                            break;
                        }
                    }

                } else{                    
                    out = true;
                    for(let j = 0; j < instruments.length; j++){
                        let instrument = instruments[j];

                        if(instrumentExceptions.indexOf(instrument) !== -1){
                            continue;
                        }

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

            let orbit = args[0][0];
            let instruments = args[1];

            let orbitEmpty = false;
            let instrumentEmpty = false;
            if(orbit === -1){
                orbitEmpty = true;
            }
            if(instruments.length === 1){
                if(instruments[0] === -1){
                    instrumentEmpty = true;
                }
            }

            let nBounds = [];
            if(args[2].length === 2){
                nBounds.push( + args[2][0] );
                nBounds.push( + args[2][1] );
            }else{
                nBounds.push( + args[2][0]);
                nBounds.push( + args[2][0]);
            }
            let out = false;
            let count = 0;

            if(orbitEmpty){
                if(instrumentEmpty){
                    for(let o = 0; o < this.norb; o++){
                        for(let i = 0; i < this.ninstr; i++){
                            if(inputs[o * this.ninstr + i] === true){
                                count++;
                            }   
                        }
                    }
                }else{
                    for(let i = 0; i < instruments.length; i++){
                        let instr = instruments[i];

                        if(instr >= this.ninstr){ // High-level class
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
                    }
                }
            }else{

                if(orbit >= this.norb){ // High-level class
                    let orbit_instance_list = this.instance_index_map["orbit"][orbit];
                    for(let i = 0; i < orbit_instance_list.length; i++){
                        let tempOrb = orbit_instance_list[i];

                        if(instrumentEmpty){
                            for(let i = 0; i < this.ninstr; i++){
                                if(inputs[tempOrb * this.ninstr + i] === true){
                                    count++;
                                }
                            }
                        }else{
                            for(let i = 0; i < instruments.length; i++){
                                let instr = instruments[i];

                                if(instr >= this.ninstr){ // High-level class
                                    let instr_instance_list = this.instance_index_map["instrument"][instr];
                                    for(let i = 0; i < instr_instance_list.length; i++){
                                        let tempInstr = instr_instance_list[i];
                                        if(inputs[tempOrb * this.ninstr + tempInstr] === true){
                                            count++;
                                        }
                                    }
                                }else{ 
                                    if(inputs[tempOrb * this.ninstr + instr] === true){
                                        count++;
                                    }
                                }
                            }
                        }
                    }
                }else{ 
                    if(instrumentEmpty){
                        for(let i = 0; i < this.ninstr; i++){
                            if(inputs[orbit * this.ninstr + i] === true){
                                count++;
                            }
                        }
                    }else{
                        for(let i = 0; i < instruments.length; i++){
                            let instr = instruments[i];

                            if(instr >= this.ninstr){ // High-level class
                                let instr_instance_list = this.instance_index_map["instrument"][instr];
                                for(let i = 0; i < instr_instance_list.length; i++){
                                    let tempInstr = instr_instance_list[i];
                                    if(inputs[orbit * this.ninstr + tempInstr] === true){
                                        count++;
                                    }
                                }
                            }else{ 
                                if(inputs[orbit * this.ninstr + instr] === true){
                                    count++;
                                }
                            }
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





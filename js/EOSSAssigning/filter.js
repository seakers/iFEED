
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
                                {value:"numOrbits",text:"# of orbit used",input:"numOrbits",hints:"Selects designs that assign instruments to [NUMBER] orbits"},
                                
                                {value:"numInstruments",text:"# of instruments",input:"numInstruments",hints:"Selects all the designs with the specified "
                                +"number of instruments. If you specify an instrument name, only those instruments will be counted across all orbits. "},

                                {value:"numInstrumentsInOrbit",text:"# of instruments in each orbit",input:"numInstrumentsInOrbit",hints:"Selects all the designs with the specified "
                                +"number of instruments in each orbit. If you specify an orbit, only those orbits will be considered. "
                                +"If you specify an instrument name, and only those instruments will be counted in each orbit. "},
                               
                                {value:"absent_except",text:"Absent + Exception",input:"absent_except", hints:"Selects designs that use [INSTRUMENT], with an exception"},
                                {value:"emptyOrbit_except",text:"EmptyOrbit + Exception",input:"emptyOrbit_except", hints:"Selects designs whose orbit [ORBIT] is empty, with an exception"},
                                {value:"notInOrbit_except",text:"NotInOrbit + Exception",input:"notInOrbit_except", hints:"Selects designs that do NOT assign {[INSTRUMENT]} to [ORBIT], with an exception"},
                                {value:"separate_except",text:"Separate + Exception",input:"separate_except", hints:"Selects designs that never assign {[INSTRUMENT]} to the same orbit, with an exception"},

                                // {value:"absentExceptInOrbit",text:"absentExceptInOrbit",input:"orbitAndInstInput",hints:""},
                                // {value:"notInOrbitExceptInstrument",text:"notInOrbitExceptInstrument",input:"orbitAndMultipleInstInput",hints:""},
                                // {value:"notInOrbitExceptOrbit",text:"notInOrbitExceptOrbit",input:"multipleOrbitAndInstInput",hints:""},
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

        this.invalid_options = ["select", "--- Orbit Classes ---", "--- Instrument Classes ---"];

        PubSub.subscribe(DATA_PROCESSED, (msg, data) => {
            this.set_application_functions();
        });
``
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
        if(this.label.instrument_relabeled.length > this.label.instrument_list.length){
            this.instrumentInputOptions.splice(this.label.instrument_list.length, 0, "--- Instrument Classes ---");
        }
        this.instrumentInputOptions.unshift('select');

        this.orbitInputOptions = JSON.parse(JSON.stringify(this.label.orbit_relabeled));
        if(this.label.orbit_relabeled.length > this.label.orbit_list.length){
            this.orbitInputOptions.splice(this.label.orbit_list.length, 0, "--- Orbit Classes ---");
        }
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
                case "numInstrumentsInOrbit":
                    return that.numInstrumentsInOrbit;
                case "absent_except":
                    return that.absentExcept;
                case "emptyOrbit_except":
                    return that.emptyOrbitExcept;
                case "notInOrbit_except":
                    return that.notInOrbitExcept;
                case "separate_except":
                    return that.separateExcept;

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

    add_orbit_select(isExceptionInput) {
        let that = this;

        let className = null;
        if(isExceptionInput){
            className = '.filterInputDiv.orbitExceptionInput';
        }else{
            className = '.filterInputDiv.orbitInput';
        }

        d3.select(className)
            .append('select')
            .attr('class', ()=>{
                if(isExceptionInput){
                    return 'orbitExceptionSelect';
                }else{
                    return 'orbitSelect';
                }
            })
            .on("change", function(){that.input_modification_callback();})
            .selectAll('option')
            .data(()=>{
                if(isExceptionInput){
                    let out = [];
                    for(let i = 0; i < that.label.orbit_list.length + 1; i++){
                        out.push(that.orbitInputOptions[i]);
                    }
                    return out;
                }else{
                    return that.orbitInputOptions;
                }
            })
            .enter()
            .append('option')              
            .attr("value", (d) => {
                return d;
            })
            .text((d) => {
                return d;
            }); 
    };

    delete_orbit_select(isExceptionInput) { 
        let that = this;

        let orbitSelectClassName = null;
        if(isExceptionInput){
            orbitSelectClassName = '.orbitExceptionSelect';
        }else{
            orbitSelectClassName = '.orbitSelect';
        }

        let numOrbitSelects = d3.selectAll(orbitSelectClassName).nodes().length;
        d3.selectAll(orbitSelectClassName).nodes().forEach((d, i) => {
            if(that.invalid_options.indexOf(d.value) !== -1 && i < numOrbitSelects - 1){
                d3.select(d).remove();
            } 
        });
    };

    orbit_select_callback(isExceptionInput) {
        let that = this;
        this.input_modification_callback();

        let orbitSelectClassName = null;
        if(isExceptionInput){
            orbitSelectClassName = '.orbitExceptionSelect';
        }else{
            orbitSelectClassName = '.orbitSelect';
        }

        let orbitSelects = d3.selectAll(orbitSelectClassName).nodes();
        let allSelected = true;
        for(let i = 0; i < orbitSelects.length; i++){
            if(that.invalid_options.indexOf(orbitSelects[i].value) !== -1 ){
                allSelected = false;
            }
        }
        if(allSelected){
            this.add_orbit_select(isExceptionInput);
            d3.selectAll(orbitSelectClassName).on("change", ()=>{
                that.orbit_select_callback(isExceptionInput);
            });

        }else if(!allSelected){
            this.delete_orbit_select(isExceptionInput);
        }
        this.orbit_option_set_constraint(isExceptionInput);
    }

    orbit_option_set_constraint(isExceptionInput){
        let that = this;
        let selectedOrbits = [];
        
        let orbitSelectClassName = null;
        if(isExceptionInput){
            orbitSelectClassName = '.orbitExceptionSelect';
        }else{
            orbitSelectClassName = '.orbitSelect';
        }

        d3.selectAll(orbitSelectClassName).nodes().forEach((d) => {
            if(selectedOrbits.indexOf(d.value) === -1 && that.invalid_options.indexOf(d.value) === -1){
                let index = that.label.orbit_relabeled.indexOf(d.value);
                if(index !== -1 && index < that.label.orbit_list.length){
                    selectedOrbits.push(d.value);
                }
            }
        });

        d3.selectAll(orbitSelectClassName).nodes().forEach((d) => {
            d3.select(d).selectAll('option').nodes().forEach((d2) => {
                if(selectedOrbits.indexOf(d2.value) !== -1 && that.invalid_options.indexOf(d2.value) === -1){
                    d2.disabled = true;
                }else{
                    d2.disabled = false;
                }
            });
        });
    }

    add_instrument_select(isExceptionInput) { 
        let that = this;

        let className = null;
        if(isExceptionInput){
            className = '.filterInputDiv.instrumentExceptionInput';
        }else{
            className = '.filterInputDiv.instrumentInput';
        }

        d3.select(className)
            .append('select')
            .attr('class', ()=>{
                if(isExceptionInput){
                    return 'instrumentExceptionSelect';
                }else{
                    return 'instrumentSelect';
                }
            })            
            .on("change", function(){that.input_modification_callback();})
            .selectAll('option')
            .data(()=>{
                if(isExceptionInput){
                    let out = [];
                    for(let i = 0; i < that.label.instrument_list.length + 1; i++){
                        out.push(that.instrumentInputOptions[i]);
                    }
                    return out;
                }else{
                    return that.instrumentInputOptions;
                }
            })
            .enter()
            .append('option')              
            .attr("value", (d) => {
                return d;
            })
            .text((d) => {
                return d;
            });
    };

    delete_instrument_select(isExceptionInput) { 
        let that = this;

        let instrumentSelectClassName = null;
        if(isExceptionInput){
            instrumentSelectClassName = '.instrumentExceptionSelect';
        }else{
            instrumentSelectClassName = '.instrumentSelect';
        }

        let numInstrumentSelects = d3.selectAll(instrumentSelectClassName).nodes().length;
        d3.selectAll(instrumentSelectClassName).nodes().forEach((d, i) => {
            if(that.invalid_options.indexOf(d.value) !== -1 && i < numInstrumentSelects - 1){
                d3.select(d).remove();
            } 
        });
    };

    input_modification_callback(){}

    instrument_select_callback(isExceptionInput) {
        let that = this;
        this.input_modification_callback();

        let instrumentSelectClassName = null;
        if(isExceptionInput){
            instrumentSelectClassName = '.instrumentExceptionSelect';
        }else{
            instrumentSelectClassName = '.instrumentSelect';
        }

        let instrumentSelects = d3.selectAll(instrumentSelectClassName).nodes();
        let allSelected = true;
        for(let i = 0; i < instrumentSelects.length; i++){
            if(that.invalid_options.indexOf(instrumentSelects[i].value) !== -1 ){
                allSelected = false;
            }
        }
        if(allSelected){
            this.add_instrument_select(isExceptionInput);
            d3.selectAll(instrumentSelectClassName).on("change", ()=>{
                that.instrument_select_callback(isExceptionInput);
            });

        }else if(!allSelected){
            this.delete_instrument_select(isExceptionInput);
        }
        this.instrument_option_set_constraint(isExceptionInput);
    }

    instrument_option_set_constraint(isExceptionInput){
        let that = this;
        let selectedInstruments = [];
        
        let instrumentSelectClassName = null;
        if(isExceptionInput){
            instrumentSelectClassName = '.instrumentExceptionSelect';
        }else{
            instrumentSelectClassName = '.instrumentSelect';
        }

        d3.selectAll(instrumentSelectClassName).nodes().forEach((d) => {
            if(selectedInstruments.indexOf(d.value) === -1 && that.invalid_options.indexOf(d.value) === -1){
                let index = that.label.instrument_relabeled.indexOf(d.value);
                if(index !== -1 && index < that.label.instrument_list.length){
                    selectedInstruments.push(d.value);
                }
            }
        });

        d3.selectAll(instrumentSelectClassName).nodes().forEach((d) => {
            d3.select(d).selectAll('option').nodes().forEach((d2) => {
                if(selectedInstruments.indexOf(d2.value) !== -1 && that.invalid_options.indexOf(d2.value) === -1){
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

        let instrument_exception_select_input = null;
        let orbit_exception_select_input = null;

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

                        if(that.invalid_options.indexOf(instr) !== -1){
                            instr = "[INSTRUMENT]";
                            disableApplyButton();
                        }else{
                            enableApplyButton();
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
                            if(that.invalid_options.indexOf(instrName) === -1){
                                instrumentNames.push(instrName);
                            }
                        }
                    
                        if(that.invalid_options.indexOf(orb) !== -1 || instrumentNames.length === 0){
                            orb = "[ORBIT]";
                            disableApplyButton();
                        }else{
                            enableApplyButton();
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
                        
                        if(that.invalid_options.indexOf(orb) !== -1 || that.invalid_options.indexOf(instr) !== -1){
                            disableApplyButton();
                        }else{
                            enableApplyButton();
                        }

                        if(that.invalid_options.indexOf(orb) !== -1){
                            orb = "[ORBIT]";
                        }
                        if(that.invalid_options.indexOf(instr) !== -1){
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
                        if(that.invalid_options.indexOf(orb) !== -1){
                            orb = "[ORBIT]";
                            disableApplyButton();
                        }else{
                            enableApplyButton();
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
                    instrument_select_input = filter_input_div.append('div')
                                                        .attr('class','filterInputDiv instrumentInput');
                    instrument_select_input.text("Select an instrument (may not be selected)");
                    this.add_instrument_select();
                    d3.selectAll('.instrumentSelect').on("change", function(){
                        that.instrument_select_callback();
                    });

                    number_input = filter_input_div.append('div')
                                                    .attr('class','filterInputDiv numInput')
                    number_input.text("Input the number of instrument used (fill in both fields to indicate the lower bound and the upper bound): ");
                    number_input.append("input")
                                .attr("type","number")
                                .attr("id","numInputLB")
                                .style("width","80px")
                                .on("change", function(){that.input_modification_callback();});

                    number_input.append("input")
                                .attr("type","number")
                                .attr("id","numInputUB")
                                .style("width","80px")
                                .on("change", function(){that.input_modification_callback();});

                    d3.select('.filterInputDiv.numInput').select('#numInputLB').node().value = 1;

                    this.input_modification_callback = () => {
                        disableApplyButton();

                        let instrumentText = null;
                        let instruments = [];
                        let instrSelects = d3.select('.filterInputDiv.instrumentInput').selectAll('select').nodes();
                        for(let i = 0; i < instrSelects.length; i++){
                            let instrName = instrSelects[i].value;
                            if(that.invalid_options.indexOf(instrName) === -1){
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
                            newHelpText =  "Filter explanation: selects designs that use ";
                            if(instruments.length === 0){
                                if(numText === "1"){
                                    newHelpText = newHelpText + " a single instrument across all orbits.";
                                }else{
                                    newHelpText = newHelpText + numText + " instruments across all orbits.";
                                }
                                enableApplyButton();
                            } else {
                                if(instruments.length === 1){
                                    if(numText === "1"){
                                        newHelpText = newHelpText + "one of the instrument " + instrumentText + " across all orbits.";
                                    }else{
                                        newHelpText = newHelpText + numText + " of the instrument " + instrumentText + " across all orbits.";
                                    }
                                }else{
                                    if(numText === "1"){
                                        newHelpText = newHelpText + "one instrument out of the set " + instrumentText + " across all orbits.";
                                    }else{
                                        newHelpText = newHelpText + numText + " instruments out of the set " + instrumentText + " across all orbits.";
                                    } 
                                }
                                enableApplyButton();
                            }
                        }
                        newHelpText = "<p>" + newHelpText + "</p>";
                        d3.select(".filter.hints.div").select('div').html(newHelpText);
                    }
                    break;

                case "numInstrumentsInOrbit":
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
                    number_input.text("Input the number of instrument used (fill in both fields to indicate the lower bound and the upper bound): ");
                    number_input.append("input")
                                .attr("type","number")
                                .attr("id","numInputLB")
                                .style("width","80px")
                                .on("change", function(){that.input_modification_callback();});

                    number_input.append("input")
                                .attr("type","number")
                                .attr("id","numInputUB")
                                .style("width","80px")
                                .on("change", function(){that.input_modification_callback();});

                    d3.select('.filterInputDiv.numInput').select('#numInputLB').node().value = 1;

                    this.input_modification_callback = () => {
                        disableApplyButton();

                        let orb = d3.select('.filterInputDiv.orbitInput').select('select').node().value;
                        if(that.invalid_options.indexOf(orb) !== -1){
                            orb = null;
                        }

                        let instrumentText = null;
                        let instruments = [];
                        let instrSelects = d3.select('.filterInputDiv.instrumentInput').selectAll('select').nodes();
                        for(let i = 0; i < instrSelects.length; i++){
                            let instrName = instrSelects[i].value;
                            if(that.invalid_options.indexOf(instrName) === -1){
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
                                        newHelpText = newHelpText + " a single instrument in each orbit.";
                                    }else{
                                        newHelpText = newHelpText + numText + " instruments in each orbit.";
                                    }
                                    enableApplyButton();
                                } else {
                                    if(instruments.length === 1){
                                        if(numText === "1"){
                                            newHelpText = newHelpText + "one of " + instrumentText + " in each orbit.";
                                        }else{
                                            newHelpText = newHelpText + numText + " of " + instrumentText + " in each orbit.";
                                        }
                                    }else{
                                        if(numText === "1"){
                                            newHelpText = newHelpText + "one instrument out of the set " + instrumentText + " in each orbit.";
                                        }else{
                                            newHelpText = newHelpText + numText + " instruments out of the set " + instrumentText + " in each orbit.";
                                        } 
                                    }
                                    enableApplyButton();
                                }
                            }else{
                                newHelpText =  "Filter explanation: selects designs that assign ";
                                if(instruments.length === 0){
                                    if(numText === "1"){
                                        newHelpText = newHelpText + "one instrument in " + orb + ".";
                                    }else{
                                        newHelpText = newHelpText + numText + " instruments in " + orb + ".";
                                    } 
                                    enableApplyButton();
                                } else {
                                    if(instruments.length === 1){
                                        if(numText === "1"){
                                            newHelpText = newHelpText + "one of the instrument " + instrumentText + " in " + orb + ".";
                                        }else{
                                            newHelpText = newHelpText + numText + " of the instrument " + instrumentText + " in " + orb + ".";
                                        }         
                                    }else{
                                        if(numText === "1"){
                                            newHelpText = newHelpText + "one instrument out of the set " + instrumentText + " in " + orb + ".";
                                        }else{
                                            newHelpText = newHelpText + numText + " instruments out of the set " + instrumentText + " in " + orb + ".";
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
                            if(that.invalid_options.indexOf(instrName) === -1){
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

                case "absent_except":
                    // Single instrument input and two inputs for the exceptions

                    instrument_select_input = filter_input_div.append('div')
                                                        .attr('class','filterInputDiv instrumentInput');
                    instrument_select_input.text("Select a single instrument: ");
                    this.add_instrument_select();

                    // Add orbit exceptions
                    orbit_exception_select_input = filter_input_div.append('div')
                                                        .attr('class','filterInputDiv orbitExceptionInput');
                    orbit_exception_select_input.text("Select orbit exception (may not be selected):");
                    this.add_orbit_select(true);

                    // Add instrument exceptions
                    instrument_exception_select_input = filter_input_div.append('div')
                                                        .attr('class','filterInputDiv instrumentExceptionInput');
                    instrument_exception_select_input.text("Select instrument exception (may not be selected):");
                    this.add_instrument_select(true);

                    d3.selectAll('.orbitExceptionSelect').on("change", function(){
                        that.orbit_select_callback(true);
                    });
                    d3.selectAll('.instrumentExceptionSelect').on("change", function(){
                        that.instrument_select_callback(true);
                    });

                    this.input_modification_callback = () => {
                        let validInput = true;

                        let selectedInstrument = d3.select('.filterInputDiv.instrumentInput').select('select').node().value;
                        if(that.invalid_options.indexOf(selectedInstrument) !== -1){
                            selectedInstrument = "[INSTRUMENT]";
                            validInput = false;
                        }

                        let orbitExceptions = [];
                        let orbitSelects = d3.select('.filterInputDiv.orbitExceptionInput').selectAll('select').nodes();
                        for(let i = 0; i < orbitSelects.length; i++){
                            let orb = orbitSelects[i].value;
                            if(that.invalid_options.indexOf(orb) === -1){
                                orbitExceptions.push(orb);
                            }
                        }
                        let orbitExceptionString = null;
                        if(orbitExceptions.length === 1){
                            orbitExceptionString = orbitExceptions[0];
                        }else{
                            orbitExceptionString = "any of the orbits in the set {" + orbitExceptions.join(", ") + "}";
                        }

                        let instrumentExceptions = [];
                        let instrSelects = d3.select('.filterInputDiv.instrumentExceptionInput').selectAll('select').nodes();
                        for(let i = 0; i < instrSelects.length; i++){
                            let instrName = instrSelects[i].value;
                            if(that.invalid_options.indexOf(instrName) === -1){
                                instrumentExceptions.push(instrName);
                            }
                        }
                        let instrumentExceptionString = null;
                        if(instrumentExceptions.length === 1){
                            instrumentExceptionString = instrumentExceptions[0] + " is ";
                        }else{
                            instrumentExceptionString = "any of the instruments in the set {" + instrumentExceptions.join(", ") + "} are ";
                        }
                        
                        let newHelpText =  "Filter explanation: Selects designs that do NOT use " + selectedInstrument + ", with an exception when ";
                        if(orbitExceptions.length !== 0 && instrumentExceptions.length !== 0){
                            newHelpText = newHelpText + instrumentExceptionString + "assigned to " + orbitExceptionString;

                        }else if(orbitExceptions.length !== 0){
                            newHelpText = newHelpText + "it is assigned to " + orbitExceptionString;

                        }else if(instrumentExceptions.length !== 0){
                            newHelpText = newHelpText + instrumentExceptionString + " used";

                        }else{
                            // No exception
                            newHelpText =  "Filter explanation: Selects designs that do NOT use " + selectedInstrument;
                        }


                        if(validInput){
                            enableApplyButton();
                        }else{
                            disableApplyButton();
                        }
                        newHelpText = "<p>" + newHelpText + "</p>";
                        d3.select(".filter.hints.div").select('div').html(newHelpText);
                    }

                    break;

                case "emptyOrbit_except":
                    // Single orbit input and two inputs for the exceptions
                    orbit_select_input = filter_input_div.append('div')
                                                        .attr('class','filterInputDiv orbitInput');
                    
                    orbit_select_input.text("Select an orbit: ");
                    this.add_orbit_select();

                    // Add orbit exceptions
                    orbit_exception_select_input = filter_input_div.append('div')
                                                        .attr('class','filterInputDiv orbitExceptionInput');
                    orbit_exception_select_input.text("Select orbit exception (may not be selected):");
                    this.add_orbit_select(true);

                    // Add instrument exceptions
                    instrument_exception_select_input = filter_input_div.append('div')
                                                        .attr('class','filterInputDiv instrumentExceptionInput');
                    instrument_exception_select_input.text("Select instrument exception (may not be selected):");
                    this.add_instrument_select(true);

                    d3.selectAll('.orbitExceptionSelect').on("change", function(){
                        that.orbit_select_callback(true);
                    });
                    d3.selectAll('.instrumentExceptionSelect').on("change", function(){
                        that.instrument_select_callback(true);
                    });

                    this.input_modification_callback = () => {
                        let validInput = true;

                        let selectedOrbit = d3.select('.filterInputDiv.orbitInput').select('select').node().value;
                        if(that.invalid_options.indexOf(selectedOrbit) !== -1){
                            selectedOrbit = "[ORBIT]";
                            validInput = false;
                        }

                        let orbitExceptions = [];
                        let orbitSelects = d3.select('.filterInputDiv.orbitExceptionInput').selectAll('select').nodes();
                        for(let i = 0; i < orbitSelects.length; i++){
                            let orb = orbitSelects[i].value;
                            if(that.invalid_options.indexOf(orb) === -1){
                                orbitExceptions.push(orb);
                            }
                        }
                        let orbitExceptionString = null;
                        if(orbitExceptions.length === 1){
                            orbitExceptionString = orbitExceptions[0];
                        }else{
                            orbitExceptionString = "any of the orbits in the set {" + orbitExceptions.join(", ") + "}";
                        }

                        let instrumentExceptions = [];
                        let instrSelects = d3.select('.filterInputDiv.instrumentExceptionInput').selectAll('select').nodes();
                        for(let i = 0; i < instrSelects.length; i++){
                            let instrName = instrSelects[i].value;
                            if(that.invalid_options.indexOf(instrName) === -1){
                                instrumentExceptions.push(instrName);
                            }
                        }
                        let instrumentExceptionString = null;
                        if(instrumentExceptions.length === 1){
                            instrumentExceptionString = instrumentExceptions[0] + " is ";
                        }else{
                            instrumentExceptionString = "any of the instruments in the set {" + instrumentExceptions.join(", ") + "} are ";
                        }
                        
                        let newHelpText =  "Filter explanation: Selects designs that do NOT assign any instrument in " + selectedOrbit + ", with an exception when ";
                        if(orbitExceptions.length !== 0 && instrumentExceptions.length !== 0){
                            newHelpText = newHelpText + instrumentExceptionString + "assigned to " + orbitExceptionString;

                        }else if(orbitExceptions.length !== 0){
                            newHelpText = newHelpText + "the instruments are assigned to" + orbitExceptionString;

                        }else if(instrumentExceptions.length !== 0){
                            newHelpText = newHelpText + instrumentExceptionString + " assigned to it";

                        }else{
                            // No exception
                            newHelpText =  "Filter explanation: Selects designs that do NOT assign any instrument in " + selectedOrbit;
                        }

                        if(validInput){
                            enableApplyButton();
                        }else{
                            disableApplyButton();
                        }
                        newHelpText = "<p>" + newHelpText + "</p>";
                        d3.select(".filter.hints.div").select('div').html(newHelpText);
                    }
                    break;

                case "notInOrbit_except":
                    orbit_select_input = filter_input_div.append('div')
                                                        .attr('class','filterInputDiv orbitInput');
                    orbit_select_input.text("Select an orbit: ");
                    this.add_orbit_select();

                    instrument_select_input = filter_input_div.append('div')
                                                        .attr('class','filterInputDiv instrumentInput');
                    instrument_select_input.text("Select instruments: ");
                    this.add_instrument_select();

                    // Add orbit exceptions
                    orbit_exception_select_input = filter_input_div.append('div')
                                                        .attr('class','filterInputDiv orbitExceptionInput');
                    orbit_exception_select_input.text("Select orbit exception (may not be selected):");
                    this.add_orbit_select(true);

                    // Add instrument exceptions
                    instrument_exception_select_input = filter_input_div.append('div')
                                                        .attr('class','filterInputDiv instrumentExceptionInput');
                    instrument_exception_select_input.text("Select instrument exception (may not be selected):");
                    this.add_instrument_select(true);

                    d3.selectAll('.instrumentSelect').on("change", function(){
                        that.instrument_select_callback();
                    });
                    d3.selectAll('.orbitExceptionSelect').on("change", function(){
                        that.orbit_select_callback(true);
                    });
                    d3.selectAll('.instrumentExceptionSelect').on("change", function(){
                        that.instrument_select_callback(true);
                    });
                    
                    this.input_modification_callback = () => {
                        let validInput = true;

                        let selectedOrbit = d3.select('.filterInputDiv.orbitInput').select('select').node().value;
                        if(that.invalid_options.indexOf(selectedOrbit) !== -1){
                            selectedOrbit = "[ORBIT]"
                        }

                        let selectedInstruments = [];
                        let instrSelects = d3.select('.filterInputDiv.instrumentInput').selectAll('select').nodes();
                        for(let i = 0; i < instrSelects.length; i++){
                            let instrName = instrSelects[i].value;
                            if(that.invalid_options.indexOf(instrName) === -1){
                                selectedInstruments.push(instrName);
                            }
                        }
                        let selectedInstrumentString;
                        if(selectedInstruments.length === 0){
                            selectedInstrumentString = "{[INSTRUMENT]}"
                        } else if(selectedInstruments.length === 1){
                            selectedInstrumentString = selectedInstruments[0];
                        } else {
                            selectedInstrumentString = "any of the instruments in the set {" + selectedInstruments.join(", ") + "}";
                        }
                    
                        let orbitExceptions = [];
                        let orbitSelects = d3.select('.filterInputDiv.orbitExceptionInput').selectAll('select').nodes();
                        for(let i = 0; i < orbitSelects.length; i++){
                            let orb = orbitSelects[i].value;
                            if(that.invalid_options.indexOf(orb) === -1){
                                orbitExceptions.push(orb);
                            }
                        }
                        let orbitExceptionString = null;
                        if(orbitExceptions.length === 1){
                            orbitExceptionString = orbitExceptions[0];
                        }else{
                            orbitExceptionString = "any of the orbits in the set {" + orbitExceptions.join(", ") + "}";
                        }

                        let instrumentExceptions = [];
                        instrSelects = d3.select('.filterInputDiv.instrumentExceptionInput').selectAll('select').nodes();
                        for(let i = 0; i < instrSelects.length; i++){
                            let instrName = instrSelects[i].value;
                            if(that.invalid_options.indexOf(instrName) === -1){
                                instrumentExceptions.push(instrName);
                            }
                        }
                        let instrumentExceptionString = null;
                        if(instrumentExceptions.length === 1){
                            instrumentExceptionString = instrumentExceptions[0] + " is ";
                        }else{
                            instrumentExceptionString = "any of the instruments in the set {" + instrumentExceptions.join(", ") + "} are ";
                        }
                        
                        let newHelpText =  "Filter explanation: Selects designs that do NOT assign "+ selectedInstrumentString +" in " + selectedOrbit + ", with an exception when ";
                        if(orbitExceptions.length !== 0 && instrumentExceptions.length !== 0){
                            newHelpText = newHelpText + instrumentExceptionString + "assigned to " + orbitExceptionString;

                        }else if(orbitExceptions.length !== 0){
                            newHelpText = newHelpText + "the instruments are assigned to " + orbitExceptionString;

                        }else if(instrumentExceptions.length !== 0){
                            newHelpText = newHelpText + instrumentExceptionString + " assigned to it";

                        }else{
                            // No exception
                            newHelpText =  "Filter explanation: Selects designs that do NOT assign "+ selectedInstrumentString +" in " + selectedOrbit;
                        }

                        if(validInput){
                            enableApplyButton();
                        }else{
                            disableApplyButton();
                        }
                        newHelpText = "<p>" + newHelpText + "</p>";
                        d3.select(".filter.hints.div").select('div').html(newHelpText);
                    }
                    break;

                case "separate_except":
                    instrument_select_input = filter_input_div.append('div')
                                                        .attr('class','filterInputDiv instrumentInput');
                    
                    instrument_select_input.text("Select instruments: ");
                    this.add_instrument_select();

                    // Add orbit exceptions
                    orbit_exception_select_input = filter_input_div.append('div')
                                                        .attr('class','filterInputDiv orbitExceptionInput');
                    orbit_exception_select_input.text("Select orbit exception (may not be selected):");
                    this.add_orbit_select(true);

                    // Add instrument exceptions
                    instrument_exception_select_input = filter_input_div.append('div')
                                                        .attr('class','filterInputDiv instrumentExceptionInput');
                    instrument_exception_select_input.text("Select instrument exception (may not be selected):");
                    this.add_instrument_select(true);

                    d3.selectAll('.instrumentSelect').on("change", function(){
                        that.instrument_select_callback();
                    });
                    d3.selectAll('.orbitExceptionSelect').on("change", function(){
                        that.orbit_select_callback(true);
                    });
                    d3.selectAll('.instrumentExceptionSelect').on("change", function(){
                        that.instrument_select_callback(true);
                    });
                    
                    this.input_modification_callback = () => {
                        let validInput = true;

                        let selectedInstruments = [];
                        let instrSelects = d3.select('.filterInputDiv.instrumentInput').selectAll('select').nodes();
                        for(let i = 0; i < instrSelects.length; i++){
                            let instrName = instrSelects[i].value;
                            if(that.invalid_options.indexOf(instrName) === -1){
                                selectedInstruments.push(instrName);
                            }
                        }
                        let selectedInstrumentString;
                        if(selectedInstruments.length === 0){
                            selectedInstrumentString = "{[INSTRUMENT]}"
                        } else if(selectedInstruments.length === 1){
                            selectedInstrumentString = selectedInstruments[0];
                        } else {
                            selectedInstrumentString = "the instruments in the set {" + selectedInstruments.join(", ") + "}";
                        }
                    
                        let orbitExceptions = [];
                        let orbitSelects = d3.select('.filterInputDiv.orbitExceptionInput').selectAll('select').nodes();
                        for(let i = 0; i < orbitSelects.length; i++){
                            let orb = orbitSelects[i].value;
                            if(that.invalid_options.indexOf(orb) === -1){
                                orbitExceptions.push(orb);
                            }
                        }
                        let orbitExceptionString = null;
                        if(orbitExceptions.length === 1){
                            orbitExceptionString = orbitExceptions[0];
                        }else{
                            orbitExceptionString = "any of the orbits in the set {" + orbitExceptions.join(", ") + "}";
                        }

                        let instrumentExceptions = [];
                        instrSelects = d3.select('.filterInputDiv.instrumentExceptionInput').selectAll('select').nodes();
                        for(let i = 0; i < instrSelects.length; i++){
                            let instrName = instrSelects[i].value;
                            if(that.invalid_options.indexOf(instrName) === -1){
                                instrumentExceptions.push(instrName);
                            }
                        }
                        let instrumentExceptionString = null;
                        if(instrumentExceptions.length === 1){
                            instrumentExceptionString = instrumentExceptions[0] + " is ";
                        }else{
                            instrumentExceptionString = "any of the instruments in the set {" + instrumentExceptions.join(", ") + "} are ";
                        }
                        
                        let newHelpText =  "Filter explanation: Selects designs that never assign "+ selectedInstrumentString +" to the same orbit, with an exception when ";
                        if(orbitExceptions.length !== 0 && instrumentExceptions.length !== 0){
                            newHelpText = newHelpText + instrumentExceptionString + "assigned to " + orbitExceptionString;

                        }else if(orbitExceptions.length !== 0){
                            newHelpText = newHelpText + "the instruments are assigned to " + orbitExceptionString;

                        }else if(instrumentExceptions.length !== 0){
                            newHelpText = newHelpText + instrumentExceptionString + " assigned together";

                        }else{
                            // No exception
                            newHelpText =  "Filter explanation: Selects designs that never assign "+ selectedInstrumentString +" to the same orbit";
                        }

                        if(selectedInstruments.length === 0 || selectedInstruments.length === 1){
                            newHelpText = newHelpText + "<p>(At least two instruments must be selected!)</p>";
                            validInput = false;
                        }

                        if(validInput){
                            enableApplyButton();
                        }else{
                            disableApplyButton();
                        }
                        newHelpText = "<p>" + newHelpText + "</p>";
                        d3.select(".filter.hints.div").select('div').html(newHelpText);
                    }
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
        let that = this;
        let invalid_input = false;
        let filter_expression = "";
        let filterType = d3.select(".filter.options.dropdown").node().value;
        let orbitInputs = [];
        let instrumentInputs = [];
        let numberInputs = [];

        let orbitExceptions = [];
        let instrumentExceptions = [];

        d3.select('.filterInputDiv.orbitInput').selectAll('select').nodes().forEach((d) => {
            if(that.invalid_options.indexOf(d.value) === -1){
                orbitInputs.push(d.value);
            }
        });

        d3.select('.filterInputDiv.instrumentInput').selectAll('select').nodes().forEach((d) => {
            if(that.invalid_options.indexOf(d.value) === -1){
                instrumentInputs.push(d.value);
            }
        });

        d3.select('.filterInputDiv.numInput').selectAll('input').nodes().forEach((d) => {
            if(d.value !== ""){
                numberInputs.push(+d.value);
            }
        });

        d3.select('.filterInputDiv.orbitExceptionInput').selectAll('select').nodes().forEach((d) => {
            if(that.invalid_options.indexOf(d.value) === -1){
                orbitExceptions.push(d.value);
            }
        });

        d3.select('.filterInputDiv.instrumentExceptionInput').selectAll('select').nodes().forEach((d) => {
            if(that.invalid_options.indexOf(d.value) === -1){
                instrumentExceptions.push(d.value);
            }
        });

        let instrumentNameString = null;
        let orbitNameString = null;
        let numInputString = null;
        let orbitExceptionString = null;
        let instrumentExceptionString = null;

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

        let instrumentExceptionRelabeled = [];
        for(let i = 0; i < instrumentExceptions.length; i++){
            instrumentExceptionRelabeled.push(this.label.displayName2Index(instrumentExceptions[i], "instrument"));
        }
        instrumentExceptionString = instrumentExceptionRelabeled.join(",");

        let orbitExceptionRelabeled = [];
        for(let i = 0; i < orbitExceptions.length; i++){
            orbitExceptionRelabeled.push(this.label.displayName2Index(orbitExceptions[i], "orbit"));
        }
        orbitExceptionString = orbitExceptionRelabeled.join(",");

        let isOrbitExceptionEmpty = false; 
        if(orbitExceptions.length === 0){
            isOrbitExceptionEmpty = true;
        }
        let isInstrumentExceptionEmpty = false;
        if(instrumentExceptions.length === 0){
            isInstrumentExceptionEmpty = true;
        }

        // Example of an filter expression: {presetName[orbits;instruments;numbers]} 
        if(filterType === "present" || filterType === "absent" || filterType === "together" || filterType === "separate"){
            if(instrumentInputs.length === 0){
                invalid_input = true;
            }
            filter_expression = filterType + "[;" + instrumentNameString + ";]";
            
        }else if(filterType === "inOrbit" || filterType === "notInOrbit"){
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
            
        }else if(filterType === "numInstruments"){
            if(instrumentInputs.length === 0){
                // Count all instruments across all orbits
                filter_expression = filterType + "[;;" + numInputString + "]";

            }else {
                // Count the number of specified instrument   
                filter_expression = filterType + "[;" + instrumentNameString + ";" + numInputString + "]";
            }

        }else if(filterType === "numInstrumentsInOrbit"){
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

        } else if(filterType === "absent_except"){
            if(instrumentInputs.length === 0){
                invalid_input = true;
            }
            filter_expression =  "absent[;" + instrumentNameString + ";]";
            if(!isOrbitExceptionEmpty || !isInstrumentExceptionEmpty){
                filter_expression = filter_expression + "except[" + orbitExceptionString + ";" + instrumentExceptionString + ";]";
            }
                                    
        } else if(filterType === "emptyOrbit_except"){
            if(orbitInputs.length === 0){
                invalid_input = true;
            }         
            filter_expression =  "emptyOrbit[" + orbitNameString + ";;]";
            if(!isOrbitExceptionEmpty || !isInstrumentExceptionEmpty){
                filter_expression = filter_expression + "except[" + orbitExceptionString + ";" + instrumentExceptionString + ";]";
            }

        } else if(filterType === "notInOrbit_except"){
            if(orbitInputs.length === 0 || instrumentInputs.length === 0){
                invalid_input = true;
            }
            filter_expression = "notInOrbit["+ orbitNameString + ";" + instrumentNameString + ";]";
            if(!isOrbitExceptionEmpty || !isInstrumentExceptionEmpty){
                filter_expression = filter_expression + "except[" + orbitExceptionString + ";" + instrumentExceptionString + ";]";
            }

        } else if(filterType === "separate_except"){
            if(instrumentInputs.length === 0){
                invalid_input = true;
            }
            filter_expression =  "separate[;" + instrumentNameString + ";]";
            if(!isOrbitExceptionEmpty || !isInstrumentExceptionEmpty){
                filter_expression = filter_expression + "except[" + orbitExceptionString + ";" + instrumentExceptionString + ";]";
            }

        } else if(filterType === "paretoFront"){
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

        let numComponents = expression.split("[").length - 1;
        let names = [];
        let argSetString = [];
        for(let i = 0; i < numComponents; i++){
            let component = expression.split("]")[i];
            names.push(component.split("[")[0]);
            argSetString.push(component.split("[")[1]);
        }

        let combinedName = names.join("_");

        let inputType = null;
        let found = false;
        for (let i = 0; i < this.presetFeatureTypes.length; i++){
            let featureType = this.presetFeatureTypes[i];
            if (featureType.keyword === combinedName){
                found = true;
                inputType = featureType.inputType;
                break;
            }
        }

        if(found){
            this.initialize_filter_input_field(combinedName);
        }else{
            throw "Exception: Matching filter not found!";
        }

        let mainArgs = argSetString[0].split(";");
        let exceptArgs;
        if(argSetString.length === 2){
            exceptArgs = argSetString[1].split(";");
        }else{
            exceptArgs = null;
        }

        let orbitInputs = [];
        let instrumentInputs = [];
        let numberInputs = [];

        let orbitException = [];
        let instrumentException = [];

        for(let i = 0; i < mainArgs.length; i++){
            let indivArgs = mainArgs[i].split(",");

            for(let j = 0; j < indivArgs.length; j++){
                if(indivArgs[j] === "" || typeof indivArgs === "undefined"){
                    continue;
                } 
                if(i === 0){
                    orbitInputs.push(this.label.index2DisplayName(indivArgs[j], "orbit"));
                }else if(i === 1){
                    instrumentInputs.push(this.label.index2DisplayName(indivArgs[j], "instrument"));
                }else{
                    if(indivArgs[j] !== ""){
                        numberInputs.push(+indivArgs[j]);
                    }
                }
            }
        }

        if(exceptArgs){
            for(let i = 0; i < exceptArgs.length; i++){
                let indivArgs = exceptArgs[i].split(",");

                for(let j = 0; j < indivArgs.length; j++){
                    if(indivArgs[j] === "" || typeof indivArgs === "undefined"){
                        continue;
                    } 
                    if(i === 0){
                        orbitException.push(this.label.index2DisplayName(indivArgs[j], "orbit"));
                    }else if(i === 1){
                        instrumentException.push(this.label.index2DisplayName(indivArgs[j], "instrument"));
                    }else{
                        if(indivArgs[j] !== ""){
                        }
                    }
                }
            }
        }

        if(d3.select(".filter.options.dropdown").node() === null){
            return;
        } else {
            d3.select(".filter.options.dropdown").node().value = combinedName;
        }

        for(let i = 0; i < orbitInputs.length; i++){
            if(i !== 0){
                this.add_orbit_select();
            }
            d3.select('.filterInputDiv.orbitInput').selectAll('select').nodes()[i].value = orbitInputs[i];
        }  

        for(let i = 0; i < instrumentInputs.length; i++){
            if(i === 0){
                if(inputType === "orbitAndMultipleInstInput" 
                    || inputType === "multipleInstInput" 
                    || inputType === "numInstruments"
                    || inputType === "numInstrumentsInOrbit"
                    || inputType === "notInOrbit_except"
                    || inputType === "separate_except"){

                    this.add_instrument_select();
                }
            }else{
                this.add_instrument_select();
            }
            d3.select('.filterInputDiv.instrumentInput').selectAll('select').nodes()[i].value = instrumentInputs[i];
        }

        if(inputType === "orbitAndMultipleInstInput" 
            || inputType === "multipleInstInput"
            || inputType === "numInstruments" 
            || inputType === "numInstrumentsInOrbit"
            || inputType === "notInOrbit_except"
            || inputType === "separate_except"){

            d3.selectAll('.instrumentSelect').on("change", function(){
                that.instrument_select_callback();
            });
            this.instrument_option_set_constraint();
        }

        if(numberInputs.length !== 0){
            for(let i = 0; i < numberInputs.length; i++){
                d3.select('.filterInputDiv.numInput').selectAll('input').nodes()[i].value = numberInputs[i];
            }
        }

        for(let i = 0; i < orbitException.length; i++){
            this.add_orbit_select(true);
            d3.select('.filterInputDiv.orbitExceptionInput').selectAll('select').nodes()[i].value = orbitException[i];
        }  
        this.orbit_option_set_constraint(true);

        for(let i = 0; i < instrumentException.length; i++){
            this.add_instrument_select(true);
            d3.select('.filterInputDiv.instrumentExceptionInput').selectAll('select').nodes()[i].value = instrumentException[i];
        }
        this.instrument_option_set_constraint(true);

        d3.select("#apply_filter_button").node().disabled = false;
        d3.select("#apply_filter_button").style('opacity','1.0');
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
            let instantiated_args = JSON.parse(JSON.stringify(args));

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
            let instantiated_args = JSON.parse(JSON.stringify(args));

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

            let instantiated_args = JSON.parse(JSON.stringify(args));
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
            let instantiated_args = JSON.parse(JSON.stringify(args));

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

            let isOrbitExceptionEmpty = false;
            let isInstrumentExceptionEmpty = false;
            if(orbitException.length === 1 && orbitException[0] === -1){
                isOrbitExceptionEmpty = true;
            }
            if(instrumentException.length === 1 && instrumentException[0] === -1){
                isInstrumentExceptionEmpty = true;
            }

            let instantiatedArgs = JSON.parse(JSON.stringify(args));
            if(instrument >= this.ninstr){
                let instance_list = this.instance_index_map["instrument"][instrument];
                for(let i = 0; i < instance_list.length ;i++){

                    if(isOrbitExceptionEmpty && !isInstrumentExceptionEmpty){
                        if(instrumentException.indexOf(instance_list[i]) !== -1){
                            continue;
                        }
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

                    if(!isOrbitExceptionEmpty){
                        if(isInstrumentExceptionEmpty){
                            if(orbitException.indexOf(i) !== -1){
                                continue;
                            }
                        }else{
                            if(orbitException.indexOf(i) !== -1 && instrumentException.indexOf(instrument) !== -1){
                                continue;
                            }
                        }
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

            let isOrbitExceptionEmpty = false;
            let isInstrumentExceptionEmpty = false;
            if(orbitException.length === 1 && orbitException[0] === -1){
                isOrbitExceptionEmpty = true;
            }
            if(instrumentException.length === 1 && instrumentException[0] === -1){
                isInstrumentExceptionEmpty = true;
            }

            let instantiatedArgs = JSON.parse(JSON.stringify(args));
            if(orbit >= this.norb){
                let instance_list = this.instance_index_map["orbit"][orbit];
                for(let i = 0; i < instance_list.length; i++){

                    if(!isOrbitExceptionEmpty && isInstrumentExceptionEmpty){
                        if(orbitException.indexOf(instance_list[i]) !== -1){
                            continue;
                        }
                    }
                    
                    instantiatedArgs[0][0] = [instance_list[i]];
                    if(!this.emptyOrbit(instantiatedArgs, inputs)){
                        out = false;
                        break;
                    }
                }

            }else{
                for(let i = 0; i < this.ninstr; i++){

                    if(!isInstrumentExceptionEmpty){
                        if(isOrbitExceptionEmpty){
                            if(instrumentException.indexOf(i) !== -1){
                                continue;
                            }
                        }else{
                            if(orbitException.indexOf(orbit) !== -1 && instrumentException.indexOf(i) !== -1){
                                continue;
                            }
                        }
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
            let out = true;

            let mainArgs = args[0];
            let exceptArgs = args[1];

            let orbit = mainArgs[0];
            let instruments = mainArgs[1];
            let orbitException = exceptArgs[0];
            let instrumentException = exceptArgs[1];

            let isOrbitExceptionEmpty = false;
            let isInstrumentExceptionEmpty = false;
            if(orbitException.length === 1 && orbitException[0] === -1){
                isOrbitExceptionEmpty = true;
            }
            if(instrumentException.length === 1 && instrumentException[0] === -1){
                isInstrumentExceptionEmpty = true;
            }

            let instantiatedArgs = JSON.parse(JSON.stringify(args));
            if(orbit >= this.norb){
                let instance_list = this.instance_index_map["orbit"][orbit];
                for(let i = 0; i < instance_list.length; i++){
                    if(!isOrbitExceptionEmpty && isInstrumentExceptionEmpty){
                        if(orbitException.indexOf(instance_list[i]) !== -1){
                            continue;
                        }
                    }

                    instantiatedArgs[0][0] = [instance_list[i]];
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
                            instantiatedArgs[0][1] = [].concat(...ground_items, ...iter);

                        }else{  // There's only one generalized class
                            if(ground_items.indexOf(iter) != -1){
                                common_element_found = true;
                            }
                            instantiatedArgs[0][1] = [].concat(...ground_items, iter);
                        }
                        if(common_element_found){
                            continue;
                        }

                        if(!this.notInOrbitExcept(instantiatedArgs, inputs)){
                            out = false;
                            break;
                        }
                    }

                } else {                    
                    out = true;
                    for(let j = 0; j < instruments.length; j++){
                        let instrument = instruments[j];

                        if(!isInstrumentExceptionEmpty){
                            if(isOrbitExceptionEmpty){
                                if(instrumentException.indexOf(instrument) !== -1){
                                    continue;
                                }
                            }else{
                                if(orbitException.indexOf(orbit) !== -1 && instrumentException.indexOf(instrument) !== -1){
                                    continue;
                                }
                            }
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

        this.separateExcept = (args, inputs) => {
            // validInputCheck(args);
            let out = true;

            let mainArgs = args[0];
            let exceptArgs = args[1];

            let instruments = mainArgs[1];
            let orbitException = exceptArgs[0];
            let instrumentException = exceptArgs[1];

            let isOrbitExceptionEmpty = false;
            let isInstrumentExceptionEmpty = false;
            if(orbitException.length === 1 && orbitException[0] === -1){
                isOrbitExceptionEmpty = true;
            }
            if(instrumentException.length === 1 && instrumentException[0] === -1){
                isInstrumentExceptionEmpty = true;
            }

            let instantiatedArgs = JSON.parse(JSON.stringify(args));
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
                        instantiatedArgs[0][1] = [].concat(...ground_items, ...iter);

                    }else{  // There's only one generalized class
                        if(ground_items.indexOf(iter) != -1){
                            common_element_found = true;
                        }
                        instantiatedArgs[0][1] = [].concat(...ground_items, iter);
                    }

                    if(common_element_found){
                        continue;
                    }

                    if(!this.separateExcept(instantiatedArgs, inputs)){
                        out = false;
                        break;
                    }
                }

            }else{
                for(let i = 0; i < this.norb; i++){
                    let found = false;

                    if(!isOrbitExceptionEmpty && isInstrumentExceptionEmpty){
                        if(orbitException.indexOf(i) !== -1){
                            continue;
                        }
                    }
                    
                    for(let j = 0; j < instruments.length; j++){
                        let instrument = instruments[j];
                        if(inputs[i * this.ninstr + instrument] === true){

                            if(!isInstrumentExceptionEmpty){
                                if(isOrbitExceptionEmpty){
                                    if(instrumentException.indexOf(instrument) !== -1){
                                        continue;
                                    }
                                }else{
                                    if(orbitException.indexOf(i) !== -1 && instrumentException.indexOf(instrument) !== -1){
                                        continue;
                                    }
                                }
                            }

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

        this.together = (args, inputs) => {
            validInputCheck(args);

            let instruments = args[1];
            let out = false;

            let instantiated_args = JSON.parse(JSON.stringify(args));
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

            let instantiated_args = JSON.parse(JSON.stringify(args));
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
            let instantiated_args = JSON.parse(JSON.stringify(args));

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

            let instruments = args[1];

            let instrumentEmpty = false;
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

            if(instrumentEmpty){
                for(let o = 0; o < this.norb; o++){
                    for(let i = 0; i < this.ninstr; i++){
                        if(inputs[o * this.ninstr + i] === true){
                            count++;
                        }   
                    }
                }
            }else{

                let alreadyCounted = [];

                for(let i = 0; i < instruments.length; i++){
                    let instr = instruments[i];

                    if(instr >= this.ninstr){ // High-level class
                        let instance_list = this.instance_index_map["instrument"][instr];
                        for(let j = 0; j < instance_list.length; j++){
                            let tempInstr = instance_list[j];

                            if(alreadyCounted.indexOf(tempInstr) === -1){
                                alreadyCounted.push(tempInstr);
                            }else{
                                continue;
                            }

                            for(let o = 0; o < this.norb; o++){
                                if(inputs[o * this.ninstr + tempInstr] === true){
                                    count++;
                                }
                            }
                        }
                    }else{ 
                        if(alreadyCounted.indexOf(instr) === -1){
                            alreadyCounted.push(instr);
                        }else{
                            continue;
                        }

                        for(let o = 0; o < this.norb; o++){
                            if(inputs[o * this.ninstr + instr] === true){
                                count++;
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

        this.numInstrumentsInOrbit = (args, inputs) => {
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

            let out = true;
            if(orbitEmpty){
                if(instrumentEmpty){ // Count the number of instruments for each orbit
                    for(let o = 0; o < this.norb; o++){
                        let count = 0;
                        for(let i = 0; i < this.ninstr; i++){
                            if(inputs[o * this.ninstr + i] === true){
                                count++;
                            }   
                        }
                        if(count < nBounds[0] || count > nBounds[1]){
                            out = false;
                            break;
                        }
                    }
                }else{
                    for(let o = 0; o < this.norb; o++){
                        let count = 0;
                        let alreadyCounted = [];
                        for(let i = 0; i < instruments.length; i++){
                            let instr = instruments[i];

                            if(instr >= this.ninstr){ // High-level class
                                let instance_list = this.instance_index_map["instrument"][instr];
                                for(let j = 0; j < instance_list.length; j++){
                                    let tempInstr = instance_list[j];

                                    if(alreadyCounted.indexOf(tempInstr) === -1){
                                        alreadyCounted.push(tempInstr);
                                    }else{
                                        continue;
                                    }

                                    if(inputs[o * this.ninstr + tempInstr] === true){
                                        count++;
                                    }
                                }
                                
                            }else{ 

                                if(alreadyCounted.indexOf(instr) === -1){
                                    alreadyCounted.push(instr);
                                }else{
                                    continue;
                                }

                                if(inputs[o * this.ninstr + instr] === true){
                                    count++;
                                } 
                            }
                        }

                        if(count < nBounds[0] || count > nBounds[1]){
                            out = false;
                            break;
                        }
                    }
                }

            }else{
                if(orbit >= this.norb){ // High-level class
                    let orbit_instance_list = this.instance_index_map["orbit"][orbit];

                    for(let o = 0; o < orbit_instance_list.length; o++){
                        let tempOrb = orbit_instance_list[o];
                        let count = 0;

                        if(instrumentEmpty){
                            for(let i = 0; i < this.ninstr; i++){
                                if(inputs[tempOrb * this.ninstr + i] === true){
                                    count++;
                                }
                            }
                        }else{

                            let alreadyCounted = [];
                            for(let i = 0; i < instruments.length; i++){
                                let instr = instruments[i];

                                if(instr >= this.ninstr){ // High-level class
                                    let instr_instance_list = this.instance_index_map["instrument"][instr];
                                    for(let j = 0; j < instr_instance_list.length; j++){
                                        let tempInstr = instr_instance_list[j];

                                        if(alreadyCounted.indexOf(tempInstr) === -1){
                                            alreadyCounted.push(tempInstr);
                                        }else{
                                            continue;
                                        }

                                        if(inputs[tempOrb * this.ninstr + tempInstr] === true){
                                            count++;
                                        }
                                    }
                                }else{

                                    if(alreadyCounted.indexOf(instr) === -1){
                                        alreadyCounted.push(instr);
                                    }else{
                                        continue;
                                    }

                                    if(inputs[tempOrb * this.ninstr + instr] === true){
                                        count++;
                                    }
                                }
                            }
                        }

                        if(count < nBounds[0] || count > nBounds[1]){
                            out = false;
                            break;
                        }
                    }

                }else{ 
                    let count = 0;
                    if(instrumentEmpty){
                        for(let i = 0; i < this.ninstr; i++){
                            if(inputs[orbit * this.ninstr + i] === true){
                                count++;
                            }
                        }

                    }else{

                        let alreadyCounted = [];
                        for(let i = 0; i < instruments.length; i++){
                            let instr = instruments[i];

                            if(instr >= this.ninstr){ // High-level class
                                let instr_instance_list = this.instance_index_map["instrument"][instr];
                                for(let j = 0; j < instr_instance_list.length; j++){
                                    let tempInstr = instr_instance_list[j];

                                    if(alreadyCounted.indexOf(tempInstr) === -1){
                                        alreadyCounted.push(tempInstr);
                                    }else{
                                        continue;
                                    }

                                    if(inputs[orbit * this.ninstr + tempInstr] === true){
                                        count++;
                                    }
                                }
                            }else{ 
                                if(alreadyCounted.indexOf(instr) === -1){
                                    alreadyCounted.push(instr);
                                }else{
                                    continue;
                                }

                                if(inputs[orbit * this.ninstr + instr] === true){
                                    count++;
                                }
                            }
                        }
                    }
                    if(count < nBounds[0] || count > nBounds[1]){
                        out = false;
                    }
                }
            }
            return out;
        }  

    }
}





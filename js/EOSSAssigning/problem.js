TOOLTIP_MESSAGES = {
    "LEO-600-polar-NA": "LEO with polar inclination at 600km altitude",
    "SSO-600-SSO-AM": "SSO with morning LTAN at 600km altitude",
    "SSO-600-SSO-DD": "SSO with dawn-dusk LTAN at 600km altitude",
    "SSO-800-SSO-DD": "SSO with afternoon LTAN at 800km altitude",
    "SSO-800-SSO-PM": "SSO with dawn-dusk LTAN at 800km altitude",
    "ACE_ORCA": "Ocean color spectrometer",
    "ACE_POL": "Aerosol polarimeter",
    "ACE_LID": "Differential absorption lidar",
    "CLAR_ERB": "Short-wave / long-wave radiation budget",
    "ACE_CPR": "Cloud and precipitation radar",
    "DESD_SAR": "Polarimetric L-band SAR",
    "DESD_LID": "Vegetation/ice green lidar",
    "GACM_VIS": "UV/VIS limb spectrometer",
    "GACM_SWIR": "SWIR nadir spectrometer",
    "HYSP_TIR": "SWIR-TIR hyperspectral imager",
    "POSTEPS_IRS": "IR atmospheric sounder",
    "CNES_KaRIN": "Wide-swath radar altimeter",
    // Orbit classes
    "Altitude600Orbit": "Orbits at 600km altitude",
    "Altitude800Orbit": "Orbits at 800km altitude",
    "PolarOrbit": "Orbits with polar inclination",
    "Sun-synchronousOrbit": "Sun-synchronous orbits", 
    "Dawn-DuskOrbit": "Sun-synchronous orbits with dawn/dusk local time of the ascending node", 
    "AMOrbit": "Sun-synchronous orbits with AM local time of the ascending node", 
    "PMOrbit": "Sun-synchronous orbits with PM local time of the ascending node", 
    "VNIRInstr": "Instruments that operate in visible and/or near-infrared spectral region",
    // Instrument classes
    "MWInstr": "Instruments that operate in microwave spectral region",
    "UVInstr": "Instruments that operate in UV spectral region",
    "LWIRInstr": "Instruments that operate in long-wave infrared spectral region",
    "SWIRInstr": "Instruments that operate in short-wave infrared spectral region",
    "Lidar": "", 
    "Radar": "", 
    "PassiveInstr": "Passive instruments (use external light source)",
    "ActiveInstr": "Active instruments (have its own light source)", 
    "LowPowerInstr": "Instruments that require relatively low power", 
    "HighPowerInstr": "Instruments that require relatively high power",
    "OceanColorInstr": "Instruments capable of taking measurements related to ocean color", 
    "AerosolInstr": "Instruments capable of taking measurements related to aerosol (e.g. aerosol optical depth)",
    "VegetationInstr": "Instruments capable of taking measurements related to vegetation (e.g. vegetation type and structure, canopy density)", 
    "AtmPropInstr": "Instruments capable of taking measurements related to atmospheric properties (e.g. atmospheric humidity)", 
    "CloudInstr": "Instruments capable of taking measurements related to cloud (e.g. cloud cover, type)", 
    "RadiationBudgetInstr": "Instruments capable of taking measurements related to Earth radiation budget (e.g. downward short-wave irradiance)",
    "SeaSurfacePropInstr": "Instruments capable of taking measurements related to sea surface properties (e.g. sea surface currents)", 
    "LandCoverInstr": "Instruments capable of taking measurements related to land cover (e.g. land use)", 
    "TopographyInstr": "Instruments capable of taking topography measurements",
    "SoilMoistureInstr": "Instruments capable of measuring soil moisture.",
    "GlacierAndIceInstr": "Instruments capable of taking measurements related to glacier (e.g. glacier surface elevation)",
    "AtmChemInstr": "Instruments capable of taking measurements related to atmospheric chemistry (e.g. CO2, O3, NO)",
}

class EOSSAssigning extends Problem{

    constructor(){
        super();

        this.metadata = {
            problem: "ClimateCentric",
            input_num: 1,
            input_list: ["bitString"],
            input_type: "binary",
            output_list: ['Science','Cost (M)'],
            output_num: 2,
            output_obj: [1, -1], // 1 for lager-is-better, -1 for smaller-is-better
            // file_path: "EOSS_data_recalculated.csv",
            // file_path: "ClimateCentric.csv",
            // file_path: "ClimateCentric_042319.csv",
            file_path: "ClimateCentric_050819.csv",
            // file_path: "ClimateCentric_0423_0508_combined.csv",
            problem_specific_params: null
        };

        let that = this;
        $.ajax({
            url: "/api/eoss/data/set-problem",
            type: "POST",
            data: {
                problem: that.metadata.problem,
            },
            async: false,
            error: function (jqXHR, textStatus, errorThrown)
            {
                alert("Error in setting the problem name in the daphne_brain session.");
            }
        });

        // Initialize the member attributes 
        this.orbit_list = [];
        this.instrument_list = [];
        this.orbit_num = null;
        this.instrument_num = null;
        this.current_bitString = null;

        $.ajax({
            url: "/api/eoss/engineer/get-orbit-list",
            type: "POST",
            async: false,
            data: {
                problem_name: that.metadata.problem,
            },
            success: function (data, textStatus, jqXHR)
            {
                that.orbit_list = data;
            },
            error: function (jqXHR, textStatus, errorThrown)
            {
                alert("error");
            }
        });

        $.ajax({
            url: "/api/eoss/engineer/get-instrument-list",
            type: "POST",
            async: false,
            data: {
                problem_name: that.metadata.problem,
            },
            success: function (data, textStatus, jqXHR)
            {
                that.instrument_list = data;
            },
            error: function (jqXHR, textStatus, errorThrown)
            {
                alert("error");
            }
        });

        this.load_resources_tab();

        this.orbit_num = this.orbit_list.length;
        this.instrument_num = this.instrument_list.length; 

        // Set problem-specific parameters in metadata
        this.metadata.problem_specific_params = {"orbit_list": this.orbit_list, "instrument_list": this.instrument_list};

        PubSub.subscribe(LABELING_SCHEME_LOADED, (msg, data) => {
            this.label = data;
        });

        PubSub.publish(DESIGN_PROBLEM_LOADED, this);
        
        PubSub.subscribe(GENERALIZED_CONCEPTS_LOADED, (msg, data) => {
            this.metadata.problem_specific_params["orbit_extended_list"] = data["rightSet"];
            this.metadata.problem_specific_params["instrument_extended_list"] = data["leftSet"];
        });

        // EXPERIMENT
        PubSub.subscribe(EXPERIMENT_SET_MODE, (msg, data) => {
            if(data.stage === "design_synthesis"){
                if(this._display_arch_info){
                    this.display_arch_info = this._display_arch_info;
                    this._display_arch_info = null;
                }

                this.experimentStage = data.stage;
                this.display_instrument_options();

                let emptyBitString = "";
                for(let i = 0; i < 60; i++){
                    emptyBitString += "0";
                }
                this.display_arch_info(emptyBitString);

                // Display the current architecture info
                d3.select('#arch_info_display_outputs')
                    .append("p")
                    .text("Drag instruments to empty orbit slots to build and evaluate new designs")
                    .style('font-size','1.2vw');
            
            }else if(data.stage === "feature_synthesis"){
                this.experimentStage = data.stage;
                this._display_arch_info = this.display_arch_info;
                this.display_arch_info = () => {};
            }
        });  
    }
    
    booleanArray2String(boolArray) {
        let bitString = "";
        for (let i = 0; i < boolArray.length; i++) {
            let bool;
            if (boolArray[i] === true) {
                bool = 1;
            } else {
                bool = 0;
            }
            bitString = bitString + bool;
        }
        return bitString;
    }

    string2BooleanArray(bitString) {
        let boolArray = [];
        boolArray.length = 0;
        for (let i = 0; i < bitString.length; i++) {
            if (bitString.charAt(i) == "1") {
                boolArray.push(true);
            } else {
                boolArray.push(false);
            }
        }
        return boolArray;
    }

    display_arch_info(data) {
        if(data === null || typeof data === "undefined"){
            return;
        }

        let that = this;

        // Remove previously-added content
        d3.select('#view1').selectAll('g').remove();

        let support_panel = d3.select("#support_panel")
            .select("#view1")
            .append("g");

        // Display the current architecture info
        let arch_info_display_outputs = support_panel.append('div')
                .attr('id','arch_info_display_outputs');

        let bitString = null;
        if(typeof data === "string"){
            bitString = data;

        }else{
            let output_display_text = [];
            for(let i = 0; i < this.metadata.output_list.length; i++){
                let out = this.metadata.output_list[i] + ": ";
                let val = data.outputs[i];    
                if (typeof val == "number"){
                    if (val > 100){ 
                        val = val.toFixed(2);
                    }
                    else{ 
                        val = val.toFixed(4); 
                    }
                }
                output_display_text.push(out + val);
            }

            arch_info_display_outputs.append("p")
                .html((d) => {
                    return output_display_text.join("&nbsp&nbsp | &nbsp&nbsp");
                });

            bitString = this.booleanArray2String(data.inputs);
        }
        this.current_bitString = bitString;
        
        let json_arch=[];
        for(let i = 0; i < this.orbit_num; i++){
            let orbit = this.orbit_list[i];
            let assigned = [];
            for(let j = 0; j < this.instrument_num; j++){
                if(bitString[i * this.instrument_num + j] === '1'){
                    let instrument = this.instrument_list[j];
                    //Store the instrument names assigned to jth orbit
                    assigned.push(instrument);
                }
            }
            // Store the name of the orbit and the assigned instruments
            json_arch.push({"orbit":orbit, "children":assigned});
        }        
    
        let norb = json_arch.length;
        let maxNInst = 0;
        let totalNInst = 0;
        for (let i = 0; i < this.orbit_num; i++) {
            let nInst = json_arch[i].children.length;
            totalNInst = totalNInst + nInst;
            if (nInst > maxNInst) {
                maxNInst = nInst;
            }
        }

        d3.select("#support_panel").select("#view1")
                .select("g").select("#arch_info_display_table_div").remove();

        let supportPanel = d3.select("#support_panel").select("#view1").select("g");

        let table = supportPanel.append('div')
                                .attr('id','arch_info_display_table_div')
                                .append("table")
                                .attr("id", "arch_info_display_table")
                                .style("table-layout", "fixed")
                                .style("width","100%");

        let panelBoundingRect = d3.select("#support_panel").node().getBoundingClientRect();

        let columns = [];
        columns.push({columnName: "Orbit"});
        for (let i = 0; i < maxNInst; i++) {
            let tmp = i + 1;
            columns.push({columnName: "Instrument " + tmp});
        }

        // create table header
        table.append('thead')
            .append('tr')
            .selectAll('th')
            .data(columns)
            .enter()
            .append('th')
            .attr('class', 'arch_info_display_cell header')
            .text(function (d) {
                return d.columnName;
            });

        // create table body
        table.append('tbody')
            .selectAll('tr')
            .data(json_arch)
            .enter()
            .append('tr')
            .attr('class','arch_info_display_cell_container')
            .attr("name", function (d) {
                return d.orbit;
            });

        table.select('tbody').selectAll('tr')
            .selectAll('td')
            .data(function (row, i) {
                let thisRow = [];
                let orbitObj = {type: "orbit", content: json_arch[i].orbit};
                thisRow.push(orbitObj);
                for (let j = 0; j < json_arch[i].children.length; j++) {
                    let instObj = {type: "instrument", content: json_arch[i].children[j], orbit: json_arch[i].orbit};
                    thisRow.push(instObj);
                }
                return thisRow;
            })
            .enter()
            .append('td')
            .attr("name", function (d) {
                return d.content;
            })
            .style("background-color", function (d) {
                if (d.type === "orbit") {
                    return "#D0D0D0";
                }
            })
            .attr("class", function(d){
                if(d.type=="orbit"){
                    return "arch_info_display_cell orbit not_draggable";
                }else{
                    return "arch_info_display_cell instrument";
                }
            })
            .text((d) => {
               if(d.type === "orbit"){
                  return that.label.actualName2DisplayName(d.content,"orbit");
              }
              return that.label.actualName2DisplayName(d.content,"instrument");
            })
            .attr("aria-label",(d) => {
                if(d.content in TOOLTIP_MESSAGES){
                    return TOOLTIP_MESSAGES[d.content];
                }else{
                    return d.content;
                }
            })
            .attr("data-balloon-pos", (d)=> {
                if(d.type === "orbit"){
                    return "right";
                }else{
                    return "up";
                }
            });

        table.selectAll('.arch_info_display_cell')
            .style("height", () => {
                return (panelBoundingRect.height / 21.6) + "px";
            })
            .style("font-size", () => {
                if(maxNInst <= 6){
                    return "0.7vw";
                }else if(maxNInst <= 8){
                    return "0.6vw";
                }else{
                    return "0.5vw";
                }
            });

        // EXPERIMENT
        if(typeof this.experimentStage !== "undefined" && this.experimentStage !== null){
            if(this.experimentStage === "design_synthesis"){
                this.enable_modify_architecture();
            }
        }

        // EXPERIMENT
        PubSub.publish(EXPERIMENT_EVENT, {key:"design_viewed"});
    }
    
    enable_modify_architecture(){
        let that = this;
        
        $('.arch_info_display_cell_container')
        .sortable({
            items: ':not(.not_draggable)',
            start: function(){
                $('.not_draggable', this).each(function(){
                    let $this = $(this);
                    $this.data('pos', $this.index());
                });
            },  
            connectWith: '.arch_info_display_cell_container',
            cursor: 'pointer',
            update: (ui) => {
                let bitString_save = that.current_bitString;
                that.current_bitString = that.update_current_architecture();
                if(bitString_save !== that.current_bitString){
                    that.enable_evaluate_architecture();

                    // EXPERIMENT 
                    PubSub.publish(EXPERIMENT_TUTORIAL_EVENT, "architecture_modified");
                } 
            }
        })
        .droppable({
            accept: '.arch_info_display_cell.candidates',
            drop: function(event, ui) {
                let bitString_save = that.current_bitString;

                let instrNode = d3.select(ui.draggable.context);
                let orbitNode = d3.select(this);
                let instrName = instrNode.attr('name');
                let orbitName = orbitNode.attr('name');           

                let Iindex = that.instrument_list.indexOf(instrName);
                let OIndex = that.orbit_list.indexOf(orbitName);
                let index = that.instrument_num*OIndex+Iindex;
                                
                that.current_bitString = that.current_bitString.split('');
                that.current_bitString[index] = '1';
                that.current_bitString = that.current_bitString.join('');
                                
                that.display_arch_info(that.current_bitString);                
                if(bitString_save !== that.current_bitString){
                    that.enable_evaluate_architecture();
                    that.enable_modify_architecture();

                    // EXPERIMENT 
                    PubSub.publish(EXPERIMENT_TUTORIAL_EVENT, "instrument_assigned");
                }
            }
        });        
    }
    
    enable_evaluate_architecture(){
        let that = this;
        let output_display_slot = d3.select('#arch_info_display_outputs');

        if(d3.select('#arch_info_display_outputs > p').node()){
            output_display_slot.selectAll('p').remove();
        }

        if(d3.select('#evaluate_architecture_button').node()){
            output_display_slot.select('#evaluate_architecture_button').remove();
        }

        output_display_slot.append('button')
                            .attr('id','evaluate_architecture_button')
                            .text('Evaluate this design')
                            .on('click',(d) => {
                                let inputs = that.string2BooleanArray(that.current_bitString);
                                that.evaluate_architecture(inputs);
                            });
    }
    
    update_current_architecture(){
        let indices = [];
        let bitString = "";

        let that = this;
        d3.selectAll('.arch_info_display_cell_container').nodes().forEach((d) => {                            
            let orbitName = d3.select(d).attr('name');                    
            let OIndex = that.orbit_list.indexOf(orbitName);

            d3.select(d).selectAll('.arch_info_display_cell.instrument').nodes().forEach((d) => {
                let instrName = d3.select(d).attr('name');
                let Iindex = that.instrument_list.indexOf(instrName);
                let index = that.instrument_num*OIndex+Iindex;
                indices.push(index);
            });
        });

        for(let i = 0; i < this.orbit_num; i++){
            for(let j = 0; j < this.instrument_num; j++){
                if(indices.indexOf(i * this.instrument_num + j)==-1){
                    bitString = bitString + "0";
                }else{
                    bitString = bitString + "1";
                }
            }
        }
        return bitString;
    }
    
    display_instrument_options(){
        let that = this;

        // Remove feature interactive panel
        d3.select('#feature_interactive_panel').remove();

        let variableOptionsPanel = d3.select('#content')
            .append('div')   
            .attr('id','variable_options_panel');

        let panelBoundingRect = d3.select("#variable_options_panel").node().getBoundingClientRect();

        variableOptionsPanel.append('p')
                .text('Candidate Instruments');
        
        let table = variableOptionsPanel
                .append("table")
                .attr("id", "instr_options_table")
                .style("width", () => {
                    return panelBoundingRect.width * 0.85 + "px";
                });

        let candidate_instruments = [];
        for(let i = 0; i < Math.round(this.instrument_num / 2); i++){
            let temp = [];
            for(let j = 0; j < 2; j++){
                let index = j * Math.round(this.instrument_num / 2) + i;
                if(index < this.instrument_num){
                    temp.push(this.instrument_list[index]);
                }
            }
            candidate_instruments.push(temp);
        }

        // create table body
        table.append('tbody')
                .selectAll('tr')
                .data(candidate_instruments)
                .enter()
                .append('tr')
                .selectAll('td')
                .data(function(row,i){
                    return candidate_instruments[i];
                })
                .enter()
                .append('td')
                .attr("width", () => {
                    return panelBoundingRect.width * 0.38 + "px";
                })
                .attr("name", function (d) {
                    return d;
                })
                .attr('class',function(d){
                    return 'arch_info_display_cell candidates';
                })
                .text(function (d) {
                    return that.label.actualName2DisplayName(d,"instrument")
                });    
        
        $('.arch_info_display_cell.candidates').draggable({
            connectWith: '.arch_info_display_cell.orbit',
            helper: 'clone',
            cursor: 'pointer'
        });    

        variableOptionsPanel.append('div')
                .attr('id','instr_options_trash')
                .style('width', ()=> {
                    return panelBoundingRect.width * 0.85 + "px";
                })
                .append('p')
                .text('Drag here to remove');

        $('#instr_options_trash').droppable({
            accept: '.arch_info_display_cell.instrument',
            drop: function (event, ui) {
                let node = d3.select(ui.draggable.context);
                if(node.classed('candidates')){
                    return;
                }else{
                    ui.draggable.remove();
                }
            }
        });    
    }    

    generate_design_input(input){

        // "A/B/CD/E"
        let split = input.split("/");
        input = new Array(60).fill(0);

        let norb = 5;
        let ninstr = 12;

        for(let o = 0; o < split.length; o++){
            let thisOrbit = split[o];
            for(let i = 0; i < thisOrbit.length; i++){
                let instrIndex = +this.label.displayName2Index(thisOrbit[i], "instrument");
                input[o * ninstr + instrIndex] = 1;
            }
        }

        return input;
    }
    
    evaluate_architecture(inputs){
        let that = this;
        $.ajax({
            url: "/api/eoss/engineer/evaluate-architecture",
            type: "POST",
            data: {
                    inputs: JSON.stringify(inputs),
                  },
            async: false,
            success: function (data, textStatus, jqXHR)
            {
                let arch = that.preprocessing(data);    
                PubSub.publish(INSPECT_ARCH, arch);
                PubSub.publish(ADD_ARCHITECTURE, arch);

                // EXPERIMENT 
                PubSub.publish(EXPERIMENT_TUTORIAL_EVENT, "architecture_evaluated");
                
                // EXPERIMENT
                PubSub.publish(EXPERIMENT_EVENT, {key:"design_evaluated", data: arch});
            },
            error: function (jqXHR, textStatus, errorThrown)
            {
                alert("error");
            }
        });        
    } 

    load_resources_tab(){

        d3.select("#view4").select("g").remove();

        let tab = d3.select('#view4').append('g');

        let helpButtonsContainer = tab.append('div')
            .style("width","100%")
            .style("padding","1vw");

        helpButtonsContainer
            .append("div")
            .append("button")
            .attr("id", "task_goal_view_button")
            .on("click", () => {
                iziToast.info({
                    drag: true,
                    timeout: true,
                    close: true,
                    title: "Tutorial",
                    titleSize: 28,
                    message: "<p>Tutorial is in progress. During the actual tasks, the main goal of each task will be displayed here.</p>"
                            +"<p></p>",
                    messageSize: 22,
                    position: 'topCenter',
                    timeout: 45000,
                });
            })
            .text("View task goal");

        helpButtonsContainer
            .append("div")
            .append("button")
            .attr("id","variable_description_material_link")
            .on("click", () => {

                // EXPERIMENT
                PubSub.publish(EXPERIMENT_TUTORIAL_EVENT, "variable_description_material_opened");

                window.open('instruments_and_orbits_resource.html', '_blank');
            })
            .text("View instruments and orbits information");

        helpButtonsContainer
            .append("div")
            .append("button")
            .attr("id", "sample_questions_link")
            .on("click", () => {

                // EXPERIMENT
                PubSub.publish(EXPERIMENT_TUTORIAL_EVENT, "sample_questions_opened");

                window.open("https://cornell.qualtrics.com/jfe/form/SV_bvZxj19eEYDWr5j", '_blank');
            })
            .text("View sample questions");

        helpButtonsContainer
            .append("div")
            .append("button")
            .attr("id", "coverage_and_specificity_explanation_link")
            .on("click", () => {
                window.open('coverage_and_specificity.html', '_blank'); 
            })
            .text("View feature definition (coverage and specificity)");

        helpButtonsContainer.selectAll("div")
            .style("float", "left")
            .style("margin-right", "2vh")
            .style("margin-top", "2vh");

        helpButtonsContainer.selectAll("button")
            .style("width", "15vw")
            .style("height", "8vh")
            .style("padding", "1vh")
            .style("font-size", "1.8vh")
            .style("font-weight", "bold");
    }  
}

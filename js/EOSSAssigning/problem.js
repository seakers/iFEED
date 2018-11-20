
class EOSSAssigning extends Problem{

    constructor(){
        super();

        this.metadata = {
            problem: "ClimateCentric",
            input_num: 1,
            input_list: ["bitString"],
            input_type: "binary",
            output_list: ['Science','Cost'],
            output_num: 2,
            output_obj: [1, -1], // 1 for lager-is-better, -1 for smaller-is-better
            file_path: "EOSS_data_recalculated.csv"
        };

        let that = this;
        $.ajax({
            url: "/api/daphne/set-problem",
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
            url: "/api/vassar/get-orbit-list",
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
            url: "/api/vassar/get-instrument-list",
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

        this.orbit_num = this.orbit_list.length;
        this.instrument_num = this.instrument_list.length; 

        PubSub.subscribe(LABELING_SCHEME_LOADED, (msg, data) => {
            this.label = data;
        });

        PubSub.subscribe(SET_CURRENT_ARCHITECTURE, (msg, data) => {
            this.current_bitString = this.booleanArray2String(data.inputs);
        });   

        PubSub.publish(DESIGN_PROBLEM_LOADED, this);

        this.experiment = null;
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

        // Display the current architecture info
        let support_panel = null;
        let arch_info_display_outputs = null;

        if(d3.select("#view1").select("g").node()){
            support_panel = d3.select("#view1").select("g");

        }else{
            support_panel = d3.select("#view1").append("g");
        }

        if(d3.selectAll("#arch_info_display_outputs").node()){
            
            arch_info_display_outputs = d3.select("#arch_info_display_outputs");
            arch_info_display_outputs.selectAll("p").remove();

        }else{
            
            arch_info_display_outputs = support_panel.insert("div",":first-child")
                                                        .attr('id','arch_info_display_outputs');
        }

        if(data.outputs){
            for(let i = 0; i < this.metadata.output_list.length; i++){

                arch_info_display_outputs.append("p")
                    .text(d => {
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
                        return out + val;
                    })
                    .style('font-size','20px');
            }
        }
        
        let bitString = null;
        
        if(typeof data == "string"){
            bitString = data;

        }else{
            if(this.experiment){
                let boolArray = this.experiment.randomized.encodeBitStringBool(data.inputs);
                bitString = this.booleanArray2String(boolArray);
            }else{
                bitString = this.booleanArray2String(data.inputs);
            }
        }
        
        let json_arch =[];
        
        for(let i = 0; i < this.orbit_num; i++){
            
            let orbit = this.orbit_list[i];
            let assigned = [];
            
            for(let j = 0; j < this.instrument_num; j++){

                if(bitString[i * this.instrument_num + j] === '1'){
                    var instrument = this.instrument_list[j];
                    //Store the instrument names assigned to jth orbit
                    assigned.push(instrument);
                }
            }
            // Store the name of the orbit and the assigned instruments
            json_arch.push({"orbit":orbit,"children":assigned});
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

        support_panel.select("#arch_info_display_table_div").remove();

        let table = support_panel.append('div')
                                .attr('id','arch_info_display_table_div')
                                .append("table")
                                .attr("id", "arch_info_display_table");

        let columns = [];
        //columns.push({columnName: "orbit"});
        columns.push({columnName: "Slots"});
        
        for (let i = 0; i < maxNInst; i++) {
            let tmp = i + 1;
            columns.push({columnName: "Item " + tmp});
        }

        // create table header
        table.append('thead').append('tr')
            .selectAll('th')
            .data(columns).enter()
            .append('th')
            .attr("width", function (d) {
                if (d.columnName == "orbit") {
                    return "120px";
                } else {
                    return "70px";
                }
            })
            .text(function (d) {
                return d.columnName;
            })
            .style("font-size", "13px");

        let that = this;

        // create table body
        table.append('tbody')
            .selectAll('tr')
            .data(json_arch).enter()
            .append('tr')
            .attr('class','arch_info_display_cell_container')
            .attr("name", function (d) {
                return d.orbit;
            })
            .selectAll('td')
            .data(function (row, i) {
                var thisRow = [];
                var orbitObj = {type: "orbit", content: json_arch[i].orbit};
                thisRow.push(orbitObj);
                for (var j = 0; j < json_arch[i].children.length; j++) {
                    var instObj = {type: "instrument", content: json_arch[i].children[j], orbit: json_arch[i].orbit};
                    thisRow.push(instObj);
                }
                return thisRow;
            }).enter()
            .append('td')
            .attr("name", function (d) {
                return d.content;
            })
            .style("background-color", function (d) {
                if (d.type == "orbit") {
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
            .attr("width", function (d, i) {
                if (d.type == "orbit") {
                    return "120px";
                } else {
                    return "70px";
                }
            })
            .text(function (d) {
               if(d.type=="orbit"){
                  return that.label.actualName2DisplayName(d.content,"orbit");
              }
              return that.label.actualName2DisplayName(d.content,"instrument");
            });
    }
    
    enable_modify_architecture(){

        let that = this;
        
        $('.arch_info_display_cell_container').sortable({
    
            items: ':not(.not_draggable)',
            start: function(){
                $('.not_draggable', this).each(function(){
                    let $this = $(this);
                    $this.data('pos', $this.index());
                });
            },
                               
            connectWith: '.arch_info_display_cell_container',
            cursor: 'pointer',
            update: function(ui){
                let bitString_save = that.current_bitString;
                
                that.current_bitString = that.update_current_architecture();
                
                // if(bitString_save != that.current_bitString){
                    that.enable_evaluate_architecture();
                // } 
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
                that.enable_modify_architecture();
                
                // if(bitString_save != that.current_bitString){
                    that.enable_evaluate_architecture();
                // } 
            }
        });   

        this.display_instrument_options();     
    }
    
    
    enable_evaluate_architecture(){

        let that = this;

        let output_display_slot = d3.select('#arch_info_display_outputs');
                
        if(d3.select('#arch_info_display_outputs > p').node()){
            output_display_slot.selectAll('p').remove();
        }   

        if(d3.select("#evaluate_architecture_button").node()){
            output_display_slot.selectAll('button').remove();
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

        d3.selectAll('.arch_info_display_cell_container').nodes().forEach(function(d){                            

            let orbitName = d3.select(d).attr('name');                    
            let OIndex = that.orbit_list.indexOf(orbitName);

            d3.select(d).selectAll('.arch_info_display_cell.instrument').nodes().forEach(function(d){
                let instrName = d3.select(d).attr('name');

                let Iindex = that.instrument_list.indexOf(instrName);
                let index = that.instrument_num * OIndex + Iindex;
                indices.push(index);
            });
        });

        for(let i = 0; i < that.orbit_num; i++){
            for(let j = 0; j < that.instrument_num; j++){
                if(indices.indexOf(i * that.instrument_num + j) == -1){
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
        
        let support_panel = d3.select("#view1").select("g");
        
        if(d3.select('#instr_options_display').node()){
            return;
        }
        
        var instrOptions = support_panel.insert("div","#arch_info_display_outputs + *").attr('id','instr_options_display');
        
        instrOptions.append('p')
                .text('Candidate Instruments')
                .style('margin','auto')
                .style('font-weight','bold')
                .style('font-size','16px');
        
        let table = instrOptions
                .append("table")
                .attr("id", "instr_options_table");

        let candidate_instruments = [];
        for(var i=0;i<Math.round(that.instrument_num/2);i++){
            var temp = [];
            for(var j=0;j<2;j++){
                var index = j*Math.round(that.instrument_num/2) + i;
                if(index < that.instrument_num){
                    temp.push(that.instrument_list[index]);
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
                .attr("name", function (d) {
                    return d;
                })
                .attr("width", function (d, i) {
                    return "70px";
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

        instrOptions.append('div')
                .attr('id','instr_options_trash')
                .append('p')
                .style('margin','auto')
                .style('padding','15px')
                .text('Drag here to remove')
                .style('font-weight','bold');

        $('#instr_options_trash').droppable({
            accept: '.arch_info_display_cell.instrument',
            drop: function (event, ui) {
                var node = d3.select(ui.draggable.context);
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
    
    get_critique(architecture) {
                
        $.ajax({
            url: "/api/critic/criticize-architecture",
            type: "POST",
            data: {
                    inputs: JSON.stringify(architecture.inputs),
                  },
            async: false,
            success: function (data, textStatus, jqXHR)
            {
                var critique = data;
            },
            error: function (jqXHR, textStatus, errorThrown)
            {
                alert("error");
            }
        });
    }
    
    evaluate_architecture(inputs){

        let that = this;

        $.ajax({
            url: "/api/vassar/evaluate-architecture",
            type: "POST",
            data: {
                    inputs: JSON.stringify(inputs),
                  },
            async: false,
            success: function (data, textStatus, jqXHR)
            {
                let arch = that.preprocessing(data);       

                console.log(arch);         
                                                
                PubSub.publish(VIEW_ARCHITECTURE, arch);
                PubSub.publish(ADD_ARCHITECTURE, arch);
                
            },
            error: function (jqXHR, textStatus, errorThrown)
            {
                alert("error");
            }
        });        
    }
}
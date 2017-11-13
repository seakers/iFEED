function EOSS(ifeed){
    
    var self = this;

    // Initialize the member attributes 
    self.orbit_list = [];
    self.instrument_list = [];
    self.orbit_num = null;
    self.instrument_num = null;
    //self.i = 0;
    
    // Set the problem instance
    ifeed.problem=self;
    ifeed.metadata.output_list = ['Science','Cost'];
    ifeed.metadata.input_num=60;
    ifeed.metadata.output_num=2;
    ifeed.metadata.output_obj =[1,-1]; // 1 for lager-is-better, -1 for smaller-is-better
    
    // Set the path to the result file
    ifeed.metadata.result_path="EOSS_data_recalculated.csv";
        
    ifeed.label = new EOSSLabel(self);
    
    ifeed.current_bitString = null;


    
    /*
    Returns the list of orbits
    @return orbitList: a string list containing the names of orbits
    */
    self.get_orbit_list = function() {
        var orbitList;
        $.ajax({
            url: "/api/vassar/get-orbit-list/",
            type: "GET",
            async: false,
            success: function (data, textStatus, jqXHR)
            {
                orbitList = data;
            },
            error: function (jqXHR, textStatus, errorThrown)
            {
                alert("error");
            }
        });
        return orbitList;
    }
    

    /*
    Returns the list of instruments
    @return instrumentList: a string list containing the names of instruments
    */
    self.get_instrument_list = function() {
        var instrumentList;
        $.ajax({
            url: "/api/vassar/get-instrument-list/",
            type: "GET",
            async: false,
            success: function (data, textStatus, jqXHR)
            {
                instrumentList = data;
            },
            error: function (jqXHR, textStatus, errorThrown)
            {
                alert("error");
            }
        });
        return instrumentList;
    }
    
    
    self.booleanArray2String = function(boolArray) {
        var bitString = "";
        for (var i = 0; i < boolArray.length; i++) {
            var bool;
            if (boolArray[i] === true) {
                bool = 1;
            } else {
                bool = 0;
            }
            bitString = bitString + bool;
        }
        return bitString;
    }


    self.string2BooleanArray = function(bitString) {
        var boolArray = [];
        boolArray.length = 0;
        for (var i = 0; i < bitString.length; i++) {
            if (bitString.charAt(i) == "1") {
                boolArray.push(true);
            } else {
                boolArray.push(false);
            }
        }
        return boolArray;
    }
    

    
    self.preprocessing = function(data){
        
        var output = [];
        
        var input_is_array = false;
        
        if(Array.isArray(data)){
            input_is_array=true;
        }else{
            data = [data];
        }
        
        data.forEach(function (d) {  

            var outputs = d.outputs;
            var inputs = d.inputs;
            var id = +d.id;
            
            var arch = new Architecture(id,inputs,outputs);

            output.push(arch);
        });
        
        if(input_is_array) return output;
        else return output[0];
    }
    

    PubSub.subscribe(DATA_IMPORTED, (msg, data) => {
        
        self.orbit_list = self.get_orbit_list();
        self.instrument_list = self.get_instrument_list(); 
        self.orbit_num = self.orbit_list.length;
        self.instrument_num = self.instrument_list.length;   
        
        var preprocessed = self.preprocessing(data);
        
        PubSub.publish(DATA_PROCESSED,preprocessed);
        
        PubSub.publish(EXPERIMENT_START,null);
    });     

    

    self.display_arch_info = function(data) {
                
        
        var bitString = null;
        
        if(typeof data == "string"){
            
            bitString = data;

        }else{
            
            var booleanArray = ifeed.experiment.encodeBitStringBool(data.inputs);
            
            bitString = self.booleanArray2String( booleanArray );
        }
        
        var json_arch=[];
        
        for(var i=0;i<self.orbit_num;i++){
            
            var orbit = self.orbit_list[i];
            var assigned = [];
            
            for(var j=0;j<self.instrument_num;j++){

                if(bitString[i*self.instrument_num+j]=='1'){
                    var instrument = self.instrument_list[j];
                    //Store the instrument names assigned to jth orbit
                    assigned.push(instrument);
                }
            }
            // Store the name of the orbit and the assigned instruments
            json_arch.push({"orbit":orbit,"children":assigned});
        }        
    
        
        var norb = json_arch.length;
        var maxNInst = 0;
        var totalNInst = 0;

        for (var i = 0; i < self.orbit_num; i++) {
            var nInst = json_arch[i].children.length;
            totalNInst = totalNInst + nInst;
            if (nInst > maxNInst) {
                maxNInst = nInst;
            }
        }

        d3.select("#support_panel").select("#view1")
                .select("g").select("#arch_info_display_table_div").remove();

        var supportPanel = d3.select("#support_panel").select("#view1").select("g");

        var table = supportPanel.append('div')
                                .attr('id','arch_info_display_table_div')
                                .append("table")
                                .attr("id", "arch_info_display_table");

        var columns = [];
        columns.push({columnName: "orbit"});
        
        for ( i = 0; i < maxNInst; i++) {
            var tmp = i + 1;
            columns.push({columnName: "Inst " + tmp});
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
                  return ifeed.label.actualName2DisplayName(d.content,"orbit");
              }
              return ifeed.label.actualName2DisplayName(d.content,"instrument");
            });

    }
    
    
    self.enable_modify_architecture = function(){
        
        
        $('.arch_info_display_cell_container').sortable({
    
            items: ':not(.not_draggable)',
            start: function(){
                $('.not_draggable', this).each(function(){
                    var $this = $(this);
                    $this.data('pos', $this.index());
                });
            },
                               
            connectWith: '.arch_info_display_cell_container',
            cursor: 'pointer',
            update: function(ui){
                var bitString_save = self.current_bitString;
                
                self.current_bitString = self.update_current_architecture();
                
                if(bitString_save!=self.current_bitString) self.enable_evaluate_architecture();
            }
        })
        .droppable({
            accept: '.arch_info_display_cell.candidates',
            drop: function(event, ui) {
                
                var bitString_save = self.current_bitString;

                var instrNode = d3.select(ui.draggable.context);
                var orbitNode = d3.select(this);

                var instrName = instrNode.attr('name');
                var orbitName = orbitNode.attr('name');           

                var Iindex = self.instrument_list.indexOf(instrName);
                var OIndex = self.orbit_list.indexOf(orbitName);

                var index = self.instrument_num*OIndex+Iindex;
                                
                self.current_bitString = self.current_bitString.split('');
                self.current_bitString[index] = '1';
                self.current_bitString = self.current_bitString.join('');
                                
                self.display_arch_info(self.current_bitString);
                self.enable_modify_architecture();
                
                if(bitString_save!=self.current_bitString) self.enable_evaluate_architecture();
            }
        });        
        
        
    }
    

    
    
    self.enable_evaluate_architecture = function(){
        
        d3.select('#run_design_local_search').remove();
        
        if(d3.select('#arch_info_display_outputs > p')[0][0]){

            var output_display_slot = d3.select('#arch_info_display_outputs');
            output_display_slot.selectAll('p').remove();
            output_display_slot.append('button')
                                .attr('id','evaluate_architecture_button')
                                .text('Evaluate this design')
                                .on('click',function(d){
                                    var decodedbitString = ifeed.experiment.decodeBitString(self.current_bitString);
                                    var inputs = self.string2BooleanArray(decodedbitString);
                                    self.evaluate_architecture(inputs);
                                });
        }           
                
    }
    
    
    
    
    self.update_current_architecture = function(){
        
        var indices = [];
        var bitString = "";

        d3.selectAll('.arch_info_display_cell_container')[0].forEach(function(d){                            

            var orbitName = d3.select(d).attr('name');                    
            var OIndex = self.orbit_list.indexOf(orbitName);

            d3.select(d).selectAll('.arch_info_display_cell.instrument')[0].forEach(function(d){
                var instrName = d3.select(d).attr('name');

                var Iindex = self.instrument_list.indexOf(instrName);
                var index = self.instrument_num*OIndex+Iindex;
                indices.push(index);
            });
        });

        for(var i=0;i<self.orbit_num;i++){
            for(var j=0;j<self.instrument_num;j++){
                if(indices.indexOf(i*self.instrument_num+j)==-1){
                    bitString = bitString + "0";
                }else{
                    bitString = bitString + "1";
                }
            }
        }
        
        return bitString;
    }
    
    


    self.display_instrument_options = function(){
        
        var support_panel = d3.select("#support_panel")
                .select("#view1")
                .select("g");
        
        if(d3.select('#instr_options_display')[0][0]){
            return;
        }
        
        var instrOptions = support_panel.insert("div","#arch_info_display_outputs + *").attr('id','instr_options_display');
        
        instrOptions.append('p')
                .text('Candidate Instruments')
                .style('margin','auto')
                .style('font-weight','bold')
                .style('font-size','16px');
        
        var table = instrOptions
                .append("table")
                .attr("id", "instr_options_table");

        var candidate_instruments = [];
        for(var i=0;i<Math.round(self.instrument_num/2);i++){
            var temp = [];
            for(var j=0;j<2;j++){
                var index = j*Math.round(self.instrument_num/2) + i;
                if(index < self.instrument_num){
                    temp.push(self.instrument_list[index]);
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
                    return ifeed.label.actualName2DisplayName(d,"instrument")
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
    
    

    
    self.get_critique = function(architecture) {
                
        $.ajax({
            url: "/api/critic/criticize-architecture/",
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
    
    
    self.evaluate_architecture = function(inputs){
        
 
        ifeed.experiment.counter_new_design_evaluated++;
        
        
        $.ajax({
            url: "/api/vassar/evaluate-architecture/",
            type: "POST",
            data: {
                    inputs: JSON.stringify(inputs),
                  },
            async: false,
            success: function (data, textStatus, jqXHR)
            {
                var arch = self.preprocessing(data);                
                                                
                PubSub.publish(VIEW_ARCHITECTURE, arch);
                PubSub.publish(ADD_ARCHITECTURE, {'previous':ifeed.data,'added':arch});
                
                //ifeed.data.push(arch); 
            },
            error: function (jqXHR, textStatus, errorThrown)
            {
                alert("error");
            }
        });        
    }
    
    self.run_local_search = function(architecture){
        
        ifeed.experiment.counter_design_local_search++;
        
        
        var inputs = architecture.inputs;
        
        $.ajax({
            url: "/api/vassar/run-local-search/",
            type: "POST",
            data: {
                    inputs: JSON.stringify(inputs),
                  },
            async: false,
            success: function (data, textStatus, jqXHR)
            {
                var archs = self.preprocessing(data);
                archs.push(architecture);
                
                PubSub.publish(ADD_ARCHITECTURE, {'previous':ifeed.data,'added':archs});
                
                //ifeed.data = ifeed.data.concat(archs);                 
            },
            error: function (jqXHR, textStatus, errorThrown)
            {
                alert("error");
            }
        });  
    }
    
    
    PubSub.subscribe(RUN_LOCAL_SEARCH, (msg, data) => {
        self.run_local_search(data);
    });   
    
    PubSub.subscribe(SET_CURRENT_ARCHITECTURE, (msg, data) => {
        self.current_bitString = ifeed.experiment.encodeBitString(self.booleanArray2String(data.inputs))
    });      
    
}

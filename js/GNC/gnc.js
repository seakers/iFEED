
class GNC extends Problem{

    constructor(){
        super();

        let that = this;
        this.metadata = {
            problem: "gnc",
            input_num: 13,
            input_type: "discrete",
            input_list: ["NS","NC","sensors","computers","Ibin_1","Ibin_2","Ibin_3",
                            "Ibin_4","Ibin_5","Ibin_6","Ibin_7","Ibin_8","Ibin_9"],
            output_list: ['m','R','MTTF','Nlinks','N9'],
            output_num: 5,
            output_obj: [-1, 1, 1, -1, 1], // 1 for lager-is-better, -1 for smaller-is-better
            //file_path: "gnc_scenario3_column_reduced.csv"
            file_path: "gnc_scenario3_column_reduced.csv"
        };

        PubSub.subscribe(LABELING_SCHEME_LOADED, (msg, data) => {
            this.label = data;
        });

        PubSub.publish(DESIGN_PROBLEM_LOADED, this);
    }

    preprocessing_problem_specific(data){
        let col1 = 4;
        let col2 = 12;
        data.forEach((d) => {  
            for(let i = col1; i < col2 + 1; i++){
                let val = d.inputs[i];
                if(val === 48){ // UTF-8 to character
                    d.inputs[i] = 0;
                }else if(val === 49){ // UTF-8 to character
                    d.inputs[i] = 1;
                }else{
                    //d.inputs[i] = 0;
                }
            }
        });
        return data;
    }

    display_arch_info(data) {

        let support_panel = d3.select("#support_panel")
            .select("#view1")
            .append("g");

        let arch_info_display_inputs = support_panel.append('div')
            .attr("id","arch_info_display_inputs")
            .styles({
                "width": "35%",
                "float": "left",
                "margin-left":"30px",
             });

        arch_info_display_inputs.append("p")
            .text("Inputs")
            .style("font-size","20px");

        // Display the current architecture info
        let arch_info_display_outputs = support_panel.append('div')
            .attr('id','arch_info_display_outputs')
            .styles({
                "width": "50%",
                "float": "left",
             });

        arch_info_display_outputs.append("p")
            .text("Objectives")
            .style("font-size","20px");


        let output_table = arch_info_display_outputs.append("table")
                                        .attr("id", "archInfo_output_table")
                                        .style("float","left")
                                        .style("margin-left","10px")
                                        .style("margin-top","10px")
                                        .style("margin-right","10px")
                                        .style("border-collapse","collapse")
                                        .style("border","1px solid black");

        let columns = [];
        columns.push({columnName: "Objective"});
        columns.push({columnName: "Value"});
        columns.push({columnName: "Objective"});
        columns.push({columnName: "Value"});

        // create table header
        output_table.append('thead').append('tr')
                .selectAll('th')
                .data(columns).enter()
                .append('th')
                .text(function (d) {
                    return d.columnName;
                })
                .style("background-color", function (d) {
                        return "#D0D0D0";
                })
                .attr("width","120px")
                .style("border","1px solid black")
                .style("font-size", "20px");

        let rows = [];
        let outputNames = this.metadata.output_list;
        let inputNames = this.metadata.input_list;

        for(let i = 0; i < outputNames.length/2; i++){
            rows.push({name1:outputNames[2*i],val1:data.outputs[2*i],name2:outputNames[2*i+1],val2:data.outputs[2*i+1]});
        }
            
        // create table body
        output_table.append('tbody')
                .selectAll('tr')
                .data(rows).enter()
                .append('tr')
                .selectAll('td')
                .data(function(row,i){
                    var thisRow = [];
                    thisRow.push({content:row.name1});
                    thisRow.push({content:row.val1});
                    thisRow.push({content:row.name2});
                    thisRow.push({content:row.val2});
                    return thisRow;
                })
                .enter()
                .append('td')
                .text(function(d){
                    return d.content;
                })
                .attr("width","100px")
                .style("border","1px solid black")
                .styles({
                    "padding": "7px",
                    "vertical-align": "central",
                });


        let svg = arch_info_display_inputs.append('svg')
            .attr('id','archInfo_input_svg')
            .style("float","left")
            .style("margin-left","20px")
            .style("margin-top","10px")
            .style('width','400px')
            .style('height','300px');

                // rows = [];
        // for(let i = 0 ; i < inputNames.length/2 ;i++){

        //     let row = {name1:inputNames[2*i],val1:data.inputs[2*i],name2:inputNames[2*i+1],val2:data.inputs[2*i+1]};
            
        //     if(row.name1 === "sensors" || row.name1 === "computers"){
        //         let original_val = row.val1 + "";
        //         let modified_val = "";
        //         for(let j = 0; j < original_val.length; j++){
        //             modified_val += this.label.actualName2DisplayName(original_val[j], row.name1);
        //         }
        //         row.val1 = modified_val;
        //     }
        //     if(row.name2 === "sensors" || row.name2 === "computers"){
        //         let original_val = row.val2 + "";
        //         let modified_val = "";
        //         for(let j = 0; j < original_val.length; j++){
        //             modified_val += this.label.actualName2DisplayName(original_val[j], row.name2);
        //         }
        //         row.val2 = modified_val;
        //     }

        //     rows.push(row);
        // }


        let sensors_string = "" + data.inputs[2];
        let computers_string = "" + data.inputs[3];
        let sensorsList = [];
        let computersList = [];

        for(let i = 0; i < sensors_string.length; i++){
            switch(sensors_string[i]){
                case "0":
                    break;
                case "1":
                    sensorsList.push("A");
                    break;
                case "2":
                    sensorsList.push("B");
                    break;
                case "3":
                    sensorsList.push("C");
                    break;
                default:
                    break;
            }
        }

        for(let i = 0; i < computers_string.length; i++){
            switch(computers_string[i]){
                case "0":
                    break;
                case "1":
                    computersList.push("A");
                    break;
                case "2":
                    computersList.push("B");
                    break;
                case "3":
                    computersList.push("C");
                    break;
                default:
                    break;
            }
        }

        let linkList = data.inputs.slice(4,13);
        let NS = data.inputs[0];
        let NC = data.inputs[1];

        // console.log(sensors_string);
        // console.log(computers_string);
        // console.log(linkList);
        //let sensorsList = ['a','b','c'];
        //let computersList = ['a','b','c'];
        //let linkList = [1,1,1,1,1,1,1,1,1];

        let links = [];
        let sensors = [];
        let computers = [];

        let vertical_margin = 80;
        let horizontal_margin = 200;

        for(let i=0;i<sensorsList.length;i++){
            sensors.push({'i':i, 'name':sensorsList[i], 'x':0, 'y':vertical_margin * i, 'color':"#FFA08C", 'font-color':"black"});
        }
        for(let i=0;i<computersList.length;i++){
            computers.push({'i':i, 'name':computersList[i], 'x':horizontal_margin, 'y':vertical_margin * i, 'color':"#8CA1FF", 'font-color':"black"});
        }

        let ind=0;
        for(let i=0;i<NS;i++){
            for(let j=0;j<NC;j++){
                let link = linkList[ind];
                if(link === 1){
                    links.push({'s':sensors[i], 'c':computers[j]});
                }
                ind++;
            }
        }

        // for(let i=0;i<linkList.length;i++){
        //     let s = null;
        //     let c = null;
        //     if(sensors.length > computers.length){
        //         c = Math.floor(i / 3);
        //         s = i % 3;
        //     }else if(computers.length > sensors.length){
        //         s = Math.floor(i / 3);
        //         c = i % 3;
        //     }else{
        //         s = Math.floor(i / 3);
        //         c = i % 3;
        //     }
        //     if(linkList[i] === 1){
        //         links.push({'s':sensors[s], 'c':computers[c]});
        //     }
        // }

        let instruments = sensors.concat(computers);

        svg.selectAll('rect')
            .data(instruments)
            .enter()
            .append('rect')
            .attr('x',(d) => { return d.x; })
            .attr('y',(d) => { return d.y; })
            .style('width','65px')
            .style('height','65px')
            .style("fill",(d) => { return d.color; });

        svg.selectAll('text')
            .data(instruments)
            .enter()
            .append('text')
            .attr('x',(d) => { return d.x + 25; })
            .attr('y',(d) => { return d.y + 43; })
            .style("fill","white")
            .style('font-size','30px')
            .text((d) => { return d.name; });
        
        svg.selectAll('line')
            .data(links)
            .enter()
            .append('line')
            .attr('x1',(d) => { return d.s.x + 65; })
            .attr('x2',(d) => { return d.c.x + 0; })
            .attr('y1',(d) => { return d.s.y + 43; })
            .attr('y2',(d) => { return d.c.y + 43; })
            .style("stroke","black")
            .style('stroke-width','7');

        // var input_table = arch_info_display_inputs.append("table")
        //         .attr("id", "archInfo_input_table")
        //         .style("float","left")
        //         .style("border-collapse","collapse")
        //         .style("border","1px solid black")
        //         .style("margin-left","20px")
        //         .style("margin-top","10px")
        //         .style("margin-right","10px");

        // columns = [];
        // columns.push({columnName: "Input"});
        // columns.push({columnName: "Value"});
        // columns.push({columnName: "Input"});
        // columns.push({columnName: "Value"});

        // // create table header
        // input_table.append('thead').append('tr')
        //         .selectAll('th')
        //         .data(columns).enter()
        //         .append('th')
        //         .text(function (d) {
        //             return d.columnName;
        //         })
        //         .attr("width","80px")
        //         .style("background-color", function (d) {
        //                 return "#D0D0D0";
        //         })
        //         .style("border","1px solid black")
        //         .style("font-size", "20px");

        // rows = [];
        // for(let i = 0 ; i < inputNames.length/2 ;i++){

        //     let row = {name1:inputNames[2*i],val1:data.inputs[2*i],name2:inputNames[2*i+1],val2:data.inputs[2*i+1]};
            
        //     if(row.name1 === "sensors" || row.name1 === "computers"){
        //         let original_val = row.val1 + "";
        //         let modified_val = "";
        //         for(let j = 0; j < original_val.length; j++){
        //             modified_val += this.label.actualName2DisplayName(original_val[j], row.name1);
        //         }
        //         row.val1 = modified_val;
        //     }
        //     if(row.name2 === "sensors" || row.name2 === "computers"){
        //         let original_val = row.val2 + "";
        //         let modified_val = "";
        //         for(let j = 0; j < original_val.length; j++){
        //             modified_val += this.label.actualName2DisplayName(original_val[j], row.name2);
        //         }
        //         row.val2 = modified_val;
        //     }

        //     rows.push(row);
        // }
        
        // // create table body
        // input_table.append('tbody')
        //         .selectAll('tr')
        //         .data(rows)
        //         .enter()
        //         .append('tr')
        //         .selectAll('td')
        //         .data(function(row,i){
        //             var thisRow = [];
        //             thisRow.push({content:row.name1});
        //             thisRow.push({content:row.val1});
        //             thisRow.push({content:row.name2});
        //             thisRow.push({content:row.val2});
        //             return thisRow;
        //         })
        //         .enter()
        //         .append('td')
        //         .text(function(d){
        //             return d.content;
        //         })
        //         .style("border","1px solid black")
        //         .style("font-size", "18px")
        //         .styles({
        //             "padding": "7px",
        //             "vertical-align": "central",
        //         });
    }
      
}

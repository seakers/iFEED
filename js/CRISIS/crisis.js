
class Crisis extends Problem{

    constructor(){
        super();

        let that = this;

        this.metadata = {
            problem: "crisis",
            input_num: 4,
            input_type: "continuous",
            input_list: ["Altitude", "Nsats", "Nplanes","Temp"],
            output_list: ["GResOff", "Cost","RevisitTimeMax","RevisitTimeMean","ResponseTimeMax","ResponseTimeMean",
                            "NImagesPerDay","CostPerImage"],
            output_num: 8,
            output_obj: [-1, -1, -1, -1, -1, 1, -1], // 1 for lager-is-better, -1 for smaller-is-better
            file_path: "crisis_data.csv"
        };

        PubSub.subscribe(LABELING_SCHEME_LOADED, (msg, data) => {
            this.label = data;
        });

        PubSub.publish(DESIGN_PROBLEM_LOADED, this);
    }

    preprocessing_problem_specific(data){
        return data;
    }

    display_arch_info(data) {

        let support_panel = d3.select("#support_panel")
            .select("#view1")
            .append("g");

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

        let arch_info_display_inputs = support_panel.append('div')
            .attr("id","arch_info_display_inputs")
            .styles({
                "width": "50%",
                "float": "left",
             });

        arch_info_display_inputs.append("p")
            .text("Inputs")
            .style("font-size","20px");

        var output_table = arch_info_display_outputs.append("table")
                                        .attr("id", "archInfo_output_table")
                                        .style("float","left")
                                        .style("margin-left","20px")
                                        .style("margin-top","10px")
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
            rows.push({
                name1:outputNames[2*i],val1:data.outputs[2*i],
                name2:outputNames[2*i+1],val2:data.outputs[2*i+1]});
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
                .attr("width","120px")
                .style("border","1px solid black")
                .styles({
                    "padding": "7px",
                    "vertical-align": "central",
                });


        var input_table = arch_info_display_inputs.append("table")
                .attr("id", "archInfo_input_table")
                .style("float","left")
                .style("border-collapse","collapse")
                .style("border","1px solid black")
                .style("margin-left","20px")
                .style("margin-top","10px")
                .style("margin-right","10px");

        columns = [];
        columns.push({columnName: "Input"});
        columns.push({columnName: "Value"});
        columns.push({columnName: "Input"});
        columns.push({columnName: "Value"});
        columns.push({columnName: "Input"});
        columns.push({columnName: "Value"});

        // create table header
        input_table.append('thead').append('tr')
                .selectAll('th')
                .data(columns).enter()
                .append('th')
                .text(function (d) {
                    return d.columnName;
                })
                .attr("width","80px")
                .style("background-color", function (d) {
                        return "#D0D0D0";
                })
                .style("border","1px solid black")
                .style("font-size", "20px");

        rows = [];

        for(let i = 0 ; i < inputNames.length/3 ;i++){
            let row = {
                name1:inputNames[3*i],val1: data.inputs[3*i],
                name2:inputNames[3*i+1],val2:data.inputs[3*i+1],
                name3:inputNames[3*i+2],val3:data.inputs[3*i+2]};
            rows.push(row);
        }
        
        let that = this;

        // create table body
        input_table.append('tbody')
                .selectAll('tr')
                .data(rows)
                .enter()
                .append('tr')
                .selectAll('td')
                .data(function(row,i){
                    var thisRow = [];
                    thisRow.push({content:row.name1});
                    thisRow.push({content: that.label.actualName2DisplayName(row.val1, row.name1)});
                    thisRow.push({content:row.name2});
                    thisRow.push({content: that.label.actualName2DisplayName(row.val2, row.name2)});
                    thisRow.push({content:row.name3});
                    thisRow.push({content: that.label.actualName2DisplayName(row.val3, row.name3)});
                    return thisRow;
                })
                .enter()
                .append('td')
                .text(function(d){
                    return d.content;
                })
                .style("border","1px solid black")
                .style("font-size", "18px")
                .styles({
                    "padding": "7px",
                    "vertical-align": "central",
                });
    }
      
}

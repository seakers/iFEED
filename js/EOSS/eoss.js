function EOSS(metadata){
    
    var self = this;

    // Initialize the member attributes 
    self.orbit_list = [];
    self.instrument_list = [];
    self.orbit_num = null;
    self.instrument_num = null;
    self.i = 0;
    
    // Set the problem instance
    metadata.problem=self;

    // Set the path to the result file
    metadata.result_path="/results/EOSS_data.csv";


    
    /*
    Returns the list of orbits
    @return orbitList: a string list containing the names of orbits
    */
    self.get_orbit_list = function() {
        var orbitList;
        $.ajax({
            url: "/api/vassar/get-orbit-list/",
            type: "POST",
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
            type: "POST",
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
            if (bitString.charAt(i) == "0") {
                boolArray.push(true);
            } else {
                boolArray.push(false);
            }
        }
        return boolArray;
    }
    

    
    self.initialize_data = function(data){
        
        var output = [];
        
        data.forEach(function (d) {  
            
            // convert string to numbers
            d.science = +d.science;
            d.cost = +d.cost;
            if (d.cost == 100000) {
                d.cost = 0;
                d.science = 0;
            }
            var outputs = [d.science, d.cost];
            var inputs = d.bitString;
            var id = self.i++;
            var arch = new Architecture(id,inputs,outputs);

            output.push(arch);
        });
        
        return output;
    }
    
    
    self.import_callback = function(data){
        
        self.orbit_list = self.get_orbit_list();
        self.instrument_list = self.get_instrument_list(); 
        self.orbit_num = self.orbit_list.length;
        self.instrument_num = self.instrument_list.length;   
        
        metadata.data=self.initialize_data(data);
    }

    
    
//    function extractInfoFromBitString(bitString){
//        var jsonObj_arch=[];
//        for(var i=0;i<norb;i++){
//           orbit = orbitList[i];
//           assigned = [];
//           for(var j=0;j<ninstr;j++){
//              if(bitString[i*ninstr+j]=='1'){
//                 instrument = instrList[j];
//                    //Store the instrument names assigned to jth orbit
//                    assigned.push(instrument);
//                }
//            }
//            // Store the name of the orbit and the assigned instruments
//            jsonObj_arch.push({orbit:orbit,children:assigned});
//        }
//        return jsonObj_arch;
//    }

    
    
}













//
//
//function display_arch_info(bitString) {
//
//    document.getElementById('tab1').click();
//
//    json_arch = extractInfoFromBitString(bitString);
//    var norb = json_arch.length;
//    var maxNInst = 0;
//    var totalNInst = 0;
//
//    for (var i = 0; i < norb; i++) {
//        var nInst = json_arch[i].children.length;
//        totalNInst = totalNInst + nInst;
//        if (nInst > maxNInst) {
//            maxNInst = nInst;
//        }
//    }
//
//    d3.select("#supportPanel").select("[id=view1]")
//    .select("g").select("table").remove();
//
//    var supportPanel = d3.select("#supportPanel").select("[id=view1]")
//    .select("g");
//
//    var table = supportPanel.append("table")
//    .attr("id", "archInfoTable");
//
//    var columns = [];
//    columns.push({columnName: "orbit"});
//    for ( i = 0; i < maxNInst; i++) {
//        var tmp = i + 1;
//        columns.push({columnName: "Inst " + tmp});
//    }
//
//    // create table header
//    table.append('thead').append('tr')
//    .selectAll('th')
//    .data(columns).enter()
//    .append('th')
//    .attr("width", function (d) {
//        if (d.columnName == "orbit") {
//            return "120px";
//        } else {
//            return "70px";
//        }
//    })
//    .text(function (d) {
//        return d.columnName;
//    })
//    .style("font-size", "12px");
//
//
//    // create table body
//    table.append('tbody')
//    .selectAll('tr')
//    .data(json_arch).enter()
//    .append('tr')
//    .attr("name", function (d) {
//        return d.orbit;
//    })
//    .selectAll('td')
//    .data(function (row, i) {
//        var thisRow = [];
//        var orbitObj = {type: "orbit", content: json_arch[i].orbit};
//        thisRow.push(orbitObj);
//        for (var j = 0; j < json_arch[i].children.length; j++) {
//            var instObj = {type: "instrument", content: json_arch[i].children[j], orbit: json_arch[i].orbit};
//            thisRow.push(instObj);
//        }
//        return thisRow;
//    }).enter()
//    .append('td')
//    .attr("name", function (d) {
//        return d.content;
//    })
//    .style("background-color", function (d) {
//        if (d.type == "orbit") {
//            return "#D0D0D0";
//        }
//    })
//    .attr("id", "arch_cell")
//    .attr("width", function (d, i) {
//        if (d.type == "orbit") {
//            return "120px";
//        } else {
//            return "70px";
//        }
//    })
//    .text(function (d) {
//       if(d.type=="orbit"){
//          return ActualName2DisplayName(d.content,"orbit");
//      }
//      return ActualName2DisplayName(d.content,"instrument");
//  })
//    .style("font-size", "13px");
//}








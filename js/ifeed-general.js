

function Architecture(id,inputs,outputs){
    this.id=id;
    this.inputs=inputs;
    this.outputs=outputs;    
}



function IFEED(){
    
    var self = this;
    
    // Data
    self.metadata = {
                    "result_path":null, // String
                    "input_num":null,
                    "output_num":null,
                    "input_list":[],
                    "output_list":[],
                    "output_obj":[], // 1 for lager-is-better, -1 for smaller-is-better
                    };
    
    self.data = null; // Array containing the imported data
    
    // Functions
    self.import_callback = null, // Callback function to be called after importing data (preprocessing)
    
        
    // Instances of Classes
    self.problem = null; // Problem-specific class
    self.main_plot = null;
    self.filter = null;
    self.label = null;
    self.data_mining = null;
    self.feature_application = null;
    
    
    //Interaction states
    self.UI_states = {"support_panel_active":false,
                     "selection_changed":true,
                     "selection_mode":"zoom-pan",};
    

    
    self.get_data_ids = function(data){
        
        if(!data){
            data = self.data;
        }
        
        var ids = [];
        for(var i=0;i<data.length;i++){
            ids.push(data[i].id);
        }
        return ids;
    }
    
    

    /*
    Imports a new data from a file
    @param path: a string path to the file
    */

    self.import_new_data = function(path){

        console.log('Importing data...');

        if(!path){
           path = self.metadata.result_path; 
        } 

        $.ajax({
            url: "/api/ifeed/import-data/",
            type: "POST",
            data: {path:path},
            async: false,
            success: function (data, textStatus, jqXHR){

                self.data=data;
                
                if(self.import_callback){
                    self.import_callback(data);   
                }else{
                    alert('Preprocessing not defined');
                }
                
            },
            error: function (jqXHR, textStatus, errorThrown){
                alert("error");
            }   
        });
        
        
        ifeed.main_plot.update(ifeed.data,0,1);
    }
    
    

    self.calculate_pareto_ranking = function(limit){  
        
        var rank=0;
        
        if(!limit){
            limit=15;
        }
        
        var archs = self.data;
        var remaining = [];
        
        while(archs.length > 0){
            
            remaining=[];

            var n = archs.length;
            
            if (rank>limit){
                break;
            }

            for (var i=0; i < n ; i++){
                var non_dominated = true;
                var this_arch = archs[i];
                
                for (var j=0;j<n;j++){
                    
                    if (i==j){
                        continue;
                    
                    }else if(dominates(archs[j].outputs, this_arch.outputs, self.metadata.output_obj)){
                        non_dominated = false;
                    }
                }
                if (non_dominated == true){
                    archs[i].pareto_ranking = rank;
                }else{
                    remaining.push(archs[i]);
                }
            }

            rank++;
            archs = remaining;
        }
    }
    
    
}


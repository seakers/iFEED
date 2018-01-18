
// Inspecting an architecture using a mouse (tradespace_plot.js)
const INSPECT_ARCH = "inspect_arch";
// New selection made (tradespace_plot.js)
const SELECTION_UPDATED = "selection_updated";

// Apply feature expression (filter.js)
const APPLY_FEATURE_EXPRESSION = "apply_feature_expression";

// Highlight architectures (tradespace_plot.js)
const HIGHLIGHT_ARCHITECTURES = "highlight_architectures";




const INITIALIZE_FEATURE_APPLICATION = "initialize_feature_application";
const INITIALIZE_DATA_MINING = "initialize_data_mining";
const DRAW_VENN_DIAGRAM = "draw_venn_diagram";
const ADD_FEATURE = "add_feature";
const UPDATE_FEATURE_APPLICATION = "update_feature_application";
const CANCEL_ADD_FEATURE = "cancel_add_feature";
const DATA_IMPORTED = "data_imported";
const DATA_PROCESSED = "data_processed";
const ADD_ARCHITECTURE = "add_architecture";
const SET_CURRENT_ARCHITECTURE = "set_current_architecutre";
const VIEW_ARCHITECTURE = "view_architecture";
const HIGHLIGHT_SUPPORT_PANEL = "highlight_support_panel";
const RUN_LOCAL_SEARCH = "run_local_search";


const ARCH_SELECTED = "arch_selected";


class Architecture{
    constructor(id,inputs,outputs){
        this.id=id;
        this.inputs=inputs;
        this.outputs=outputs;  
    }
}


class IFEED{
    
    constructor(){

        // Data
        this.metadata = {
                        "result_path":null, // String
                        "input_num":null,
                        "output_num":null,
                        "input_list":[],
                        "output_list":[],
                        "output_obj":[], // 1 for lager-is-better, -1 for smaller-is-better
                        };

        this.data = null; // Array containing the imported data
        
        // Instances of Classes
        this.problem = null; // Problem-specific class
        this.tradespace_plot = null;
        this.filter = null;
        this.label = null;
        this.data_mining = null;
        this.feature_application = null;
        
        //Interaction states
        this.UI_states = {"support_panel_active":false,
                         "selection_changed":true,
                         "selection_mode":"zoom-pan"};

    }
    

    get_data_ids(data){
        if(!data){
            data = this.data;
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
    import_new_data(path){

        console.log('Importing data...');

        if(!path){
           path = this.metadata.result_path; 
        } 

        let that = this;

        $.ajax({
            url: "/api/ifeed/import-data/",
            type: "POST",
            data: {filename:path},
            async: false,
            success: function (data, textStatus, jqXHR){

                that.data=data;
                PubSub.publish(DATA_IMPORTED,data);
                
            },
            error: function (jqXHR, textStatus, errorThrown){
                alert("error");
            }   
        });
        
    }
    
    

    calculate_pareto_ranking(limit){  
        
        var rank=0;
        
        if(!limit){
            limit=15;
        }
        
        var archs = this.data;
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
                    
                    }else if(dominates(archs[j].outputs, this_arch.outputs, this.metadata.output_obj)){
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

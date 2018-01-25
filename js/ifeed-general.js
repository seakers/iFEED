// Load data (pub: index.html, sub: ifeed-general.js)
const LOAD_DATA = "load_data";
// Finished loading the design problem specification (pub: eoss.js, sub: ifeed-general.js, tradespace_plot.js, eossLabel.js)
const DESIGN_PROBLEM_LOADED = "design_problem_loaded";
// Inspecting an architecture using a mouse (pub: tradespace_plot.js, sub: problem.js)
const INSPECT_ARCH = "inspect_arch";
// New selection made (pub: tradespace_plot.js, sub: data_mining.js)
const SELECTION_UPDATED = "selection_updated";
// Apply feature expression (sub: filter.js)
const APPLY_FEATURE_EXPRESSION = "apply_feature_expression";
// Highlight architectures (pub: filter.js, sub: tradespace_plot.js)
const HIGHLIGHT_ARCHITECTURES = "highlight_architectures";
// Data imported (pub: ifeed-general.js, sub: problem.js, eoss.js)
const DATA_IMPORTED = "data_imported";
// Data preprocessing finished (pub: problem.js, sub: tradespace_plot.js, eossFilter.js, data_mining.js, feature_application.js)
const DATA_PROCESSED = "data_processed";
// Run local search in the design space (sub: problem.js)
const RUN_LOCAL_SEARCH = "run_local_search";
// Labeling scheme loaded (pub: eossLabel.js, sub: )
const LABELING_SCHEME_LOADED = "labeling_scheme_loaded";
// Feature application loaded (pub: feature_application.js, sub: data_mining.js)
const FEATURE_APPLICATION_LOADED = "feature_application_loaded";




const INITIALIZE_FEATURE_APPLICATION = "initialize_feature_application";
const DRAW_VENN_DIAGRAM = "draw_venn_diagram";
const ADD_FEATURE = "add_feature";
const UPDATE_FEATURE_APPLICATION = "update_feature_application";
const CANCEL_ADD_FEATURE = "cancel_add_feature";
const ADD_ARCHITECTURE = "add_architecture";
const SET_CURRENT_ARCHITECTURE = "set_current_architecutre";
const VIEW_ARCHITECTURE = "view_architecture";
const HIGHLIGHT_SUPPORT_PANEL = "highlight_support_panel";
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
                        "problem": null,
                        "input_num": null,
                        "input_type": null,
                        "input_list": [],
                        "output_list": [],
                        "output_num": null,
                        "output_obj": [], // 1 for lager-is-better, -1 for smaller-is-better
                        "file_path": null, // String
                        };

        this.data = null; // Array containing the imported data
        
        // Instances of Classes
        // this.problem = null; // Problem-specific class
        // this.tradespace_plot = null;
        // this.filter = null;
        // this.label = null;
        // this.data_mining = null;
        // this.feature_application = null;
        
        //Interaction states
        this.UI_states = {"support_panel_active":false,
                         "selection_changed":true,
                         "selection_mode":"zoom-pan"};

        PubSub.subscribe(DESIGN_PROBLEM_LOADED, (msg, data) => {
            this.metadata = data.metadata;
        }); 

        PubSub.subscribe(LOAD_DATA, (msg, data) => {
            this.import_new_data(data);
        }); 
    }
    

    get_data_ids(data){
        if(!data){
            data = this.data;
        }
        
        var ids = [];
        for(let i = 0; i < data.length; i++){
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

        let metadata = this.metadata;
        if(path){
           metadata.file_path = path;
        } 

        let that = this;
        $.ajax({
            url: "/api/ifeed/import-data/",
            type: "POST",
            data: this.metadata,
            async: false,
            success: function (data, textStatus, jqXHR){
                that.data = data;
                //that.calculate_pareto_ranking();
                PubSub.publish(DATA_IMPORTED,data);
            },
            error: function (jqXHR, textStatus, errorThrown){
                alert("error");
            }   
        });
        
        console.log("Data imported!");
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

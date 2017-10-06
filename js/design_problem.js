var metadata = {
    
    "problem":null,
    "result_path":null,
    "data":null,
    
    // Functions
    "import_callback":null,
    
    "input_num":null,
    "output_num":null,
    "input_list":[],
    "output_list":[],
}


function Architecture(id,inputs,outputs){
    this.id=id;
    this.inputs=inputs;
    this.outputs=outputs;    
}


/*
Imports a new data from a file
@param path: a string path to the file
*/

function import_new_data(path){
    
    console.log('Importing data...');

    if(!path){
       path = metadata.result_path; 
    } 
        
    $.ajax({
        url: "/api/ifeed/import-data/",
        type: "POST",
        data: {path:path},
        async: false,
        success: function (data, textStatus, jqXHR){
            
            if(metadata.problem.import_callback) metadata.problem.import_callback(data);      
        
        },
        error: function (jqXHR, textStatus, errorThrown){
            alert("error");
        }   
    });
    
}


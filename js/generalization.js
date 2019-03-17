
// class Generalization{
    
//     constructor(){

//         this.data = null;
//         this.metadata = null;
//         this.selected_archs = null;


//         PubSub.subscribe(DESIGN_PROBLEM_LOADED, (msg, data) => {
//             this.metadata = data.metadata;
//         }); 

//         PubSub.subscribe(DATA_PROCESSED, (msg, data) => {
//             this.data = data;
//         });       

//         PubSub.subscribe(SELECTION_UPDATED, (msg, data) => {
//             this.selected_archs = data;
//         });

//         PubSub.subscribe(GENERALIZE_FEATURE, (msg, data) => {
//             this.generalization_request(data);
//         });  
//     }

//     initialize(){
//     }

//     generalize_feature(feature_expression){
//     }

//     generalization_request(feature_expression){

//         $.ajax({
//             url: "/api/data-mining/generalize_feature",
//             type: "POST",
//             data: {
//                     problem: this.metadata.problem,  // ClimateCentric, GNC, etc.
//                     input_type: this.metadata.input_type, // binary, discrete, continuous, etc.
//                     feature: feature_expression, 
//                     selected: JSON.stringify(selected),
//                     non_selected:JSON.stringify(non_selected),
//                   },
//             async: false,
//             success: function (data, textStatus, jqXHR)
//             {
//             },
//             error: function (jqXHR, textStatus, errorThrown)
//             {alert("error");}
//         });
//     }
// }


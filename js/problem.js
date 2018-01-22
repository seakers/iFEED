
class Problem{

    constructor(){

        PubSub.subscribe(DATA_IMPORTED, (msg, data) => {
            let preprocessed = this.preprocessing(data);
            PubSub.publish(DATA_PROCESSED,preprocessed);
        });     

        PubSub.subscribe(INSPECT_ARCH, (msg, data) => {
            this.display_arch_info(data);
        });       
        
        PubSub.subscribe(RUN_LOCAL_SEARCH, (msg, data) => {
            this.run_local_search(data);
        });   
        
        // PubSub.subscribe(SET_CURRENT_ARCHITECTURE, (msg, data) => {
        //     self.current_bitString = self.booleanArray2String(data.inputs)
        // });   

    }
    
    preprocessing(data){
        
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


    display_arch_info(data) {  
        // To be implemented
    }     
}

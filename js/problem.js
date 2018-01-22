
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
        
        var out = [];
        var input_is_array = false;
        
        if(Array.isArray(data)){
            input_is_array=true;
        }else{
            data = [data];
        }
        
        data.forEach(function (d) {  
            let outputs = d.outputs;
            let inputs = d.inputs;
            let id = +d.id;
            let arch = new Architecture(id,inputs,outputs);
            out.push(arch);
        });
        
        if(input_is_array) return out;
        else return out[0];
    }


    display_arch_info(data) {  
        // To be implemented
    }     
}


class Problem{

    constructor(){

        this.data = null;

        PubSub.subscribe(DATA_IMPORTED, (msg, data) => {

            this.data = this.preprocessing(data);

            this.calculate_pareto_ranking([], 1);

            PubSub.publish(DATA_PROCESSED,this.data);

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

    preprocessing_problem_specific(data){
        // To be implemented
        return data;
    }
    
    preprocessing(data){
        
        let out = [];
        let input_is_array = false;
        
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

        if(this.preprocessing_problem_specific){
            out = this.preprocessing_problem_specific(out)
        }        
        
        if(input_is_array) return out;
        else return out[0];
    }

    display_arch_info(data) {  
        // To be implemented
    }    

    calculate_pareto_ranking(objective_indices, limit){  

        console.log("Calculating pareto ranking...");

        if(!objective_indices || objective_indices.length === 0){
            objective_indices = [];
            for(let i = 0; i < this.metadata.output_list.length; i++){
                objective_indices.push(i);
            }
        }

        let output_obj = JSON.parse(JSON.stringify(this.metadata.output_obj));

        let reduced = false;
        if(objective_indices.length < this.metadata.output_list.length){
            reduced = true;
            output_obj = output_obj.multisplice(objective_indices);
        }

        let archs = this.data;
        let archOutputs = [];

        for(let i = 0; i < this.data.length; i++){
            let outputs = JSON.parse(JSON.stringify(archs[i].outputs));
            if(reduced){
                outputs = outputs.multisplice(objective_indices);
            }
            archOutputs.push(outputs);
        }

        let rank = 0;
        
        if(!limit){
            limit = 15;
        }
        
        let remaining_outputs = [];
        let remaining = [];
        
        while(archs.length > 0){
            
            remaining_outputs = [];
            remaining = [];

            let n = archs.length;
            
            if (rank > limit){
                break;
            }

            for (let i = 0; i < n; i++){ 
                // Check dominance for each architecture
                let non_dominated = true;
                let this_arch_output = archOutputs[i];

                for (let j = 0; j < n; j++){
                    let arch_to_compare_output = archOutputs[j];
                    if (i === j){
                        continue;
                    }else if(dominates(arch_to_compare_output, this_arch_output, output_obj)){
                        non_dominated = false;
                    }
                }

                if (non_dominated){
                    archs[i].pareto_ranking = rank;
                }else{
                    remaining_outputs.push(archOutputs[i]);
                    remaining.push(archs[i]);
                    //archs[i].pareto_ranking = -1;
                }
            }

            rank++;
            archs = remaining;
            archOutputs = remaining_outputs;
        }
    }       

}

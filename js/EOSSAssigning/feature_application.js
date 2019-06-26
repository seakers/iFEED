
class EOSSFeatureApplication extends FeatureApplication {
    
    constructor(DataMiningScheme, filteringScheme, labelingScheme) {
    	super(DataMiningScheme, filteringScheme, labelingScheme);
    }

    update_base_feature_satisfaction(data){
    	let that = this;
    	let root = this.data;
        if(root === null || typeof root === "undefined"){
        	return;
        }

        if(!data){
	        this.visit_nodes(root, (d) => {
	            if(d.type === "leaf"){
            		d.unsatisfied = false;
	            }
	        });
        }else{
	        this.visit_nodes(root, (d) => {
	            if(d.type === "leaf"){
	            	if(this.filter.check_preset_feature_single_sample(d.name, data)){
	            		d.unsatisfied = false;
	            	} else {
	            		d.unsatisfied = true;
	            	}
	            }
	        });
        }

        let nodes = d3.selectAll('.treeNode');

        nodes.selectAll('circle')
        	.style("fill", (d) => {
        		return this.get_node_color(d);
        	});

        nodes.selectAll("text")
            .style("fill", (d) => {
                return this.get_node_color(d);
            });    
    }

    booleanArray2String(boolArray) {
        let bitString = "";
        for (let i = 0; i < boolArray.length; i++) {
            let bool;
            if (boolArray[i] === true) {
                bool = 1;
            } else {
                bool = 0;
            }
            bitString = bitString + bool;
        }
        return bitString;
    }
}
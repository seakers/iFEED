

function get_selected_arch_ids(){
	var target_string = "";
	d3.selectAll('.dot.main_plot.selected')[0].forEach(function(d){
		target_string = target_string + "," + d.__data__.id;
	});
	return target_string.substring(1,target_string.length);
}



function get_selected_arch_ids_list(){
	var target = [];
	d3.selectAll('.dot.main_plot.selected')[0].forEach(function(d){
		target.push(d.__data__.id);
	});
	return target;
}


function select_archs_using_ids(target_ids_string){

	var target_ids_split = target_ids_string.split(',');
	var target_ids =[];
	for(var i=0;i<target_ids_split.length;i++){
		var id = + target_ids_split[i];
		target_ids.push(id);
	}
    d3.selectAll('.dot.main_plot')[0].forEach(function(d){
    	if(target_ids.indexOf(d.__data__.id)!=-1){
    		d3.select(d)
    			.classed('selected',true)
    			.style("fill", ifeed.main_plot.color.selected);
    	}
    });

}



//var high_cost_high_perf = 
//var mid_cost_mid_perf = 
//var low_cost_low_perf = 



function turn_highlighted_to_selected(){
    
    d3.selectAll('.dot.main_plot.selected')
		.classed('selected',false)
        .classed('highlighted',false)
	    .style("fill", ifeed.main_plot.color.default); 
    
	d3.selectAll('.dot.main_plot.highlighted')
        .classed('selected',true)
		.classed('highlighted',false)
		.style("fill", ifeed.main_plot.color.selected);  
}


function turn_selected_to_highlighted(){
	
    d3.selectAll('.dot.main_plot.highlighted')
		.classed('selected',false)
        .classed('highlighted',false)
	    .style("fill", ifeed.main_plot.color.default); 
    
	d3.selectAll('.dot.main_plot.selected')
        .classed('selected',false)
		.classed('highlighted',true)
		.style("fill", ifeed.main_plot.color.highlighted);  
}
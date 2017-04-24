


var socket = new WebSocket("ws://127.0.0.1:8001/ifeed/"+key);

socket.onmessage = function(e){
    
    var text = e.data;
    var data = JSON.parse(text);
    
    // If the target is not feature application status page, return.
    if(data.target!='ifeed') return;
    
    var expression = data.expression;

    if(data.id=='apply_feature'){
        if(data.source=='feature_application_status'){
            if(data.expression==""){
                cancelDotSelections('remove_highlighted');
            }else{
                applyComplexFilter(data.expression);
            }
            
            // Draw venn diagram
            draw_venn_diagram();
            
            current_feature_expression = data.expression;
            
        }
    }
    else if(data.id=='update_feature'){
        current_feature_expression = data.expression;
    }
    else if(data.id=='test_feature'){
        // Add a new feature to the driving feature plot
        applyComplexFilter(data.expression);
        
        // Draw venn diagram
        draw_venn_diagram();
        
        current_feature_expression = data.expression;
        add_current_feature_to_DF_plot();
    }
    
    
};




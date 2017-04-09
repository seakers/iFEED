
var socket = new WebSocket("ws://127.0.0.1:8001/ifeed/");

socket.onmessage = function(e){
    
    var text = e.data;
    var data = JSON.parse(text);
    
    if(text=="apply_pareto_filter"){
        applyComplexFilter("{paretoFront[8]}");
        return;
    }
    else if(text=="cancel_selections"){
        cancelDotSelections();
        return;
    }
    
    
    if(data.id=='apply_feature_expression'){
        if(data.expression==""){
            cancelDotSelections('remove_highlighted');
        }else{
            applyComplexFilter(data.expression);
        }
        current_feature_expression = data.expression;
    }
    else if(data.id=='update_feature_expression'){
        current_feature_expression = data.expression;
    }
    
    
    
};




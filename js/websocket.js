
var socket = new WebSocket("ws://127.0.0.1:8001/ifeed/");

socket.onmessage = function(e){
    
    var text = e.data;
    if(text=="apply_pareto_filter"){
        applyComplexFilter("{paretoFront[8]}");
    }
    else if(text=="cancel_selections"){
        cancelDotSelections();
    }
    
    
    
    
};




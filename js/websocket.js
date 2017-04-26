


var socket = new WebSocket("ws://127.0.0.1:8001/ifeed/"+key);

socket.onmessage = function(e){
    
    var text = e.data;
    var data = JSON.parse(text);
    
    // If the target is not feature application status page, return.
    if(data.target!='ifeed') return;
    

    
};




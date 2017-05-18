
var socket = new WebSocket("ws://127.0.0.1:8001/"+key);


function connect(){
    if(socket==null){
        // make new connection
    }else if(socket.readyState!=1){
        // make new connection
    }else{
        return;
    }
    
    socket = new WebSocket("ws://127.0.0.1:8001/"+key);
    socket.onmessage=on_message;
}




socket.onmessage = function(e){
    
    var text = e.data;
    var data = JSON.parse(text);
    
    // If the target is not feature application status page, return.
    if(data.target.indexOf('ifeed')==-1) return;
        
};



/*
* Sends voice command to the main server
*/
function send_utterance(utterance){

    // If utterance is not an array (single string input), make it an array
    if(utterance.constructor != Array){
        utterance = [utterance];
    }

    var utteranceJson = JSON.stringify(utterance);

    // Send the utterance to the daphne server
    $.ajax(
            {
                url: "/api/ifeed/update-utterance/",
                type: "POST",
                data: {key:key,utterance:utteranceJson},
                async: true,
                success: function (data, textStatus, jqXHR)
                {
                },
                error: function (jqXHR, textStatus, errorThrown)
                {
                    alert("Error in updating utterance");
                }
            });
}

function submit(){
        
    var content = d3.select('[name=usermsg]')[0][0].value;
    
    send_utterance(content);
    
    update_chatbox_message(content,'Input');
    d3.select('[name=usermsg]')[0][0].value = "";
}


socket.onmessage = function(e){
    
    var text = e.data;
    var data = JSON.parse(text);
    
    if(data.target.indexOf('chat')==-1) return;
    
    update_chatbox_message(data.content[0],'Daphne');
};




function update_chatbox_message(message, speaker){ // speaker = {input, system}
    // Update the message to the chatbox
    var html = d3.select('#chatbox').html();
    d3.select('#chatbox').html(function(){
        return html + "<p>"+ speaker +": " + message + "</p>";
    });
    var chatbox = document.getElementById("chatbox");
    chatbox.scrollTop = chatbox.scrollHeight;
}




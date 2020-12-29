'use strict';



var chatWindow = new ChatWindow();

var serverConnection = new ServerConnection(function(actor,content) {
    chatWindow.log(actor,content);
} );

function buttonSendClick(event) {
    var textBox = document.getElementById('textToSend');
    if(!textBox.value) {
        log('Info','Enter some text before pressing send!');
        return;
    }
    var msg = {type:'broadcast',text:textBox.value};
    serverConnection.sendMessage(msg);
    textBox.value = '';
}

function buttonSetNameClick(event) {
    var textBox = document.getElementById('textUsername');
    var msg = {type:'rename',playerName:textBox.value};
    serverConnection.sendMessage(msg);
    localStorage.setItem('PlayerName',textBox.value )
}

//Helper to trip the user pressing return and execute a function
function addDefaultAction(textBox, action ) {
    textBox.addEventListener("keyup", function(event) {
        if (event.key === "Enter") {
            action();
        }
    });
}

function onload() {

    const playerName = localStorage.getItem('PlayerName');
    console.log('Logging with suggested player name : ' + playerName);

    var wsURL = (window.location.protocol === 'http:' ? 'ws:' : 'wss:') +window.location.host ;
    if( playerName ) {
        wsURL += '?playerName=' + encodeURIComponent(playerName);
    }

    serverConnection.connect(wsURL);

    var buttonSend = document.getElementById('buttonSend');
    buttonSend.addEventListener('click', buttonSendClick);

    var textToSend = document.getElementById('textToSend');
    addDefaultAction(textToSend, buttonSendClick);
    textToSend.focus();

    addDefaultAction(document.getElementById('textUsername'), buttonSetNameClick);
}

window.addEventListener('load',onload);


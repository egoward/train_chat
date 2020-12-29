'use strict';

var chatWindow = new ChatWindow();

function buttonSendClick(event) {
    var textBox = document.getElementById('textToSend');
    if (!textBox.value) {
        console.log('Info', 'Enter some text before pressing send!');
        return;
    }
    //var msg = { type: 'broadcast', text: textBox.value };
    chatWindow.sendMessage(textBox.value);
    textBox.value = '';
}

function buttonSetNameClick(event) {
    var textBox = document.getElementById('textUsername');
    chatWindow.setMyName(textBox.value);
}

//Helper to trip the user pressing return and execute a function
function addDefaultAction(textBox, action) {
    textBox.addEventListener("keyup", function (event) {
        if (event.key === "Enter") {
            action();
        }
    });
}

function onload() {

    chatWindow.connect();

    var buttonSend = document.getElementById('buttonSend');
    buttonSend.addEventListener('click', buttonSendClick);

    var textToSend = document.getElementById('textToSend');
    addDefaultAction(textToSend, buttonSendClick);
    textToSend.focus();

    addDefaultAction(document.getElementById('textUsername'), buttonSetNameClick);
}

window.addEventListener('load', onload);


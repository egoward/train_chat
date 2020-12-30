'use strict';

class ChatWindow {

    constructor() {
        this.serverConnection = null;
    }

    connect() {
        this.serverConnection = new ServerConnection(chatWindow);
        const playerName = localStorage.getItem('PlayerName');
        console.log('Logging with suggested player name : ' + playerName);
        var wsURL = (window.location.protocol === 'http:' ? 'ws:' : 'wss:') +window.location.host ;
        if( playerName ) {
            wsURL += '?playerName=' + encodeURIComponent(playerName);
        }
        this.serverConnection.connect(wsURL);
    }

    addMessage( actor, content)  {
        var messages = document.getElementById('messages');
        var divMessage = document.createElement('div');
        divMessage.className='message';
        var divActor = document.createElement('span');
        divActor.className='actor';
        divActor.innerText = actor + ': ';
        var divContent = document.createElement('span');
        divContent.className='content';
        divContent.innerText = content;
        divMessage.appendChild(divActor);
        divMessage.appendChild(divContent);
        // messages.insertBefore(divMessage, messages.childNodes[0]); 
        messages.appendChild(divMessage);
    }

    sendMessageWithActor(actor, text) {
        this.serverConnection.begin_list_insert('messages', { actor: actor, text: text }, true );
    }

    sendMessage(text) {
        this. sendMessageWithActor( this.serverConnection.userMe.playerName, text);
    }

    server_Log(actor,content) {
        console.log( actor, content);
    }

    refreshMessages() {
        document.getElementById('messages').innerHTML = '';
        var objects = this.serverConnection.sharedObjects;
        for(var c=0;c<objects.messages.length;c++) {
            var msg = objects.messages[c];
            this.addMessage(msg.actor, msg.text);
        }
    }

    server_login(state) {
        console.log("Login!");
        if( !this.serverConnection.sharedObjects.messages ) {
            this.serverConnection.createAndSendObjects( { messages: [{actor:"Info", text:"Chat started"}] } );
        }
        this.refreshMessages();
    }

    on_list_insert(key, objectsToInsert) {
        if( key == "messages") {
            this.refreshMessages();
        }
    }

    on_user_list_change() {
    }

}

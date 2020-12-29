class ChatWindow {

    constructor() {
    }

    log( actor, content)  {
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
}

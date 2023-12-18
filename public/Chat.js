'use strict';

class Popup {
    constructor(title) {
        this.popupClose = document.createElement("div");
        this.popupClose.className = "popupClose";
        this.popupClose.innerHTML = "&#10060;";
        this.popupTitle = document.createElement("div");
        this.popupTitle.className = "popupTitle";
        this.popupTitle.innerHTML = title;
        this.popupTitle.appendChild(this.popupClose);
        this.popupBody = document.createElement("div")
        this.popupBody.className = "popupBody";
        this.popupBody.innerHTML = "Hello";
        this.popup = document.createElement("div");
        this.popup.className = "popup";
        this.popup.appendChild(this.popupTitle);
        this.popup.appendChild(this.popupBody);
        document.body.appendChild(this.popup);
        this.popupClose.addEventListener('click', this.close.bind(this));
    }

    close() {
        document.body.removeChild(this.popup);
    }
    //Helper to trip the user pressing return and execute a function
    static addDefaultAction(textBox, action) {
        textBox.addEventListener("keyup", function (event) {
            if (event.key === "Enter") {
                action();
            }
        });
    }
}

class PopupUsers extends Popup {
    constructor(serverConnection) {
        super("User Settings")

        this.serverConnection = serverConnection;

        this.serverConnection.listeners.push(this);

        this.populateContent();

    }

    close() {
        var index = this.serverConnection.listeners.indexOf(this);
        this.serverConnection.listeners.splice(index,1);
        super.close();
    }

    populateContent() {
        var html = "<h2>User settings</h2><br />" +
        "<p>Username:  <input type=text id=textNewUsername size=30 />" +
        "  <input type=button id=buttonChangeUsername/></p>";

        html+= "Current users:<hr/>"
        html+= '<table style="border:1px solid black;border-collapse: collapse;"><th>ID</th><th>Name</th><th>ReadyState</th>\n'
        for(var userId in this.serverConnection.users) {
            var user = this.serverConnection.users[userId];
            html += "<tr><td>" + user.uniqueID + "</td><td>" + user.playerName + "</td><td>" + user.readyState + "</td></tr>\n";
        }
        html+="</table>"

        this.popupBody.innerHTML = html;

        this.textNewUsername = document.getElementById('textNewUsername');
        this.textNewUsername.value=this.serverConnection.userMe.playerName;

        this.buttonChangeUsername = document.getElementById('buttonChangeUsername');
        this.buttonChangeUsername.addEventListener('click', this.changeUsername.bind(this));
        Popup.addDefaultAction(this.textNewUsername, this.changeUsername.bind(this));

        textNewUsername.focus();

    }

    changeUsername() {
        var newUsername = this.textNewUsername.value;
        this.serverConnection.changeUsername(newUsername);
        console.log("Change user to " + newUsername);
    }

    on_user_list_change() {
        this.populateContent();
    }


}

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

function buttonUsersClick() {
    var popup = new PopupUsers( chatWindow.serverConnection );

}

function onload() {

    chatWindow.connect();

    var buttonSend = document.getElementById('buttonSend');
    buttonSend.addEventListener('click', buttonSendClick);

    var textToSend = document.getElementById('textToSend');
    Popup.addDefaultAction(textToSend, buttonSendClick);
    textToSend.focus();

    var buttonUsers = document.getElementById('buttonUsers');
    buttonUsers.addEventListener('click', buttonUsersClick);

}

window.addEventListener('load', onload);


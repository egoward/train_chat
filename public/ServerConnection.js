class ServerConnection {

    constructor(listener) {
        this.socket = null;
        this.userMe = null;
        this.listener = listener;
        this.sharedObjects = {}
    }

    log(actor, content) {
        if (this.listener && this.listener.server_Log) {
            this.listener.server_Log(actor, content);
        } else {
            console.log(actor, content);
        }
    }

    connect(wsURL) {
        this.log("Info", "Connecting to " + wsURL);
        this.socket = new WebSocket(wsURL);
        this.socket.addEventListener('open', this.onWSConnected.bind(this));
        this.socket.addEventListener('message', this.onWSMessage.bind(this));
        this.socket.addEventListener('close', this.onWSClose.bind(this));
    }

    onWSConnected(event) {
        this.log("Info", "Connected");
    }
    onWSClose(event) {
        this.log("Info", "Connection Closed");
    }

    handleInitialState(msg) {
        // document.getElementById('textUsername').innerText = msg.user.playerName;
        this.userMe = msg.user;
        this.log("Info", 'Logged in as ' + msg.user.playerName);
        if (msg.users.length == 1) {
            this.log("Info", "You are alone");
        } else {
            this.log("Info", 'Users : ' + msg.users.map(x => x.playerName).join(', '));
        }

        this.sharedObjects = msg.objects;

        if (this.listener && this.listener.server_login) {
            this.listener.server_login(msg);
        }
    }

    handleBroadcast(message) {
        var isMe = (this.userMe.uniqueID === message.from.uniqueID);
        if (this.listener && this.listener.server_broadcast) {
            this.listener.server_broadcast(message, isMe);
        }
        if (message.msg.text) {
            this.log(message.from.playerName + (isMe ? ' (you)' : ''), message.msg.text);
        }
    }

    handleAction(message) {
        var isMe = (this.userMe.uniqueID === message.from.uniqueID);
        if (isMe) {
            console.log("Ignoring action that we sent.")
            return;
        }

        for (var key in message.create) {
            if (key in objects) {
                console.log("Ignore creation of " + key + " as it already exsits.");
                continue;
            }
            var obj = messageObj.create[key];
            objects[key] = obj;
        }

        for (var key in message.update) {
            if (!key in objects) {
                console.log("Ignore change to " + key + " as it does not exit.");
                continue;
            }
            var obj = message.update[key];
            objects[key] = obj;
        }

        for (var key in message.delete) {
            if (!key in objects) {
                console.log("Ignore delete of " + key + " as it does not exit.");
                continue;
            }
            delete objects[key];
        }
    }

    onWSMessage(event) {
        try {
            var message = JSON.parse(event.data);
        } catch (e) {
            this.log('Error', e.toString() + ' parsing ' + event.data);
            return;
        }

        var type = message.type;
        switch (type) {
            case 'join':
                this.log('Server', message.user.playerName + " joined");
                break;
            case 'leave':
                this.log('Server', message.user.playerName + " left");
                break;
            case 'rename':
                this.log('Server', message.oldName + " renamed to " + message.from.playerName);
                break;
            case 'broadcast':
                this.handleBroadcast(message);
                break;
            case 'action':
                this.handleAction(message);
                break;
            case 'initial_state':
                this.handleInitialState(message);
                break;
            default:
                this.log("Message", event.data);
        }
    }

    sendMessage(msg) {
        if (this.socket.readyState == WebSocket.OPEN) {
            this.socket.send(JSON.stringify(msg, null, '  '));
        }
    }

    createAndSendObjects( objects ) {
        for (var key in objects) {
            this.sharedObjects[key] = objects[key];
        }
        this.sendMessage({type:'action', create:objects});
    }
    broadcastChanges( keys ) {
        var msg = {type:'action',update:{}}
        for (var key of keys) {
            msg.update[key] = this.sharedObjects[key];
        }
        this.sendMessage(msg);
    }

}


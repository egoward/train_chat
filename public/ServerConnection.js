class ServerConnection {

    constructor(listener) {
        this.socket = null;
        this.userMe = null;
        this.users = null;
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
        this.users = msg.users;

        this.log("Info", 'Logged in as ' + msg.user.playerName);
        if (msg.users.length == 1) {
            this.log("Info", "You are alone");
        } else {
            var userArray = Object.keys(msg.users).map(x=>msg.users[x]);
            this.log("Info", 'Users : ' + userArray.map(x => x.playerName).join(', '));
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

        for (var key in message.create) {
            if (key in this.sharedObjects) {
                console.log("Ignore creation of " + key + " as it already exsits.");
                continue;
            }
            var obj = message.create[key];
            this.sharedObjects[key] = obj;
        }

        if(message.update) {
            for (var key in message.update) {
                if (!key in this.sharedObjects) {
                    console.log("Ignore change to " + key + " as it does not exit.");
                    continue;
                }
                var obj = message.update[key];
                this.sharedObjects[key] = obj;
    
            }
            if(this.listener && this.listener.on_update) {
                for (var key in message.update) {
                    var obj = message.update[key];
                    this.listener.on_update(key, obj);
                }
            }
        }

        for (var key in message.delete) {
            if (!key in this.sharedObjects) {
                console.log("Ignore delete of " + key + " as it does not exit.");
                continue;
            }
            delete this.sharedObjects[key];
        }

        for (var key in message.list_insert) {
            if (!key in this.sharedObjects) {
                console.log("Ignore list_insert of " + key + " as it does not exit.");
                continue;
            }

            var array = this.sharedObjects[key];
            if (!Array.isArray(array)) {
              console.log("Ignore list insert of " + key + " as it is not an arrya");
              continue;
            }
            var objectsToInsert = message.list_insert[key];
            for(var item of objectsToInsert) {
                array.push(item);
            }
            if(this.listener && this.listener.on_list_insert) {
                this.listener.on_list_insert(key, objectsToInsert);
            }
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
                this.users[ message.user.uniqueID ] = message.user;
                this.log('Server', message.user.playerName + " joined");
                break;
            case 'leave':
                delete this.users[ message.user.uniqueID ];
                this.log('Server', message.user.playerName + " left");
                break;
            case 'rename':
                this.users[ message.user.uniqueID ] = message.user;
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
    broadcastChanges( keys, broadcast_to_sender) {
        var msg = {type:'action',update:{}, broadcast_to_sender}
        for (var key of keys) {
            msg.update[key] = this.sharedObjects[key];
        }
        this.sendMessage(msg);
    }

    begin_list_insert(key, value, broadcast_to_sender) {
        var array = this.sharedObjects[key];
        if(!Array.isArray(array)) {
            throw new Error("Attempting to add to something that isn't an array");
        }
        var msg = {type:'action',list_insert:{}, broadcast_to_sender}
        msg.list_insert[key] = [value];
        this.sendMessage(msg);
    }

}


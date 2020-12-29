class ServerConnection {
    constructor(logger) {
        this.socket = null;
        this.userMe = null;
        this.logger = logger;
    }

    log(actor,content) {
        this.logger(actor,content);
    }

    connect(wsURL) {
   
        this.log("Info", "Connecting to " + wsURL );
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

    handleYouMessage(msg) {
        document.getElementById('textUsername').innerText = msg.user.playerName;
        this.userMe = msg.user;
        this.log("Info", 'Logged in as ' + msg.user.playerName);
        if( msg.users.length == 1 ) {
            this.log("Info","You are alone");
        } else { 
            this.log("Info", 'Users : ' + msg.users.map( x=> x.playerName).join(', '));
        }
    
    }
    
    onWSMessage(event) {
        try {
            var message = JSON.parse(event.data);
        } catch( e ) {
            this.log('Error', e.toString() + ' parsing ' + event.data);
            return;
        }
    
        var type = message.type;
        switch( type ) {
            case 'join':
                this.log( 'Server', message.user.playerName + " joined");
                break;
            case 'leave':
                this.log( 'Server', message.user.playerName + " left");
                break;
            case 'rename':
                this.log( 'Server', message.oldName + " renamed to " + message.from.playerName);
                break;
            case 'broadcast':
                var isMe = (this.userMe.uniqueID === message.from.uniqueID );
                this.log( message.from.playerName + (isMe?' (you)':''), message.msg.text);
                break;
            case 'you':
                this.handleYouMessage(message);
                break;
            default:
                this.log("Message", event.data);
        }
    }

    sendMessage(msg) {
        this.socket.send( JSON.stringify(msg, null,'  '));
    }
}


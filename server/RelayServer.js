'use strict';

const WebSocket = require('ws');


class Connection {
  constructor(relayServer, ws) {
    this.relayServer = relayServer;
    this.ws = ws;
    this.uniqueID = null;
    this.playerName = null;
  }

  connect(req) {
    try {
      this.playerName = new URL('http://localhost' + req.url).searchParams.get('playerName')
    } catch (e) {
    }

    if (this.playerName == null) {
      this.playerName = 'Player ' + this.relayServer.nextPlayerNumber;
      this.relayServer.nextPlayerNumber++;
    }

    this.uniqueID = req.socket.remoteAddress + ':' + this.ws._socket.remotePort;

    this.relayServer.users[this.uniqueID] = this;

    var yourInfo = {
      type: 'initial_state',
      user: this.getUserJSON(),
      users: this.relayServer.getUsersJSON(),
      objects: this.relayServer.objects
    };
    this.ws.send(JSON.stringify(yourInfo, null, '  '));

    this.relayServer.broadcast({
      type: 'join',
      user: this.getUserJSON()
    });

    this.ws.on('open', function () { console.log('WS Open!') });
    this.ws.on('close', this.on_close.bind(this));
    this.ws.on('error', function () { console.log('WS Error!') });
    this.ws.on('message', this.on_message.bind(this));
  }

  on_close() {
    console.log('WS Close!')
    this.relayServer.broadcast({
      type: 'leave',
      user: this.getUserJSON()
    });

    delete this.relayServer.users[ this.uniqueID ];
  }

  on_action(messageObj) {
    var objects = this.relayServer.objects;
    var broadcast = {type:'action','create':{},'update':{},'delete':{}, 'list_insert':{}, from: this.getUserJSON()};

    for (var key in messageObj.create) {
      console.log("Create " + key);
      if (key in objects) {
        console.log("Ignore creation of " + key + " as it already exsits.");
        continue;
      }
      var obj = messageObj.create[key];
      objects[key] = obj;
      broadcast.create[key] = obj;
    }

    for (var key in messageObj.update) {
      console.log("Update " + key);
      if (!key in objects) {
        console.log("Ignore change to " + key + " as it does not exit.");
        continue;
      }
      var obj = messageObj.update[key];
      objects[key] = obj;
      broadcast.update[key] = obj;
    }

    for (var key in messageObj.delete) {
      console.log("Delete " + key);
      if (!key in objects) {
        console.log("Ignore delete of " + key + " as it does not exit.");
        continue;
      }
      delete objects[key];
      broadcast.delete[key] = null;
    }

    for (var key in messageObj.list_insert) {
      console.log("List insert " + key);
      if (!key in objects) {
        console.log("Ignore list insert of " + key + " as it does not exist");
        continue;
      }
      var serverArray = objects[key];
      if (!Array.isArray(serverArray)) {
        console.log("Ignore list insert of " + key + " as it is not an arrya");
        continue;
      }

      var objectsToInsert = messageObj.list_insert[key];
      for(var item of objectsToInsert) {
        serverArray.push(item);
      }
      broadcast.list_insert[key] = objectsToInsert;
    }

    var ignoredSender = messageObj.broadcast_to_sender ? null : this;

    this.relayServer.broadcast(broadcast, ignoredSender);

  }

  on_message(messageText) {
    try {
      var messageObj = JSON.parse(messageText);
      var type = messageObj.type;
      if (type == 'action') {
        this.on_action( messageObj);
      } else if (type == 'broadcast') {
        this.relayServer.broadcast({ type: 'broadcast', from: this.getUserJSON(), msg: messageObj });
      } else if (type == 'rename') {
        var oldName = this.playerName;
        this.playerName = messageObj.playerName;
        this.relayServer.broadcast({ type: 'rename', oldName, from: this.getUserJSON() });
      } else {
        console.log("Unhandled message ", messageObj);
      }
    }
    catch (e) {
      console.log("Unable to parse message ", messageText);
    }
  }

  getUserJSON() {
    return {
      uniqueID: this.uniqueID,
      playerName: this.playerName,
      readyState: this.ws.readyState
    };
  }
}

class RelayServer {
  constructor() {
    this.objects = {};
    this.users = {};
    this.nextPlayerNumber = 1;
    this.wss = null;
  }

  broadcast(msg, ignoredSender) {
    var msgText = JSON.stringify(msg);
    this.wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        if( client != ignoredSender ) {
          client.send(msgText);
        }
      }
    });
  }

  init() {
    this.wss = new WebSocket.Server({ noServer: true });
    this.wss.on('connection', this.connect.bind(this));
  }

  getUsersJSON() {
    return Object.fromEntries( Object.entries(this.users).map(([id,user])=>[id,user.getUserJSON()]))    
  }

  connect(ws, req) {
    var connection = new Connection(this, ws, req);
    connection.connect(req);
  }

}

module.exports = { RelayServer };
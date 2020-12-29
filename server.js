"use strict";

const http = require("http");
const fs = require('fs');
const WebSocket = require('ws');
const express = require('express');
const { send } = require("process");

var users = [];
var nextPlayerNumber = 1;

const app = express();

function getUserJSON(user) {
  return {
    uniqueID:user.uniqueID, 
    playerName:user.playerName, 
    readyState:user.ws.readyState
  };
}

app.get('/users', (req,res) => {
  res.contentType('application/json');
  var ret = users.map( getUserJSON );
  res.send( JSON.stringify(ret,null,'  '));
})

app.use(express.static('public'))
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer:true });

function broadcast(msg) {
  var msgText = JSON.stringify(msg);
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send( msgText);
    }
  });    

}

wss.on('connection', function connection(ws, req) {

  var playerName;
  try {
    playerName = new URL('http://localhost' + req.url).searchParams.get('playerName')
  } catch( e) {
  }

  if(playerName == null ) {
    var playerName = 'Player ' + nextPlayerNumber;
    nextPlayerNumber ++;
  }

  var uniqueID = req.socket.remoteAddress + ':' + ws._socket.remotePort;

  var user = {ws, uniqueID, playerName};
  users.push(user);

  var yourInfo = {
    type:'you', 
    user:getUserJSON(user),
    users: users.map( getUserJSON )
  };
  ws.send(JSON.stringify(yourInfo,null,'  '));

  broadcast({
    type: 'join',
    user: getUserJSON(user)
  });

  ws.on('open', function () {console.log('WS Open!')} );
  ws.on('close', function () {
    console.log('WS Close!')
    broadcast({
      type: 'leave',
      user: getUserJSON(user)
    });
    var index = users.findIndex( user => user.ws === ws );
    if( index < 0 ) {
      throw new Error("Unable to locate user who closed web socket");
    }
    users.splice(index,1);
  });
  ws.on('error', function () {console.log('WS Error!')} );

  ws.on('message', function incoming(messageText) {
    try {
      var messageObj = JSON.parse(messageText);
      var type = messageObj.type;
      if(type == 'broadcast') {
        broadcast( {type: 'broadcast', from:getUserJSON(user), msg: messageObj});
      } else if(type == 'rename') {
        var oldName = user.playerName;
        user.playerName = messageObj.playerName;
        broadcast( {type: 'rename', oldName, from:getUserJSON(user)});
      } else {
        console.log("Unhandled message ", messageObj);
      }
    }
    catch(e) {
      console.log("Unable to parse message ", messageText);
    }

    console.log('received: %s', messageText);
  });

});


server.on('upgrade', function upgrade(request, socket, head) {
  wss.handleUpgrade(request, socket, head, function done(ws) {
    wss.emit('connection', ws, request);
  });  
});

const port = 8080;
server.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

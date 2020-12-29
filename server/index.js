"use strict";

const http = require("http");
const fs = require('fs');
const express = require('express');
const { send } = require("process");
const {RelayServer} = require("./RelayServer");

var relayServer = new RelayServer();

const app = express();

app.get('/users', (req,res) => {
  res.contentType('application/json');
  var ret = relayServer.users.map( RelayServer.getUserJSON );
  res.send( JSON.stringify(ret,null,'  '));
})

app.use(express.static('public'))
const httpServer = http.createServer(app);

relayServer.init();

httpServer.on('upgrade', function upgrade(request, socket, head) {
  relayServer.wss.handleUpgrade(request, socket, head, function done(ws) {
    relayServer.wss.emit('connection', ws, request);
  });  
});

const port = 8080;
httpServer.listen(port, () => {
  console.log(`Relay server listening at http://localhost:${port}`)
})

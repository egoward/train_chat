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
  res.send( JSON.stringify(relayServer.getUsersJSON(),null,'  '));
})

const path1=__dirname+'/../public'
console.log('Serving files from ', path1)
app.use('/',express.static(path1, {index:'index.html'}))
const httpServer = http.createServer(app);

relayServer.init();

httpServer.on('upgrade', function upgrade(request, socket, head) {
  relayServer.wss.handleUpgrade(request, socket, head, function done(ws) {
    relayServer.wss.emit('connection', ws, request);
  });  
});

const port = 8080;
httpServer.listen(port, '0.0.0.0', () => {
  console.log(`Relay server listening at http://localhost:${port}`)
})

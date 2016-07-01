'use strict';

const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer({ port: 8080 });
const utils = require('./utils');

wss.broadcast = function broadcast(msg) {
  const str = JSON.stringify(msg);

  wss.clients.forEach(function(client) {
    client.send(str);
  });
};

const idGen = (function() {
  let id = 0;
  return function() {
    return 'user' + id++;
  };
}());

wss.on('connection', function connection(ws) {
  const id = idGen();
  console.log(id, 'connected');
  ws.id = id;
  ws.position = {
    // TODO: will need to use vw values since we're using a scalable dom
    x: utils.randomIntBetween(0, 256),
    y: utils.randomIntBetween(0, 240)
  };
  ws.lastProcessedInput = { time: 0, position: ws.position };

  // we always want to stringify our data
  ws.sendStr = function(msg) {
    if (wss.clients.indexOf(ws) === -1) {
      return;
    }
    ws.send(JSON.stringify(msg));
  };

  ws.sendStr({ type: 'id', id }); // inform client of its id

  // spawn all existing players on client
  wss.clients.forEach(function(client) {
    if (client.id === id) {
      return; // don't spawn ourself yet
    }
    ws.sendStr({ type: 'spawn', id: client.id, x: client.x, y: client.y });
  });

  // broadcast our own position (and spawn)
  // TODO: bear in mind we have an unchanging paddle container position
  // and a vertical position within that which can change.
  // take this into account.
  // also consider removing the container element and simply defining a
  // max and min y value.
  wss.broadcast({ type: 'spawn', id, x: ws.position.x, y: ws.position.y });

  ws.on('close', function() {
    wss.broadcast({type: 'destroy', id: id});
  });

  ws.on('message', function incoming(message) {
    const msg = JSON.parse(message);
    const messageHandlers = {
      move() {
        // TODO: if the new received position is within the server's known bounds for the client player,
        // update the position on the server and broadcast the new position to all connected clients
      }
    };

    messageHandlers[msg.type]();
  });
});

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

const updatePlayerPositions = function() {
  const courtWidth = 98;
  const courtHeight = 54.25;
  const paddleContainerWidth = 1;
  const numPlayers = wss.clients.length;
  const paddleContainerHeight = utils.getReach(numPlayers);
  const playerCountIsEven = numPlayers % 2 === 0;

  wss.clients.forEach(function(ws) {
    const x = (function() {
      if (ws.position) {
        return ws.position.x;
      }
      if (playerCountIsEven) {
        // spawn on right side
        return utils.randomIntBetween(courtWidth / 2, courtWidth - paddleContainerWidth);
      } else {
        // spawn on left side
        return utils.randomIntBetween(0, courtWidth / 2 - paddleContainerWidth);
      }
    }());
    const y = utils.randomIntBetween(0, courtHeight - paddleContainerHeight);
    wss.broadcast({type: 'destroyPlayer', id: ws.id});
    // randomize player positions
    ws.position = { x, y };
    wss.broadcast({type: 'spawnPlayer', id: ws.id, x, y});
  });
};

wss.on('connection', function connection(ws) {
  const id = idGen();
  console.log(id, 'connected');
  ws.id = id;

  // we always want to stringify our data
  ws.sendStr = function(msg) {
    if (wss.clients.indexOf(ws) === -1) {
      return;
    }
    ws.send(JSON.stringify(msg));
  };

  ws.sendStr({ type: 'id', id }); // inform client of its id

  // spawn/respawn all players with new positions based on number of connected clients
  // TODO: bear in mind we have a paddle container position (player movement boundaries)
  // and a vertical position within that which player can set by moving the mouse.
  // consider removing the container element and simply defining a max and min y value.
  updatePlayerPositions();

  ws.on('close', function() {
    wss.broadcast({type: 'destroyPlayer', id: id});
    updatePlayerPositions();
  });

  ws.on('message', function incoming(message) {
//    console.log('received message:', message);
    const msg = JSON.parse(message);
    const messageHandlers = {
      movePlayer() {
        // TODO: if the new received position is within the server's known bounds for the client player,
        // update the position on the server
        // broadcast the new position to all connected clients
        // TODO: only do this, again, if the position is within the expected bounds
        wss.broadcast(msg);
      }
    };
    messageHandlers[msg.type]();
  });
});

// server game loop
const fps = 6;
const refreshRate = 1000 / fps;
let newBall = function() {
  return {
    position: { x: 50, y: 50 },
    velocity: { x: -0.5, y: 0 }
  };
};
let ball = newBall();
let score = { a: 0, b: 0 }; // teams A & B

const loop = setInterval(function() {
  ball.position.x = ball.position.x + ball.velocity.x;
  ball.position.y = ball.position.y + ball.velocity.y;

  // bounce off the walls if we hit them
  if (ball.position.y < 0 || ball.position.y > 100) {
    ball.velocity.y = -ball.velocity.y;
  }

  // update score and reposition ball if a goal is scored
  if (ball.position.x < 0) {
    score.b++;
    ball = newBall();
    wss.broadcast({ type: 'score', score });
  } else if (ball.position.x > 100) {
    score.a++;
    ball = newBall();
    wss.broadcast({ type: 'score', score });
  }

  wss.broadcast({ type: 'moveBall', x: ball.position.x, y: ball.position.y });
}, refreshRate);

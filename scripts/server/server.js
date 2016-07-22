(function() {  
  'use strict';

  const WebSocketServer = require('ws').Server;
  const wss = new WebSocketServer({ port: 8080 });
  const utils = require('../utils');

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

  let paddleContainerHeight;

  const updatePlayerPositions = function() {
    const paddleContainerWidth = 1;
    const numPlayers = wss.clients.length;
    const playerCountIsEven = numPlayers % 2 === 0;
    paddleContainerHeight = utils.getReach(numPlayers);

    wss.clients.forEach(function(ws) {
      const x = (function() {
        if (ws.paddleContainer) {
          return ws.paddleContainer.x;
        }
        if (playerCountIsEven) {
          // spawn on right side
          return utils.randomIntBetween(50, 100 - paddleContainerWidth);
        } else {
          // spawn on left side
          return utils.randomIntBetween(0, 50 - paddleContainerWidth);
        }
      }());
      const y = utils.randomIntBetween(0, 100 - paddleContainerHeight);
      wss.broadcast({type: 'destroyPlayer', id: ws.id});
      // randomize player positions
      ws.paddleContainer = { x, y };
      wss.broadcast({type: 'spawnPlayer', id: ws.id, x, y});
    });
  };

  wss.on('connection', function connection(ws) {
    const id = idGen();
    console.log(id, 'connected');
    ws.id = id;
    ws.paddle = { y: 33 }; // initialize paddle position within paddleContainer to 33%

    // we always want to stringify our data
    ws.sendStr = function(msg) {
      if (wss.clients.indexOf(ws) === -1) {
        return; // don't send if client has disconnected or otherwise does not exist
      }
      ws.send(JSON.stringify(msg));
    };

    ws.sendStr({ type: 'id', id }); // inform client of its id

    // spawn/respawn all players with new positions based on number of connected clients.
    // bear in mind we have a paddle container (player movement boundaries) position
    // and a vertical position within that which player can set by moving the mouse.
    updatePlayerPositions();

    ws.on('close', function() {
      wss.broadcast({ type: 'destroyPlayer', id: id });
      updatePlayerPositions();
    });

    ws.on('message', function incoming(message) {
      const msg = JSON.parse(message);
      const messageHandlers = {
        movePlayer() {
          // TODO: see what happens if client sends a message with a y < 0 or > 100. prevent cheating if necessary.
          ws.paddle = { y: msg.y };
          wss.broadcast(msg);
        }
      };
      messageHandlers[msg.type]();
    });
  });

  // server game loop
  const fps = 60;
  const refreshRate = 1000 / fps;
  const broadcastRate = 6; // broadcasts per second
  const framesPerBroadcast = fps / broadcastRate; // skip this many frames between updating clients
  let frame = 0;

  const newBall = function() {
    return {
      position: { x: 50, y: 50 },
      velocity: { x: -0.2, y: -0.3 }
    };
  };
  const newScore = function() {
    // teams A & B
    return { a: 0, b: 0 };
  };
  let ball = newBall();
  let score = newScore();

  const loop = setInterval(function() {
    const ballWidth = 1;
    const ballHeight = 1;
    ball.position.x = ball.position.x + ball.velocity.x;
    ball.position.y = ball.position.y + ball.velocity.y;

    // bounce off the walls if we hit them
    if (ball.position.y < 0 || ball.position.y + ballHeight > 100) {
      ball.velocity.y = -ball.velocity.y;
    }

    // bounce off of paddles if we hit them
    // loop through paddles and calculate bounds of each based on paddle height, current positions and container heights
    let hasBounced = false;
    wss.clients.forEach(function(client) {
      if (hasBounced) {
        return;
      }
      const paddleHeight = 5;
      const paddleWidth = 1;

      // absolute paddle top/left position expressed as percentage of court width and height
      const paddle = {
        position: {
          x: client.paddleContainer.x,
          y: client.paddleContainer.y + ((client.paddle.y / 100) * paddleContainerHeight)
        }
      };

      if (ball.position.x + ballWidth >= paddle.position.x &&
        ball.position.x <= paddle.position.x + paddleWidth &&
        ball.position.y + ballHeight >= paddle.position.y &&
        ball.position.y <= paddle.position.y + paddleHeight) {
        ball.velocity.x = -ball.velocity.x;
        hasBounced = true;
      }
      // if ball is on one side of the paddle now but will be on the other side of the paddle next frame
      // and it's within the y bounds, bounce next frame
      /*if ((ball.position.x > paddle.position.x && ball.position.x + ball.velocity.x <= paddle.position.x) ||
          (ball.position.x < paddle.position.x && ball.position.x + ball.velocity.x >= paddle.position.x) &&
          // TODO: since paddles are so tall, just checking whether ball is within paddle bounds
          // may want to update to work like x check in case ball y velocity gets really fast
          // or paddles get shorter... but not sure how that would work since the ball usually
          // won't cross the x and y bounds in the same frame...
          ball.position.y + ballHeight >= paddle.position.y && ball.position.y <= paddle.position.y + paddleHeight
         ) {
        ball.velocity.x = -ball.velocity.x;
      }*/
    });

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

    // reset game at 11 points
    if (score.a >= 11 || score.b >= 11) {
      score = newScore();
    } else {
      if (frame % framesPerBroadcast === 0) {
        wss.broadcast({ type: 'moveBall', x: ball.position.x, y: ball.position.y });
      }
      frame++;
      if (frame > framesPerBroadcast) {
        frame = 0;
      }
    }
  }, refreshRate);
}());

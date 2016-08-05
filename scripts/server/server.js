(function() {  
  'use strict';

  const WebSocketServer = require('ws').Server;
  const wss = new WebSocketServer({ port: 8080 });
  const utils = require('../utils');

  wss.broadcast = function broadcast(msg) {
    const str = JSON.stringify(msg);

    wss.clients.forEach(function(client) {
      if (client.readyState !== client.OPEN) {
        console.log(client.id, 'state is', client.readyState);
        return;
      }

      client.send(str);
    });
  };

  const idGen = (function() {
    let id = 0;
    return function() {
      return 'user' + id++;
    };
  }());

  const getX = function(paddle) {
    // count the number of players on each side to keep things even
    let leftCount = 0;
    let rightCount = 0;
    wss.clients.forEach(function(client) {
      if (!client.paddleContainer) {
        return; // this player doesn't have a paddle (it's probably us), so don't count
      }
      if (client.paddleContainer.x < 50) {
        leftCount++;
      } else {
        rightCount++;
      }
    });
    if (leftCount > rightCount) {
      // spawn on right side
      return utils.randomIntBetween(50, 100 - paddle.width);
    } else {
      // spawn on left side
      return utils.randomIntBetween(0, 50 - paddle.width);
    }
  };

  wss.on('connection', function connection(ws) {
    const id = idGen();
    console.log(id, 'connected');
    ws.id = id;
    // TODO: what the heck? paddle height should be 5, but it didn't work until i doubled it
    // could this have something to do with the 16:9 aspect ratio and vws?
    ws.paddle = { position: {y: 45}, width: 1, height: 10 };
    ws.paddle.position.x = getX(ws.paddle);
    wss.broadcast({type: 'spawnPlayer', id: ws.id, x: ws.paddle.position.x});

    // we always want to stringify our data
    ws.sendStr = function(msg) {
      // don't send if client has disconnected or otherwise does not exist
      if (wss.clients.indexOf(ws) === -1 || ws.readyState !== ws.OPEN) {
        console.log(ws.id, 'state is', ws.readyState);
        return;
      }

      ws.send(JSON.stringify(msg));
    };

    ws.sendStr({ type: 'id', id }); // inform client of its id
    ws.sendStr({ type: 'score', score }); // inform client of current score

    ws.on('close', function() {
      wss.broadcast({ type: 'destroyPlayer', id: id });
      console.log(id, 'disconnected');
    });

    ws.on('message', function incoming(message) {
      const msg = JSON.parse(message);
      const messageHandlers = {
        movePlayer() {
          // TODO: see what happens if client sends a message with a y < 0 or > 100. prevent cheating if necessary.
          ws.paddle.position.y = msg.y;
          wss.broadcast(msg);
        }
      };
      messageHandlers[msg.type]();
    });
  });

  // server game loop
  const fps = 60;
  const refreshRate = 1000 / fps;
  const broadcastRate = 24; // broadcasts per second
  const framesPerBroadcast = fps / broadcastRate; // skip this many frames between updating clients
  const ballSize = 2; // ball width and height // TODO: what the heck? should be 1, but doubling the value makes it work better
  let frame = 0;

  const newBall = function() {
    return {
      position: { x: 50 - (ballSize / 2), y: 50 - (ballSize / 2) },
      velocity: { x: -0.4, y: 0 }
    };
  };
  const newScore = function() {
    // teams A & B
    return { a: 0, b: 0 };
  };
  let ball = newBall();
  let score = newScore();

  const loop = setInterval(function() {
    ball.position.x = ball.position.x + ball.velocity.x;
    ball.position.y = ball.position.y + ball.velocity.y;

    // bounce off the walls if we hit them
    if (ball.position.y < 0 || ball.position.y + ballSize > 100) {
      ball.velocity.y = -ball.velocity.y;
    }

    // bounce off of paddles if we hit them
    // loop through paddles and calculate bounds of each based on paddle height & current positions
    let hasBounced = false;
    wss.clients.forEach(function(client) {
      if (hasBounced) {
        return;
      }

      var objectsAreColliding = function(a, b) {
        return a.position.x < b.position.x + b.width &&
        a.position.x + a.width > b.position.x &&
        a.position.y < b.position.y + b.height &&
        a.height + a.position.y > b.position.y;
      };

      var ballIntersectsPaddle = objectsAreColliding(client.paddle, Object.assign({}, ball, {width: ballSize, height: ballSize}));

      if (ballIntersectsPaddle) {
        (function bounceOffPaddle() {
          // ensure ball doesn't get stuck in paddle
          if (ball.velocity.x > 0) { // ball hits paddle from the left
            ball.position.x = client.paddle.position.x - ballSize;
          } else { // from the right
            ball.position.x = client.paddle.position.x + client.paddle.width;
          }
          // this calculation borrowed/adapted from Max Wihlborg
          // https://www.youtube.com/watch?v=KApAJhkkqkA
          // allows the player to alter the direction of the ball based on where it hits the paddle
          var n = (ball.position.y + ballSize - client.paddle.position.y) / (client.paddle.height + ballSize); // normalized -- 0 to 1
          var fortyFiveDegrees = 0.25 * Math.PI;
          var n2 = 2 * n - 1; // gives a number from -1 to 1
          var phi = fortyFiveDegrees * n2;
          ball.velocity.x = -ball.velocity.x;
          ball.velocity.y = Math.sin(phi);
          hasBounced = true;
        }());
      }
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

    const maxScore = 7;
    if (score.a >= maxScore || score.b >= maxScore) {
      score = newScore(); // reset score
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

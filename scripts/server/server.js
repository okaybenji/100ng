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
      if (!client.paddle.position.x) {
        return; // this player doesn't have a paddle x yet (it's probably us), so don't count
      }
      if (client.paddle.position.x < 50) {
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

    // ws.paddle = { width: 1, height: 5 };
    ws.paddle = { width: 1, height: 10 }; // TODO: what the heck? why does doubling the height make collision detection almost work right?
    ws.paddle.position = { y: 50 - (ws.paddle.height / 2) };
    ws.paddle.position.x = getX(ws.paddle);
    ws.color = utils.randomColor();

    // spawn paddles for all existing connections (except for this one) on the client that just connected
    wss.clients.forEach(function(client) {
      if (client.id === id) {
        return;
      }
      ws.sendStr({ type: 'spawnPlayer', id: client.id, x: client.paddle.position.x, y: client.paddle.position.y, color: client.color });
    });

    // spawn this player on all clients (including this one)
    wss.broadcast({ type: 'spawnPlayer', id, x: ws.paddle.position.x, y: ws.paddle.position.y, color: ws.color });

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
  let frame = 0;

  const newBall = function() {
    let ball = {
      velocity: { x: -0.4, y: 0 },
      width: 1,
      // height: 1
      height: 2 // TODO: what the heck? why does doubling the height make collision detection almost work right?
    };
    ball.position = { x: 50 - (ball.width / 2), y: 50 - (ball.height / 2) };
    return ball;
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
    if (ball.position.y < 0 || ball.position.y + ball.height > 100) {
      // ensure ball doesn't get stuck in wall
      if (ball.velocity.y > 0) { // ball hits bottom wall
        ball.position.y = 100 - ball.height;
      } else { // top wall
        ball.position.y = 0;
      }
      ball.velocity.y = -ball.velocity.y;
    }

    // bounce off of paddles if we hit them
    // loop through paddles and calculate bounds of each based on paddle height & current positions
    let hasBounced = false;
    wss.clients.forEach(function(client) {
      if (hasBounced) {
        return;
      }

      const objectsAreColliding = function(a, b) {
        return a.position.x < b.position.x + b.width &&
        a.position.x + a.width > b.position.x &&
        a.position.y < b.position.y + b.height &&
        a.height + a.position.y > b.position.y;
      };

      const ballIntersectsPaddle = objectsAreColliding(client.paddle, ball);
      // predict whether the ball would 'phase through' the paddle due to its velocity
      // TODO: prediction could be improved by calculating where ball y would have been when it crossed the paddle's x,
      // and taking into account a bounce if it would have hit the wall in the meantime
      const ballWillIntersectPaddle = (function() {
        let ballYNextFrame = ball.position.y + ball.velocity.y;
        // force ballNextFrame to wall if it would've crossed wall boundary
        ballYNextFrame = ballYNextFrame < 0 ? 0 : ballYNextFrame + ball.height > 100 ? 100 - ball.height : ballYNextFrame;
        const ballNextFrame = Object.assign({}, ball, {position: {x: ball.position.x + ball.velocity.x, y: ballYNextFrame}});
        let ballWillPhaseThroughPaddle;
        const ballYDoesAndWillIntersectPaddleY =
          ball.position.y < client.paddle.position.y + client.paddle.height &&
          ball.height + ball.position.y > client.paddle.position.y &&
          ballNextFrame.position.y < client.paddle.position.y + client.paddle.height &&
          ballNextFrame.height + ballNextFrame.position.y > client.paddle.position.y;
        if (ball.velocity.x > 0) { // ball moving rightward
          ballWillPhaseThroughPaddle = ball.position.x + ball.width < client.paddle.position.x &&
              ballNextFrame.position.x > client.paddle.position.x + client.paddle.width &&
              ballYDoesAndWillIntersectPaddleY;
        } else { // ball moving rightward
          ballWillPhaseThroughPaddle = ball.position.x > client.paddle.position.x + client.paddle.width &&
              ballNextFrame.position.x + ballNextFrame.width < client.paddle.position.x &&
              ballYDoesAndWillIntersectPaddleY;
        }
        return ballWillPhaseThroughPaddle;
      }());

      if (ballIntersectsPaddle || ballWillIntersectPaddle) {
        (function bounceOffPaddle() {
          // ensure ball doesn't get stuck in paddle
          if (ball.velocity.x > 0) { // ball hits paddle from the left
            ball.position.x = client.paddle.position.x - ball.height;
          } else { // from the right
            ball.position.x = client.paddle.position.x + client.paddle.width;
          }
          // this calculation borrowed/adapted from Max Wihlborg
          // https://www.youtube.com/watch?v=KApAJhkkqkA
          // allows the player to alter the direction of the ball based on where it hits the paddle
          const n = (ball.position.y + ball.width - client.paddle.position.y) / (client.paddle.height + ball.height); // normalized -- 0 to 1
          const fortyFiveDegrees = 0.25 * Math.PI;
          const n2 = 2 * n - 1; // gives a number from -1 to 1
          const phi = fortyFiveDegrees * n2;
          ball.velocity.x = -ball.velocity.x;
          ball.velocity.y = Math.sin(phi);
          // increase ball speed
          ball.velocity.x *= 1.05;
          ball.velocity.y *= 1.05;
          hasBounced = true;
          wss.broadcast({ type: 'hit' });
        }());
      }
    });

    // update score and reposition ball if a goal is scored
    if (ball.position.x < 0) {
      score.b++;
      ball = newBall();
      wss.broadcast({ type: 'goal' });
      wss.broadcast({ type: 'score', score });
    } else if (ball.position.x > 100) {
      score.a++;
      ball = newBall();
      // change ball direction to serve toward team b
      ball.velocity.x *= -1;
      wss.broadcast({ type: 'goal' });
      wss.broadcast({ type: 'score', score });
    }

    const maxScore = 11;
    if (score.a >= maxScore || score.b >= maxScore) {
      score = newScore(); // reset score
      wss.broadcast({ type: 'win' });
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

// TODO: move these inside createSocket (here for now for console debugging)
let players = {};
let player; // ourself/client avatar

// update players' y reach based on number of players
// the more players connected, the less players should be able to move
const updatePlayers = function() {
  const playerKeys = Object.keys(players);
  const numPlayers = playerKeys.length;
  var reach = utils.getReach(numPlayers);

  playerKeys.forEach(function(key) {
    const plr = players[key];
    plr.paddleContainer.style.height = reach + 'vw';
    plr.paddle.style.top = plr.paddleContainer.style.height / 3 + 'vw';
  });
};

const createSocket = function() {
  const ws = new WebSocket('ws://localhost:8080');
  let id;

  ws.onmessage = function(data, flags) {
    const msg = JSON.parse(data.data);
//    console.log('received message:', msg);

    const messageHandlers = {
      id() {
        id = msg.id;
      },
      spawnPlayer() {
        if (msg.id === id) {
          player = players[msg.id] = createPlayer(game, {x: msg.x, y: msg.y, isClient: true});
        } else {
          players[msg.id] = createPlayer(game, {x: msg.x, y: msg.y});
        }
        updatePlayers();
      },
      movePlayer() {
        // TODO: interpolate movement!
        if (msg.id !== id) { // ignore this msg if it's us!
          players[msg.id].paddle.style.top = msg.y + '%'; // update player position
        }
      },
      destroyPlayer() {
        // TODO: test this -- it may not be working
        if (players[msg.id]) {
          console.log('destroy player:', msg.id);
          var plr = players[msg.id];
          plr.paddleContainer.removeChild(plr.paddle);
          game.removeChild(plr.paddleContainer);
          plr = null;
          updatePlayers();
        }
      },
      moveBall() {
        ball.style.left = msg.x + '%';
        ball.style.top = msg.y + '%';
      },
      score() {
        scoreA.innerHTML = msg.score.a;
        scoreB.innerHTML = msg.score.b;
      }
    };

    messageHandlers[msg.type]();
  };

  return {
    send(message) {
      // append client id to all outgoing messages
      const messageWithId = Object.assign({}, message, {id: id});
      const msg = JSON.stringify(messageWithId);
      ws.send(msg);
    }
  };
};

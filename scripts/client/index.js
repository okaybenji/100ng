// TODO: move these inside startGame (here for now for console debugging)
let players = {};
let player; // ourself/client avatar

(function startGame() {
  // const ws = new WebSocket('wss://138.68.12.151:8080'); // Digital Ocean server -- does NOT work over WSS
  const ws = new WebSocket('wss://l00ng-okaybenji.c9users.io:8080'); // Cloud 9 server -- works over WSS
  const game = document.querySelector('#game');
  const scoreA = document.querySelector('#a.score');
  const scoreB = document.querySelector('#b.score');
  const ball = document.querySelector('.ball');
  let id;

  const socket = {
    send(message) {
      // append client id to all outgoing messages
      const messageWithId = Object.assign({}, message, {id: id});
      const msg = JSON.stringify(messageWithId);
      ws.send(msg);
    }
  };

  // update players' y reach based on number of players
  // the more players connected, the less players should be able to move
  const updatePlayers = function() {
    const playerKeys = Object.keys(players);
    const numPlayers = playerKeys.length;
    var reach = utils.getReach(numPlayers);

    playerKeys.forEach(function(key) {
      const plr = players[key];
      plr.paddleContainer.style.height = reach + '%';
    });
  };

  const destroy = function(playerId) {
    var plr = players[playerId];
    plr.paddleContainer.removeChild(plr.paddle);
    game.removeChild(plr.paddleContainer);
    delete players[playerId]; // remove player from players to update reach
  };

  ws.onmessage = function(data, flags) {
    const msg = JSON.parse(data.data);
    // console.log('received message:', msg);

    const messageHandlers = {
      id() {
        id = msg.id;
      },
      spawnPlayer() {
        const isClient = msg.id === id;
        const options = {x: msg.x, y: msg.y, isClient};

        players[msg.id] = createPlayer(game, socket, options);
        updatePlayers();

        if (isClient) {
          player = players[msg.id];
        }
      },
      movePlayer() {
        // TODO: interpolate movement!
        if (msg.id !== id) { // ignore this msg if it's us!
          players[msg.id].paddle.style.top = msg.y + '%'; // update player position
        }
      },
      destroyPlayer() {
        if (players[msg.id]) {
          destroy(msg.id);
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

  // auto-reconnect if server reboots
  ws.onclose = function() {
    setTimeout(function() {
      for (let plr in players) {
        destroy(plr);
      }
      startGame();
    }, 3000);
  };
}());

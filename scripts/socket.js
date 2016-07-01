// TODO: move these inside createSocket (here for now for console debugging)
let players = {};
let player; // ourself/client avatar

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
      spawn() {
        if (msg.id === id) {
          player = players[msg.id] = createPlayer(game, {x: msg.x, y: msg.y, isClient: true});
        } else {
          players[msg.id] = createPlayer(game, {x: msg.x, y: msg.y});
        }
      },
      move() {
        // TODO: interpolate movement!
        if (msg.id !== id) { // ignore this msg if it's us!
          players[msg.id].style.top = msg.y + '%'; // update player position
        }
      },
      destroy() {
        // TODO: test this -- it may not be working
        if (players[msg.id]) {
          players[msg.id] = null;
        }
      },
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

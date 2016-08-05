const createPaddle = function(game, socket, options) {
  const paddle = document.createElement('div');
  paddle.left = options.x + '%';
  paddle.classList.add('paddle');
  paddle.style.backgroundColor = utils.randomColor();
  game.appendChild(paddle);
  paddle.style.top = '45%'; // 50% - 1/2 paddle height

  // add mouse controls if this paddle is the one we (the player) are to control
  if (options.isClient) {
    let startY = 0;

    game.addEventListener('mousemove', function movePaddle(event) {
      let newY = event.clientY - startY;
      const maxY = game.offsetHeight - paddle.offsetHeight;
      newY = newY < 0 ? 0 : newY > maxY ? maxY : newY;
      paddle.style.top = newY;

      if (newY === 0) {
        startY = event.clientY;
      } else if (newY === maxY) {
        startY = event.clientY - maxY;
      }

      const percent = newY / 100;
      socket.send({type: 'movePlayer', y: percent});
    });
  }

  return paddle;
};

const createPlayer = function(game, socket, options) {
  // paddleContainer is invisible div container which defines a paddle's boundaries
  const paddleContainer = document.createElement('div');
  paddleContainer.classList.add('paddleContainer');
  game.appendChild(paddleContainer);
  paddleContainer.style.left = options.x + '%';
  paddleContainer.style.top = options.y + '%';

  const paddle = document.createElement('div');
  paddle.classList.add('paddle');
  paddle.style.backgroundColor = utils.randomColor();
  paddleContainer.appendChild(paddle);
  paddle.style.top = '45%';

  if (options.isClient) {
    let startY = 0;

    game.addEventListener('mousemove', function movePaddle(event) {
      let newY = event.clientY - startY;
      const maxY = paddleContainer.offsetHeight - paddle.offsetHeight;
      newY = newY < 0 ? 0 : newY > maxY ? maxY : newY;
      paddle.style.top = newY;

      if (newY === 0) {
        startY = event.clientY;
      } else if (newY === maxY) {
        startY = event.clientY - maxY;
      }

      const percent = (newY / paddleContainer.offsetHeight) * 100;
      socket.send({type: 'movePlayer', y: percent});
    });
  }

  return { paddleContainer, paddle };
};

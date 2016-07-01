const createPlayer = function(game, options) {
  const paddleContainer = PaddleContainer();
  game.appendChild(paddleContainer);

  // subtract container paddle dimensions to keep it from appearing partially off the court
  // position paddle container after it's added so it has dimensions to calculate from
  // TODO: set these based on values received from the server
  paddleContainer.style.left = utils.randomIntBetween(0, game.offsetWidth - paddleContainer.offsetWidth);
  paddleContainer.style.top = utils.randomIntBetween(0, game.offsetHeight - paddleContainer.offsetHeight);
  //paddleContainer.style.left = game.offsetWidth - paddleContainer.offsetWidth;
  //paddleContainer.style.top = game.offsetHeight - paddleContainer.offsetHeight;

  const paddle = Paddle();
  paddleContainer.appendChild(paddle);

  paddle.style.backgroundColor = utils.randomColor();
  paddleContainer.appendChild(paddle);
  
  if (options.isClient) {
    let startY = 0;

    game.addEventListener('mousemove', function(event) {
      let newY = event.clientY - startY;
      const maxY = paddleContainer.offsetHeight - paddle.offsetHeight;
      newY = newY < 0 ? 0 : newY > maxY ? maxY : newY;
      paddle.style.top = newY;

      if (newY === 0) {
        startY = event.clientY;
      } else if (newY === maxY) {
        startY = event.clientY - maxY;
      }
    });
  }
};

const game = document.querySelector('#game');

const paddleContainer = PaddleContainer();
game.appendChild(paddleContainer);

// subtract container paddle dimensions to keep it from appearing partially off the court
// position paddle container after it's added so it has dimensions to calculate from
//paddleContainer.style.left = utils.randomIntBetween(0, game.clientWidth - paddleContainer.clientWidth);
//paddleContainer.style.top = utils.randomIntBetween(0, game.clientHeight - paddleContainer.clientHeight);
paddleContainer.style.left = game.clientWidth - paddleContainer.clientWidth;
paddleContainer.style.top = game.clientHeight - paddleContainer.clientHeight;

const paddle = Paddle();
paddleContainer.appendChild(paddle);

paddle.style.backgroundColor = utils.randomColor();
paddleContainer.appendChild(paddle);

/*game.onmousemove(function(event) {
  
});*/
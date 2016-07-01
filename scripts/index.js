const game = document.querySelector('#game');

const paddle = Paddle();
paddle.style.backgroundColor = utils.randomColor();
game.appendChild(paddle);
// subtract paddle dimensions to keep it from appearing partially off the court
// position paddle after it's added so it has dimensions to calculate from
paddle.style.left = utils.randomIntBetween(0, game.clientWidth - paddle.clientWidth);
paddle.style.top = utils.randomIntBetween(0, game.clientHeight - paddle.clientHeight);

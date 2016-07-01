const game = document.querySelector('#game');

const paddle = Paddle();
//paddle.style.left = utils.randomIntBetween(0, game.offsetWidth - paddle.offsetWidth);
//paddle.style.top = utils.randomIntBetween(0, game.offsetHeight - paddle.offsetHeight);
paddle.style.left = utils.randomIntBetween(0, utils.toNumber(utils.getWidth(game)) -  utils.toNumber(utils.getWidth(paddle))) + 'px';
paddle.style.top = utils.randomIntBetween(0,  utils.toNumber(utils.getHeight(game)) - utils.toNumber(utils.getHeight(paddle))) + 'px';
paddle.style.backgroundColor = utils.randomColor();
game.appendChild(paddle);

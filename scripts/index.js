const createPlayer = function(game, options) {
//  console.log('creating player with options:', options);

  // paddleContainer is invisible div container which defines a paddle's boundaries
  const paddleContainer = document.createElement('div');
  paddleContainer.classList.add('paddleContainer');
  game.appendChild(paddleContainer);
  paddleContainer.style.left = options.x + 'vw';
  paddleContainer.style.top = options.y + 'vw';

  const paddle = document.createElement('div');
  paddle.classList.add('paddle');
  paddle.style.backgroundColor = utils.randomColor();
  paddleContainer.appendChild(paddle);

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

const game = document.querySelector('#game');
const socket = createSocket(); // handles updating game state (score, ball position, players) according to server messages
const scoreA = document.querySelector('#a.score');
const scoreB = document.querySelector('#b.score');
const ball = document.createElement('div');
ball.classList.add('ball');
game.appendChild(ball);

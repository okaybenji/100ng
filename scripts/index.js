const game = document.querySelector('#game');
const socket = createSocket();
const ball = document.createElement('div');
ball.classList.add('ball');
game.appendChild(ball);

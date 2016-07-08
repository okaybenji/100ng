const game = document.querySelector('#game');
const socket = createSocket();
const ball = document.createElement('div');
const scoreA = document.querySelector('#a.score');
const scoreB = document.querySelector('#b.score');
ball.classList.add('ball');
game.appendChild(ball);

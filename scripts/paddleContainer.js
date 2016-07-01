/**
 * An invisible div container which defines a paddle's boundaries
 */
const PaddleContainer = function() {
  const paddleContainer = document.createElement('div');
  paddleContainer.classList.add('paddleContainer');

  return paddleContainer;
};

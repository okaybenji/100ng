const utils = {
  randomIntBetween(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  },
  randomColor() {
    const minBrightness = 25;

    let color = 'hsl(';
    color += utils.randomIntBetween(0, 360) + ',';
    color += utils.randomIntBetween(0, 100) + '%,';
    color += utils.randomIntBetween(minBrightness, 100) + '%)';
    return color;
  },
  /**
   * Calculate players' y reach based on number of players.
   * The more players connected, the less players should be able to move
   * Should change with every *other* player connected.
   * (1 or 2 players should have full reach, for instance)
   */
  getReach(numPlayers) {
    // TODO: tune this
    // right now, 1 or 2 players gives 100%, 3 or 4 gives 1/2, 5 or 6 gives 1/3, 7 or 8 gives 1/4, etc.
    const numPlayersIsEven = numPlayers % 2 === 0;
    return numPlayersIsEven ? 54.1 / (numPlayers / 2) : 54.1 / ((numPlayers + 1) / 2);
  }
};

if (typeof module !== 'undefined') {
  module.exports = utils;
}

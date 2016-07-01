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
  /*getPropertyValue(propName, element) {
    return window.getComputedStyle(element).getPropertyValue(propName);
  },
  getWidth(element) {
    console.log(this.getPropertyValue('width', element));
    return this.getPropertyValue('width', element);
  },
  getHeight(element) {
    return this.getPropertyValue('height', element);
  },
  toNumber(value) {
    // removes anything from a string value which is not a digit, dot or minus sign
    const numString = value.replace(/[^-\d\.]/g, '');
    return Number(numString);
  }*/
};

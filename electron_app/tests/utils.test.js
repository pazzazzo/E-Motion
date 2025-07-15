const Utils = require('../src/classes/Utils');

describe('Utils format functions', () => {
  const utils = new Utils();

  test('formatNumberDec returns correct decimals', () => {
    expect(utils.formatNumberDec(5)).toBe('5.0');
    expect(utils.formatNumberDec(5.25)).toBe('5.25');
  });

  test('formatNumberLen adds leading zero when needed', () => {
    expect(utils.formatNumberLen(3)).toBe('03');
    expect(utils.formatNumberLen(12)).toBe('12');
  });
});

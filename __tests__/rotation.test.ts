import { getAutoThemeForDate } from '../src/theme/rotation';

describe('Theme Rotation', () => {
  it('should return red for a specific base date', () => {
    // 1970-01-01 is 0 days since epoch. 0 % 4 = 0 -> 'red'
    const date = new Date('1970-01-01T12:00:00.000Z');
    expect(getAutoThemeForDate(date)).toBe('red');
  });

  it('should return green for the next day', () => {
    // 1970-01-02 is 1 day since epoch. 1 % 4 = 1 -> 'green'
    const date = new Date('1970-01-02T12:00:00.000Z');
    expect(getAutoThemeForDate(date)).toBe('green');
  });

  it('should return white for the 3rd day', () => {
    const date = new Date('1970-01-03T12:00:00.000Z');
    expect(getAutoThemeForDate(date)).toBe('white');
  });

  it('should return purple for the 4th day', () => {
    const date = new Date('1970-01-04T12:00:00.000Z');
    expect(getAutoThemeForDate(date)).toBe('purple');
  });

  it('should cycle back to red on the 5th day', () => {
    const date = new Date('1970-01-05T12:00:00.000Z');
    expect(getAutoThemeForDate(date)).toBe('red');
  });

  it('should handle dates before the epoch', () => {
    // 1969-12-31 is -1 days since epoch.
    // -1 % 4 in JS is -1. (-1 + 4) % 4 = 3 -> 'purple'
    const date = new Date('1969-12-31T12:00:00.000Z');
    expect(getAutoThemeForDate(date)).toBe('purple');
  });
});

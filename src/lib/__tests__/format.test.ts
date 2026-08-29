import { describe, expect, it } from 'vitest';
import { spelledOutCount } from '../format';

describe('spelledOutCount', () => {
  it('spells out zero through ten', () => {
    expect(spelledOutCount(0)).toBe('zero');
    expect(spelledOutCount(1)).toBe('one');
    expect(spelledOutCount(4)).toBe('four');
    expect(spelledOutCount(10)).toBe('ten');
  });

  it('falls back to the digit above ten', () => {
    expect(spelledOutCount(11)).toBe('11');
    expect(spelledOutCount(100)).toBe('100');
  });
});

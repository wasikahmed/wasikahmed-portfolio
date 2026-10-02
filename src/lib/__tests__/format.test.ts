import { describe, expect, it } from 'vitest';
import { fillCount, spelledOutCount } from '../format';

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

describe('fillCount', () => {
  it('fills the spelled-out count, capitalised or not', () => {
    expect(fillCount('{Count} systems, {count} in total.', 7)).toBe(
      'Seven systems, seven in total.',
    );
  });

  it('drops the plural suffix for exactly one', () => {
    expect(fillCount('{Count} project{s} live.', 1)).toBe('One project live.');
    expect(fillCount('{Count} project{s} live.', 2)).toBe('Two projects live.');
  });

  it('leaves copy without tokens untouched', () => {
    expect(fillCount('Selected work.', 3)).toBe('Selected work.');
  });
});

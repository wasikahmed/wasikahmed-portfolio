import { describe, expect, it } from 'vitest';
import { clamp } from '../utils';

describe('clamp', () => {
  it('returns the value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps to the minimum', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('clamps to the maximum', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

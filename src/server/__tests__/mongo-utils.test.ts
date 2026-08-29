import { describe, expect, it } from 'vitest';
import { normalizeDoc } from '../mongo-utils';

/**
 * PLAN.md W5 — the Zod/Mongoose "drift" was really this: normalizeDoc used
 * to pass Date fields through untouched, so every public interface's
 * `createdAt`/`publishedAt: string` was a lie until something happened to
 * JSON.stringify it. This is the fix under test.
 */
describe('normalizeDoc', () => {
  it('converts _id to a string id and drops __v', () => {
    const result = normalizeDoc({ _id: { toString: () => 'abc123' }, __v: 0, title: 'Hi' });
    expect(result).toEqual({ id: 'abc123', title: 'Hi' });
  });

  it('converts every top-level Date field to an ISO string', () => {
    const createdAt = new Date('2024-01-01T00:00:00.000Z');
    const publishedAt = new Date('2024-06-15T12:30:00.000Z');
    const result = normalizeDoc({ _id: 'x', title: 'Hi', createdAt, publishedAt });

    expect(result.createdAt).toBe('2024-01-01T00:00:00.000Z');
    expect(result.publishedAt).toBe('2024-06-15T12:30:00.000Z');
    expect(typeof result.createdAt).toBe('string');
  });

  it('leaves non-Date fields untouched', () => {
    const result = normalizeDoc({ _id: 'x', title: 'Hi', count: 3, tags: ['a', 'b'] });
    expect(result).toMatchObject({ title: 'Hi', count: 3, tags: ['a', 'b'] });
  });

  it('leaves an absent optional Date field absent, not null', () => {
    const result = normalizeDoc({ _id: 'x', publishedAt: undefined });
    expect(result.publishedAt).toBeUndefined();
  });
});

import { describe, expect, it } from 'vitest';
import { can, PERMISSIONS, ROLES, type Permission, type Role } from '../permissions';

/**
 * The permission matrix, exhaustively (PLAN.md W14 item 1) — `can()` is a
 * pure function, so every role × every permission is assertable with no
 * database in the loop. The expected sets below are written out by hand
 * rather than imported from permissions.ts's own internals: a test that
 * re-derives its expectation from the same source it's testing can never
 * catch a real regression in that source.
 */

const EXPECTED: Record<Role, ReadonlySet<Permission>> = {
  viewer: new Set(['content:read', 'lead:read', 'media:read']),
  editor: new Set([
    'content:read',
    'lead:read',
    'media:read',
    'content:write',
    'content:publish',
    'content:reorder',
    'media:write',
  ]),
  admin: new Set([
    'content:read',
    'lead:read',
    'media:read',
    'content:write',
    'content:publish',
    'content:reorder',
    'media:write',
    'content:delete',
    'lead:write',
    'media:delete',
    'settings:read',
    'settings:write',
    'user:read',
    'user:write',
    'user:delete',
    'audit:read',
    'apikey:read',
    'apikey:write',
    'apikey:revoke',
  ]),
  // Same permission set as admin — the difference is ownership transfer
  // and the demote/suspend/delete guards (PLAN.md W11), neither of which
  // is a `can()` check.
  owner: new Set([
    'content:read',
    'lead:read',
    'media:read',
    'content:write',
    'content:publish',
    'content:reorder',
    'media:write',
    'content:delete',
    'lead:write',
    'media:delete',
    'settings:read',
    'settings:write',
    'user:read',
    'user:write',
    'user:delete',
    'audit:read',
    'apikey:read',
    'apikey:write',
    'apikey:revoke',
  ]),
};

describe('can() — the full role × permission matrix', () => {
  for (const role of ROLES) {
    for (const permission of PERMISSIONS) {
      const expected = EXPECTED[role].has(permission);
      it(`${role} ${expected ? 'has' : 'lacks'} ${permission}`, () => {
        expect(can({ role }, permission)).toBe(expected);
      });
    }
  }
});

describe('can() — edge cases', () => {
  it('returns false for a null session', () => {
    expect(can(null, 'content:read')).toBe(false);
  });

  it('returns false for an undefined session', () => {
    expect(can(undefined, 'content:read')).toBe(false);
  });

  it('every role is strictly additive up the hierarchy (viewer ⊆ editor ⊆ admin)', () => {
    for (const permission of EXPECTED.viewer) expect(EXPECTED.editor.has(permission)).toBe(true);
    for (const permission of EXPECTED.editor) expect(EXPECTED.admin.has(permission)).toBe(true);
  });

  it('owner and admin grant exactly the same permission strings', () => {
    expect([...EXPECTED.owner].sort()).toEqual([...EXPECTED.admin].sort());
  });
});

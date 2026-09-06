/**
 * Permission strings and the role→permission matrix (PLAN.md W9).
 *
 * Shaped `<resource>:<action>` rather than one permission per collection —
 * projects, posts, testimonials, experience, tech, and skill groups all go
 * through the same `admin-crud.ts` factory and the same forms, so nobody
 * realistically needs "can edit projects but not posts." A single
 * `content:` bucket collapses what would otherwise be a 30-entry matrix
 * (six collections × five actions) maintained to express a distinction no
 * one wants. If that need appears later, splitting `content:` is
 * mechanical; collapsing 30 permissions back into 5 is not.
 *
 * `content:publish` is kept separate from `content:write` deliberately —
 * draft freely, but pushing to the live site is a different act, and it
 * maps directly onto the existing `get*`/`getAll*` visibility split
 * (AGENTS.md §6, rule 7).
 *
 * This module is pure — no Mongoose, no `server-only` — so it can be
 * imported from the User model, route handlers, and (eventually) client
 * code that just needs the `Role`/`Permission` types.
 */

export const PERMISSIONS = [
  'content:read',
  'content:write',
  'content:publish',
  'content:reorder',
  'content:delete',
  'lead:read',
  'lead:write',
  'media:read',
  'media:write',
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
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/**
 * Fixed roles, not a database collection — call sites check
 * `can(session, 'content:publish')` and never a role name, so the
 * role→permission matrix stays a pure function, exhaustively testable
 * without a database (PLAN.md W14 item 1).
 *
 * `owner` is a singleton, set only by `pnpm seed:admin`, and carries every
 * `admin` permission plus one capability that is *not* expressed as a
 * permission string: ownership transfer. That's deliberately special-cased
 * in the route that implements it (PLAN.md W11) rather than modeled as
 * e.g. `owner:transfer` — there is exactly one owner, so a permission
 * string that could theoretically be granted to a second role would be
 * misleading.
 */
export const ROLES = ['viewer', 'editor', 'admin', 'owner'] as const;

export type Role = (typeof ROLES)[number];

const VIEWER_PERMISSIONS: readonly Permission[] = ['content:read', 'lead:read', 'media:read'];

// `content:publish` deliberately excluded here — an editor drafts freely
// (content:write) and can reorder the published list, but pushing a draft
// live is admin's call. PLAN.md's original W9 role-matrix table listed
// `content:publish` under `editor`, which would make the permission a
// no-op today (every role that can write could also publish, and the
// stated rationale for splitting it — "draft freely, but pushing to the
// live site is a different act" — would describe nothing any role
// actually can't do). Corrected here to match that rationale and PLAN.md
// W14's own acceptance test ("an editor without content:publish
// submitting status: 'published' must be rejected"), which only makes
// sense if editor lacks it. Caught by that exact test going red before
// this fix landed.
const EDITOR_PERMISSIONS: readonly Permission[] = [
  ...VIEWER_PERMISSIONS,
  'content:write',
  'content:reorder',
  'media:write',
];

const ADMIN_PERMISSIONS: readonly Permission[] = [
  ...EDITOR_PERMISSIONS,
  'content:publish',
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
];

// `owner` grants exactly the same permission strings as `admin` — the
// difference between the two is ownership transfer (see the ROLES comment
// above) and the demote/suspend/delete guards enforced in the W11 user
// routes, neither of which is a `can()` check.
const OWNER_PERMISSIONS: readonly Permission[] = ADMIN_PERMISSIONS;

const ROLE_PERMISSIONS: Readonly<Record<Role, ReadonlySet<Permission>>> = {
  viewer: new Set(VIEWER_PERMISSIONS),
  editor: new Set(EDITOR_PERMISSIONS),
  admin: new Set(ADMIN_PERMISSIONS),
  owner: new Set(OWNER_PERMISSIONS),
};

/**
 * The one function anything outside this module should call — nothing
 * else reads `ROLE_PERMISSIONS` directly. Takes a bare `{ role }` rather
 * than the full `AdminSession` so it has no dependency on `session.ts`
 * (which does depend on this module for the `Role` type) and stays usable
 * from a plain unit test with no Auth.js/Mongoose in the loop.
 *
 * Not yet called from any enforcement path — see PLAN.md W10, which makes
 * `getAdminSession()` database-backed and wires this into
 * `admin-crud.ts` and every hand-written admin route. Landing the matrix
 * itself first, ahead of enforcement, is what makes W9 pure addition: no
 * behaviour changes for the existing admin until W10 flips it on.
 */
export function can(session: { role: Role } | null | undefined, permission: Permission): boolean {
  if (!session) return false;
  return ROLE_PERMISSIONS[session.role].has(permission);
}

/**
 * Every permission a role currently grants — the default scope set for a
 * Bearer token issued to that role (PLAN.md W12), and the ceiling a
 * caller-requested narrower scope list is validated against. Returns a
 * fresh array (not the internal `Set`) since callers store this in a
 * token payload or a Mongoose document.
 */
export function permissionsForRole(role: Role): Permission[] {
  return [...ROLE_PERMISSIONS[role]];
}

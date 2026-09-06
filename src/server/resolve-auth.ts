import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from './db';
import { User } from './models/user';
import { getAdminSession, type AdminSession } from './session';
import { can, ROLES, type Permission, type Role } from './permissions';
import { verifyAccessToken } from './access-token';
import { verifyCsrf } from './csrf';

/**
 * One function ahead of every /api/admin/* permission check (PLAN.md
 * W12) — cookie or Bearer token, resolved to the same shape. Cookie: the
 * existing Auth.js session, database-backed exactly as W10 left it
 * (`getAdminSession()`). Bearer: the access token is verified
 * cryptographically, then the same "is this user still active" check
 * W10 added is repeated here against the token's subject — a stateless
 * JWT has no way to be revoked directly, so re-checking the database on
 * every use is what makes a suspension or demotion apply to a Bearer
 * session exactly as fast as it applies to a cookie one. This does
 * duplicate a few lines of `getAdminSession()`'s DB lookup rather than
 * sharing it: that function is wrapped in React's `cache()` and reads
 * its identity from Auth.js's `auth()`, neither of which fits a bearer
 * token's shape, and forcing the two through one implementation would
 * make both harder to read for a marginal reduction in line count.
 *
 * `scopes` is `null` for a cookie session — unrestricted by a token,
 * governed purely by the role matrix via `can()`. For a Bearer session
 * it's the permission list captured at token issuance, always
 * intersected with the user's *current* role: a token issued while its
 * owner was `admin` must not survive their demotion to `viewer`, even
 * though the token itself still lists the old scopes — `authorized()`
 * below is where that intersection happens, on every request, not once
 * at issuance.
 */
export interface ResolvedAuth {
  session: AdminSession | null;
  scopes: Permission[] | null;
  viaBearer: boolean;
}

export async function resolveAuth(request: NextRequest): Promise<ResolvedAuth> {
  const header = request.headers.get('authorization');
  if (header?.startsWith('Bearer ')) {
    return { ...(await resolveBearer(header.slice('Bearer '.length).trim())), viaBearer: true };
  }
  const session = await getAdminSession();
  return { session, scopes: null, viaBearer: false };
}

async function resolveBearer(token: string): Promise<Omit<ResolvedAuth, 'viaBearer'>> {
  const payload = await verifyAccessToken(token);
  if (!payload || !mongoose.Types.ObjectId.isValid(payload.sub)) {
    return { session: null, scopes: null };
  }

  await connectToDatabase();
  const user = await User.findById(payload.sub).lean();
  if (!user || user.status === 'suspended' || !ROLES.includes(user.role as Role)) {
    return { session: null, scopes: null };
  }

  return {
    session: {
      id: String(user._id),
      email: user.email,
      role: user.role as Role,
      totpEnabled: Boolean(user.totpSecret),
    },
    scopes: payload.scopes,
  };
}

/** The one place both the session's role and (when present) the token's scopes are checked. */
export function authorized(auth: ResolvedAuth, permission: Permission): boolean {
  if (!auth.session) return false;
  if (!can(auth.session, permission)) return false;
  if (auth.scopes && !auth.scopes.includes(permission)) return false;
  return true;
}

/**
 * The standard shape of "is this request allowed to do X" for every
 * permission-gated admin route — the six `content:`/`lead:` collections
 * behind admin-crud.ts's factory (PLAN.md W10) and every hand-written route
 * that isn't self-service (audit-log, leads, media, settings, mdx-preview,
 * users — PLAN.md W12 extended each of these off `getAdminSession()`+`can()`
 * directly onto this, the same day Bearer tokens shipped, once a live check
 * against the running app showed a Bearer-authenticated request 401ing on
 * every one of them: `resolveAuth()` existed, but nothing outside
 * admin-crud.ts was calling it yet).
 *
 * CSRF is skipped for a Bearer request, never for a cookie one — a Bearer
 * request carries no ambient cookie, so it cannot be forged cross-site the
 * way CSRF requires, and requiring the header would just break every
 * legitimate API client for no security benefit.
 *
 * Not used by the handful of deliberately session-only routes: password/
 * TOTP self-service (act on the caller's own account, no `can()` check to
 * begin with) and the auth/tokens list/revoke + transfer-ownership routes,
 * which stay cookie-gated on purpose — see each of their own comments.
 */
export async function requirePermission(
  request: NextRequest,
  permission: Permission,
): Promise<{ session: AdminSession; response: null } | { session: null; response: NextResponse }> {
  const auth = await resolveAuth(request);
  if (!auth.session) {
    return {
      session: null,
      response: NextResponse.json({ error: 'Not authenticated.' }, { status: 401 }),
    };
  }
  if (!authorized(auth, permission)) {
    return {
      session: null,
      response: NextResponse.json({ error: 'Not permitted.' }, { status: 403 }),
    };
  }
  if (!auth.viaBearer) {
    const csrfError = verifyCsrf(request);
    if (csrfError) return { session: null, response: csrfError };
  }
  return { session: auth.session, response: null };
}

import 'server-only';

import { SignJWT, jwtVerify, errors } from 'jose';
import type { Permission } from './permissions';

/**
 * Access tokens for the Bearer-token API (PLAN.md W12) — short-lived
 * (15 minutes), stateless, signed JWTs. Nothing about an access token is
 * ever stored: verifying one is pure cryptography plus, in
 * resolve-auth.ts, one User lookup to confirm the account is still
 * active and to re-derive current permissions. This is the piece `jose`
 * was kept in the dependency graph for when Cloudflare Access was
 * removed (PLAN.md W8) — see that commit's note.
 *
 * Signed with `AUTH_SECRET` via HS256, independent of however Auth.js
 * itself encodes the session cookie's JWT — this module doesn't need to
 * match that encoding, only to be verifiable with the same secret admins
 * already rotate as one value.
 */

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is not set — required to sign access tokens.');
  return new TextEncoder().encode(secret);
}

export interface AccessTokenPayload {
  sub: string; // User document id.
  scopes: Permission[];
}

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({ scopes: payload.scopes })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(secretKey());
}

/** Null for any failure — expired, malformed, wrong signature. Never throws. */
export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.sub !== 'string' || !Array.isArray(payload.scopes)) return null;
    return { sub: payload.sub, scopes: payload.scopes as Permission[] };
  } catch (err) {
    // Expired/malformed/bad-signature are all just "not a valid token" to
    // the caller — jose's own error classes distinguish them for anyone
    // debugging from logs, but resolveAuth() only ever needs the boolean.
    if (err instanceof errors.JOSEError) return null;
    throw err;
  }
}

export const ACCESS_TOKEN_EXPIRES_IN_SECONDS = ACCESS_TOKEN_TTL_SECONDS;

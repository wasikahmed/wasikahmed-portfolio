import { randomBytes } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/server/db';
import { User } from '@/server/models/user';
import { RefreshToken } from '@/server/models/refresh-token';
import { saltedHash } from '@/server/rate-limit';
import { signAccessToken, ACCESS_TOKEN_EXPIRES_IN_SECONDS } from '@/server/access-token';
import { permissionsForRole, type Permission } from '@/server/permissions';
import { refreshTokenRequestSchema } from '@/server/schemas';

const genericError = NextResponse.json(
  { error: 'Invalid or expired refresh token.' },
  { status: 401 },
);

/**
 * Rotates a refresh token: the presented one is spent, a new one (same
 * `familyId`) is issued alongside a fresh 15-minute access token (PLAN.md
 * W12). Public, pre-auth — see token/route.ts's module comment for why.
 *
 * The family's `expiresAt` is copied forward unchanged on every rotation
 * rather than extended — a deliberate absolute session lifetime (30 days
 * from the original login) instead of a sliding window that could keep a
 * token alive indefinitely just by being used regularly. Matches this
 * codebase's existing bias toward shorter, fixed session lifetimes (the
 * cookie session's own 7-day `maxAge`, PLAN.md's archived W2 item 6) over
 * open-ended ones.
 *
 * Reuse detection: a refresh token that was already rotated out
 * (`revokedAt` set) being presented again means someone is replaying a
 * stale token — the standard signal that a token was intercepted and the
 * legitimate client has since rotated past it, or that a stolen token is
 * being used out of order. Either way the whole family is revoked, not
 * just the one token, since an attacker holding one link in the chain may
 * hold others.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const result = refreshTokenRequestSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: z.prettifyError(result.error) }, { status: 422 });
  }

  await connectToDatabase();
  const tokenHash = saltedHash(result.data.refreshToken);
  const existing = await RefreshToken.findOne({ tokenHash });
  if (!existing || existing.expiresAt.getTime() < Date.now()) return genericError;

  if (existing.revokedAt) {
    await RefreshToken.updateMany(
      { familyId: existing.familyId, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
    return NextResponse.json(
      {
        error: 'This refresh token was already used. All sessions in its chain have been revoked.',
      },
      { status: 401 },
    );
  }

  // Re-derive current role/permissions — a demoted or suspended user's
  // refresh token must not silently keep minting valid access tokens
  // (the same principle W10 applies to the session cookie).
  const user = await User.findById(existing.userId).lean();
  if (!user || user.status === 'suspended') return genericError;

  const currentRoleScopes = permissionsForRole(user.role);
  const scopes = existing.scopes.filter((s) =>
    currentRoleScopes.includes(s as Permission),
  ) as Permission[];
  if (scopes.length === 0) {
    return NextResponse.json(
      { error: 'No permissions remain for this token. Sign in again.' },
      { status: 401 },
    );
  }

  const accessToken = await signAccessToken({ sub: String(user._id), scopes });

  const newRefreshRaw = randomBytes(32).toString('hex');
  await RefreshToken.create({
    userId: user._id,
    familyId: existing.familyId,
    tokenHash: saltedHash(newRefreshRaw),
    scopes,
    label: existing.label,
    expiresAt: existing.expiresAt,
  });

  existing.revokedAt = new Date();
  existing.lastUsedAt = new Date();
  await existing.save();

  return NextResponse.json({
    tokenType: 'Bearer',
    accessToken,
    expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
    refreshToken: newRefreshRaw,
    scopes,
  });
}

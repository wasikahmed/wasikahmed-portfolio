import { randomBytes } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/server/db';
import { verifyCredentials } from '@/server/credentials';
import { signAccessToken, ACCESS_TOKEN_EXPIRES_IN_SECONDS } from '@/server/access-token';
import { RefreshToken } from '@/server/models/refresh-token';
import { saltedHash } from '@/server/rate-limit';
import { permissionsForRole, type Permission } from '@/server/permissions';
import { tokenRequestSchema } from '@/server/schemas';

/** 30 days, fixed from issuance — see the module comment on refresh/route.ts for why rotation doesn't extend it. */
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Issues a Bearer token pair for a non-browser client (PLAN.md W12) —
 * email + password (+ TOTP when enrolled) in, an access token + refresh
 * token out. Public, pre-auth, same reasoning as
 * /api/auth/forgot-password: no session exists yet, so no CSRF cookie to
 * check. Exempted from proxy.ts's session gate via PUBLIC_ADMIN_PATHS
 * even though it lives under /api/admin — see that file's comment.
 *
 * Credential verification (rate limiting, password, suspension, TOTP) is
 * shared with auth.ts's authorize() via credentials.ts — this route
 * doesn't reimplement any of it.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const result = tokenRequestSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: z.prettifyError(result.error) }, { status: 422 });
  }

  const cred = await verifyCredentials(
    result.data.email,
    result.data.password,
    result.data.code ?? '',
    request,
  );
  if (!cred.ok) {
    if (cred.reason === 'totp_required') {
      return NextResponse.json(
        { error: 'Two-factor code required.', code: 'TOTP_REQUIRED' },
        { status: 401 },
      );
    }
    if (cred.reason === 'rate_limited') {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }
    return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 });
  }

  // A caller may request a narrower scope list than their role grants
  // (principle of least privilege for a given integration) but never a
  // wider one — validated against the role *right now*, at issuance;
  // resolve-auth.ts re-validates against the current role on every
  // subsequent request, which is what makes a later demotion apply.
  const roleScopes = permissionsForRole(cred.user.role);
  let scopes: Permission[];
  if (result.data.scopes) {
    const notGranted = result.data.scopes.filter((s) => !roleScopes.includes(s));
    if (notGranted.length > 0) {
      return NextResponse.json(
        { error: `Your role does not grant: ${notGranted.join(', ')}` },
        { status: 422 },
      );
    }
    scopes = result.data.scopes;
  } else {
    scopes = roleScopes;
  }

  const userId = String(cred.user._id);
  const accessToken = await signAccessToken({ sub: userId, scopes });

  const refreshTokenRaw = randomBytes(32).toString('hex');
  await connectToDatabase();
  await RefreshToken.create({
    userId,
    familyId: randomBytes(16).toString('hex'),
    tokenHash: saltedHash(refreshTokenRaw),
    scopes,
    label: result.data.label,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });

  return NextResponse.json({
    tokenType: 'Bearer',
    accessToken,
    expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
    refreshToken: refreshTokenRaw,
    scopes,
  });
}

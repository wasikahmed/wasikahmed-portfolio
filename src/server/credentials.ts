import 'server-only';

import { connectToDatabase } from './db';
import { User } from './models/user';
import { verifyPassword } from './password';
import { checkRateLimit, getClientIp, hashIp, saltedHash } from './rate-limit';
import { decryptTotpSecret, verifyTotpCode } from './totp';

/**
 * Email+password(+TOTP) verification, extracted from auth.ts's
 * `authorize()` so `POST /api/admin/auth/token` (PLAN.md W12) can reuse
 * the exact same rate limiting, password check, suspension check, and
 * TOTP requirement rather than re-implementing (and inevitably drifting
 * from) it. `authorize()` translates the result into Auth.js's
 * `CredentialsSignin` subclasses; the token route translates it straight
 * into a JSON response. Neither call site needs to know how the other
 * one reports failure.
 */
export type CredentialsResult =
  | {
      ok: true;
      user: {
        _id: unknown;
        email: string;
        role: 'viewer' | 'editor' | 'admin' | 'owner';
        totpSecret?: string | null;
      };
    }
  | { ok: false; reason: 'invalid' | 'totp_required' | 'rate_limited' };

export async function verifyCredentials(
  rawEmail: string,
  password: string,
  code: string,
  request: Request,
): Promise<CredentialsResult> {
  const email = rawEmail.trim().toLowerCase();
  if (!email || !password) return { ok: false, reason: 'invalid' };

  // Checked before the DB lookup so a rate-limited request costs one
  // Mongo round trip, not an argon2 hash comparison too — same reasoning
  // as the original inline version in auth.ts.
  const ipOk = await checkRateLimit(`login-ip:${hashIp(getClientIp(request))}`, {
    limit: 20,
    windowMs: 15 * 60 * 1000,
  });
  if (!ipOk) return { ok: false, reason: 'rate_limited' };

  // Second limit keyed by the targeted email, independent of IP, so a
  // rotating-IP attacker still can't brute-force one account.
  const emailOk = await checkRateLimit(`login-email:${saltedHash(email)}`, {
    limit: 8,
    windowMs: 15 * 60 * 1000,
  });
  if (!emailOk) return { ok: false, reason: 'rate_limited' };

  await connectToDatabase();
  const user = await User.findOne({ email }).lean();

  // Same generic "invalid" whether the email doesn't exist, the account
  // has no password yet (an invited user, PLAN.md W11), the password is
  // wrong, or the account is suspended — distinguishing any of those lets
  // an attacker enumerate valid/pending/suspended admin emails for zero
  // benefit to a real user.
  if (!user || !user.passwordHash) return { ok: false, reason: 'invalid' };

  const passwordOk = await verifyPassword(user.passwordHash, password);
  if (!passwordOk) return { ok: false, reason: 'invalid' };

  if (user.status === 'suspended') return { ok: false, reason: 'invalid' };

  if (user.totpSecret) {
    if (!code) return { ok: false, reason: 'totp_required' };
    const secret = decryptTotpSecret(user.totpSecret);
    if (!verifyTotpCode(secret, code)) return { ok: false, reason: 'invalid' };
  }

  // Best-effort — a failed write here shouldn't fail a login that
  // otherwise succeeded. Populates PLAN.md W9's `lastLoginAt`.
  await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } }).catch(() => {});

  return { ok: true, user };
}

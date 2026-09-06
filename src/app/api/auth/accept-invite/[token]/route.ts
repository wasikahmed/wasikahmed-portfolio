import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/server/db';
import { User } from '@/server/models/user';
import { Invite } from '@/server/models/invite';
import { checkRateLimit, getClientIp, hashIp, saltedHash } from '@/server/rate-limit';
import { verifyTurnstile } from '@/server/turnstile';
import { hashPassword } from '@/server/password';
import { acceptInviteSchema } from '@/server/schemas';
import { writeAuditLog } from '@/server/audit';

/**
 * Public, pre-auth, same reasoning as forgot-password/reset-password
 * (PLAN.md W11) — no session exists yet, so no CSRF cookie to check, and
 * not covered by proxy.ts's matcher (AGENTS.md §9), so rate limiting is
 * self-implemented.
 *
 * Looked up by an indexed equality query on `tokenHash`, not a manual
 * comparison against a candidate the way reset-password.ts's 6-digit
 * code is (there, the code is compared against a document already found
 * by userId; here there's no userId to look up by until the token itself
 * resolves one). The token is 32 random bytes (64 hex chars) — brute
 * force isn't the realistic threat the way it is for a 6-digit code, so
 * the rate limit below is defense against a leaked-link scenario, not
 * the primary guard.
 */
const genericError = NextResponse.json(
  { error: 'Invalid or expired invite link.' },
  { status: 401 },
);

/** Looks up a still-valid invite by its raw token, or returns null. */
async function findValidInvite(token: string) {
  await connectToDatabase();
  const invite = await Invite.findOne({ tokenHash: saltedHash(token) });
  if (!invite || invite.expiresAt.getTime() < Date.now()) return null;
  return invite;
}

/** Lets the accept-invite page show who's being invited before they submit anything. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const invite = await findValidInvite(token);
  if (!invite) return genericError;

  const user = await User.findById(invite.userId).lean();
  if (!user || user.status !== 'invited') return genericError;

  return NextResponse.json({ email: user.email, role: user.role });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const ip = getClientIp(request);
  const ipOk = await checkRateLimit(`accept-invite-ip:${hashIp(ip)}`, {
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!ipOk) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  const { token } = await params;
  const body = await request.json().catch(() => null);
  const result = acceptInviteSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: z.prettifyError(result.error) }, { status: 422 });
  }

  // Turnstile-gated (PLAN.md W11) — public, unauthenticated, and turns a
  // pending invite into a real account, the same threat model as any
  // other public account-affecting endpoint on this site.
  const turnstileOk = await verifyTurnstile(result.data.turnstileToken, ip);
  if (!turnstileOk) {
    return NextResponse.json({ error: 'Verification failed. Try again.' }, { status: 422 });
  }

  const invite = await findValidInvite(token);
  if (!invite) return genericError;

  const user = await User.findById(invite.userId);
  if (!user || user.status !== 'invited') return genericError;

  user.name = result.data.name;
  user.passwordHash = await hashPassword(result.data.password);
  user.status = 'active';
  await user.save();

  // Single-use — delete every invite for this user, not just this token,
  // so an old link from a re-invite can't resurrect a since-superseded one.
  await Invite.deleteMany({ userId: user._id });

  await writeAuditLog({
    userEmail: user.email,
    action: 'update',
    entityType: 'user',
    entityId: String(user._id),
    summary: 'Accepted invite',
  });

  return NextResponse.json({ ok: true });
}

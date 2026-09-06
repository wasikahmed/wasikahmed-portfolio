import { NextResponse, type NextRequest } from 'next/server';
import { randomInt } from 'node:crypto';
import { z } from 'zod';
import { connectToDatabase } from '@/server/db';
import { User } from '@/server/models/user';
import { PasswordReset } from '@/server/models/password-reset';
import { checkRateLimit, getClientIp, hashIp, saltedHash } from '@/server/rate-limit';
import { sendPasswordResetOtp } from '@/server/email';
import { forgotPasswordSchema as requestSchema } from '@/server/schemas';

/**
 * Public, pre-auth — no session exists yet, so no CSRF cookie to check
 * (same reasoning as /api/contact). Not covered by proxy.ts's matcher
 * either (AGENTS.md §9), so rate limiting here is self-implemented, by
 * IP and by the targeted email, rather than inherited from anywhere.
 */

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const ipHash = hashIp(ip);

  const ipOk = await checkRateLimit(`forgot-password-ip:${ipHash}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!ipOk) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const result = requestSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: z.prettifyError(result.error) }, { status: 422 });
  }

  const email = result.data.email.trim().toLowerCase();

  // Second limit keyed by the target email, independent of IP, so a
  // rotating-IP attacker still can't spam one inbox with codes.
  const emailOk = await checkRateLimit(`forgot-password-email:${saltedHash(email)}`, {
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });
  if (!emailOk) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
  }

  await connectToDatabase();
  const user = await User.findOne({ email }).lean();

  // Always respond the same way whether or not the account exists — a
  // different response here would let this endpoint enumerate accounts.
  if (user) {
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    await PasswordReset.deleteMany({ userId: user._id });
    await PasswordReset.create({
      userId: user._id,
      codeHash: saltedHash(code),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    await sendPasswordResetOtp(user.email, code);
  }

  return NextResponse.json({ ok: true });
}

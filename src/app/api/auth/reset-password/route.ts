import { NextResponse, type NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { connectToDatabase } from '@/server/db';
import { User } from '@/server/models/user';
import { PasswordReset } from '@/server/models/password-reset';
import { checkRateLimit, getClientIp, hashIp, saltedHash } from '@/server/rate-limit';
import { hashPassword } from '@/server/password';
import { writeAuditLog } from '@/server/audit';

/**
 * Public, pre-auth, same reasoning as forgot-password/route.ts. A 6-digit
 * code is only 1e6 possibilities, so the rate limit here is the actual
 * security boundary against brute force, not a nicety.
 */
const resetSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(12, 'At least 12 characters.'),
});

const genericError = NextResponse.json({ error: 'Invalid or expired code.' }, { status: 401 });

function codesMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const ipHash = hashIp(ip);

  const ipOk = await checkRateLimit(`reset-password-ip:${ipHash}`, {
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!ipOk) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const result = resetSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: z.prettifyError(result.error) }, { status: 422 });
  }

  const email = result.data.email.trim().toLowerCase();

  const emailOk = await checkRateLimit(`reset-password-email:${saltedHash(email)}`, {
    limit: 8,
    windowMs: 60 * 60 * 1000,
  });
  if (!emailOk) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  await connectToDatabase();
  const user = await User.findOne({ email });
  if (!user) return genericError;

  const pending = await PasswordReset.findOne({ userId: user._id }).sort({ expiresAt: -1 });
  if (!pending || pending.expiresAt.getTime() < Date.now()) return genericError;
  if (!codesMatch(pending.codeHash, saltedHash(result.data.code))) return genericError;

  user.passwordHash = await hashPassword(result.data.newPassword);
  await user.save();
  await PasswordReset.deleteMany({ userId: user._id });

  await writeAuditLog({
    userEmail: user.email,
    action: 'update',
    entityType: 'user',
    entityId: String(user._id),
    summary: 'Reset password via email OTP',
  });

  return NextResponse.json({ ok: true });
}

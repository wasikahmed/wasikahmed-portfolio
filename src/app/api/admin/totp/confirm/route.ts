import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/server/db';
import { getAdminSession } from '@/server/session';
import { verifyCsrf } from '@/server/csrf';
import { writeAuditLog } from '@/server/audit';
import { User } from '@/server/models/user';
import { decryptTotpSecret, verifyTotpCode } from '@/server/totp';

const PENDING_COOKIE = 'totp-pending';
const confirmSchema = z.object({ code: z.string().min(6).max(6) });

// Deliberately no `can()` check beyond the session itself (PLAN.md W10):
// confirming your own 2FA enrollment is a base right of every role, not a
// permission — it only ever acts on the caller's own account.
export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  const csrfError = verifyCsrf(request);
  if (csrfError) return csrfError;

  const encryptedPending = request.cookies.get(PENDING_COOKIE)?.value;
  if (!encryptedPending) {
    return NextResponse.json(
      { error: 'Enrollment expired. Start over from Security settings.' },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => null);
  const result = confirmSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Enter the 6-digit code.' }, { status: 422 });
  }

  const secret = decryptTotpSecret(encryptedPending);
  if (!verifyTotpCode(secret, result.data.code)) {
    return NextResponse.json({ error: 'Incorrect code. Try the next one.' }, { status: 422 });
  }

  await connectToDatabase();
  await User.findByIdAndUpdate(session.id, { totpSecret: encryptedPending });

  await writeAuditLog({
    userEmail: session.email,
    action: 'update',
    entityType: 'user',
    entityId: session.id,
    summary: 'Enabled two-factor authentication',
  });

  const response = NextResponse.json({ ok: true });
  // `path` must match the cookie's original scope (see enroll/route.ts) or
  // the browser treats this as a different cookie and leaves the real one
  // in place.
  response.cookies.delete({ name: PENDING_COOKIE, path: '/api/admin' });
  return response;
}

import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/server/db';
import { getAdminSession } from '@/server/session';
import { verifyCsrf } from '@/server/csrf';
import { writeAuditLog } from '@/server/audit';
import { User } from '@/server/models/user';
import { verifyPassword } from '@/server/password';
import { totpDisableSchema as disableSchema } from '@/server/schemas';

/**
 * Requires the current password — de-provisioning 2FA is worth
 * re-authenticating for. Deliberately no `can()` check beyond that
 * (PLAN.md W10): disabling your own 2FA is a base right of every role,
 * not a permission — it only ever acts on the caller's own account.
 */
export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  const csrfError = verifyCsrf(request);
  if (csrfError) return csrfError;

  const body = await request.json().catch(() => null);
  const result = disableSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Password is required.' }, { status: 422 });
  }

  await connectToDatabase();
  const user = await User.findById(session.id);
  // `passwordHash` is optional at the schema level for an invited user
  // with no password yet (PLAN.md W9) — unreachable in practice, since
  // authorize() rejects a passwordless login before a session can exist,
  // but the type is honest about it, so narrow explicitly rather than
  // asserting.
  if (!user?.passwordHash || !(await verifyPassword(user.passwordHash, result.data.password))) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
  }

  user.totpSecret = undefined;
  await user.save();

  await writeAuditLog({
    userEmail: session.email,
    action: 'update',
    entityType: 'user',
    entityId: session.id,
    summary: 'Disabled two-factor authentication',
  });

  return NextResponse.json({ ok: true });
}

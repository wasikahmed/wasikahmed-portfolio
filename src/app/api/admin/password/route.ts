import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/server/db';
import { getAdminSession } from '@/server/session';
import { verifyCsrf } from '@/server/csrf';
import { writeAuditLog } from '@/server/audit';
import { User } from '@/server/models/user';
import { verifyPassword, hashPassword } from '@/server/password';

const changeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(12, 'At least 12 characters.'),
});

export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  const csrfError = verifyCsrf(request);
  if (csrfError) return csrfError;

  const body = await request.json().catch(() => null);
  const result = changeSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: z.prettifyError(result.error) }, { status: 422 });
  }

  await connectToDatabase();
  const user = await User.findById(session.id);
  // `passwordHash` is optional at the schema level for an invited user
  // with no password yet (PLAN.md W9) — unreachable in practice, since
  // authorize() rejects a passwordless login before a session can exist,
  // but the type is honest about it, so narrow explicitly rather than
  // asserting.
  if (
    !user?.passwordHash ||
    !(await verifyPassword(user.passwordHash, result.data.currentPassword))
  ) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
  }

  user.passwordHash = await hashPassword(result.data.newPassword);
  await user.save();

  await writeAuditLog({
    userEmail: session.email,
    action: 'update',
    entityType: 'user',
    entityId: session.id,
    summary: 'Changed password',
  });

  return NextResponse.json({ ok: true });
}

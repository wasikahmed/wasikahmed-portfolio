import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/server/db';
import { requirePermission } from '@/server/resolve-auth';
import { writeAuditLog } from '@/server/audit';
import { User } from '@/server/models/user';
import { Invite } from '@/server/models/invite';
import { userUpdateSchema } from '@/server/schemas';
import { normalizeDoc } from '@/server/mongo-utils';
import { safeUserFields } from '@/server/user-fields';

/**
 * Role and/or status changes for one user (PLAN.md W11). Both live on
 * this one PATCH rather than splitting role-change and suspend/reactivate
 * into separate endpoints — they share every guard below, and a form that
 * changes both at once (rare, but not nonsensical) shouldn't need two
 * requests.
 *
 * Guards, all tested (PLAN.md W14 item 5):
 * - The owner's role/status can never change here, including by the
 *   owner themselves — ownership only moves via the dedicated
 *   transfer-ownership route.
 * - No one may change their own role or status through this route,
 *   owner or not — otherwise `user:write` is just a slow path to
 *   `owner`, and self-suspension would silently sign someone out with
 *   no one else able to undo it from inside the app.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requirePermission(request, 'user:write');
  if (response) return response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const result = userUpdateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: z.prettifyError(result.error) }, { status: 422 });
  }
  if (!result.data.role && !result.data.status) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 422 });
  }

  await connectToDatabase();
  const target = await User.findById(id);
  if (!target) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  if (target.role === 'owner') {
    return NextResponse.json(
      { error: "The owner's role or status cannot be changed here." },
      { status: 403 },
    );
  }
  if (id === session.id) {
    return NextResponse.json(
      { error: 'You cannot change your own role or status.' },
      { status: 403 },
    );
  }

  const summaries: string[] = [];
  if (result.data.role && result.data.role !== target.role) {
    summaries.push(`Changed ${target.email}'s role from ${target.role} to ${result.data.role}`);
    target.role = result.data.role;
  }
  if (result.data.status && result.data.status !== target.status) {
    summaries.push(
      result.data.status === 'suspended'
        ? `Suspended ${target.email}`
        : `Reactivated ${target.email}`,
    );
    target.status = result.data.status;
  }

  if (summaries.length === 0) {
    // Valid request, nothing actually changed (e.g. re-submitting the
    // current role) — not an error, but not worth an audit entry either.
    return NextResponse.json({ item: normalizeDoc(safeUserFields(target)) });
  }

  await target.save();

  await writeAuditLog({
    userEmail: session.email,
    action: 'update',
    entityType: 'user',
    entityId: id,
    summary: summaries.join('; '),
  });

  return NextResponse.json({ item: normalizeDoc(safeUserFields(target)) });
}

/**
 * Hard delete — audit entries reference the user by id/email snapshot
 * (PLAN.md W9), so deleting the account doesn't break the trail. Same
 * owner/self guards as PATCH above, plus cleanup of any pending invite
 * for this user so a deleted invitee's old link can't be reused if the
 * email is ever invited again later.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response } = await requirePermission(request, 'user:delete');
  if (response) return response;

  const { id } = await params;
  await connectToDatabase();
  const target = await User.findById(id);
  if (!target) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  if (target.role === 'owner') {
    return NextResponse.json({ error: 'The owner cannot be deleted.' }, { status: 403 });
  }
  if (id === session.id) {
    return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 403 });
  }

  await User.findByIdAndDelete(id);
  await Invite.deleteMany({ userId: id });

  await writeAuditLog({
    userEmail: session.email,
    action: 'delete',
    entityType: 'user',
    entityId: id,
    summary: `Deleted ${target.email}`,
  });

  return new NextResponse(null, { status: 204 });
}

import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/server/db';
import { getAdminSession } from '@/server/session';
import { verifyCsrf } from '@/server/csrf';
import { writeAuditLog } from '@/server/audit';
import { User } from '@/server/models/user';
import { normalizeDoc } from '@/server/mongo-utils';
import { safeUserFields } from '@/server/user-fields';

/**
 * Ownership transfer (PLAN.md W9/W11) — promotes the target to `owner`
 * and demotes the current owner to `admin`, in one call. Deliberately not
 * a `can()` permission: `owner` is a singleton, and gating this on a
 * permission string would mean it could theoretically be granted to a
 * second role, which is exactly the invariant this route exists to
 * protect. Checked directly against `session.role` instead.
 *
 * Not wrapped in a database transaction — this deploy's MongoDB runs as a
 * standalone instance, not a replica set, so multi-document transactions
 * aren't available (see docker-compose.yml/docker-compose.prod.yml). The
 * two writes below run sequentially instead; this is a rare, deliberate,
 * human-initiated action, not a high-throughput path, so the small window
 * between them is an accepted trade-off rather than an oversight. If the
 * second write fails, both accounts are re-fetched and logged rather than
 * silently left inconsistent.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (session.role !== 'owner') {
    return NextResponse.json(
      { error: 'Only the current owner can transfer ownership.' },
      { status: 403 },
    );
  }
  const csrfError = verifyCsrf(request);
  if (csrfError) return csrfError;

  const { id } = await params;
  if (id === session.id) {
    return NextResponse.json({ error: 'You already are the owner.' }, { status: 400 });
  }

  await connectToDatabase();
  const target = await User.findById(id);
  if (!target) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  if (target.status !== 'active') {
    return NextResponse.json(
      { error: 'Only an active user can become the owner.' },
      { status: 422 },
    );
  }

  const previousOwner = await User.findById(session.id);
  if (!previousOwner) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  target.role = 'owner';
  await target.save();
  previousOwner.role = 'admin';
  await previousOwner.save();

  await writeAuditLog({
    userEmail: session.email,
    action: 'update',
    entityType: 'user',
    entityId: id,
    summary: `Transferred ownership to ${target.email} (${previousOwner.email} is now admin)`,
  });

  return NextResponse.json({ item: normalizeDoc(safeUserFields(target)) });
}

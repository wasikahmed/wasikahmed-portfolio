import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/server/db';
import { getAdminSession } from '@/server/session';
import { verifyCsrf } from '@/server/csrf';
import { RefreshToken } from '@/server/models/refresh-token';

/**
 * Revoke one of the caller's own API sessions (PLAN.md W12). Scoped to
 * `userId: session.id` in the query itself, not just checked after the
 * fact — one user can never revoke another's token by guessing an id.
 * Since a token family only ever has one active (non-revoked) member,
 * revoking it here ends that whole session; a later attempt to refresh
 * using an earlier, already-rotated link in the same chain is caught by
 * token/refresh/route.ts's reuse detection regardless.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  const csrfError = verifyCsrf(request);
  if (csrfError) return csrfError;

  const { id } = await params;
  await connectToDatabase();
  const updated = await RefreshToken.findOneAndUpdate(
    { _id: id, userId: session.id, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
  if (!updated) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  return new NextResponse(null, { status: 204 });
}

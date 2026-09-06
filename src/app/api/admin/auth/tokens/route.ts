import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/server/db';
import { getAdminSession } from '@/server/session';
import { verifyCsrf } from '@/server/csrf';
import { RefreshToken } from '@/server/models/refresh-token';
import { normalizeDoc } from '@/server/mongo-utils';

/**
 * Lists the caller's own active API sessions for /admin/security (PLAN.md
 * W12) — one row per active token family (a family only ever has one
 * non-revoked, unexpired member at a time, so this query naturally
 * returns exactly that). Deliberately no `can()` check beyond the session
 * itself, same as password/TOTP self-service routes: this only ever acts
 * on the caller's own tokens.
 */
export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  await connectToDatabase();
  const docs = await RefreshToken.find({
    userId: session.id,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  })
    .select('-tokenHash')
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ items: docs.map((d) => normalizeDoc(d)) });
}

/** Revoke every active session at once — e.g. "sign out everywhere." */
export async function DELETE(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  const csrfError = verifyCsrf(request);
  if (csrfError) return csrfError;

  await connectToDatabase();
  await RefreshToken.updateMany(
    { userId: session.id, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );

  return NextResponse.json({ ok: true });
}

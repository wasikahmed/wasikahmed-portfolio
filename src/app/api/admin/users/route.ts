import { randomBytes } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/server/db';
import { getAdminSession } from '@/server/session';
import { can } from '@/server/permissions';
import { verifyCsrf } from '@/server/csrf';
import { writeAuditLog } from '@/server/audit';
import { saltedHash } from '@/server/rate-limit';
import { User } from '@/server/models/user';
import { Invite } from '@/server/models/invite';
import { inviteSchema } from '@/server/schemas';
import { normalizeDoc } from '@/server/mongo-utils';
import { safeUserFields } from '@/server/user-fields';
import { sendInviteEmail } from '@/server/email';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:4000';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!can(session, 'user:read')) {
    return NextResponse.json({ error: 'Not permitted.' }, { status: 403 });
  }

  await connectToDatabase();
  const docs = await User.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ items: docs.map((d) => normalizeDoc(safeUserFields(d))) });
}

/**
 * Invite: creates the User document immediately (status: 'invited', no
 * password) and emails a single-use accept link, mirroring
 * /api/auth/forgot-password's OTP shape but with a URL token instead of a
 * 6-digit code (PLAN.md W11). 'owner' is never an invitable role —
 * inviteSchema's role enum already excludes it, so a request for it 422s
 * before this handler makes a decision either way.
 */
export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!can(session, 'user:write')) {
    return NextResponse.json({ error: 'Not permitted.' }, { status: 403 });
  }
  const csrfError = verifyCsrf(request);
  if (csrfError) return csrfError;

  const body = await request.json().catch(() => null);
  const result = inviteSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: z.prettifyError(result.error) }, { status: 422 });
  }

  const email = result.data.email.trim().toLowerCase();

  await connectToDatabase();
  const existing = await User.findOne({ email }).lean();
  if (existing) {
    return NextResponse.json({ error: 'A user with that email already exists.' }, { status: 409 });
  }

  const invited = await User.create({
    email,
    role: result.data.role,
    status: 'invited',
    invitedBy: session.id,
  });

  const token = randomBytes(32).toString('hex');
  await Invite.create({
    userId: invited._id,
    tokenHash: saltedHash(token),
    expiresAt: new Date(Date.now() + INVITE_TTL_MS),
  });

  await sendInviteEmail(email, `${SITE_URL}/admin/accept-invite/${token}`, result.data.role);

  await writeAuditLog({
    userEmail: session.email,
    action: 'create',
    entityType: 'user',
    entityId: String(invited._id),
    summary: `Invited ${email} as ${result.data.role}`,
  });

  return NextResponse.json({ item: normalizeDoc(safeUserFields(invited)) }, { status: 201 });
}

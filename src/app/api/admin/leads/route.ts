import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/server/db';
import { getAdminSession } from '@/server/session';
import { can } from '@/server/permissions';
import { Lead } from '@/server/models/lead';
import { normalizeDoc } from '@/server/mongo-utils';

/** Listing for /admin/leads. Creation happens at POST /api/contact (public, no session). */
export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!can(session, 'lead:read')) {
    return NextResponse.json({ error: 'Not permitted.' }, { status: 403 });
  }

  await connectToDatabase();
  const docs = await Lead.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ items: docs.map((d) => normalizeDoc(d)) });
}

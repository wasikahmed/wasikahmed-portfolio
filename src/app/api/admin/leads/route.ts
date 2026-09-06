import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/server/db';
import { requirePermission } from '@/server/resolve-auth';
import { Lead } from '@/server/models/lead';
import { normalizeDoc } from '@/server/mongo-utils';

/** Listing for /admin/leads. Creation happens at POST /api/contact (public, no session). */
export async function GET(request: NextRequest) {
  const { response } = await requirePermission(request, 'lead:read');
  if (response) return response;

  await connectToDatabase();
  const docs = await Lead.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ items: docs.map((d) => normalizeDoc(d)) });
}

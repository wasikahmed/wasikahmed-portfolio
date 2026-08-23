import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/server/db';
import { getAdminSession } from '@/server/session';
import { Lead } from '@/server/models/lead';
import { normalizeDoc } from '@/server/mongo-utils';

/**
 * Read-only until Phase 5 wires the contact form to actually create leads
 * (Zod, Turnstile, rate limiting — PLAN.md §3 "Leads pipeline"). The list
 * view exists now so the dashboard's "leads inbox" has somewhere to point;
 * it will just show an empty state until then.
 */
export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  await connectToDatabase();
  const docs = await Lead.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ items: docs.map((d) => normalizeDoc(d)) });
}

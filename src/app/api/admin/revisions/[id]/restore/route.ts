import { NextResponse, type NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/server/db';
import { requirePermission } from '@/server/resolve-auth';
import { Revision } from '@/server/models/revision';
import { isRevisionType, restoreRevision, revisionEntry } from '@/server/revisions';

/**
 * Restores one revision. Two permission checks, in order: any admin
 * session first (so an anonymous caller learns nothing about which ids
 * exist), then — once the revision's type is known — that type's own write
 * permission, the same one a normal save of that record would need.
 * `restoreRevision` adds the publish guard on top for projects and posts.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const first = await requirePermission(request, 'content:read');
  if (first.response) return first.response;

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  await connectToDatabase();
  const revision = await Revision.findById(id, 'entityType').lean();
  if (!revision || !isRevisionType(revision.entityType)) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const { session, response } = await requirePermission(
    request,
    revisionEntry(revision.entityType).writePermission,
  );
  if (response) return response;

  const result = await restoreRevision(id, session);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true, entityId: result.entityId });
}

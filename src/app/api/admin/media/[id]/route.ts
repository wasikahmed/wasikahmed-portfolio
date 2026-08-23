import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/server/db';
import { getAdminSession } from '@/server/session';
import { verifyCsrf } from '@/server/csrf';
import { writeAuditLog } from '@/server/audit';
import { Media } from '@/server/models/media';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

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
  const doc = await Media.findByIdAndDelete(id).lean();
  if (!doc) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  await unlink(path.join(UPLOAD_DIR, doc.key)).catch(() => {
    // The DB record is gone either way; a missing file on disk (already
    // deleted, or never written) shouldn't block that from succeeding.
  });

  await writeAuditLog({
    userEmail: session.email,
    action: 'delete',
    entityType: 'media',
    entityId: id,
    summary: `Deleted ${doc.key}`,
  });

  return new NextResponse(null, { status: 204 });
}

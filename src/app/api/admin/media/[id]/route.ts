import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/server/db';
import { requirePermission } from '@/server/resolve-auth';
import { writeAuditLog } from '@/server/audit';
import { deleteImage } from '@/server/cloudinary';
import { Media } from '@/server/models/media';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response } = await requirePermission(request, 'media:delete');
  if (response) return response;

  const { id } = await params;
  await connectToDatabase();
  const doc = await Media.findByIdAndDelete(id).lean();
  if (!doc) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  await deleteImage(doc.publicId);

  await writeAuditLog({
    userEmail: session.email,
    action: 'delete',
    entityType: 'media',
    entityId: id,
    summary: `Deleted ${doc.publicId}`,
  });

  return new NextResponse(null, { status: 204 });
}

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/server/db';
import { requirePermission } from '@/server/resolve-auth';
import { writeAuditLog } from '@/server/audit';
import { ResumeVersionModel } from '@/server/models/resume';
import { resumeUploadSchema } from '@/server/schemas';
import { normalizeDoc } from '@/server/mongo-utils';
import { MAX_RESUME_SIZE, isPdf, safePdfName, sha256 } from '@/server/resume-files';
import { can } from '@/server/permissions';

/**
 * Résumé history. Permissions map onto the existing content ladder rather
 * than inventing a `resume:` resource: uploading a version is drafting
 * (`content:write`), making it the one /resume serves is publishing
 * (`content:publish`), deleting is `content:delete`. An editor can stage
 * a new CV; only an admin puts it live.
 */
export async function GET(request: NextRequest) {
  const { response } = await requirePermission(request, 'content:read');
  if (response) return response;

  await connectToDatabase();
  const docs = await ResumeVersionModel.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ items: docs.map((d) => normalizeDoc(d)) });
}

export async function POST(request: NextRequest) {
  const { session, response } = await requirePermission(request, 'content:write');
  if (response) return response;

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 422 });
  }

  const meta = resumeUploadSchema.safeParse({
    label: form?.get('label') ?? undefined,
    notes: form?.get('notes') || undefined,
    makeCurrent: form?.get('makeCurrent') ?? undefined,
  });
  if (!meta.success) {
    return NextResponse.json({ error: z.prettifyError(meta.error) }, { status: 422 });
  }
  if (meta.data.makeCurrent && !can(session, 'content:publish')) {
    return NextResponse.json(
      { error: 'You can upload a version, but making it live needs publish permission.' },
      { status: 403 },
    );
  }
  if (file.size > MAX_RESUME_SIZE) {
    return NextResponse.json({ error: 'File is larger than 5MB.' }, { status: 422 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!isPdf(bytes)) {
    return NextResponse.json({ error: 'That file is not a PDF.' }, { status: 422 });
  }

  await connectToDatabase();
  // Clear the old flag before setting the new one — the partial unique
  // index on `isCurrent` (models/resume.ts) rejects two at once.
  if (meta.data.makeCurrent) {
    await ResumeVersionModel.updateMany({ isCurrent: true }, { isCurrent: false });
  }
  const created = await ResumeVersionModel.create({
    label: meta.data.label,
    notes: meta.data.notes,
    fileName: safePdfName(file.name),
    size: bytes.length,
    sha256: sha256(bytes),
    data: bytes,
    isCurrent: meta.data.makeCurrent,
    uploadedBy: session.email,
  });

  await writeAuditLog({
    userEmail: session.email,
    action: 'create',
    entityType: 'resume',
    entityId: String(created._id),
    summary: `Uploaded résumé "${meta.data.label}"${meta.data.makeCurrent ? ' and made it live' : ''}`,
  });

  const doc = created.toObject();
  delete (doc as Record<string, unknown>).data;
  return NextResponse.json({ item: normalizeDoc(doc) }, { status: 201 });
}

import { NextResponse, type NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import { connectToDatabase } from '@/server/db';
import { requirePermission } from '@/server/resolve-auth';
import { writeAuditLog } from '@/server/audit';
import { ResumeVersionModel } from '@/server/models/resume';
import { resumeUpdateSchema } from '@/server/schemas';
import { normalizeDoc } from '@/server/mongo-utils';
import { can } from '@/server/permissions';

type Params = { params: Promise<{ id: string }> };

const notFound = () => NextResponse.json({ error: 'Not found.' }, { status: 404 });

export async function PATCH(request: NextRequest, { params }: Params) {
  const { session, response } = await requirePermission(request, 'content:write');
  if (response) return response;

  const body = await request.json().catch(() => null);
  const result = resumeUpdateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: z.prettifyError(result.error) }, { status: 422 });
  }
  if (result.data.isCurrent && !can(session, 'content:publish')) {
    return NextResponse.json(
      { error: 'Making a version live needs publish permission.' },
      { status: 403 },
    );
  }

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return notFound();

  await connectToDatabase();
  const existing = await ResumeVersionModel.findById(id).lean();
  if (!existing) return notFound();

  if (result.data.isCurrent && !existing.isCurrent) {
    await ResumeVersionModel.updateMany({ isCurrent: true }, { isCurrent: false });
  }
  const updated = await ResumeVersionModel.findByIdAndUpdate(id, result.data, {
    returnDocument: 'after',
    runValidators: true,
  }).lean();
  if (!updated) return notFound();

  await writeAuditLog({
    userEmail: session.email,
    action: 'update',
    entityType: 'resume',
    entityId: id,
    summary: result.data.isCurrent
      ? `Made résumé "${updated.label}" live`
      : `Edited résumé "${updated.label}"`,
  });

  return NextResponse.json({ item: normalizeDoc(updated) });
}

/**
 * The live version can't be deleted — /resume would start falling back to
 * the static file with no warning. Make another version live first.
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const { session, response } = await requirePermission(request, 'content:delete');
  if (response) return response;

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return notFound();

  await connectToDatabase();
  const existing = await ResumeVersionModel.findById(id, 'label isCurrent').lean();
  if (!existing) return notFound();
  if (existing.isCurrent) {
    return NextResponse.json(
      { error: 'This is the live résumé. Make another version live before deleting it.' },
      { status: 409 },
    );
  }

  await ResumeVersionModel.deleteOne({ _id: id });
  await writeAuditLog({
    userEmail: session.email,
    action: 'delete',
    entityType: 'resume',
    entityId: id,
    summary: `Deleted résumé "${existing.label}"`,
  });

  return new NextResponse(null, { status: 204 });
}

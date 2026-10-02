import { NextResponse, type NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/server/db';
import { requirePermission } from '@/server/resolve-auth';
import { ResumeVersionModel } from '@/server/models/resume';
import { pdfHeaders, storedBytes } from '@/server/resume-files';

/**
 * Any version's PDF, for the admin only — old versions are private; the
 * public only ever gets the current one, through /resume. `private,
 * no-store` keeps an old CV out of any shared cache on the way.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requirePermission(request, 'content:read');
  if (response) return response;

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  await connectToDatabase();
  const doc = await ResumeVersionModel.findById(id).select('+data').lean();
  if (!doc) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  return new NextResponse(storedBytes(doc.data), {
    headers: {
      ...pdfHeaders(doc.fileName, doc.sha256, doc.size),
      'Cache-Control': 'private, no-store',
    },
  });
}

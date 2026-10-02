import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/server/db';
import { requirePermission } from '@/server/resolve-auth';
import { writeAuditLog } from '@/server/audit';
import { SiteCopyModel, SITE_COPY_SINGLETON_ID } from '@/server/models/site-copy';
import { siteCopySchema } from '@/server/schemas';
import { mergeSiteCopy } from '@/server/queries';
import { recordRevision } from '@/server/revisions';

/**
 * The site-copy singleton. Gated by `settings:*` rather than `content:*`:
 * this is the frame every page sits in — headings, calls to action, what
 * search engines show — closer to Settings than to a single project, and
 * an editor who can draft a case study shouldn't be able to rewrite the
 * home page's pitch.
 *
 * GET returns the merged view (stored values over defaults), not the raw
 * document, so the admin form opens prefilled with exactly what the site
 * is showing right now, including fields never saved.
 */
export async function GET(request: NextRequest) {
  const { response } = await requirePermission(request, 'settings:read');
  if (response) return response;

  await connectToDatabase();
  const doc = await SiteCopyModel.findById(SITE_COPY_SINGLETON_ID).lean();
  return NextResponse.json({ item: mergeSiteCopy(doc as Partial<Record<string, unknown>> | null) });
}

export async function PATCH(request: NextRequest) {
  const { session, response } = await requirePermission(request, 'settings:write');
  if (response) return response;

  const body = await request.json().catch(() => null);
  const result = siteCopySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: z.prettifyError(result.error) }, { status: 422 });
  }

  await connectToDatabase();
  const before = await SiteCopyModel.findById(SITE_COPY_SINGLETON_ID).lean();
  const updated = await SiteCopyModel.findByIdAndUpdate(SITE_COPY_SINGLETON_ID, result.data, {
    upsert: true,
    returnDocument: 'after',
  }).lean();

  if (before) {
    await recordRevision({
      entityType: 'siteCopy',
      entityId: SITE_COPY_SINGLETON_ID,
      before: before as Record<string, unknown>,
      action: 'update',
      userEmail: session.email,
    });
  }

  await writeAuditLog({
    userEmail: session.email,
    action: 'update',
    entityType: 'siteCopy',
    entityId: SITE_COPY_SINGLETON_ID,
    summary: 'Updated site copy',
  });

  return NextResponse.json({
    item: mergeSiteCopy(updated as Partial<Record<string, unknown>> | null),
  });
}

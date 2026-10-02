import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/server/db';
import { requirePermission } from '@/server/resolve-auth';
import { Revision } from '@/server/models/revision';
import { normalizeDoc } from '@/server/mongo-utils';
import { isRevisionType, revisionEntry } from '@/server/revisions';

const PAGE_SIZE = 20;

/**
 * Content history, newest first.
 *
 * Scoped (`?entityType=project&entityId=…`): one record's history, shown
 * on its edit page, gated by that type's own read permission — anyone who
 * can open the record can see how it changed.
 *
 * Unscoped: every revision across every type, which is the only place a
 * deleted record can be found again. That view spans settings as well as
 * content, so it takes `audit:read` — the same gate as the audit log it
 * sits next to.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const entityType = params.get('entityType');
  const entityId = params.get('entityId');

  if (entityType !== null && !isRevisionType(entityType)) {
    return NextResponse.json({ error: 'Unknown entity type.' }, { status: 422 });
  }

  const { response } = await requirePermission(
    request,
    entityType ? revisionEntry(entityType).readPermission : 'audit:read',
  );
  if (response) return response;

  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);
  const filter: Record<string, string> = {};
  if (entityType) filter.entityType = entityType;
  if (entityType && entityId) filter.entityId = entityId;

  await connectToDatabase();
  const [docs, total] = await Promise.all([
    Revision.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    Revision.countDocuments(filter),
  ]);

  return NextResponse.json({
    items: docs.map((d) => normalizeDoc(d)),
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  });
}

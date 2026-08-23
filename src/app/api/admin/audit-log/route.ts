import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/server/db';
import { getAdminSession } from '@/server/session';
import { AuditLog } from '@/server/models/audit-log';
import { normalizeDoc } from '@/server/mongo-utils';

const PAGE_SIZE = 50;

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') ?? '1'));

  await connectToDatabase();
  const [docs, total] = await Promise.all([
    AuditLog.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    AuditLog.countDocuments(),
  ]);

  return NextResponse.json({
    items: docs.map((d) => normalizeDoc(d)),
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  });
}

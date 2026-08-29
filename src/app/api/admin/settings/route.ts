import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/server/db';
import { getAdminSession } from '@/server/session';
import { verifyCsrf } from '@/server/csrf';
import { writeAuditLog } from '@/server/audit';
import { Settings, SETTINGS_SINGLETON_ID } from '@/server/models/settings';
import { settingsSchema } from '@/server/schemas';
import { normalizeDoc } from '@/server/mongo-utils';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  await connectToDatabase();
  const doc = await Settings.findById(SETTINGS_SINGLETON_ID).lean();
  return NextResponse.json({ item: doc ? normalizeDoc(doc) : null });
}

export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  const csrfError = verifyCsrf(request);
  if (csrfError) return csrfError;

  const body = await request.json().catch(() => null);
  const result = settingsSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: z.prettifyError(result.error) }, { status: 422 });
  }

  await connectToDatabase();
  const updated = await Settings.findByIdAndUpdate(SETTINGS_SINGLETON_ID, result.data, {
    upsert: true,
    returnDocument: 'after',
  }).lean();

  await writeAuditLog({
    userEmail: session.email,
    action: 'update',
    entityType: 'settings',
    entityId: SETTINGS_SINGLETON_ID,
    summary: 'Updated site settings',
  });

  return NextResponse.json({ item: normalizeDoc(updated!) });
}

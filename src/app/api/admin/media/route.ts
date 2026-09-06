import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import probe from 'probe-image-size';
import { connectToDatabase } from '@/server/db';
import { getAdminSession } from '@/server/session';
import { can } from '@/server/permissions';
import { verifyCsrf } from '@/server/csrf';
import { writeAuditLog } from '@/server/audit';
import { Media } from '@/server/models/media';
import { mediaSchema } from '@/server/schemas';
import { normalizeDoc } from '@/server/mongo-utils';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_SIZE = 8 * 1024 * 1024; // 8MB
// SVG is deliberately excluded — it's an XHTML document, not a raster format,
// and uploads are served from the site's own origin (public/uploads), so an
// SVG with an embedded <script> would execute under an admin session. See
// PLAN.md W2 item 3.
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!can(session, 'media:read')) {
    return NextResponse.json({ error: 'Not permitted.' }, { status: 403 });
  }

  await connectToDatabase();
  const docs = await Media.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ items: docs.map((d) => normalizeDoc(d)) });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!can(session, 'media:write')) {
    return NextResponse.json({ error: 'Not permitted.' }, { status: 403 });
  }
  const csrfError = verifyCsrf(request);
  if (csrfError) return csrfError;

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  const altRaw = form?.get('alt');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 422 });
  }
  const altResult = mediaSchema.safeParse({ alt: altRaw });
  if (!altResult.success) {
    return NextResponse.json({ error: 'Alt text is required for every upload.' }, { status: 422 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 422 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File is larger than 8MB.' }, { status: 422 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  // The authoritative type check: `file.type` and the client filename's
  // extension are both attacker-controlled claims, not facts. probe reads
  // the actual magic bytes, so a mismatch (or an unrecognizable payload
  // wearing an allowed content-type) is rejected outright rather than
  // stored — the extension used on disk is derived from what probe found,
  // never from the client-supplied filename.
  const dimensions = probe.sync(bytes);
  if (!dimensions || !ALLOWED_TYPES.has(dimensions.mime)) {
    return NextResponse.json(
      { error: 'File content does not match a supported image format.' },
      { status: 422 },
    );
  }

  const key = `${randomBytes(12).toString('hex')}${EXT_BY_MIME[dimensions.mime]}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, key), bytes);

  await connectToDatabase();
  const created = await Media.create({
    key,
    url: `/uploads/${key}`,
    alt: altResult.data.alt,
    width: dimensions.width,
    height: dimensions.height,
    size: file.size,
    contentType: dimensions.mime,
  });

  await writeAuditLog({
    userEmail: session.email,
    action: 'create',
    entityType: 'media',
    entityId: String(created._id),
    summary: `Uploaded ${file.name}`,
  });

  return NextResponse.json({ item: normalizeDoc(created.toObject()) }, { status: 201 });
}

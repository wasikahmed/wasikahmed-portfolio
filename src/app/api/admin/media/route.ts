import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import probe from 'probe-image-size';
import { connectToDatabase } from '@/server/db';
import { getAdminSession } from '@/server/session';
import { verifyCsrf } from '@/server/csrf';
import { writeAuditLog } from '@/server/audit';
import { Media } from '@/server/models/media';
import { mediaSchema } from '@/server/schemas';
import { normalizeDoc } from '@/server/mongo-utils';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  await connectToDatabase();
  const docs = await Media.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ items: docs.map((d) => normalizeDoc(d)) });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
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
  const ext = path.extname(file.name) || '';
  const key = `${randomBytes(12).toString('hex')}${ext}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, key), bytes);

  // Dimensions extracted from the actual bytes rather than trusted from the
  // client, so next/image always has a correct aspect ratio to reserve.
  let width: number | undefined;
  let height: number | undefined;
  try {
    const dimensions = probe.sync(bytes);
    if (dimensions) {
      width = dimensions.width;
      height = dimensions.height;
    }
  } catch {
    // Non-fatal — some formats (plain SVG without a viewBox) probe can't
    // read; the upload still succeeds, just without reserved dimensions.
  }

  await connectToDatabase();
  const created = await Media.create({
    key,
    url: `/uploads/${key}`,
    alt: altResult.data.alt,
    width,
    height,
    size: file.size,
    contentType: file.type,
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

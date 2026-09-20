import { NextResponse, type NextRequest } from 'next/server';
import probe from 'probe-image-size';
import { connectToDatabase } from '@/server/db';
import { requirePermission } from '@/server/resolve-auth';
import { writeAuditLog } from '@/server/audit';
import { uploadImage } from '@/server/cloudinary';
import { Media } from '@/server/models/media';
import { mediaSchema } from '@/server/schemas';
import { normalizeDoc } from '@/server/mongo-utils';

const MAX_SIZE = 8 * 1024 * 1024; // 8MB
// SVG is deliberately excluded — it's an XHTML document, not a raster
// format, and an SVG with an embedded <script> would execute under
// whatever origin serves it back. See PLAN.md W2 item 3.
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function GET(request: NextRequest) {
  const { response } = await requirePermission(request, 'media:read');
  if (response) return response;

  await connectToDatabase();
  const docs = await Media.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ items: docs.map((d) => normalizeDoc(d)) });
}

export async function POST(request: NextRequest) {
  const { session, response } = await requirePermission(request, 'media:write');
  if (response) return response;

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
  // uploaded anywhere.
  const dimensions = probe.sync(bytes);
  if (!dimensions || !ALLOWED_TYPES.has(dimensions.mime)) {
    return NextResponse.json(
      { error: 'File content does not match a supported image format.' },
      { status: 422 },
    );
  }

  let uploaded;
  try {
    uploaded = await uploadImage(bytes, file.name);
  } catch (err) {
    console.error('Cloudinary upload failed:', err);
    return NextResponse.json({ error: 'Upload failed. Try again.' }, { status: 502 });
  }

  await connectToDatabase();
  const created = await Media.create({
    publicId: uploaded.publicId,
    url: uploaded.url,
    alt: altResult.data.alt,
    width: uploaded.width ?? dimensions.width,
    height: uploaded.height ?? dimensions.height,
    size: uploaded.bytes,
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

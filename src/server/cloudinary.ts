import 'server-only';
import { v2 as cloudinary } from 'cloudinary';

/**
 * Media storage backend (PLAN.md W15 item 1 / the `.gitignore` note that
 * predated it — "Phase 7 swaps this for S3/R2"). Cloudinary was picked
 * over rolling our own S3/R2 bucket because it also does the resizing/
 * format negotiation `next/image` would otherwise need a remote loader
 * for, and because this account already hosts other projects' media —
 * `CLOUDINARY_FOLDER` scopes every asset this app ever writes or deletes
 * to one folder so it can never touch another project's files sharing
 * the same account.
 *
 * Configured once per process from the three required env vars. Every
 * call site (the media API routes) imports `cloudinary`/`CLOUDINARY_FOLDER`
 * from here rather than the SDK directly, so there is exactly one place
 * that decides the folder and one place that fails loudly if the account
 * isn't configured — the routes need to find out at upload time, not have
 * this silently no-op.
 */
export const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || 'portfolio/admin/media';

let configured = false;

export function requireCloudinary(): typeof cloudinary {
  if (!configured) {
    const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
    const api_key = process.env.CLOUDINARY_API_KEY;
    const api_secret = process.env.CLOUDINARY_API_SECRET;
    if (!cloud_name || !api_key || !api_secret) {
      throw new Error(
        'Cloudinary is not configured — set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
      );
    }
    cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
    configured = true;
  }
  return cloudinary;
}

/**
 * Uploads a validated image buffer. `probe.sync()` in the route already
 * confirmed the magic bytes match an allowed raster format before this is
 * ever called — this only handles getting the bytes to Cloudinary, via
 * `upload_stream` since the SDK's promise-based `upload()` only accepts a
 * file path or a remote URL, not an in-memory buffer.
 */
export function uploadImage(
  bytes: Buffer,
  filenameHint: string,
): Promise<{
  publicId: string;
  url: string;
  width?: number;
  height?: number;
  bytes: number;
  format: string;
}> {
  const client = requireCloudinary();
  return new Promise((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      {
        folder: CLOUDINARY_FOLDER,
        filename_override: filenameHint,
        use_filename: false,
        unique_filename: true,
        resource_type: 'image',
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload returned no result.'));
          return;
        }
        resolve({
          publicId: result.public_id,
          url: result.secure_url,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          format: result.format,
        });
      },
    );
    stream.end(bytes);
  });
}

/** Best-effort delete — mirrors the old local-disk `unlink().catch()` behavior. */
export async function deleteImage(publicId: string): Promise<void> {
  const client = requireCloudinary();
  await client.uploader.destroy(publicId, { resource_type: 'image' }).catch(() => {
    // The DB record is gone either way (see the DELETE route) — a
    // Cloudinary asset that's already gone or never existed shouldn't
    // block that from succeeding.
  });
}

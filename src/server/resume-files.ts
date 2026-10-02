// Importing this from a Client Component is a build error, not a silent
// leak — see https://nextjs.org/docs/app/getting-started/server-and-client-components#preventing-environment-poisoning
import 'server-only';

import { createHash } from 'node:crypto';

/**
 * 5 MB — a one- or two-page LaTeX CV is ~200 KB, so this is generous
 * headroom while staying well clear of Mongo's 16 MB document ceiling.
 */
export const MAX_RESUME_SIZE = 5 * 1024 * 1024;

/**
 * The authoritative type check, same principle as the media route's probe:
 * the browser-supplied `file.type` and filename are claims, the leading
 * bytes are a fact. Every PDF starts with `%PDF-`.
 */
export function isPdf(bytes: Buffer): boolean {
  return bytes.subarray(0, 5).toString('latin1') === '%PDF-';
}

export function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/**
 * A filename safe to put in a Content-Disposition header: no path parts,
 * no quotes or control characters, always ending in .pdf. The original
 * name is kept where it is already safe, because it is what a recruiter
 * sees in their downloads folder.
 */
export function safePdfName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? '';
  const cleaned = base
    .replace(/\.pdf$/i, '')
    .replace(/[^A-Za-z0-9._ -]/g, '')
    .trim()
    .slice(0, 100);
  return `${cleaned || 'resume'}.pdf`;
}

/** Response headers for streaming a stored résumé. */
export function pdfHeaders(fileName: string, sha: string, size: number): Record<string, string> {
  return {
    'Content-Type': 'application/pdf',
    'Content-Length': String(size),
    'Content-Disposition': `inline; filename="${safePdfName(fileName)}"`,
    ETag: `"${sha}"`,
    'X-Content-Type-Options': 'nosniff',
  };
}

/**
 * The stored PDF as bytes. A `.lean()` read hands Buffer paths back as the
 * BSON driver's `Binary` wrapper, not a Buffer — and `new Uint8Array()` of
 * a Binary silently yields the wrong bytes rather than throwing, which is
 * exactly how a "PDF" that opens as garbage ships. Caught by the /resume
 * round-trip test comparing bytes, not just the status code.
 */
export function storedBytes(data: unknown): Uint8Array<ArrayBuffer> {
  // Copied into a fresh ArrayBuffer-backed array — what a Response body
  // accepts — instead of a view onto the driver's (possibly shared) buffer.
  if (data instanceof Uint8Array) return new Uint8Array(data);
  const inner = (data as { buffer?: unknown } | null)?.buffer;
  if (inner instanceof Uint8Array) return new Uint8Array(inner);
  throw new Error('Stored résumé has no readable file data.');
}

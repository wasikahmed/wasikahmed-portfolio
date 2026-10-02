// Importing this from a Client Component is a build error, not a silent
// leak — see https://nextjs.org/docs/app/getting-started/server-and-client-components#preventing-environment-poisoning
import 'server-only';

import { getCurrentResumeFile } from './queries';
import { pdfHeaders, storedBytes } from './resume-files';

/**
 * Where /resume (and the legacy URL below) point until the first version
 * is uploaded at /admin/resume — the PDF that shipped in public/.
 */
export const FALLBACK_RESUME_PATH = '/resume-fallback.pdf';

/**
 * The live résumé as a response — shared by /resume and by
 * /wasik-ahmed-resume.pdf, the bundled file's old address.
 *
 * That second route exists because /resume used to answer with a *308*
 * to /wasik-ahmed-resume.pdf. A 308 is permanent, and browsers cache it
 * indefinitely: anyone who had opened /resume before the CMS took over
 * never asks the server about /resume again — they jump straight to the
 * old filename and keep getting the old CV, whatever is live. Serving the
 * current version at that old filename too is the only fix that reaches
 * them; there's no way to un-send a cached permanent redirect.
 *
 * `no-cache` (revalidate every time, with the ETag making that a cheap
 * 304) rather than a max-age: making a new version live has to take
 * effect on the very next click.
 *
 * The fallback is a 307 — temporary, deliberately. A permanent redirect is
 * exactly what caused the problem above.
 */
export async function currentResumeResponse(request: Request): Promise<Response> {
  const current = await getCurrentResumeFile();
  if (!current) {
    return new Response(null, { status: 307, headers: { Location: FALLBACK_RESUME_PATH } });
  }

  const headers = {
    ...pdfHeaders(current.fileName, current.sha256, current.size),
    'Cache-Control': 'public, no-cache',
  };

  if (request.headers.get('if-none-match') === `"${current.sha256}"`) {
    const notModified: Record<string, string> = { ...headers };
    delete notModified['Content-Length'];
    return new Response(null, { status: 304, headers: notModified });
  }
  return new Response(storedBytes(current.data), { headers });
}

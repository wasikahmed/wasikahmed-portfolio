// Importing this from a Client Component is a build error, not a silent
// leak — see https://nextjs.org/docs/app/getting-started/server-and-client-components#preventing-environment-poisoning
import 'server-only';

import { after } from 'next/server';

import { EVENTS } from '@/lib/analytics';
import { getCurrentResumeFile } from './queries';
import { pdfHeaders, storedBytes } from './resume-files';
import { buildServerEvent, getUmamiConfig, isCountableOpen, sendServerEvent } from './umami-proxy';

/**
 * Counts an open of the live résumé in Umami (`resume_view`).
 *
 * The PDF runs no tracker, so without this every open that doesn't start
 * from a click on this site — a link in a GitHub README, on LinkedIn, in
 * an application email — is invisible. Links to /resume carry UTMs for
 * the same reason links to the site do; see umami-proxy.ts for what is
 * and isn't counted. A no-op when analytics is unconfigured (local dev,
 * tests), and never on the response's critical path.
 */
function recordResumeView(request: Request, status: 200 | 304) {
  const config = getUmamiConfig();
  if (!config || !isCountableOpen(request)) return;
  const body = buildServerEvent(request, config, EVENTS.resumeView, {
    // 304: an open the browser answered from its cache after revalidating.
    response: status === 200 ? 'full' : 'cached',
  });
  after(() => sendServerEvent(config, body));
}

/**
 * Where /resume (and the legacy URL below) point until the first version
 * is uploaded at /admin/resume — the PDF that shipped in public/.
 */
export const FALLBACK_RESUME_PATH = '/resume-fallback.pdf';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:4000';

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
    // The same bytes answer at two URLs (see above). A PDF has no <head>
    // to put a canonical in, so it goes in a header — the form Google
    // documents for non-HTML files — naming /resume, the address every
    // link uses, so the two don't compete as duplicates in search.
    Link: `<${SITE_URL}/resume>; rel="canonical"`,
  };

  if (request.headers.get('if-none-match') === `"${current.sha256}"`) {
    const notModified: Record<string, string> = { ...headers };
    delete notModified['Content-Length'];
    recordResumeView(request, 304);
    return new Response(null, { status: 304, headers: notModified });
  }
  recordResumeView(request, 200);
  return new Response(storedBytes(current.data), { headers });
}

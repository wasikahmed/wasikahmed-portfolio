import { getCurrentResumeFile } from '@/server/queries';
import { pdfHeaders, storedBytes } from '@/server/resume-files';

/**
 * A stable vanity URL for the CV — /resume is what goes on an application,
 * whatever file is behind it today.
 *
 * Serves the version marked current at /admin/resume, straight from the
 * database. `no-cache` (revalidate every time, with the ETag making that a
 * cheap 304) rather than a max-age: making a new version live has to take
 * effect on the very next click, not after a cache expires somewhere
 * between here and a recruiter's browser.
 *
 * Until the first version is uploaded, falls back to the static file that
 * shipped in public/ — the original behaviour. Deliberately a bare
 * Response with a relative `Location` rather than
 * `NextResponse.redirect(new URL(..., request.url))`: that helper needs an
 * absolute URL, and `request.url` inside the container is built from the
 * `HOSTNAME=0.0.0.0` bind address — so it redirects to http://0.0.0.0:3000
 * in production while working fine locally. Same trap AGENTS.md §7 records
 * for sign-out; a relative Location never involves a hostname at all.
 */

// Reads the database on every request — never let `next build` decide this
// route is static and bake one answer in (AGENTS.md §9).
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const current = await getCurrentResumeFile();
  if (!current) {
    return new Response(null, {
      status: 307,
      headers: { Location: '/wasik-ahmed-resume.pdf' },
    });
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

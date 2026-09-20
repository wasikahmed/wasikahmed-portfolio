/**
 * A stable vanity URL for the CV.
 *
 * A Route Handler rather than a page: the useful thing to hand someone is
 * the PDF itself, and embedding it in a viewer would put it behind the
 * CSP's frame rules for no gain. /resume is what goes on an application;
 * the filename underneath can change without breaking it.
 *
 * Deliberately a bare Response with a relative `Location` rather than
 * `NextResponse.redirect(new URL(..., request.url))`. That helper needs an
 * absolute URL, and `request.url` inside the container is built from the
 * `HOSTNAME=0.0.0.0` bind address — so it redirects to http://0.0.0.0:3000
 * in production while working fine locally. Same trap AGENTS.md §7 records
 * for sign-out; a relative Location never involves a hostname at all.
 */
export function GET() {
  return new Response(null, {
    status: 308,
    headers: { Location: '/wasik-ahmed-resume.pdf' },
  });
}

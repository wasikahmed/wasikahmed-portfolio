import { currentResumeResponse } from '@/server/resume-response';

/**
 * A stable vanity URL for the CV — /resume is what goes on an application,
 * whatever file is behind it today: the version marked live at
 * /admin/resume, streamed from the database (see resume-response.ts).
 *
 * Every response here is a relative Location or a body, never an absolute
 * URL built from `request.url` — inside the container that is built from
 * the `HOSTNAME=0.0.0.0` bind address, the same trap AGENTS.md §7 records
 * for sign-out.
 */

// Reads the database on every request — never let `next build` decide this
// route is static and bake one answer in (AGENTS.md §9).
export const dynamic = 'force-dynamic';

export function GET(request: Request) {
  return currentResumeResponse(request);
}

import { currentResumeResponse } from '@/server/resume-response';

/**
 * The bundled CV's original address, kept alive and pointed at the live
 * version. Browsers that cached the old permanent /resume → here redirect
 * land on this URL without asking /resume first; see resume-response.ts.
 */

// Reads the database on every request (AGENTS.md §9).
export const dynamic = 'force-dynamic';

export function GET(request: Request) {
  return currentResumeResponse(request);
}

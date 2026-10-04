import { shortLinkResponse } from '@/server/short-links';

/**
 * /go/<name> → somewhere on this site, with UTMs attached and the open
 * counted (src/server/short-links.ts). Links are managed at
 * /admin/short-links.
 */

// Reads the database on every request — never let `next build` decide this
// route is static and bake one answer in (AGENTS.md §9).
export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return shortLinkResponse(request, slug);
}

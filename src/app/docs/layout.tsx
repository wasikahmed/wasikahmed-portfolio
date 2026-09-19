import type { ReactNode } from 'react';

/**
 * `page.tsx` is a Client Component (Scalar's reference needs the DOM), so
 * the route segment config has to live here instead — Next.js only reads
 * `dynamic` from a Server Component file.
 *
 * Forced dynamic despite reading no data: proxy.ts's CSP nonce is
 * generated fresh per request and only reaches a page's script tags when
 * that page actually renders on that request. A statically prerendered
 * page bakes in whatever nonce (or lack of one) existed at build time —
 * which can never match the middleware's per-request header — so every
 * script on the page gets blocked outright. Confirmed live: production's
 * build classified this route static (`○` in `next build`'s output) and
 * `/docs` rendered as a blank page, every chunk rejected by CSP. The dev
 * server never surfaces this because it always renders per request.
 */
export const dynamic = 'force-dynamic';

export default function DocsLayout({ children }: { children: ReactNode }) {
  return children;
}

import type { MetadataRoute } from 'next';

/*
 * `/design-system` is deliberately NOT disallowed here even though it's
 * noindexed (PLAN.md W3, decided 2026-08-30) — disallowing it in robots.txt
 * would stop a crawler from ever fetching the page at all, which means it
 * never sees the `robots: { index: false }` meta tag that page already sets
 * and is the actual source of truth for "don't index this." A URL a
 * crawler can't fetch can still get indexed from an external link with no
 * snippet, which is worse than what the meta tag already prevents.
 * `/admin` gets the disallow instead: it's authenticated, has nothing to
 * index, and there is no meta tag protecting it from crawl budget waste.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:4000';

// Confirmed 2026-08-30 by actually building and running the production
// image: without this, Next fully static-generates robots.txt during
// `next build` — no database dependency to force a dynamic render — which
// bakes in whatever NEXT_PUBLIC_SITE_URL happened to be set (or unset) in
// the Docker build stage, forever, regardless of the real value in the
// running container's .env. Same fix as sitemap.ts, different root cause:
// that one needed it for the database query, this one needs it purely for
// this env var to be read at request time instead of build time.
export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // /x/ is the analytics relay (src/server/umami-proxy.ts) — scripts
      // and beacons, nothing to index.
      disallow: ['/admin', '/x/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

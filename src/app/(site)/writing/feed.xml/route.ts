import { getPosts, getSettings } from '@/server/queries';

/*
 * RSS 2.0 for /writing (PLAN.md W3). `getPosts()` is the public `get*`
 * family — same published/scheduled-and-due filter every other page uses
 * (AGENTS.md §4 rule 7), so this can never leak a draft. force-dynamic for
 * the same reason as sitemap.ts: a build-time-only render would freeze the
 * feed at whatever existed inside the Docker build, where the database
 * isn't reachable at all.
 */
export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:4000';

/** Minimal XML entity escaping — every field below is plain-text CMS content. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const [posts, settings] = await Promise.all([getPosts(), getSettings()]);

  const items = posts
    .map((post) => {
      const url = `${SITE_URL}/writing/${post.slug}`;
      // publishedAt (when set) is already a full ISO datetime — `date` is
      // the bare `YYYY-MM-DD` formatDate() expects, which needs a time
      // appended to parse as UTC rather than local midnight.
      const pubDate = new Date(post.publishedAt ?? `${post.date}T00:00:00Z`).toUTCString();
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <description>${escapeXml(post.excerpt)}</description>
      <pubDate>${pubDate}</pubDate>
    </item>`;
    })
    .join('');

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(settings.name)} — Writing</title>
    <link>${SITE_URL}/writing</link>
    <description>${escapeXml(settings.tagline)}</description>
    <language>en</language>${items}
  </channel>
</rss>`;

  return new Response(feed, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}

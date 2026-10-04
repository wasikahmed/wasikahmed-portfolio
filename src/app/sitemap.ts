import type { MetadataRoute } from 'next';
import { getProjects, getPosts, getSettings } from '@/server/queries';

/*
 * Generated from the query layer (PLAN.md W3) — `getProjects`/`getPosts` are
 * the public `get*` family, so a draft or a not-yet-scheduled post can never
 * end up in the sitemap even if this file is never touched again (AGENTS.md
 * §4 rule 7). `/design-system` is deliberately excluded: it sets
 * `robots: { index: false }` (see that page's `generateMetadata`) and a
 * sitemap entry for a noindexed page is a contradiction search engines
 * flag, not just dead weight.
 *
 * Same fallback as `metadataBase` in the root layout — `next build` runs
 * with no env inside Docker, so this must not throw on an unset
 * NEXT_PUBLIC_SITE_URL, only produce URLs nobody will ever hit.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:4000';

// Without this, Next statically generates the sitemap once at build time —
// inside Docker, with no database reachable (see the Dockerfile's comment
// on generateStaticParams) — and production would serve that empty result
// forever. force-dynamic makes it a real per-request query instead, same as
// every page in `(site)`.
export const dynamic = 'force-dynamic';

/** The newest of some ISO timestamps, or undefined when there are none. */
function latest(...dates: (string | undefined)[]): string | undefined {
  return dates
    .filter((d): d is string => Boolean(d))
    .sort()
    .at(-1);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts, settings] = await Promise.all([getProjects(), getPosts(), getSettings()]);

  // `lastModified` is the one sitemap field Google says it actually uses,
  // and only while it stays accurate — so it comes from `updatedAt`, which
  // every save moves. `publishedAt` (what this used before) is set only for
  // scheduled items, which left most entries with no date at all.
  const projectRoutes: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${SITE_URL}/work/${project.slug}`,
    lastModified: latest(project.updatedAt, project.publishedAt),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/writing/${post.slug}`,
    lastModified: latest(post.updatedAt, post.publishedAt ?? post.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // An index page changes when anything listed on it does. Home lists
  // projects and is built from settings; /work lists projects; /writing
  // lists posts; /about is settings (plus roles and skills, which carry no
  // timestamps of their own here).
  const projectsChanged = latest(...projectRoutes.map((r) => r.lastModified as string | undefined));
  const postsChanged = latest(...postRoutes.map((r) => r.lastModified as string | undefined));

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: latest(projectsChanged, settings.updatedAt),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/work`,
      lastModified: projectsChanged,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/writing`,
      lastModified: postsChanged,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: settings.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    { url: `${SITE_URL}/contact`, changeFrequency: 'yearly', priority: 0.5 },
  ];

  return [...staticRoutes, ...projectRoutes, ...postRoutes];
}

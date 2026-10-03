import type { Metadata } from 'next';
import { SiteShell } from '@/components/layout/site-shell';
import { Footer } from '@/components/layout/footer';
import { Analytics } from '@/components/analytics/analytics';
import { getSettings, getProjects, getPosts, getSiteCopy } from '@/server/queries';

/*
 * Every page under this layout is CMS-backed — the layout itself queries
 * settings/projects/posts for the nav and footer, so the whole group is
 * already DB-dependent at render time regardless of what each page does.
 * Forcing dynamic rendering here (rather than leaving Next to infer static
 * eligibility per route) means content published through the admin shows
 * up on the next request, not the next deploy — which is the entire point
 * of having a CMS. It also removes the one dependency `next build` had on
 * a reachable database: the Docker build stage has no network access to
 * Mongo by design, and `generateStaticParams` in the [slug] routes already
 * degrades gracefully to an empty list for that same reason.
 */
export const dynamic = 'force-dynamic';

/*
 * The site-wide description and social-card defaults, from the CMS rather
 * than the root layout's static fallback (which only admin and /docs still
 * see). Pages override both through `pageMetadata` (lib/seo.ts); this is
 * what anything without its own description falls back to.
 */
export async function generateMetadata(): Promise<Metadata> {
  const [settings, copy] = await Promise.all([getSettings(), getSiteCopy()]);
  return {
    description: copy.seo.siteDescription,
    openGraph: {
      type: 'website',
      siteName: settings.name,
      title: settings.name,
      description: copy.seo.siteDescription,
    },
  };
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // Fetched once at the layout — Nav, the command palette, and Footer all
  // need settings/projects/posts, and React's cache() (see queries.ts)
  // means this and any call the same data further down the tree resolve
  // to a single Mongo round trip per request either way.
  const [settings, projects, posts, copy] = await Promise.all([
    getSettings(),
    getProjects(),
    getPosts(),
    getSiteCopy(),
  ]);

  // SiteShell is a Client Component, so everything handed to it is
  // serialized into every page's HTML. The WhatsApp number must not be:
  // keeping it out of the markup is the whole point of /whatsapp.
  const publicSettings = { ...settings, whatsapp: undefined };

  return (
    <SiteShell settings={publicSettings} projects={projects} posts={posts}>
      {/* pt-16 clears the fixed header. */}
      <main id="main" className="flex-1 pt-16">
        {children}
      </main>
      <Footer settings={publicSettings} unavailableText={copy.footer.unavailableText} />
      {/* Umami, public pages only — see components/analytics/analytics.tsx. */}
      <Analytics />
    </SiteShell>
  );
}

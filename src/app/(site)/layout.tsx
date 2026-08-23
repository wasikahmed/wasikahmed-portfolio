import { SiteShell } from '@/components/site/site-shell';
import { Footer } from '@/components/site/footer';
import { getSettings, getProjects, getPosts } from '@/server/queries';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // Fetched once at the layout — Nav, the command palette, and Footer all
  // need settings/projects/posts, and React's cache() (see queries.ts)
  // means this and any call the same data further down the tree resolve
  // to a single Mongo round trip per request either way.
  const [settings, projects, posts] = await Promise.all([getSettings(), getProjects(), getPosts()]);

  return (
    <SiteShell settings={settings} projects={projects} posts={posts}>
      {/* pt-16 clears the fixed header. */}
      <main id="main" className="flex-1 pt-16">
        {children}
      </main>
      <Footer settings={settings} />
    </SiteShell>
  );
}

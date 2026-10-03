'use client';

import { useState } from 'react';
import { Nav } from './nav';
import { CommandPalette } from './command-palette';
import type { Post, Project, Settings } from '@/lib/types';
import { EVENTS, track } from '@/lib/analytics';

/**
 * Client boundary for the site chrome. Kept as thin as possible so every
 * page below it stays a Server Component — only the nav and palette need
 * interactivity, not the content they wrap.
 *
 * `settings`/`projects`/`posts` are fetched once by the Server Component
 * layout and threaded down as props — Client Components cannot query
 * Mongo directly.
 */
export function SiteShell({
  children,
  settings,
  projects,
  posts,
}: {
  children: React.ReactNode;
  settings: Settings;
  projects: Project[];
  posts: Post[];
}) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <>
      <a
        href="#main"
        className="bg-accent text-bg sr-only rounded-md px-4 py-2 font-medium focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[70]"
      >
        Skip to content
      </a>
      <Nav
        onOpenPalette={() => {
          track(EVENTS.paletteOpen, { method: 'button' });
          setPaletteOpen(true);
        }}
        settings={settings}
      />
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        settings={settings}
        projects={projects}
        posts={posts}
      />
      {children}
    </>
  );
}

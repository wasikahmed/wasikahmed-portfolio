'use client';

import { useState } from 'react';
import { Nav } from './nav';
import { CommandPalette } from './command-palette';

/**
 * Client boundary for the site chrome. Kept as thin as possible so every
 * page below it stays a Server Component — only the nav and palette need
 * interactivity, not the content they wrap.
 */
export function SiteShell({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <>
      <a
        href="#main"
        className="bg-accent text-bg sr-only rounded-md px-4 py-2 font-medium focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[70]"
      >
        Skip to content
      </a>
      <Nav onOpenPalette={() => setPaletteOpen(true)} />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      {children}
    </>
  );
}

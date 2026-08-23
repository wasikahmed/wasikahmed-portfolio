'use client';

import { useActiveSection } from '@/components/site/use-active-section';
import { cn } from '@/lib/cn';

/**
 * Sticky contents for long case studies. Desktop only — on narrow screens
 * it would cost more room than it saves, and the sections are short enough
 * to scroll.
 */
export function Toc({ sections }: { sections: { id: string; title: string }[] }) {
  const activeId = useActiveSection(sections.map((s) => s.id));

  return (
    <nav aria-label="Case study contents" className="sticky top-28">
      <p className="text-2xs text-fg-subtle mb-4 font-mono tracking-widest uppercase">Contents</p>
      <ul className="border-border-subtle flex flex-col gap-1 border-l">
        {sections.map((section) => {
          const active = section.id === activeId;
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={active ? 'true' : undefined}
                className={cn(
                  'duration-fast -ml-px block border-l py-1.5 pl-4 text-sm transition-colors',
                  active
                    ? 'border-accent text-accent'
                    : 'text-fg-muted hover:border-border-strong hover:text-fg border-transparent',
                )}
              >
                {section.title}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

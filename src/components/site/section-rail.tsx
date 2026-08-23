'use client';

import { motion, useScroll, useSpring } from 'motion/react';
import { useActiveSection } from './use-active-section';
import { cn } from '@/lib/cn';

interface RailSection {
  id: string;
  label: string;
}

/**
 * Signature interaction #6 (PLAN.md §2.5).
 *
 * The prototype had a bare scroll-progress bar — decoration that told you
 * nothing you could act on. This keeps the progress fill but adds the two
 * things that make it information: which section you are in, and a way to
 * jump to any other.
 *
 * Desktop only. On mobile the labels would cost more room than they earn.
 */
export function SectionRail({ sections }: { sections: RailSection[] }) {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });
  const activeId = useActiveSection(sections.map((s) => s.id));

  if (sections.length === 0) return null;

  return (
    <nav
      aria-label="Section navigation"
      className="pointer-events-none fixed top-0 left-0 z-40 hidden h-screen w-10 xl:block"
    >
      {/* Progress track */}
      <div className="bg-border-subtle absolute top-0 left-5 h-full w-px">
        <motion.div
          className="from-accent to-accent-bright absolute inset-x-0 top-0 origin-top bg-gradient-to-b"
          style={{ height: '100%', scaleY: progress }}
        />
      </div>

      <ul className="group pointer-events-auto absolute top-1/2 left-0 flex -translate-y-1/2 flex-col gap-1">
        {sections.map((section) => {
          const active = section.id === activeId;
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="flex items-center gap-3 py-1.5 pr-3 pl-[15px]"
                aria-current={active ? 'true' : undefined}
              >
                <span
                  className={cn(
                    'duration-base block h-px transition-all',
                    active ? 'bg-accent w-4' : 'bg-border-strong w-2 group-hover:w-3',
                  )}
                />
                <span
                  className={cn(
                    'text-2xs duration-base font-mono whitespace-nowrap opacity-0 transition-all group-hover:opacity-100',
                    active ? 'text-accent' : 'text-fg-muted',
                  )}
                >
                  {section.label}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

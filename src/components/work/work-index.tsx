'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { ProjectCard } from './project-card';
import type { Category, Project } from '@/lib/types';
import { cn } from '@/lib/cn';
import { EVENTS, track } from '@/lib/analytics';

const FILTERS: (Category | 'All')[] = ['All', 'AI', 'Automation', 'Systems', 'Web'];

/**
 * Filtering with layout animation.
 *
 * Cards move to their new positions rather than popping in and out, so the
 * relationship between before and after survives the change — Rule 1(a).
 * `layout` is a transform animation, so reduced motion collapses it to an
 * instant reposition without losing a single card.
 */
export function WorkIndex({ projects }: { projects: Project[] }) {
  const params = useSearchParams();
  // Set by the hero constellation: /work?tech=PostgreSQL
  const techFilter = params.get('tech');
  const [category, setCategory] = useState<Category | 'All'>('All');

  const visible = useMemo(() => {
    return projects.filter((project) => {
      const matchesCategory = category === 'All' || project.categories.includes(category);
      const matchesTech = !techFilter || project.stack.includes(techFilter);
      return matchesCategory && matchesTech;
    });
  }, [category, techFilter, projects]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((filter) => {
          const active = category === filter;
          return (
            <button
              key={filter}
              type="button"
              onClick={() => {
                setCategory(filter);
                track(EVENTS.workFilter, { category: filter, source: 'chips' });
              }}
              aria-pressed={active}
              className={cn(
                'text-2xs duration-fast relative rounded-sm border px-3 py-1.5 font-mono transition-colors',
                active
                  ? 'border-border-strong text-accent'
                  : 'border-border-subtle text-fg-muted hover:border-border hover:text-fg',
              )}
            >
              {active ? (
                <motion.span
                  layoutId="filter-pill"
                  className="bg-accent-soft absolute inset-0 -z-10 rounded-sm"
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                />
              ) : null}
              {filter}
            </button>
          );
        })}

        <p className="text-2xs text-fg-subtle ml-auto font-mono" role="status" aria-live="polite">
          {visible.length} of {projects.length}
        </p>
      </div>

      {techFilter ? (
        <p className="text-2xs text-fg-muted mt-4 font-mono">
          Filtered by <span className="text-accent">{techFilter}</span> ·{' '}
          <Link href="/work" className="hover:text-fg underline underline-offset-4">
            clear
          </Link>
        </p>
      ) : null}

      <motion.ul layout className="mt-10 grid gap-5 sm:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {visible.map((project) => (
            <motion.li
              key={project.slug}
              layout
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <ProjectCard project={project} headingLevel="h2" className="h-full" />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      {visible.length === 0 ? (
        <p className="text-fg-muted mt-16 text-center text-sm">Nothing matches that combination.</p>
      ) : null}
    </>
  );
}

import Link from 'next/link';
import type { Project } from '@/lib/types';
import { ViewTransition } from '@/components/motion/view-transition';
import { TagList } from '@/components/ui/tag';
import { cn } from '@/lib/cn';

/**
 * Progressive disclosure, PLAN.md §2.4.
 *
 * The card shows a title, one outcome metric, and three stack chips. The
 * problem statement is revealed on hover; role, timeline, full stack, and
 * everything else lives in the case study. The prototype's card tried to
 * say all of it at once, which meant none of it was read.
 */
export function ProjectCard({
  project,
  size = 'default',
  className,
}: {
  project: Project;
  /** `feature` is the larger tile in the asymmetric home grid. */
  size?: 'default' | 'feature';
  className?: string;
}) {
  const feature = size === 'feature';

  return (
    <Link
      href={`/work/${project.slug}`}
      className={cn(
        'group border-border-subtle bg-surface-1 duration-base ease-out-quint relative flex flex-col justify-between overflow-hidden rounded-lg border p-6 transition-all',
        'hover:border-border-strong hover:shadow-e3 hover:-translate-y-1',
        'focus-visible:border-border-strong focus-visible:-translate-y-1',
        feature ? 'min-h-[22rem] sm:p-8' : 'min-h-[16rem]',
        className,
      )}
    >
      {/* Accent wash that resolves on hover — confirms the card is a target. */}
      <span
        aria-hidden
        className="duration-base pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
        style={{
          background: `radial-gradient(120% 80% at 50% 100%, color-mix(in oklab, ${project.accent} 10%, transparent) 0%, transparent 70%)`,
        }}
      />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <ViewTransition name={`project-title-${project.slug}`}>
            <h3
              className={cn(
                'font-display font-bold tracking-tight',
                feature ? 'text-2xl' : 'text-xl',
              )}
            >
              {project.title}
            </h3>
          </ViewTransition>
          <span
            aria-hidden
            className="text-2xs text-fg-subtle duration-base group-hover:text-accent mt-1 shrink-0 font-mono transition-transform group-hover:translate-x-0.5"
          >
            →
          </span>
        </div>

        <p className="text-fg-muted mt-2 text-sm">{project.tagline}</p>

        {/*
         * The problem, revealed on hover. Grid-rows 0fr→1fr animates height
         * without hardcoding one, so it adapts to any copy length.
         */}
        <div className="duration-base ease-out-quint grid grid-rows-[0fr] transition-[grid-template-rows] group-hover:grid-rows-[1fr] group-focus-visible:grid-rows-[1fr]">
          <div className="overflow-hidden">
            <p className="text-fg-subtle pt-3 text-sm leading-relaxed">{project.problem}</p>
          </div>
        </div>
      </div>

      <div className="relative mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <ViewTransition name={`project-metric-${project.slug}`}>
            <p
              className={cn(
                'font-display text-fg font-bold tracking-tight',
                feature ? 'text-4xl' : 'text-3xl',
              )}
            >
              {project.headline.value}
            </p>
          </ViewTransition>
          <p className="text-fg-muted mt-0.5 text-sm">{project.headline.label}</p>
        </div>
        <TagList items={project.stack} max={3} />
      </div>
    </Link>
  );
}

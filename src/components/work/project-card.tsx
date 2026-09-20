import Image from 'next/image';
import Link from 'next/link';
import type { Project } from '@/lib/types';
import { ViewTransition } from '@/components/motion/view-transition';
import { TagList } from '@/components/ui/tag';
import { cn } from '@/lib/cn';

/**
 * Progressive disclosure, PLAN.md §2.4.
 *
 * The card shows a title, one outcome metric, and three stack chips. On the
 * default tile the problem statement is revealed on hover; role, timeline,
 * full stack, and everything else lives in the case study. The prototype's
 * card tried to say all of it at once, which meant none of it was read.
 *
 * The `feature` tile is the exception: it is stretched to twice the height
 * of its neighbours, so it shows the problem and two supporting metrics
 * outright rather than standing mostly empty.
 */
export function ProjectCard({
  project,
  size = 'default',
  headingLevel = 'h3',
  className,
}: {
  project: Project;
  /** `feature` is the larger tile in the asymmetric home grid. */
  size?: 'default' | 'feature';
  /**
   * The card's own heading level. `h3` suits the home grid, which sits
   * under a section `h2`. `/work` has no `h2` between its page `h1` and
   * these cards, so it passes `h2` rather than skipping a level.
   */
  headingLevel?: 'h2' | 'h3';
  className?: string;
}) {
  const feature = size === 'feature';
  const Heading = headingLevel;
  /*
   * `metrics` normally leads with the same number as `headline` (the
   * case study's "at a glance" bar repeats it deliberately). Showing both
   * on one tile just prints $140k twice, so the headline is filtered out
   * before taking the two that add something.
   */
  const supporting = feature
    ? project.metrics
        .filter((m) => m.value !== project.headline.value || m.label !== project.headline.label)
        .slice(0, 2)
    : [];

  return (
    <Link
      href={`/work/${project.slug}`}
      className={cn(
        'group border-border-subtle bg-surface-1 duration-base ease-out-quint relative flex flex-col overflow-hidden rounded-lg border p-6 transition-all',
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

      {/* Cover image, bled to the card's edges — absent means the card
          reads exactly as it did before this existed (PLAN.md W15 item 1). */}
      {project.cover ? (
        <div
          className={cn(
            'bg-surface-2 relative -mx-6 -mt-6 mb-5 aspect-video overflow-hidden',
            feature ? 'sm:-mx-8 sm:-mt-8' : '',
          )}
        >
          <Image
            src={project.cover.url}
            alt={project.cover.alt}
            fill
            sizes="(min-width: 640px) 50vw, 100vw"
            className="duration-base object-cover transition-transform group-hover:scale-[1.03]"
          />
        </div>
      ) : null}

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <ViewTransition name={`project-title-${project.slug}`}>
            <Heading
              className={cn(
                'font-display font-bold tracking-tight',
                feature ? 'text-2xl' : 'text-xl',
              )}
            >
              {project.title}
            </Heading>
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
         * Role/timeline/categories (PLAN.md W15 item 2) — previously known
         * only from the case study. One quiet meta line is enough; the
         * numbers below already carry the card's visual weight.
         */}
        <p className="text-2xs text-fg-subtle mt-2 font-mono tracking-wide uppercase">
          {project.categories.join(' · ')} — {project.role}, {project.timeline}
        </p>

        {/*
         * Progressive disclosure is for the small tiles, where hiding the
         * problem is what keeps them scannable. The feature tile is
         * `row-span-2` and stretched to the height of the three cards
         * beside it, so hiding its body left roughly 600px of empty card —
         * it read as a failed image load rather than restraint. It carries
         * the copy outright instead.
         */}
        {feature ? (
          <p className="text-fg-subtle mt-4 text-sm leading-relaxed">{project.problem}</p>
        ) : (
          // Grid-rows 0fr→1fr animates height without hardcoding one, so it
          // adapts to any copy length.
          <div className="duration-base ease-out-quint grid grid-rows-[0fr] transition-[grid-template-rows] group-hover:grid-rows-[1fr] group-focus-visible:grid-rows-[1fr]">
            <div className="overflow-hidden">
              <p className="text-fg-subtle pt-3 text-sm leading-relaxed">{project.problem}</p>
            </div>
          </div>
        )}
      </div>

      {/*
       * Everything numeric sits in one block pinned to the foot of the tile.
       * `mt-auto` rather than `justify-between` on the parent: with three
       * children the latter opened *two* gaps in the stretched feature tile
       * instead of one, which looked more broken than the empty card did.
       */}
      <div className="relative mt-auto">
        {/*
         * The supporting numbers, feature tile only. They are already on the
         * case study's "at a glance" bar; surfacing two of them here is what
         * turns the lead tile from a bigger card into a denser one.
         */}
        {supporting.length > 0 ? (
          <dl className="border-border-subtle grid grid-cols-2 gap-4 border-t pt-6">
            {supporting.map((metric) => (
              <div key={metric.label}>
                <dt className="text-2xs text-fg-subtle font-mono tracking-wide uppercase">
                  {metric.label}
                </dt>
                <dd className="font-display text-fg mt-1 text-xl font-bold tracking-tight">
                  {metric.value}
                </dd>
                {metric.baseline ? (
                  <dd className="text-fg-subtle mt-0.5 font-mono text-xs">{metric.baseline}</dd>
                ) : null}
              </div>
            ))}
          </dl>
        ) : null}

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
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
      </div>
    </Link>
  );
}

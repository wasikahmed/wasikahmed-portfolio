import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Section, Container } from '@/components/ui/section';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Tag } from '@/components/ui/tag';
import { Button, ArrowRight } from '@/components/ui/button';
import { Metric } from '@/components/motion/metric';
import { Reveal } from '@/components/motion/reveal';
import { ViewTransition } from '@/components/motion/view-transition';
import { Architecture } from '@/components/case-study/architecture';
import { Toc } from '@/components/case-study/toc';
import { MdxContent } from '@/components/mdx/mdx-content';
import {
  getProjectSlugs,
  getProject,
  getAdjacentProjects,
  getSettings,
  getSiteCopy,
} from '@/server/queries';
import { pageTitle, pageMetadata } from '@/lib/seo';

export async function generateStaticParams() {
  // Best-effort pre-render: `next build` runs this with no guarantee the
  // database is reachable (it never is inside the Docker build stage — no
  // network access to a real Mongo, by design). `dynamicParams` defaults
  // to true, so any slug missing from this list still renders correctly
  // on its first request and is cached from there; an empty array here
  // just means every slug takes that path instead of only the new ones.
  try {
    const slugs = await getProjectSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [project, settings] = await Promise.all([getProject(slug), getSettings()]);
  if (!project) return {};

  // The CMS's SEO override fields (publish-fields.tsx) had nowhere to land
  // until now — PLAN.md W3. A blank override falls back to the same values
  // the page body renders.
  return pageMetadata({
    title: pageTitle(project.seo?.title ?? project.title, settings.name),
    description: project.seo?.description ?? project.problem,
    path: `/work/${slug}`,
    siteName: settings.name,
  });
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [project, copy] = await Promise.all([getProject(slug), getSiteCopy()]);
  if (!project) notFound();

  const { next } = await getAdjacentProjects(slug);
  const toc = project.sections.map((s) => ({ id: s.id, title: s.title }));

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <Section density="compact" ambient={['blob']} className="pt-10 sm:pt-14">
        <Container>
          <Link
            href="/work"
            className="text-2xs text-fg-muted duration-fast hover:text-accent inline-flex items-center gap-2 font-mono transition-colors"
          >
            <span aria-hidden>←</span> All work
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            {project.categories.map((category) => (
              <Tag key={category} tone="accent">
                {category}
              </Tag>
            ))}
            <span className="text-2xs text-fg-subtle font-mono">{project.timeline}</span>
          </div>

          {/* Shared element — morphs from the card that opened this page. */}
          <ViewTransition name={`project-title-${project.slug}`}>
            <h1 className="font-display mt-5 max-w-3xl text-4xl font-bold tracking-tighter text-balance">
              {project.title}
            </h1>
          </ViewTransition>

          <p className="text-fg-muted mt-4 max-w-xl text-lg text-pretty">{project.tagline}</p>

          {/* Absent means the hero reads exactly as it did before cover
              images existed (PLAN.md W15 item 1). */}
          {project.cover ? (
            <div className="border-border-subtle bg-surface-1 relative mt-8 aspect-video overflow-hidden rounded-lg border">
              <Image
                src={project.cover.url}
                alt={project.cover.alt}
                fill
                sizes="(min-width: 1024px) 46rem, 100vw"
                priority
                className="object-cover"
              />
            </div>
          ) : null}
        </Container>
      </Section>

      {/*
       * "At a glance" bar. Sticks under the header while you read, so the
       * outcome stays visible through the detail rather than being something
       * you have to scroll back up for.
       */}
      <div className="border-border-subtle bg-bg/85 sticky top-16 z-30 border-y backdrop-blur-xl">
        <Container className="px-6 lg:px-10">
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 py-5 sm:grid-cols-3">
            {project.metrics.map((metric, index) => (
              <div key={metric.label} className={index === 0 ? '' : 'hidden sm:block'}>
                <ViewTransition name={index === 0 ? `project-metric-${project.slug}` : undefined}>
                  <Metric value={metric.value} label={metric.label} baseline={metric.baseline} />
                </ViewTransition>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_minmax(0,44rem)] lg:gap-16 xl:grid-cols-[minmax(0,15rem)_minmax(0,46rem)_1fr]">
            <aside className="hidden lg:block">
              <Toc sections={toc} />
            </aside>

            <article className="min-w-0">
              {project.sections.map((section) => (
                <section key={section.id} id={section.id} className="mb-14 scroll-mt-40 last:mb-0">
                  <Reveal>
                    <h2 className="font-display text-2xl font-bold tracking-tight">
                      {section.title}
                    </h2>
                    <div className="mt-5">
                      <MdxContent source={section.bodyMdx} />
                    </div>
                  </Reveal>

                  {/* The diagram belongs with the approach, not in a gallery. */}
                  {section.id === 'approach' ? (
                    <div className="border-border-subtle bg-surface-1 mt-8 rounded-lg border p-6 sm:p-8">
                      <Eyebrow>How it runs</Eyebrow>
                      <Architecture nodes={project.architecture} />
                    </div>
                  ) : null}
                </section>
              ))}

              {/* Stack and role — detail that does not belong on the card. */}
              <div className="border-border-subtle mt-16 grid gap-8 border-t pt-8 sm:grid-cols-2">
                <div>
                  <p className="text-2xs text-fg-subtle mb-3 font-mono tracking-widest uppercase">
                    Stack
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {project.stack.map((item) => (
                      <Tag key={item}>{item}</Tag>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-2xs text-fg-subtle mb-3 font-mono tracking-widest uppercase">
                    Role
                  </p>
                  <p className="text-fg-muted text-sm">{project.role}</p>
                  <p className="text-2xs text-fg-subtle mt-1 font-mono">{project.timeline}</p>
                </div>
              </div>
            </article>
          </div>
        </Container>
      </Section>

      {/* ── Next ─────────────────────────────────────────────────────── */}
      {next ? (
        <Section bordered density="compact">
          <Container>
            <Link href={`/work/${next.slug}`} className="group block">
              <p className="text-2xs text-fg-subtle font-mono tracking-widest uppercase">
                Next project
              </p>
              <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                <h2 className="font-display duration-fast group-hover:text-accent text-3xl font-bold tracking-tight transition-colors">
                  {next.title}
                </h2>
                <span className="text-2xs text-fg-muted flex items-center gap-2 font-mono">
                  {next.headline.value} {next.headline.label}
                  <ArrowRight />
                </span>
              </div>
            </Link>
          </Container>
        </Section>
      ) : null}

      <Section bordered density="compact">
        <Container className="flex flex-wrap items-center justify-between gap-6">
          <p className="text-fg-muted max-w-md">{copy.caseStudy.ctaText}</p>
          <Button href="/contact" className="group">
            Start a conversation
            <ArrowRight />
          </Button>
        </Container>
      </Section>
    </>
  );
}

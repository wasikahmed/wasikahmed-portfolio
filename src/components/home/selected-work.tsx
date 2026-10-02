import { Section, Container } from '@/components/ui/section';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Button, ArrowRight } from '@/components/ui/button';
import { ProjectCard } from '@/components/work/project-card';
import { Reveal, Stagger, StaggerItem } from '@/components/motion/reveal';
import { getProjects, getSiteCopy } from '@/server/queries';
import { fillCount } from '@/lib/format';

/**
 * The first project gets a full-width feature tile and the rest fall into
 * an even two-column grid — one of the three sections that deliberately
 * breaks the uniform card grid (PLAN.md §2.7).
 *
 * The hierarchy break is the point; the earlier asymmetric-offset version
 * achieved it by row-spanning the lead against a stack of siblings, which
 * only held while there were exactly four projects and no cover images.
 */
export async function SelectedWork() {
  const [projects, copy] = await Promise.all([getProjects(), getSiteCopy()]);
  const [lead, ...rest] = projects;

  return (
    <Section id="work" bordered band ambient={['grid']}>
      <Container>
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Eyebrow rule>Selected work</Eyebrow>
              <h2 className="font-display mt-5 max-w-xl text-3xl font-bold tracking-tight text-balance">
                {/* Was hardcoded "Four" (PLAN.md W5) — silently wrong the
                    moment a project shipped or was unpublished. The count
                    still comes from the data; the sentence around it is
                    site copy. */}
                {fillCount(copy.home.workHeading, projects.length)}
              </h2>
            </div>
            <Button href="/work" variant="ghost" className="group">
              All work
              <ArrowRight />
            </Button>
          </div>
        </Reveal>

        {lead ? (
          <Stagger className="mt-12 grid gap-5 lg:grid-cols-2" gap={0.08}>
            {/* Full width, not a row-spanning column. The previous layout
                gave the lead `lg:row-span-2 h-full` against an unbounded
                right column, so the card stretched to whatever the stack
                beside it happened to total — 2168px against a 256px cover
                once a fifth project and cover images landed. Spanning the
                row instead keeps the hierarchy break without tying one
                card's height to the number of others. */}
            <StaggerItem className="lg:col-span-2">
              <ProjectCard project={lead} size="feature" />
            </StaggerItem>

            {rest.map((project) => (
              <StaggerItem key={project.slug}>
                <ProjectCard project={project} className="h-full" />
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          // No published projects yet — a real, reachable state (a fresh
          // install before seeding, or every project unpublished from the
          // CMS), not something to crash on.
          <p className="text-fg-muted mt-16 text-center text-sm">
            Nothing published yet — check back soon.
          </p>
        )}
      </Container>
    </Section>
  );
}

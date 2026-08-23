import { Section, Container } from '@/components/ui/section';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Button, ArrowRight } from '@/components/ui/button';
import { ProjectCard } from '@/components/work/project-card';
import { Reveal, Stagger, StaggerItem } from '@/components/motion/reveal';
import { getProjects } from '@/server/queries';

/**
 * Asymmetric offset grid — one of the three sections that deliberately
 * breaks the uniform card grid (PLAN.md §2.7). The first project gets a
 * larger tile and the second column is nudged down, so the eye moves
 * diagonally instead of scanning identical rows.
 */
export async function SelectedWork() {
  const projects = await getProjects();
  const [lead, ...rest] = projects;

  return (
    <Section id="work" bordered ambient={['grid']}>
      <Container>
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Eyebrow rule>Selected work</Eyebrow>
              <h2 className="font-display mt-5 max-w-xl text-3xl font-bold tracking-tight text-balance">
                Four systems, still in production.
              </h2>
            </div>
            <Button href="/work" variant="ghost" className="group">
              All work
              <ArrowRight />
            </Button>
          </div>
        </Reveal>

        <Stagger className="mt-12 grid gap-5 lg:grid-cols-2" gap={0.08}>
          <StaggerItem className="lg:row-span-2">
            <ProjectCard project={lead} size="feature" className="h-full" />
          </StaggerItem>

          {/* Offset pushes the right column out of lockstep with the left. */}
          <div className="flex flex-col gap-5 lg:mt-12">
            {rest.map((project) => (
              <StaggerItem key={project.slug}>
                <ProjectCard project={project} />
              </StaggerItem>
            ))}
          </div>
        </Stagger>
      </Container>
    </Section>
  );
}

import { Section, Container } from '@/components/ui/section';
import { Metric } from '@/components/motion/metric';
import { Reveal } from '@/components/motion/reveal';
import { getProjects, getSiteCopy } from '@/server/queries';

/**
 * Full-bleed statement moment — the second deliberate break from the card
 * grid (PLAN.md §2.7). No cards at all: just the numbers, large, on the
 * page ground, with the baseline that makes each one checkable.
 *
 * Capped at four: the grid is four columns at its widest, so a fifth metric
 * strands itself alone on a second row.
 */
export async function Impact() {
  const [allProjects, copy] = await Promise.all([getProjects(), getSiteCopy()]);
  const projects = allProjects.slice(0, 4);

  return (
    <Section id="impact" density="spacious" bordered ambient={['scanlines', 'guides']}>
      <Container>
        <Reveal>
          <h2 className="font-display max-w-3xl text-3xl font-bold tracking-tight text-balance">
            {copy.home.impactHeading}
          </h2>
          <p className="text-fg-muted mt-4 max-w-xl text-sm">{copy.home.impactIntro}</p>
        </Reveal>

        <div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {projects.map((project, i) => (
            <Reveal key={project.slug} delay={i * 0.06}>
              <Metric
                value={project.headline.value}
                label={project.headline.label}
                baseline={project.headline.baseline}
              />
              <p className="border-border-subtle text-fg-subtle mt-3 border-t pt-3 font-mono text-xs">
                {project.title}
              </p>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

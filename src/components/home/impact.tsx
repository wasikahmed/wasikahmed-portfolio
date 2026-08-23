import { Section, Container } from '@/components/ui/section';
import { Metric } from '@/components/motion/metric';
import { Reveal } from '@/components/motion/reveal';
import { projects } from '@/lib/content/projects';

/**
 * Full-bleed statement moment — the second deliberate break from the card
 * grid (PLAN.md §2.7). No cards at all: just the numbers, large, on the
 * page ground, with the baseline that makes each one evidence.
 */
export function Impact() {
  return (
    <Section id="impact" density="spacious" bordered ambient={['noise']}>
      <Container>
        <Reveal>
          <h2 className="font-display max-w-3xl text-3xl font-bold tracking-tight text-balance">
            The numbers, with the baselines that make them mean something.
          </h2>
          <p className="text-fg-muted mt-4 max-w-xl text-sm">
            A percentage on its own is marketing. Paired with what it replaced, it is evidence.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {projects.map((project, i) => (
            <Reveal key={project.slug} delay={i * 0.06}>
              <Metric
                value={project.headline.value}
                label={project.headline.label}
                baseline={project.headline.baseline}
              />
              <p className="border-border-subtle text-2xs text-fg-subtle mt-3 border-t pt-3 font-mono">
                {project.title}
              </p>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

import { Section, Container } from '@/components/ui/section';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Reveal } from '@/components/motion/reveal';
import { getProjects, getSettings } from '@/server/queries';

/**
 * Public artefacts, derived from each project's `links` rather than from a
 * collection of its own.
 *
 * This replaced the testimonials section. Three client quotes is the shape a
 * consultancy site wants; the readers this site is written for are hiring,
 * and a store listing they can open outweighs a quote they cannot verify.
 * Deriving it from `links` means the admin already edits it — add a link to
 * a project and it appears here, so the two can never disagree.
 */
export async function Shipped() {
  const [projects, settings] = await Promise.all([getProjects(), getSettings()]);
  const shipped = projects.filter((p) => p.links?.length);
  const github = settings.socials.find((s) => s.label === 'GitHub');

  if (!shipped.length) return null;

  return (
    <Section id="shipped" bordered density="compact" ambient={['noise']}>
      <Container>
        <Eyebrow rule>Shipped &amp; public</Eyebrow>
        <h2 className="font-display mt-5 max-w-2xl text-3xl font-bold tracking-tight text-balance">
          Things you can open yourself.
        </h2>

        <ul className="divide-border-subtle border-border-subtle mt-10 flex flex-col divide-y border-t">
          {shipped.map((project, i) => (
            <Reveal as="li" key={project.slug} delay={i * 0.06}>
              <div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-baseline sm:gap-8">
                <div className="min-w-0 sm:w-64 sm:shrink-0">
                  <p className="font-display text-fg text-lg font-semibold tracking-tight">
                    {project.title}
                  </p>
                  <p className="text-fg-subtle mt-1 text-xs">{project.tagline}</p>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {project.links?.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-fg-muted duration-fast hover:text-accent font-mono text-xs transition-colors"
                    >
                      {link.label} <span aria-hidden>↗</span>
                    </a>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}

          {github ? (
            <Reveal as="li" delay={shipped.length * 0.06}>
              <div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-baseline sm:gap-8">
                <div className="min-w-0 sm:w-64 sm:shrink-0">
                  <p className="font-display text-fg text-lg font-semibold tracking-tight">
                    Everything else
                  </p>
                  <p className="text-fg-subtle mt-1 text-xs">
                    Smaller projects and experiments, in public.
                  </p>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  <a
                    href={github.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-fg-muted duration-fast hover:text-accent font-mono text-xs transition-colors"
                  >
                    GitHub <span aria-hidden>↗</span>
                  </a>
                </div>
              </div>
            </Reveal>
          ) : null}
        </ul>
      </Container>
    </Section>
  );
}

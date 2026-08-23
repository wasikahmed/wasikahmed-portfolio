import Link from 'next/link';
import { Section, Container } from '@/components/ui/section';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Reveal } from '@/components/motion/reveal';
import { getTestimonials, getProjects } from '@/server/queries';

/**
 * Testimonials, tied to the project each quote came from.
 *
 * The prototype gave these their own carousel section. Folding them into
 * inline quotes that link back to the work removes a whole section of
 * scroll while making each quote more credible, not less.
 */
export async function Voices() {
  const [testimonials, projects] = await Promise.all([getTestimonials(), getProjects()]);
  const bySlug = new Map(projects.map((p) => [p.slug, p]));

  return (
    <Section id="voices" bordered density="compact">
      <Container>
        <Eyebrow rule>What clients said</Eyebrow>
        <ul className="mt-10 grid gap-x-10 gap-y-10 md:grid-cols-3">
          {testimonials.map((t, i) => {
            const project = t.projectSlug ? bySlug.get(t.projectSlug) : undefined;
            return (
              <Reveal as="li" key={t.name} delay={i * 0.07}>
                <figure className="flex h-full flex-col">
                  <blockquote className="text-fg text-sm leading-relaxed text-pretty">
                    “{t.quote}”
                  </blockquote>
                  <figcaption className="border-border-subtle mt-5 flex items-center gap-3 border-t pt-4">
                    <span
                      aria-hidden
                      className="border-border bg-surface-2 text-2xs text-accent grid h-8 w-8 shrink-0 place-items-center rounded-full border font-mono"
                    >
                      {t.initials}
                    </span>
                    <span className="text-2xs text-fg-muted min-w-0">
                      <span className="text-fg block truncate">{t.name}</span>
                      <span className="block truncate">
                        {t.title}, {t.company}
                      </span>
                    </span>
                  </figcaption>
                  {project ? (
                    <Link
                      href={`/work/${project.slug}`}
                      className="text-2xs text-fg-subtle duration-fast hover:text-accent mt-3 font-mono transition-colors"
                    >
                      → {project.title}
                    </Link>
                  ) : null}
                </figure>
              </Reveal>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}

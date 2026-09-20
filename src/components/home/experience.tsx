import { Section, Container } from '@/components/ui/section';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Button, ArrowRight } from '@/components/ui/button';
import { Reveal } from '@/components/motion/reveal';
import type { Role } from '@/lib/types';

/**
 * Three-role summary (PLAN.md W15 item 6).
 *
 * This page and /about used to render the same full role history —
 * home's version even the richer of the two, with an expand-for-detail
 * accordion /about didn't have. Redundant, and a large share of why the
 * home page ran to a ~7,500px mobile scroll. /about now owns the full
 * timeline (`RoleAccordion`, with the shipped-work detail this section
 * used to show); this keeps only the headline of it, plus a way there.
 *
 * `roles` arrives already sorted by `order` ascending (queries.ts's
 * `getRoles()`) — the first three are the current/most recent ones, not
 * an arbitrary slice.
 */
export function Experience({ roles }: { roles: Role[] }) {
  const featured = roles.slice(0, 3);

  return (
    <Section id="experience" bordered>
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow rule>Experience</Eyebrow>
            <h2 className="font-display mt-5 max-w-xl text-3xl font-bold tracking-tight text-balance">
              Where I&apos;ve built.
            </h2>
          </div>
          <Button href="/about#experience" variant="ghost" className="group">
            Full experience
            <ArrowRight />
          </Button>
        </div>

        <ul className="mt-12 grid gap-x-8 gap-y-8 sm:grid-cols-3">
          {featured.map((role, i) => (
            <Reveal as="li" key={`${role.company}-${role.title}`} delay={i * 0.06}>
              <p className="text-fg-subtle font-mono text-xs">{role.period}</p>
              <p className="font-display text-fg mt-2 text-lg font-semibold tracking-tight">
                {role.title}
              </p>
              <p className="text-fg-muted mt-1 text-sm">{role.company}</p>
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

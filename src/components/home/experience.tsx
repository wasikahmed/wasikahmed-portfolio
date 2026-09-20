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
    <Section id="experience" bordered band ambient={['dots']}>
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

        {/*
         * A ruled two-column list rather than three free-floating text
         * blocks: period and engagement type on the left, role, employer
         * and the headline thing shipped on the right. The previous
         * version showed only period/title/company, which read as a
         * placeholder — the role means nothing without what came out of
         * it. Mirrors the Approach section's ruled-row rhythm so the page
         * has one list idiom rather than two.
         */}
        <ol className="mt-12 flex flex-col">
          {featured.map((role, i) => (
            <Reveal
              as="li"
              key={`${role.company}-${role.title}`}
              delay={i * 0.07}
              className="border-border-subtle grid gap-x-10 gap-y-3 border-b py-7 first:border-t sm:grid-cols-[11rem_1fr]"
            >
              <div>
                <p className="text-2xs text-accent font-mono tracking-wide">{role.period}</p>
                <p className="text-2xs text-fg-subtle mt-2 font-mono">{role.type}</p>
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-fg text-xl font-semibold tracking-tight">
                  {role.title}
                </h3>
                <p className="text-fg-muted mt-1 text-sm">{role.company}</p>
                {role.shipped[0] ? (
                  <p className="text-fg-subtle mt-3 max-w-xl text-sm leading-relaxed text-pretty">
                    {role.shipped[0]}
                  </p>
                ) : null}
              </div>
            </Reveal>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

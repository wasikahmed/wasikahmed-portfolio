import { Section, Container } from '@/components/ui/section';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Button, ArrowRight } from '@/components/ui/button';
import { Reveal } from '@/components/motion/reveal';
import { CompanyMark, hasAnyLogo } from '@/components/experience/company-mark';
import type { Role } from '@/lib/types';

/**
 * The whole timeline, one line each.
 *
 * This used to show only the first three (PLAN.md W15 item 6). That cap
 * was introduced when home rendered the full role history as an
 * expand-for-detail accordion — richer than /about's own copy of it, and
 * a large share of why the page ran to a ~7,500px mobile scroll. Cutting
 * to three fixed a real problem with the format of the time.
 *
 * The format is now one compact line per role, so a row costs ~153px and
 * the whole list costs less than the accordion did at three. Keeping the
 * cap would hide two of five entries — including the offline sync engine
 * and the published npm SDK — behind a click, to save about 3% of page
 * height. Not a trade worth making on the one section a recruiter
 * actually scans.
 *
 * /about still owns the detail: `RoleAccordion` there carries the full
 * shipped-work bullets, which is what "Full experience" links to.
 *
 * `roles` arrives sorted by `order` ascending (queries.ts's `getRoles()`).
 */
export function Experience({ roles, heading }: { roles: Role[]; heading: string }) {
  const work = roles.filter((role) => role.kind !== 'education');
  const showMarks = hasAnyLogo(work);

  return (
    <Section id="experience" bordered band ambient={['dots']}>
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow rule>Experience</Eyebrow>
            <h2 className="font-display mt-5 max-w-xl text-3xl font-bold tracking-tight text-balance">
              {heading}
            </h2>
          </div>
          {/* Not "Full experience" any more — the full list is right here.
              What /about adds is the shipped-work detail behind each row. */}
          <Button
            href="/about#experience"
            variant="ghost"
            className="group"
            data-track="cta_click"
            data-track-cta="full_experience"
          >
            Full detail
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
          {work.map((role, i) => (
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
                <div className="flex items-center gap-4">
                  {showMarks ? <CompanyMark company={role.company} logo={role.logo} /> : null}
                  <div className="min-w-0">
                    <h3 className="font-display text-fg text-xl font-semibold tracking-tight">
                      {role.title}
                    </h3>
                    <p className="text-fg-muted mt-1 text-sm">{role.company}</p>
                  </div>
                </div>
                {/* Falls back to the first CV bullet so a role added
                    through the admin without a summary still renders —
                    that is exactly how this read before the field
                    existed, not a broken state. */}
                {(role.summary ?? role.shipped[0]) ? (
                  <p className="text-fg-subtle mt-3 max-w-xl text-sm leading-relaxed text-pretty">
                    {role.summary ?? role.shipped[0]}
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

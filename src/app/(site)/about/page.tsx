import type { Metadata } from 'next';
import { Section, Container } from '@/components/ui/section';
import { Eyebrow, StatusDot } from '@/components/ui/eyebrow';
import { Button, ArrowRight } from '@/components/ui/button';
import { Tag } from '@/components/ui/tag';
import { Reveal, Stagger, StaggerItem } from '@/components/motion/reveal';
import { getSkillGroups, getRoles, getSettings } from '@/server/queries';

export const metadata: Metadata = {
  title: 'About — Wasik Ahmed',
  description: 'Software engineer working on AI, automation, and systems that remove manual work.',
};

const STORY = [
  'I started writing code at university because it was the fastest way to make things that actually worked. Computer science gave me the theory; agencies, startups, and product teams gave me everything else.',
  'Most of my career has been spent in the gap between "we have a problem" and "we have software that fixes it". The hardest part is rarely the code — it is understanding the problem precisely enough to know what to build.',
  'For the last few years that has increasingly meant AI and automation. Not because they are fashionable, but because they are usually the right tool when the goal is to remove manual work at scale.',
  'I work as a senior engineer on product teams and take on consulting projects for people who need one specific system built well. Each keeps the other honest.',
];

export default async function AboutPage() {
  const [skillGroups, roles, settings] = await Promise.all([
    getSkillGroups(),
    getRoles(),
    getSettings(),
  ]);

  return (
    <>
      <Section density="spacious" ambient={['blob']} className="pt-10 sm:pt-16">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-20">
            <Reveal>
              <Eyebrow rule>About</Eyebrow>
              <h1 className="font-display mt-6 max-w-2xl text-4xl font-bold tracking-tighter text-balance">
                I build software that removes a problem.
              </h1>
              <div className="mt-8 flex max-w-xl flex-col gap-5">
                {STORY.map((paragraph, i) => (
                  <p key={i} className="text-fg-muted text-base leading-relaxed text-pretty">
                    {paragraph}
                  </p>
                ))}
              </div>
              <div className="mt-10 flex flex-wrap gap-3">
                <Button href="/contact" className="group">
                  Work with me
                  <ArrowRight />
                </Button>
                <Button href="/work" variant="ghost">
                  See the work
                </Button>
              </div>
            </Reveal>

            {/*
             * Facts panel instead of a stock portrait. The prototype used an
             * Unsplash headshot of someone else, which is the single biggest
             * credibility leak a portfolio can have. A real photo goes here
             * in Phase 8.
             */}
            <Reveal delay={0.1}>
              <dl className="divide-border-subtle border-border-subtle bg-surface-1 flex flex-col divide-y rounded-lg border">
                {[
                  ['Based in', settings.location],
                  ['Timezone', settings.timezone],
                  ['Focus', settings.discipline],
                  ['Replies in', settings.responseTime],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-4 px-5 py-4">
                    <dt className="text-2xs text-fg-subtle font-mono tracking-wide uppercase">
                      {label}
                    </dt>
                    <dd className="text-fg text-right text-sm">{value}</dd>
                  </div>
                ))}
                {settings.available ? (
                  <div className="flex items-center gap-2 px-5 py-4">
                    <StatusDot />
                    <span className="text-2xs text-accent font-mono">{settings.availableFor}</span>
                  </div>
                ) : null}
              </dl>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section bordered ambient={['dots']}>
        <Container>
          <Eyebrow rule>Skills</Eyebrow>
          <h2 className="font-display mt-5 max-w-xl text-3xl font-bold tracking-tight text-balance">
            What I reach for.
          </h2>

          <Stagger
            className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3"
            gap={0.06}
          >
            {skillGroups.map((group) => (
              <StaggerItem key={group.category}>
                <p className="text-2xs text-accent mb-4 font-mono tracking-widest uppercase">
                  {group.category}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <Tag key={item}>{item}</Tag>
                  ))}
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </Section>

      <Section bordered>
        <Container>
          <Eyebrow rule>Timeline</Eyebrow>
          <ul className="mt-10 flex flex-col">
            {roles.map((role, i) => (
              <Reveal as="li" key={`${role.company}-${role.title}`} delay={i * 0.05}>
                <div className="border-border-subtle flex flex-col gap-1 border-b py-5 sm:flex-row sm:items-baseline sm:gap-8">
                  <span className="text-2xs text-fg-subtle shrink-0 font-mono sm:w-40">
                    {role.period}
                  </span>
                  <span className="min-w-0">
                    <span className="text-fg block text-base">{role.title}</span>
                    <span className="text-fg-muted block text-sm">{role.company}</span>
                  </span>
                </div>
              </Reveal>
            ))}
          </ul>
        </Container>
      </Section>
    </>
  );
}

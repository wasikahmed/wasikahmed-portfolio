import type { Metadata } from 'next';
import Image from 'next/image';
import { Section, Container } from '@/components/ui/section';
import { Eyebrow, StatusDot } from '@/components/ui/eyebrow';
import { Button, ArrowRight } from '@/components/ui/button';
import { Tag } from '@/components/ui/tag';
import { Reveal, Stagger, StaggerItem } from '@/components/motion/reveal';
import { RoleAccordion } from '@/components/experience/role-accordion';
import { getSkillGroups, getRoles, getSettings } from '@/server/queries';
import { pageTitle, canonical } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: pageTitle('About', settings.name),
    description:
      'Software engineer working on AI, automation, and systems that remove manual work.',
    alternates: canonical('/about'),
  };
}

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
             * A real photo replaces the facts-only panel once one exists
             * (PLAN.md W15 item 1) — the prototype's stock Unsplash headshot
             * of someone else was the single biggest credibility leak a
             * portfolio can have, so this stayed facts-only until a real
             * one was uploaded. It also gives this column enough height to
             * stop reading as an afterthought next to the story column
             * (PLAN.md W15 item 5) — without one, the facts panel alone is
             * a legitimately shorter, self-contained block, not a gap.
             */}
            <Reveal delay={0.1} className="flex flex-col gap-6">
              {settings.portrait ? (
                <div className="border-border-subtle bg-surface-1 relative aspect-[4/5] overflow-hidden rounded-lg border">
                  <Image
                    src={settings.portrait.url}
                    alt={settings.portrait.alt}
                    fill
                    sizes="(min-width: 1024px) 26rem, 100vw"
                    priority
                    className="object-cover"
                  />
                </div>
              ) : null}
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

      {/*
       * The full role history, shipped-work detail included — home's
       * Experience section used to duplicate this in full (PLAN.md W15
       * item 6); it now shows a three-role summary and links to this
       * section's id.
       */}
      <Section id="experience" bordered>
        <Container>
          <Eyebrow rule>Timeline</Eyebrow>
          <RoleAccordion roles={roles} />
        </Container>
      </Section>
    </>
  );
}

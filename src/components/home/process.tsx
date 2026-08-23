import { Section, Container } from '@/components/ui/section';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Reveal, Stagger, StaggerItem } from '@/components/motion/reveal';

const STEPS = [
  {
    n: '01',
    title: 'Understand',
    body: 'One or two calls to find the actual problem rather than the stated one. What breaks, who complains, and what has already been tried and failed.',
  },
  {
    n: '02',
    title: 'Design',
    body: 'A written proposal: system design, technology choices, scope boundaries, and a timeline. Decisions get made before code does.',
  },
  {
    n: '03',
    title: 'Build',
    body: 'Working software in front of you weekly. Nothing is a surprise at the end, because you have been using it since week two.',
  },
  {
    n: '04',
    title: 'Hand over',
    body: 'Documentation, deployment, and a walkthrough. You own it outright — no dependency on me to keep it running.',
  },
];

/**
 * Editorial two-column — the third deliberate break from the card grid
 * (PLAN.md §2.7). A sticky heading on the left against a scrolling list on
 * the right; no cards, no borders around each step.
 */
export function Process() {
  return (
    <Section id="process" bordered ambient={['grid']}>
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-20">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <Eyebrow rule>Process</Eyebrow>
            <h2 className="font-display mt-5 text-3xl font-bold tracking-tight text-balance">
              How the work actually goes.
            </h2>
            <p className="text-fg-muted mt-5 text-sm leading-relaxed">
              The hardest part is rarely the code. It is understanding the problem precisely enough
              to know what to build.
            </p>
          </Reveal>

          <Stagger className="flex flex-col" gap={0.09}>
            {STEPS.map((step) => (
              <StaggerItem key={step.n}>
                <div className="border-border-subtle flex gap-6 border-b py-7 first:pt-0 last:border-b-0 sm:gap-10">
                  <span className="text-2xs text-accent shrink-0 font-mono">{step.n}</span>
                  <div className="min-w-0">
                    <h3 className="font-display text-xl font-semibold tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-fg-muted mt-2 max-w-lg text-sm leading-relaxed">
                      {step.body}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </Container>
    </Section>
  );
}

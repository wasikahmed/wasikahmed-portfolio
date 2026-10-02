import { Section, Container } from '@/components/ui/section';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Reveal, Stagger, StaggerItem } from '@/components/motion/reveal';
import { getSettings, getSiteCopy } from '@/server/queries';

/**
 * Editorial two-column — the third deliberate break from the card grid
 * (PLAN.md §2.7). A sticky heading on the left against a scrolling list on
 * the right; no cards, no borders around each step.
 */
export async function Process() {
  const [settings, copy] = await Promise.all([getSettings(), getSiteCopy()]);

  return (
    <Section id="process" bordered ambient={['grid']}>
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-20">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <Eyebrow rule>Approach</Eyebrow>
            <h2 className="font-display mt-5 text-3xl font-bold tracking-tight text-balance">
              {copy.home.approachHeading}
            </h2>
            <p className="text-fg-muted mt-5 text-sm leading-relaxed">{copy.home.approachIntro}</p>
          </Reveal>

          <Stagger className="flex flex-col" gap={0.09}>
            {settings.approach.map((step, i) => (
              <StaggerItem key={step.title}>
                <div className="border-border-subtle flex gap-6 border-b py-7 first:pt-0 last:border-b-0 sm:gap-10">
                  <span className="text-2xs text-accent shrink-0 font-mono">
                    {String(i + 1).padStart(2, '0')}
                  </span>
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

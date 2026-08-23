import { Section, Container } from '@/components/ui/section';
import { Button, ArrowRight } from '@/components/ui/button';
import { Magnetic } from '@/components/motion/magnetic';
import { TextReveal } from '@/components/motion/text-reveal';
import { Spotlight } from '@/components/ambient/spotlight';
import { Constellation } from './constellation';
import { getSettings, getTech } from '@/server/queries';

/**
 * The hero, per PLAN.md §2.9.
 *
 * Ambient budget: blob (via Section) + spotlight = 2. The prototype ran
 * nine effects here. Everything else that moves is either responding to
 * the cursor or carrying information.
 */
export async function Hero() {
  const [settings, tech] = await Promise.all([getSettings(), getTech()]);

  return (
    <Section
      id="top"
      density="default"
      ambient={['blob']}
      className="relative overflow-hidden pt-8 sm:pt-12"
    >
      <Spotlight />

      <Container>
        <div className="flex flex-col gap-10 lg:gap-12">
          <div className="max-w-3xl">
            <p className="text-2xs text-accent flex items-center gap-3 font-mono tracking-widest uppercase">
              {settings.role}
              <span aria-hidden className="bg-border-strong h-px w-8" />
              {settings.discipline}
            </p>

            <h1 className="font-display mt-6 text-5xl font-bold tracking-tighter">
              <TextReveal text={settings.tagline} accentWords={[0, 1]} delay={0.1} />
            </h1>

            {/* The proof line. Concrete, not a slogan. */}
            <p className="text-fg-muted mt-6 max-w-xl text-lg text-pretty">{settings.proof}</p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Magnetic>
                <Button href="/work" size="lg" className="group">
                  View work
                  <ArrowRight />
                </Button>
              </Magnetic>
              <Button href="/contact" variant="ghost" size="lg">
                Get in touch
              </Button>
            </div>
          </div>

          <Constellation tech={tech} />
        </div>
      </Container>
    </Section>
  );
}

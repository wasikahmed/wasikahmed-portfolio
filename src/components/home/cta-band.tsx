import { Section, Container } from '@/components/ui/section';
import { Button, ArrowRight } from '@/components/ui/button';
import { Magnetic } from '@/components/motion/magnetic';
import { Reveal } from '@/components/motion/reveal';
import { StatusDot } from '@/components/ui/eyebrow';
import { getSettings, getSiteCopy } from '@/server/queries';

export async function CtaBand() {
  const [settings, copy] = await Promise.all([getSettings(), getSiteCopy()]);

  return (
    <Section id="contact" density="spacious" bordered ambient={['blob', 'noise']}>
      <Container className="text-center">
        <Reveal>
          {settings.available ? (
            <p className="border-border bg-accent-whisper text-2xs text-accent mb-6 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono">
              <StatusDot />
              {settings.availableFor}
            </p>
          ) : null}

          <h2 className="font-display mx-auto max-w-2xl text-4xl font-bold tracking-tighter text-balance">
            {copy.home.ctaHeading}
          </h2>
          <p className="text-fg-muted mx-auto mt-5 max-w-md text-pretty">{copy.home.ctaBody}</p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Magnetic>
              <Button href="/contact" size="lg" className="group">
                Start a conversation
                <ArrowRight />
              </Button>
            </Magnetic>
            <Button href={`mailto:${settings.email}`} variant="ghost" size="lg">
              {settings.email}
            </Button>
          </div>

          <p className="text-fg-subtle mt-6 font-mono text-xs">
            Replies in {settings.responseTime} · {settings.location} · {settings.timezone}
          </p>
        </Reveal>
      </Container>
    </Section>
  );
}

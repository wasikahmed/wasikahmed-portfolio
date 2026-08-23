import { Section, Container } from '@/components/ui/section';
import { Button, ArrowRight } from '@/components/ui/button';
import { Magnetic } from '@/components/motion/magnetic';
import { Reveal } from '@/components/motion/reveal';
import { StatusDot } from '@/components/ui/eyebrow';
import { site } from '@/lib/content/site';

export function CtaBand() {
  return (
    <Section id="contact" density="spacious" bordered ambient={['blob', 'noise']}>
      <Container className="text-center">
        <Reveal>
          {site.available ? (
            <p className="border-border bg-accent-whisper text-2xs text-accent mb-6 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono">
              <StatusDot />
              {site.availableFor}
            </p>
          ) : null}

          <h2 className="font-display mx-auto max-w-2xl text-4xl font-bold tracking-tighter text-balance">
            Got something that should run itself?
          </h2>
          <p className="text-fg-muted mx-auto mt-5 max-w-md text-pretty">
            Tell me what breaks today. If I am not the right person for it, I will say so and point
            you somewhere better.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Magnetic>
              <Button href="/contact" size="lg" className="group">
                Start a conversation
                <ArrowRight />
              </Button>
            </Magnetic>
            <Button href={`mailto:${site.email}`} variant="ghost" size="lg">
              {site.email}
            </Button>
          </div>

          <p className="text-2xs text-fg-subtle mt-6 font-mono">
            Replies in {site.responseTime} · {site.location} · {site.timezone}
          </p>
        </Reveal>
      </Container>
    </Section>
  );
}

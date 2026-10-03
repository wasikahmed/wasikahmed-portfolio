import { Section, Container } from '@/components/ui/section';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Button, ArrowRight } from '@/components/ui/button';
import { TrackNotFound } from '@/components/analytics/track-not-found';
import { getSiteCopy } from '@/server/queries';

/**
 * The public site's 404 — both for an unknown address (via the
 * `[...missing]` catch-all beside this file) and for a `notFound()` from a
 * case study or article whose slug doesn't exist or isn't published.
 *
 * Inside (site)'s layout on purpose: Next's root-level default 404 renders
 * with none of the site around it — no nav, no way back — and without the
 * analytics script, so a broken inbound link was invisible. It now reports
 * a `not_found` event with the path and where the visitor came from.
 */
export default async function NotFound() {
  const copy = await getSiteCopy();

  return (
    <Section density="spacious" ambient={['grid']} className="pt-10 sm:pt-16">
      <Container>
        <TrackNotFound />
        <Eyebrow rule>404</Eyebrow>
        <h1 className="font-display mt-6 max-w-2xl text-4xl font-bold tracking-tighter text-balance">
          {copy.notFound.heading}
        </h1>
        <p className="text-fg-muted mt-5 max-w-lg text-lg text-pretty">{copy.notFound.body}</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button href="/" className="group" data-track="cta_click" data-track-cta="not_found_home">
            Home
            <ArrowRight />
          </Button>
          <Button
            href="/work"
            variant="ghost"
            data-track="cta_click"
            data-track-cta="not_found_work"
          >
            The work
          </Button>
          <Button
            href="/contact"
            variant="ghost"
            data-track="cta_click"
            data-track-cta="not_found_contact"
          >
            Get in touch
          </Button>
        </div>
      </Container>
    </Section>
  );
}

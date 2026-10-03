import type { Metadata } from 'next';
import { Section, Container } from '@/components/ui/section';
import { Eyebrow, StatusDot } from '@/components/ui/eyebrow';
import { ContactForm } from '@/components/contact/contact-form';
import { EmailLink } from '@/components/ui/email-link';
import { BrandIcon } from '@/components/ui/brand-icon';
import { socialIcon } from '@/lib/brand-icons';
import { getSettings, getSiteCopy } from '@/server/queries';
import { turnstileSiteKey } from '@/server/turnstile';
import { pageTitle, pageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const [settings, copy] = await Promise.all([getSettings(), getSiteCopy()]);
  return pageMetadata({
    title: pageTitle('Contact', settings.name),
    description: copy.contact.metaDescription,
    path: '/contact',
    siteName: settings.name,
  });
}

export default async function ContactPage() {
  const [settings, copy] = await Promise.all([getSettings(), getSiteCopy()]);

  return (
    <Section density="spacious" ambient={['blob']} className="pt-10 sm:pt-16">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-20">
          <div className="min-w-0">
            <Eyebrow rule>Contact</Eyebrow>
            <h1 className="font-display mt-6 max-w-xl text-4xl font-bold tracking-tighter text-balance">
              {copy.contact.heading}
            </h1>
            <p className="text-fg-muted mt-5 max-w-lg text-lg text-pretty">{copy.contact.intro}</p>

            <div className="mt-12">
              <ContactForm email={settings.email} turnstileSiteKey={turnstileSiteKey()} />
            </div>
          </div>

          {/*
           * Sticky (PLAN.md W15 item 5) — the same `lg:sticky lg:top-28
           * lg:self-start` pattern Process's left column already uses.
           * The form to its left grew a field taller once intent stopped
           * gating the rest of it (item 3); without this the aside ended
           * well before the form did.
           */}
          <aside className="flex flex-col gap-8 lg:sticky lg:top-28 lg:self-start">
            <div>
              <p className="text-2xs text-fg-subtle mb-3 font-mono tracking-widest uppercase">
                Direct
              </p>
              <div className="flex flex-col gap-2">
                <EmailLink
                  email={settings.email}
                  className="text-fg duration-fast hover:text-accent inline-flex items-center gap-2 text-sm transition-colors"
                >
                  <BrandIcon icon={socialIcon('mailto:')} />
                  {settings.email}
                </EmailLink>
                {/* Through /whatsapp, never a wa.me link here — that route's
                    comment has why. A plain <a>, not <Link>: it is a route
                    handler that redirects off-site, not a page. */}
                {settings.whatsapp ? (
                  <a
                    href="/whatsapp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-fg duration-fast hover:text-accent inline-flex items-center gap-2 text-sm transition-colors"
                  >
                    <BrandIcon icon={socialIcon('/whatsapp')} />
                    WhatsApp
                  </a>
                ) : null}
              </div>
            </div>

            <div>
              <p className="text-2xs text-fg-subtle mb-3 font-mono tracking-widest uppercase">
                Résumé
              </p>
              {/* A plain <a>, not <Link>: /resume is a route handler that
                  streams a PDF, not a page. The rule only flags it because
                  the (site)/[...missing] catch-all makes every path look
                  like a page to it. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a
                href="/resume"
                className="text-fg duration-fast hover:text-accent text-sm transition-colors"
              >
                Download PDF
              </a>
            </div>

            <div>
              <p className="text-2xs text-fg-subtle mb-3 font-mono tracking-widest uppercase">
                Elsewhere
              </p>
              <ul className="flex flex-col gap-2">
                {settings.socials.map((social) => (
                  <li key={social.label}>
                    {social.href.startsWith('mailto:') ? (
                      <EmailLink
                        email={social.href.slice('mailto:'.length)}
                        className="text-fg-muted duration-fast hover:text-fg inline-flex items-center gap-2 text-sm transition-colors"
                      >
                        <BrandIcon icon={socialIcon(social.href)} />
                        {social.label}
                      </EmailLink>
                    ) : (
                      <a
                        href={social.href}
                        {...(social.href.startsWith('http')
                          ? { target: '_blank', rel: 'noopener noreferrer' }
                          : {})}
                        className="text-fg-muted duration-fast hover:text-fg inline-flex items-center gap-2 text-sm transition-colors"
                      >
                        <BrandIcon icon={socialIcon(social.href)} />
                        {social.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-border-subtle bg-surface-1 rounded-lg border p-5">
              <p className="text-2xs text-accent flex items-center gap-2 font-mono">
                <StatusDot />
                {settings.available ? 'Available' : 'Booked up'}
              </p>
              <p className="text-fg-muted mt-3 text-sm leading-relaxed">{settings.availableFor}</p>
              <p className="text-fg-subtle mt-4 font-mono text-xs">
                Replies in {settings.responseTime} · {settings.timezone}
              </p>
            </div>
          </aside>
        </div>
      </Container>
    </Section>
  );
}

import type { Metadata } from 'next';
import { Section, Container } from '@/components/ui/section';
import { Eyebrow, StatusDot } from '@/components/ui/eyebrow';
import { ContactForm } from '@/components/contact/contact-form';
import { getSettings } from '@/server/queries';
import { pageTitle, canonical } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: pageTitle('Contact', settings.name),
    description: 'Start a conversation about a project or a role.',
    alternates: canonical('/contact'),
  };
}

export default async function ContactPage() {
  const settings = await getSettings();

  return (
    <Section density="spacious" ambient={['blob']} className="pt-10 sm:pt-16">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-20">
          <div className="min-w-0">
            <Eyebrow rule>Contact</Eyebrow>
            <h1 className="font-display mt-6 max-w-xl text-4xl font-bold tracking-tighter text-balance">
              Tell me what breaks.
            </h1>
            <p className="text-fg-muted mt-5 max-w-lg text-lg text-pretty">
              If I am not the right person for it, I will say so and point you somewhere better.
            </p>

            <div className="mt-12">
              <ContactForm email={settings.email} />
            </div>
          </div>

          <aside className="flex flex-col gap-8">
            <div>
              <p className="text-2xs text-fg-subtle mb-3 font-mono tracking-widest uppercase">
                Direct
              </p>
              <a
                href={`mailto:${settings.email}`}
                className="text-fg duration-fast hover:text-accent text-sm transition-colors"
              >
                {settings.email}
              </a>
            </div>

            <div>
              <p className="text-2xs text-fg-subtle mb-3 font-mono tracking-widest uppercase">
                Elsewhere
              </p>
              <ul className="flex flex-col gap-2">
                {settings.socials.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      {...(social.href.startsWith('http')
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                      className="text-fg-muted duration-fast hover:text-fg text-sm transition-colors"
                    >
                      {social.label}
                    </a>
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
              <p className="text-2xs text-fg-subtle mt-4 font-mono">
                Replies in {settings.responseTime} · {settings.timezone}
              </p>
            </div>
          </aside>
        </div>
      </Container>
    </Section>
  );
}

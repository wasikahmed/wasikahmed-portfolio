import Link from 'next/link';
import { LogoMark, Wordmark } from '@/components/brand/logo';
import { NAV_LINKS } from '@/lib/nav';
import type { Settings } from '@/lib/types';
import { StatusDot } from '@/components/ui/eyebrow';
import { Container } from '@/components/ui/section';

/**
 * Site footer — wayfinding, identity, and live status.
 *
 * Deliberately *not* a second call to action: `CtaBand` already owns
 * conversion and sits directly above this on every page that needs it.
 * Repeating the ask here would be the exact kind of redundancy PLAN.md §2.2
 * calls noise.
 *
 * The earlier version led with a 112px wordmark at 6% opacity. That is an
 * ambient decorative layer by any reading, and §2.10 budgets the footer at
 * zero — it also left a dead column at wide viewports while squeezing the
 * links, and pushed the whole footer to ~55% of viewport height. Four even
 * columns of real information use the same space and carry meaning.
 */

const LINK = 'text-fg-muted duration-fast hover:text-fg text-sm transition-colors';

function ColumnLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-2xs text-fg-subtle mb-4 font-mono tracking-widest uppercase">{children}</p>
  );
}

export function Footer({ settings }: { settings: Settings }) {
  const meta: [string, string][] = [
    ['Replies', settings.responseTime],
    ['Based in', settings.location],
    ['Timezone', settings.timezone],
  ];

  return (
    <footer className="border-border-subtle relative border-t">
      {/*
       * Hairline that fades at both ends, sitting on top of the flat border.
       * Structure rather than decoration: it centres the eye on the content
       * width instead of letting the rule run edge to edge.
       */}
      <span
        aria-hidden
        className="via-border-strong absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent to-transparent"
      />

      <Container className="px-6 pt-14 pb-9 lg:px-10">
        {/*
         * Two columns from the narrowest viewport up: the two link lists are
         * short enough to sit side by side on a phone, which keeps the footer
         * from turning into one long scroll. Identity and availability span
         * the full width until there is room for all four columns.
         */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-[1.6fr_1fr_1fr_1.3fr] lg:gap-x-10 lg:gap-y-12">
          {/* Identity — the same lockup as the nav, so the two ends of the page
              read as one brand. */}
          <div className="col-span-2 min-w-0 sm:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5"
              aria-label={`${settings.name} — home`}
            >
              <LogoMark className="text-accent h-7 w-7 shrink-0" />
              <Wordmark name={settings.name} className="text-sm" />
            </Link>

            <p className="text-fg-muted mt-4 max-w-xs text-sm text-pretty">{settings.proof}</p>

            <a
              href={`mailto:${settings.email}`}
              className="group text-fg duration-fast hover:text-accent mt-5 inline-flex items-center gap-2 text-sm transition-colors"
            >
              {settings.email}
              <span
                aria-hidden
                className="duration-fast transition-transform group-hover:translate-x-0.5"
              >
                →
              </span>
            </a>
          </div>

          <nav aria-label="Footer">
            <ColumnLabel>Navigate</ColumnLabel>
            <ul className="flex flex-col gap-2.5">
              {[
                ...NAV_LINKS,
                { label: 'Résumé', href: '/resume' },
                { label: 'API reference', href: '/docs' },
                { label: 'Design system', href: '/design-system' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={LINK}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <ColumnLabel>Elsewhere</ColumnLabel>
            <ul className="flex flex-col gap-2.5">
              {settings.socials.map((social) => {
                // The arrow is information, not ornament: it marks the links
                // that leave the site.
                const external = social.href.startsWith('http');
                return (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className={`group inline-flex items-center gap-1.5 ${LINK}`}
                    >
                      {social.label}
                      {external ? (
                        <span aria-hidden className="text-2xs text-fg-subtle">
                          ↗
                        </span>
                      ) : null}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <ColumnLabel>Availability</ColumnLabel>
            {settings.available ? (
              <p className="text-fg-muted flex items-start gap-2 text-sm text-pretty">
                <StatusDot className="mt-[0.4rem] shrink-0" />
                {settings.availableFor}
              </p>
            ) : (
              <p className="text-fg-muted text-sm">Not taking on new work right now.</p>
            )}

            <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 font-mono text-xs">
              {meta.map(([term, value]) => (
                <div key={term} className="contents">
                  <dt className="text-fg-subtle">{term}</dt>
                  <dd className="text-fg-muted">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="border-border-subtle text-2xs text-fg-subtle mt-12 flex flex-col gap-3 border-t pt-6 font-mono sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} {settings.name}
          </span>
          <a
            href="#main"
            className="group duration-fast hover:text-fg-muted inline-flex items-center gap-1.5 self-start transition-colors sm:self-auto"
          >
            Back to top
            <span
              aria-hidden
              className="duration-fast transition-transform group-hover:-translate-y-0.5"
            >
              ↑
            </span>
          </a>
        </div>
      </Container>
    </footer>
  );
}

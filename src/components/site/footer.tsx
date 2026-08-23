import Link from 'next/link';
import { NAV_LINKS } from '@/lib/nav';
import type { Settings } from '@/lib/types';
import { StatusDot } from '@/components/ui/eyebrow';
import { Container } from '@/components/ui/section';

export function Footer({ settings }: { settings: Settings }) {
  return (
    <footer className="border-border-subtle relative border-t">
      <Container className="pt-density-compact px-6 pb-10 lg:px-10">
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
          {/*
           * Oversized wordmark. Sits at very low contrast on purpose — it is
           * texture and sign-off, not something to read, so it does not
           * compete with the links beside it.
           */}
          <div className="min-w-0">
            <p
              aria-hidden
              className="font-display text-fg/[0.06] text-[clamp(3.5rem,11vw,7rem)] leading-[0.85] font-bold tracking-tighter select-none"
            >
              {settings.name.split(' ')[0].toUpperCase()}
            </p>
            <p className="text-fg-muted mt-4 max-w-sm text-sm">{settings.proof}</p>
          </div>

          <div className="flex flex-wrap gap-x-16 gap-y-10">
            <nav aria-label="Footer">
              <p className="text-2xs text-fg-subtle mb-4 font-mono tracking-widest uppercase">
                Navigate
              </p>
              <ul className="flex flex-col gap-2.5">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-fg-muted duration-fast hover:text-fg text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/design-system"
                    className="text-fg-muted duration-fast hover:text-fg text-sm transition-colors"
                  >
                    Design system
                  </Link>
                </li>
              </ul>
            </nav>

            <div>
              <p className="text-2xs text-fg-subtle mb-4 font-mono tracking-widest uppercase">
                Elsewhere
              </p>
              <ul className="flex flex-col gap-2.5">
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
          </div>
        </div>

        <div className="border-border-subtle text-2xs text-fg-subtle mt-14 flex flex-col gap-3 border-t pt-6 font-mono sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
          {settings.available ? (
            <span className="text-fg-muted flex items-center gap-2">
              <StatusDot />
              {settings.availableFor}
            </span>
          ) : null}
          <span>Replies in {settings.responseTime}</span>
          <span>{settings.location}</span>
          <span>{settings.timezone}</span>
          <span className="sm:ml-auto">
            © {new Date().getFullYear()} {settings.name}
          </span>
        </div>
      </Container>
    </footer>
  );
}

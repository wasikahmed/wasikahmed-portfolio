'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { Wordmark } from '@/components/brand/wordmark';
import { NAV_LINKS } from '@/lib/nav';
import type { Settings } from '@/lib/types';
import { StatusDot } from '@/components/ui/eyebrow';
import { buttonVariants } from '@/components/ui/button';
import { EmailLink } from '@/components/ui/email-link';
import { BrandIcon } from '@/components/ui/brand-icon';
import { socialIcon } from '@/lib/brand-icons';
import { cn } from '@/lib/cn';

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Nav({
  onOpenPalette,
  settings,
}: {
  onOpenPalette: () => void;
  settings: Settings;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /*
   * Close the menu when the route changes.
   *
   * Done as a render-phase adjustment rather than an effect — React's
   * documented pattern for "reset state when a value changes". It bails out
   * and re-renders immediately instead of committing, then running an
   * effect that triggers a second render.
   */
  const [menuRoute, setMenuRoute] = useState(pathname);
  if (menuRoute !== pathname) {
    setMenuRoute(pathname);
    setOpen(false);
  }

  /*
   * Mobile menu a11y — all of this was missing from the prototype:
   * scroll lock, Escape to close, and a focus trap so tabbing cannot
   * wander into the page behind the overlay.
   */
  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    panelRef.current?.querySelector<HTMLElement>('a[href]')?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus();
    };
  }, [open]);

  return (
    <header
      className={cn(
        'duration-base fixed inset-x-0 top-0 z-50 transition-colors',
        scrolled || open
          ? 'border-border-subtle bg-bg/85 border-b backdrop-blur-xl'
          : 'border-b border-transparent',
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between gap-4 px-6 lg:px-10">
        <Link href="/" className="group shrink-0" aria-label={`${settings.name} — home`}>
          {/* Visible at every width: with the mark gone the name is the only
              identity in the header, and below `sm` the menu toggle is all
              that shares the row, so there is room for it. Hover lifts the
              family name (see Wordmark) — confirm, not decorate. */}
          <Wordmark name={settings.name} className="text-base" />
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'duration-fast relative rounded-sm px-3 py-2 text-sm transition-colors',
                      active ? 'text-fg' : 'text-fg-muted hover:text-fg',
                    )}
                  >
                    {link.label}
                    {active ? (
                      <motion.span
                        layoutId="nav-active"
                        className="bg-accent absolute inset-x-3 -bottom-px h-px"
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {/* Command palette affordance — discoverability for signature #5. */}
          <button
            type="button"
            onClick={onOpenPalette}
            className="border-border-subtle text-2xs text-fg-muted duration-fast hover:border-border hover:text-fg hidden items-center gap-2 rounded-md border px-2.5 py-1.5 transition-colors lg:flex"
          >
            <span>Search</span>
            <kbd className="text-2xs text-fg-subtle font-mono">⌘K</kbd>
          </button>

          {settings.available ? (
            <span className="border-border bg-accent-whisper text-2xs text-accent hidden items-center gap-2 rounded-full border px-3 py-1.5 font-mono sm:flex">
              <StatusDot />
              Available
            </span>
          ) : null}

          <button
            ref={toggleRef}
            type="button"
            className="text-fg -mr-2 grid h-10 w-10 place-items-center rounded-md md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="relative block h-4 w-5">
              <motion.span
                className="absolute left-0 block h-px w-5 bg-current"
                animate={open ? { top: 7, rotate: 45 } : { top: 2, rotate: 0 }}
                transition={{ duration: 0.2 }}
              />
              <motion.span
                className="absolute top-[7px] left-0 block h-px w-5 bg-current"
                animate={{ opacity: open ? 0 : 1 }}
                transition={{ duration: 0.15 }}
              />
              <motion.span
                className="absolute left-0 block h-px w-5 bg-current"
                animate={open ? { top: 7, rotate: -45 } : { top: 12, rotate: 0 }}
                transition={{ duration: 0.2 }}
              />
            </span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-menu"
            data-track-location="mobile_menu"
            ref={panelRef}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            /*
             * Fills the screen below the header rather than dropping a panel
             * over the page: the short version left the page showing through
             * underneath, with no way to tell it was inert. Scrolls on its
             * own on a short landscape phone, where the body is locked.
             */
            className="border-border-subtle bg-bg/95 h-[calc(100dvh-var(--spacing)*16)] overflow-y-auto overscroll-contain border-t backdrop-blur-xl md:hidden"
          >
            <nav aria-label="Mobile" className="flex min-h-full flex-col px-6 pt-2 pb-8">
              <ul className="flex flex-col">
                {NAV_LINKS.map((link) => {
                  const active = isActive(pathname, link.href);
                  return (
                    <li key={link.href}>
                      {/* No trailing arrow: ↗ marks links that leave the
                          site everywhere else (footer, contact), and these
                          don't. */}
                      <Link
                        href={link.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'border-border-subtle flex items-center border-b py-4 text-lg',
                          active ? 'text-accent' : 'text-fg',
                        )}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {/* The one thing a recruiter on a phone most often came for,
                  and before this it was only reachable from the footer.
                  A plain <a>: /resume is a route handler streaming a PDF,
                  and the (site)/[...missing] catch-all makes every path
                  look like a page to the lint rule. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/resume" className={cn(buttonVariants({ variant: 'ghost' }), 'mt-6 w-full')}>
                Download résumé
              </a>

              {settings.socials.length > 0 ? (
                <ul className="mt-4 flex flex-wrap gap-x-6">
                  {settings.socials.map((social) => {
                    const className =
                      'text-fg-muted inline-flex min-h-11 items-center gap-2 text-sm';
                    return (
                      <li key={social.label}>
                        {social.href.startsWith('mailto:') ? (
                          <EmailLink
                            email={social.href.slice('mailto:'.length)}
                            className={className}
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
                            className={className}
                          >
                            <BrandIcon icon={socialIcon(social.href)} />
                            {social.label}
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : null}

              {settings.available ? (
                <p className="text-2xs text-accent mt-auto flex items-center gap-2 pt-8 font-mono">
                  <StatusDot />
                  {settings.availableFor}
                </p>
              ) : null}
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

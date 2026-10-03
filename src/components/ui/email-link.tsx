'use client';

import { useEffect, useRef, useState } from 'react';
import { EVENTS, locationOf, track } from '@/lib/analytics';
import { cn } from '@/lib/cn';

/*
 * How long to wait for a mail app before concluding there isn't one. When a
 * handler exists the OS switches to it and this window blurs (desktop) or
 * goes hidden (mobile), typically well inside this. When none exists the
 * browser does nothing at all — no error, no event — so the absence of a
 * blur is the only signal there is. Well inside the ~5s of user activation
 * Chrome and Firefox allow a clipboard write after the click.
 */
const HANDLER_GRACE_MS = 800;
const NOTICE_MS = 4000;

type Notice = { kind: 'copied' } | { kind: 'manual' };

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard API refused (no permission, insecure context, or Safari's
    // stricter activation rule). The legacy path still works in most of
    // those.
  }
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.className = 'fixed top-0 left-0 opacity-0';
  document.body.appendChild(field);
  field.select();
  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }
  field.remove();
  return copied;
}

/**
 * A mailto link that still works on a machine with no mail app.
 *
 * The link opens the visitor's mail client as normal. If nothing takes
 * focus within a moment, the address is copied to the clipboard instead
 * and a short notice says so — or, if even the clipboard is refused, the
 * notice shows the address selectable so it can be copied by hand. Either
 * way the visitor is never left clicking a link that silently does nothing.
 */
export function EmailLink({
  email,
  className,
  children,
}: {
  email: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((id) => window.clearTimeout(id));
  }, []);

  const onClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const location = locationOf(event.currentTarget);
    track(EVENTS.emailClick, { location });

    let handled = false;
    const markHandled = () => {
      handled = true;
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') handled = true;
    };
    window.addEventListener('blur', markHandled);
    document.addEventListener('visibilitychange', onVisibility);

    timers.current.push(
      window.setTimeout(async () => {
        window.removeEventListener('blur', markHandled);
        document.removeEventListener('visibilitychange', onVisibility);
        if (handled) return;

        const copied = await copyToClipboard(email);
        track(EVENTS.emailCopy, { location, trigger: 'no_mail_app', copied });
        setNotice(copied ? { kind: 'copied' } : { kind: 'manual' });
        timers.current.push(window.setTimeout(() => setNotice(null), NOTICE_MS));
      }, HANDLER_GRACE_MS),
    );
  };

  return (
    <span className="relative inline-flex">
      <a href={`mailto:${email}`} className={className} onClick={onClick}>
        {children ?? email}
      </a>
      {/* Always in the DOM so screen readers announce the change, not just
          sighted visitors. */}
      <span role="status" aria-live="polite" className="contents">
        {notice ? (
          // Anchored to the link's start edge and wrapping at a fixed
          // width, not centred and nowrap: the footer's link sits at the
          // left edge of a phone screen, where a centred line would hang
          // off it.
          <span
            className={cn(
              'border-border bg-surface-3 text-fg shadow-e4 absolute bottom-full left-0 z-20 mb-2 w-64',
              'rounded-md border px-3 py-2 text-left text-xs leading-relaxed',
            )}
          >
            {notice.kind === 'copied' ? (
              <>No mail app opened, so the address is copied to your clipboard.</>
            ) : (
              <>
                No mail app opened. Copy the address from here:
                <span className="text-accent mt-1 block font-mono break-all select-all">
                  {email}
                </span>
              </>
            )}
          </span>
        ) : null}
      </span>
    </span>
  );
}

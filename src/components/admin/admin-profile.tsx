'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/cn';

/**
 * Who's signed in, plus sign out — a popover instead of a bare email string
 * so there's somewhere to put 2FA status and a path to Security without
 * cluttering the sidebar with a permanent second nav section.
 */
export function AdminProfile({
  email,
  initials,
  totpEnabled,
  align = 'up',
}: {
  email: string;
  initials: string;
  totpEnabled: boolean;
  /** Popover opens above the trigger on the desktop sidebar (bottom of screen), below it on the mobile top bar. */
  align?: 'up' | 'down';
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="hover:bg-surface-2 duration-fast flex min-w-0 items-center gap-2 rounded-md p-1 pr-2 transition-colors"
      >
        <span className="from-accent to-accent-bright font-display text-bg text-2xs grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br font-bold">
          {initials}
        </span>
        <span className="text-2xs text-fg-muted min-w-0 truncate font-mono">{email}</span>
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            'border-border-subtle bg-surface-2 shadow-e3 absolute z-20 w-64 rounded-lg border p-2 backdrop-blur-xl',
            align === 'up' ? 'bottom-full left-0 mb-2' : 'top-full left-0 mt-2',
          )}
        >
          <div className="flex items-center gap-3 px-2 py-2">
            <span className="from-accent to-accent-bright font-display text-bg grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br text-xs font-bold">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="text-fg truncate text-sm">{email}</p>
              <p className="text-2xs text-fg-subtle font-mono uppercase">Admin</p>
            </div>
          </div>

          <div className="border-border-subtle my-2 border-t" />

          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-2xs text-fg-muted font-mono uppercase">Two-factor auth</span>
            <span
              className={cn(
                'text-2xs font-mono',
                totpEnabled ? 'text-accent' : 'text-signal-amber',
              )}
            >
              {totpEnabled ? 'Enabled' : 'Off'}
            </span>
          </div>

          <Link
            href="/admin/security"
            onClick={() => setOpen(false)}
            className="text-fg-muted hover:bg-surface-3 hover:text-fg duration-fast block rounded-md px-2 py-1.5 text-sm transition-colors"
          >
            Security settings
          </Link>

          <div className="border-border-subtle my-2 border-t" />

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="text-signal-rose hover:bg-surface-3 duration-fast block w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors"
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

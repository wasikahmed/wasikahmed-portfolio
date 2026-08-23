'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

/**
 * "Optional for now, nag until enabled" — the user's explicit choice over
 * requiring TOTP from the first login. Dismissible per browsing session
 * (state lives in this layout-scoped component, so it clears on a full
 * reload) rather than requiring an explicit "don't show again" the account
 * might forget it agreed to.
 */
export function TotpNag() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <Card
      variant="outline"
      padding="sm"
      className="border-signal-amber/30 mb-6 flex flex-wrap items-center justify-between gap-3 bg-[color-mix(in_oklab,var(--color-signal-amber)_6%,transparent)]"
    >
      <p className="text-fg text-sm">
        <span className="text-signal-amber">Two-factor auth isn&apos;t enabled.</span>{' '}
        <Link href="/admin/security" className="hover:text-accent underline underline-offset-4">
          Set it up
        </Link>{' '}
        — takes under a minute with an authenticator app.
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="text-fg-subtle hover:text-fg"
      >
        ×
      </button>
    </Card>
  );
}

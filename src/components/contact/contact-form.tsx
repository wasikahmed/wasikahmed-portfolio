'use client';

import { useRef, useState } from 'react';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Button, ArrowRight } from '@/components/ui/button';
import { TurnstileWidget } from '@/components/contact/turnstile-widget';
import { EmailLink } from '@/components/ui/email-link';
import { EVENTS, track } from '@/lib/analytics';

type Status = 'idle' | 'pending' | 'sent' | 'error';

/**
 * One short form, no branching, no qualifying questions.
 *
 * It used to open with "a role or a project?" — first as two cards gating
 * every other field, then as cards swapping fields in and out, and last as
 * a compact select. Even the select was a question asked for the owner's
 * triage, not the visitor's benefit, and it had no right answer for anyone
 * who was neither hiring nor commissioning (a collaborator, a question, a
 * hello) — while defaulting to "role" skewed the data it existed to
 * collect. It went in 2026-10; the message itself says what it is about.
 *
 * `budget` went earlier for the same reason. Both stay optional in the
 * Lead model, so leads that already carry them still render.
 */
export function ContactForm({
  email,
  turnstileSiteKey,
}: {
  email: string;
  turnstileSiteKey: string | undefined;
}) {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>(undefined);
  const [turnstileReset, setTurnstileReset] = useState(0);
  // The address a confirmation went to, shown back so a typo is caught
  // here rather than by a reply that never arrives. Null when none was sent.
  const [receiptTo, setReceiptTo] = useState<string | null>(null);
  // contact_start fires once per form shown — the funnel step between
  // landing on /contact and submitting, which is where people drop out.
  const started = useRef(false);
  const onFirstFocus = () => {
    if (started.current) return;
    started.current = true;
    track(EVENTS.contactStart);
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Caught here rather than by a round trip that can only answer
    // "Verification failed" — the check may simply not have finished yet.
    if (turnstileSiteKey && !turnstileToken) {
      setErrorMessage('Complete the verification check above, then send it again.');
      setStatus('error');
      return;
    }

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get('name') ?? ''),
      email: String(form.get('email') ?? ''),
      company: form.get('company') ? String(form.get('company')) : undefined,
      message: String(form.get('message') ?? ''),
      turnstileToken,
    };

    setStatus('pending');
    // Set once an HTTP error has been reported, so the catch below only
    // reports what never got a response at all (status 0: offline, DNS).
    let reported = false;
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        track(EVENTS.contactError, { status: res.status });
        reported = true;
        throw new Error(body?.error ?? 'Something went wrong. Please try again.');
      }
      const body = (await res.json().catch(() => null)) as { receiptSent?: boolean } | null;
      // Only what the form was about — never the name, address or message.
      track(EVENTS.contactSubmit, { hasCompany: Boolean(payload.company) });
      setReceiptTo(body?.receiptSent ? payload.email : null);
      setStatus('sent');
    } catch (err) {
      if (!reported) track(EVENTS.contactError, { status: 0 });
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.');
      setStatus('error');
      // The token was spent on that attempt whether or not it was the
      // reason it failed; a retry needs a fresh one.
      setTurnstileReset((n) => n + 1);
    }
  };

  if (status === 'sent') {
    return (
      <div className="border-border bg-surface-1 rounded-lg border p-8">
        <p className="font-display text-2xl font-bold tracking-tight">Sent.</p>
        <p className="text-fg-muted mt-3 text-sm leading-relaxed">
          {receiptTo ? (
            <>
              Thanks for reaching out. A confirmation is on its way to{' '}
              <span className="text-fg">{receiptTo}</span> — if it doesn&apos;t arrive, that address
              may have a typo, and you can{' '}
              <EmailLink email={email} className="underline underline-offset-4">
                email me directly
              </EmailLink>{' '}
              instead.
            </>
          ) : (
            <>Thanks for reaching out — I&apos;ll be in touch.</>
          )}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            variant="ghost"
            onClick={() => {
              // The form remounts with a fresh widget; the old token is spent.
              setTurnstileToken(undefined);
              setReceiptTo(null);
              setStatus('idle');
              started.current = false;
            }}
          >
            Send another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} onFocus={onFirstFocus} className="flex flex-col gap-6">
      <div className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" htmlFor="name">
            <Input id="name" name="name" required autoComplete="name" />
          </Field>
          <Field label="Email" htmlFor="email">
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </Field>
        </div>

        <Field label="Company (optional)" htmlFor="company">
          <Input id="company" name="company" autoComplete="organization" />
        </Field>

        <Field
          label="Message"
          htmlFor="message"
          hint="What you're working on, and where you think I'd fit in."
        >
          <Textarea id="message" name="message" required rows={7} />
        </Field>

        <TurnstileWidget
          siteKey={turnstileSiteKey}
          onToken={setTurnstileToken}
          resetSignal={turnstileReset}
        />

        {status === 'error' ? (
          <p className="text-signal-rose text-sm">
            {errorMessage}{' '}
            <EmailLink email={email} className="underline underline-offset-4">
              Email me directly instead.
            </EmailLink>
          </p>
        ) : null}

        <div>
          <Button type="submit" size="lg" className="group" disabled={status === 'pending'}>
            {status === 'pending' ? 'Sending…' : 'Send it'}
            <ArrowRight />
          </Button>
        </div>
      </div>
    </form>
  );
}

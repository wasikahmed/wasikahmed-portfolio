'use client';

import { useRef, useState } from 'react';
import { Field, Input, Textarea, Select } from '@/components/ui/field';
import { Button, ArrowRight } from '@/components/ui/button';
import { TurnstileWidget } from '@/components/contact/turnstile-widget';
import { EmailLink } from '@/components/ui/email-link';
import { EVENTS, track } from '@/lib/analytics';

type Intent = 'project' | 'role';
type Status = 'idle' | 'pending' | 'sent' | 'error';

/**
 * One short form, no branching.
 *
 * Earlier versions made "a role or a project?" the first thing a visitor
 * had to answer — first as two cards gating every other field, then as
 * two cards that stayed but swapped fields in and out beneath them. Both
 * put a qualifying question ahead of the message, on the one page whose
 * entire job is receiving a message, and the animated show/hide moved
 * fields under the cursor while someone was reading.
 *
 * It is now a single compact select sitting in the same row as everything
 * else. The triage signal is still captured — /admin/leads filters on it
 * — but it costs a glance rather than a decision, and every field is
 * present and stable from the moment the page loads.
 *
 * `budget` is gone. It was the most transactional thing on the page, it
 * only ever applied to one of the two paths, and the ranges were
 * guesswork. It stays optional in the schema, so leads that already carry
 * one still render.
 */
export function ContactForm({ email }: { email: string }) {
  const [intent, setIntent] = useState<Intent>('role');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>(undefined);
  // contact_start fires once per form shown — the funnel step between
  // landing on /contact and submitting, which is where people drop out.
  const started = useRef(false);
  const onFirstFocus = () => {
    if (started.current) return;
    started.current = true;
    track(EVENTS.contactStart, { intent });
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const payload = {
      intent,
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
        track(EVENTS.contactError, { intent, status: res.status });
        reported = true;
        throw new Error(body?.error ?? 'Something went wrong. Please try again.');
      }
      // Only what the form was about — never the name, address or message.
      track(EVENTS.contactSubmit, { intent, hasCompany: Boolean(payload.company) });
      setStatus('sent');
    } catch (err) {
      if (!reported) track(EVENTS.contactError, { intent, status: 0 });
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.');
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <div className="border-border bg-surface-1 rounded-lg border p-8">
        <p className="font-display text-2xl font-bold tracking-tight">Sent.</p>
        <p className="text-fg-muted mt-3 text-sm leading-relaxed">
          Thanks — I&apos;ll get back to you soon.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            variant="ghost"
            onClick={() => {
              setStatus('idle');
              setIntent('role');
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

        <div className="grid gap-5 sm:grid-cols-2">
          {/* "Optional" lives in the label, not the hint slot: a hint
              renders below the input and would make this column taller
              than the select beside it. */}
          <Field label="Company (optional)" htmlFor="company">
            <Input id="company" name="company" autoComplete="organization" />
          </Field>
          <Field label="What is this about?" htmlFor="intent">
            <Select
              id="intent"
              name="intent"
              value={intent}
              onChange={(e) => setIntent(e.target.value as Intent)}
            >
              <option value="role">A role</option>
              <option value="project">A project</option>
            </Select>
          </Field>
        </div>

        <Field
          label="Message"
          htmlFor="message"
          hint={
            intent === 'role'
              ? 'Team, stack, and what you need someone to own.'
              : 'The problem, not the solution — I will get to that part.'
          }
        >
          <Textarea id="message" name="message" required rows={7} />
        </Field>

        <TurnstileWidget onVerify={setTurnstileToken} />

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

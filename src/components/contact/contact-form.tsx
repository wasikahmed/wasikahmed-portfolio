'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Field, Input, Textarea, Select } from '@/components/ui/field';
import { Button, ArrowRight } from '@/components/ui/button';
import { TurnstileWidget } from '@/components/contact/turnstile-widget';
import { cn } from '@/lib/cn';

type Intent = 'project' | 'role';
type Status = 'idle' | 'pending' | 'sent' | 'error';

/**
 * Progressive form (PLAN.md §2.7).
 *
 * Three fields are visible on arrival. The rest appear once you have shown
 * intent by choosing what this is about — a long form on first sight is the
 * fastest way to lose someone who was only half-decided.
 */
export function ContactForm({ email }: { email: string }) {
  const [intent, setIntent] = useState<Intent | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>(undefined);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!intent) return;

    const form = new FormData(event.currentTarget);
    const payload = {
      intent,
      name: String(form.get('name') ?? ''),
      email: String(form.get('email') ?? ''),
      company: form.get('company') ? String(form.get('company')) : undefined,
      budget: form.get('budget') ? String(form.get('budget')) : undefined,
      message: String(form.get('message') ?? ''),
      turnstileToken,
    };

    setStatus('pending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? 'Something went wrong. Please try again.');
      }
      setStatus('sent');
    } catch (err) {
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
              setIntent(null);
            }}
          >
            Send another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <fieldset>
        <legend className="text-2xs text-fg-muted mb-3 font-mono tracking-wide uppercase">
          What is this about?
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              {
                id: 'project',
                title: 'A project',
                body: 'You have something that needs building.',
              },
              { id: 'role', title: 'A role', body: 'You are hiring and want to talk.' },
            ] as const
          ).map((option) => {
            const active = intent === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setIntent(option.id)}
                aria-pressed={active}
                className={cn(
                  'duration-fast rounded-md border p-4 text-left transition-all',
                  active
                    ? 'border-border-strong bg-accent-whisper'
                    : 'border-border-subtle hover:border-border',
                )}
              >
                <span className={cn('block text-sm', active ? 'text-accent' : 'text-fg')}>
                  {option.title}
                </span>
                <span className="text-2xs text-fg-subtle mt-1 block">{option.body}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <AnimatePresence initial={false}>
        {intent ? (
          <motion.div
            key="rest"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-5 pt-1">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Name" htmlFor="name">
                  <Input id="name" name="name" required autoComplete="name" />
                </Field>
                <Field label="Email" htmlFor="email">
                  <Input id="email" name="email" type="email" required autoComplete="email" />
                </Field>
              </div>

              {intent === 'project' ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Company" htmlFor="company">
                    <Input id="company" name="company" autoComplete="organization" />
                  </Field>
                  <Field
                    label="Rough budget"
                    htmlFor="budget"
                    hint="Helps me be straight with you about fit."
                  >
                    <Select id="budget" name="budget" defaultValue="">
                      <option value="" disabled>
                        Select a range
                      </option>
                      <option>Under $10k</option>
                      <option>$10k — $30k</option>
                      <option>$30k — $75k</option>
                      <option>$75k+</option>
                      <option>Not sure yet</option>
                    </Select>
                  </Field>
                </div>
              ) : null}

              <Field
                label={intent === 'project' ? 'What breaks today?' : 'About the role'}
                htmlFor="message"
                hint={
                  intent === 'project'
                    ? 'The problem, not the solution — I will get to that part.'
                    : 'Team, stack, and what you need someone to own.'
                }
              >
                <Textarea id="message" name="message" required rows={6} />
              </Field>

              <TurnstileWidget onVerify={setTurnstileToken} />

              {status === 'error' ? (
                <p className="text-signal-rose text-sm">
                  {errorMessage}{' '}
                  <a href={`mailto:${email}`} className="underline underline-offset-4">
                    Email me directly instead.
                  </a>
                </p>
              ) : null}

              <div>
                <Button type="submit" size="lg" className="group" disabled={status === 'pending'}>
                  {status === 'pending' ? 'Sending…' : 'Send it'}
                  <ArrowRight />
                </Button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </form>
  );
}

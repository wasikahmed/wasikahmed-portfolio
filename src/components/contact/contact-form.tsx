'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Field, Input, Textarea, Select } from '@/components/ui/field';
import { Button, ArrowRight } from '@/components/ui/button';
import { cn } from '@/lib/cn';

type Intent = 'project' | 'role';

/**
 * Progressive form (PLAN.md §2.7).
 *
 * Three fields are visible on arrival. The rest appear once you have shown
 * intent by choosing what this is about — a long form on first sight is the
 * fastest way to lose someone who was only half-decided.
 *
 * Submission is wired in Phase 5 (Zod, Turnstile, rate limiting, Resend).
 * Until then this validates and reports honestly rather than faking success.
 */
export function ContactForm({ email }: { email: string }) {
  const [intent, setIntent] = useState<Intent | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
  };

  if (sent) {
    return (
      <div className="border-border bg-surface-1 rounded-lg border p-8">
        <p className="font-display text-2xl font-bold tracking-tight">Not connected yet.</p>
        <p className="text-fg-muted mt-3 text-sm leading-relaxed">
          The form validates, but there is no backend behind it until Phase 5 — so nothing was sent,
          and pretending otherwise would lose your message. Email works today.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href={`mailto:${email}`}>Email instead</Button>
          <Button variant="ghost" onClick={() => setSent(false)}>
            Back to form
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

              <div>
                <Button type="submit" size="lg" className="group">
                  Send it
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

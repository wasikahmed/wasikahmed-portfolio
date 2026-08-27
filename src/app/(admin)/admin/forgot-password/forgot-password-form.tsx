'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Input } from '@/components/ui/field';
import { Button, ArrowRight } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * Two-step: request an email OTP, then submit it with a new password.
 * Mirrors login-form.tsx's progressive-disclosure pattern. Both steps
 * show a generic success/error message — the request step never reveals
 * whether the email matched an account (see forgot-password/route.ts).
 */
export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'request' | 'reset' | 'done'>('request');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? 'Something went wrong. Try again.');
      return;
    }

    setStep('reset');
  };

  const onReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? 'Invalid or expired code.');
      return;
    }

    setStep('done');
  };

  if (step === 'done') {
    return (
      <Card variant="raised" padding="lg" className="w-full max-w-sm text-center">
        <p className="text-fg text-sm">Password updated. You can sign in now.</p>
        <Button
          onClick={() => router.push('/admin/login')}
          size="lg"
          className="group mt-5 w-full justify-center"
        >
          Sign in
          <ArrowRight />
        </Button>
      </Card>
    );
  }

  if (step === 'reset') {
    return (
      <Card variant="raised" padding="lg" className="w-full max-w-sm">
        <form onSubmit={onReset} className="flex flex-col gap-5">
          <p className="text-fg-muted text-sm">
            If an account exists for {email}, a 6-digit code was sent to it. It expires in 10
            minutes.
          </p>

          <Field label="Code" htmlFor="code" hint="From your email.">
            <Input
              id="code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              autoFocus
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </Field>

          <Field label="New password" htmlFor="newPassword" hint="At least 12 characters.">
            <Input
              id="newPassword"
              type="password"
              required
              minLength={12}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </Field>

          {error ? <p className="text-signal-rose text-sm">{error}</p> : null}

          <Button type="submit" size="lg" className="group justify-center" disabled={submitting}>
            {submitting ? 'Saving…' : 'Reset password'}
            {!submitting ? <ArrowRight /> : null}
          </Button>
        </form>
      </Card>
    );
  }

  return (
    <Card variant="raised" padding="lg" className="w-full max-w-sm">
      <form onSubmit={onRequest} className="flex flex-col gap-5">
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        {error ? <p className="text-signal-rose text-sm">{error}</p> : null}

        <Button type="submit" size="lg" className="group justify-center" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send code'}
          {!submitting ? <ArrowRight /> : null}
        </Button>

        <Button href="/admin/login" variant="link" size="sm" className="mx-auto">
          Back to sign in
        </Button>
      </form>
    </Card>
  );
}

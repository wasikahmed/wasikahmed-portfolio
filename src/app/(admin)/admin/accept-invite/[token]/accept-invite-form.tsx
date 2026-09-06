'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Input } from '@/components/ui/field';
import { Button, ArrowRight } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TurnstileWidget } from '@/components/contact/turnstile-widget';

type LoadState =
  | { status: 'loading' }
  | { status: 'invalid' }
  | { status: 'ready'; email: string; role: string }
  | { status: 'done' };

/**
 * Validates the token on mount (GET) before showing any form — an
 * invalid or expired link gets one clear message instead of a form that
 * only fails on submit. Turnstile-gated on submit, same widget the
 * contact form uses (PLAN.md W11): this is a public, unauthenticated
 * endpoint that turns a pending invite into a real account.
 */
export function AcceptInviteForm({ token }: { token: string }) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/auth/accept-invite/${token}`)
      .then(async (res) => {
        if (!res.ok) return setState({ status: 'invalid' });
        const body = (await res.json()) as { email: string; role: string };
        setState({ status: 'ready', email: body.email, role: body.role });
      })
      .catch(() => setState({ status: 'invalid' }));
  }, [token]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/auth/accept-invite/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password, turnstileToken }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? 'Something went wrong. Try again.');
      return;
    }

    setState({ status: 'done' });
  };

  if (state.status === 'loading') {
    return (
      <Card variant="raised" padding="lg" className="w-full max-w-sm text-center">
        <p className="text-fg-muted text-sm">Checking your invite…</p>
      </Card>
    );
  }

  if (state.status === 'invalid') {
    return (
      <Card variant="raised" padding="lg" className="w-full max-w-sm text-center">
        <p className="text-fg text-sm">
          This invite link is invalid or has expired. Ask whoever invited you to send a new one.
        </p>
        <Button href="/admin/login" size="lg" className="group mt-5 w-full justify-center">
          Back to sign in
          <ArrowRight />
        </Button>
      </Card>
    );
  }

  if (state.status === 'done') {
    return (
      <Card variant="raised" padding="lg" className="w-full max-w-sm text-center">
        <p className="text-fg text-sm">Your account is ready. You can sign in now.</p>
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

  return (
    <Card variant="raised" padding="lg" className="w-full max-w-sm">
      <p className="text-fg-muted mb-5 text-sm">
        {state.email} · invited as <span className="text-fg">{state.role}</span>
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <Field label="Name" htmlFor="name">
          <Input
            id="name"
            required
            autoComplete="name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        <Field label="Password" htmlFor="password" hint="At least 12 characters.">
          <Input
            id="password"
            type="password"
            required
            minLength={12}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <TurnstileWidget onVerify={setTurnstileToken} />

        {error ? <p className="text-signal-rose text-sm">{error}</p> : null}

        <Button type="submit" size="lg" className="group justify-center" disabled={submitting}>
          {submitting ? 'Setting up…' : 'Create account'}
          {!submitting ? <ArrowRight /> : null}
        </Button>
      </form>
    </Card>
  );
}

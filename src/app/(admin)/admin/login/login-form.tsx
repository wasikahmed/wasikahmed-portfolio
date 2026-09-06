'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Field, Input } from '@/components/ui/field';
import { Button, ArrowRight } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * Two-step login, matching the site's contact-form progressive-disclosure
 * pattern (PLAN.md §2.7): email + password first; the TOTP code field only
 * appears once the server confirms this specific account has 2FA enabled
 * (signaled by the `TOTP_REQUIRED` error code from src/server/auth.ts).
 * Nothing about whether an email exists is revealed before that point.
 */
export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [needsCode, setNeedsCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Redirect-based, not `redirect: false` like credentials above — Google's
  // flow leaves the app entirely and comes back via
  // /api/auth/callback/google, so there's no local result to branch on. A
  // rejected sign-in (see auth.ts's `signIn` callback — no matching User
  // document, or a suspended one) lands back here with `?error=` in the
  // URL, which Auth.js's own default error handling covers; this app
  // doesn't currently render a custom message for it, matching the
  // generic "Incorrect email or password" treatment credentials gets.
  const onGoogle = () => {
    void signIn('google', { callbackUrl: params.get('from') ?? '/admin' });
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await signIn('credentials', {
      email,
      password,
      code,
      redirect: false,
    });

    setSubmitting(false);

    /*
     * Auth.js only ever sends the generic `code` to the client, never the
     * descriptive message passed to `new CredentialsSignin(...)` on the
     * server — that stays server-side in the logs, deliberately, so a
     * failure response can't be used to enumerate which part was wrong.
     * `TOTP_REQUIRED` is the one code this app defines itself and the only
     * one worth branching on; anything else collapses to one fixed,
     * intentionally non-specific message.
     */
    if (result?.code === 'TOTP_REQUIRED') {
      setNeedsCode(true);
      return;
    }
    if (result?.code === 'RATE_LIMITED') {
      setError('Too many attempts. Try again in a few minutes.');
      return;
    }
    if (!result?.ok) {
      setError(
        needsCode
          ? 'Incorrect code. Check your authenticator app and try again.'
          : 'Incorrect email or password.',
      );
      return;
    }

    router.push(params.get('from') ?? '/admin');
    router.refresh();
  };

  return (
    <Card variant="raised" padding="lg" className="w-full max-w-sm">
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            autoFocus
            disabled={needsCode}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            disabled={needsCode}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        {needsCode ? (
          <Field label="Authentication code" htmlFor="code" hint="From your authenticator app.">
            <Input
              id="code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              autoFocus
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </Field>
        ) : null}

        {error ? <p className="text-signal-rose text-sm">{error}</p> : null}

        <Button type="submit" size="lg" className="group justify-center" disabled={submitting}>
          {submitting ? 'Checking…' : needsCode ? 'Verify' : 'Sign in'}
          {!submitting ? <ArrowRight /> : null}
        </Button>

        {!needsCode ? (
          <Button href="/admin/forgot-password" variant="link" size="sm" className="mx-auto">
            Forgot password?
          </Button>
        ) : null}
      </form>

      {googleEnabled && !needsCode ? (
        <>
          <div className="text-fg-subtle text-2xs my-5 flex items-center gap-3">
            <span className="bg-border-subtle h-px flex-1" />
            or
            <span className="bg-border-subtle h-px flex-1" />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="w-full justify-center"
            onClick={onGoogle}
          >
            Sign in with Google
          </Button>
        </>
      ) : null}
    </Card>
  );
}

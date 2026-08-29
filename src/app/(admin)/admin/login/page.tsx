import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Sign in — Admin',
  robots: { index: false },
};

/*
 * Without this, this page has no dynamic API call of its own (LoginForm is
 * a Client Component), so Next statically prerenders it once at build
 * time — with one nonce baked into its `<script>` tags forever, while
 * proxy.ts's CSP header carries a fresh nonce on every request. The two
 * can never match again after the first request, so every script on the
 * page — including LoginForm's own hydration — gets silently blocked by
 * the browser's CSP enforcement. Confirmed 2026-08-30 against the actual
 * standalone-output production server: the login form never rendered at
 * all. force-dynamic makes this render fresh per request, same as every
 * page in `(site)` already does for a different reason (queries.ts).
 */
export const dynamic = 'force-dynamic';

export default function AdminLoginPage() {
  return (
    <main className="bg-bg text-fg flex min-h-screen flex-col items-center justify-center gap-8 px-6">
      <div className="text-center">
        <span className="from-accent to-accent-bright font-display text-bg mb-4 inline-grid h-9 w-9 place-items-center rounded-md bg-gradient-to-br text-xs font-bold">
          WA
        </span>
        <h1 className="font-display text-xl font-bold tracking-tight">Admin</h1>
      </div>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Sign in — Admin',
  robots: { index: false },
};

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

import type { Metadata } from 'next';
import { ForgotPasswordForm } from './forgot-password-form';

export const metadata: Metadata = {
  title: 'Reset password — Admin',
  robots: { index: false },
};

// Same CSP nonce-vs-static-prerender bug as admin/login/page.tsx — see
// that file's comment. This page had the identical shape (no dynamic API
// call of its own) and was statically prerendered for the same reason.
export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
  return (
    <main className="bg-bg text-fg flex min-h-screen flex-col items-center justify-center gap-8 px-6">
      <div className="text-center">
        <span className="from-accent to-accent-bright font-display text-bg mb-4 inline-grid h-9 w-9 place-items-center rounded-md bg-gradient-to-br text-xs font-bold">
          WA
        </span>
        <h1 className="font-display text-xl font-bold tracking-tight">Reset password</h1>
      </div>
      <ForgotPasswordForm />
    </main>
  );
}

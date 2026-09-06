import type { Metadata } from 'next';
import { AcceptInviteForm } from './accept-invite-form';

export const metadata: Metadata = {
  title: 'Accept invite — Admin',
  robots: { index: false },
};

// Same CSP nonce-vs-static-prerender bug as admin/login/page.tsx (see that
// file's comment) — this page has the identical shape (no dynamic API
// call of its own; AcceptInviteForm is a Client Component) and would be
// statically prerendered for the same reason without this.
export const dynamic = 'force-dynamic';

export default async function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return (
    <main className="bg-bg text-fg flex min-h-screen flex-col items-center justify-center gap-8 px-6">
      <div className="text-center">
        <span className="from-accent to-accent-bright font-display text-bg mb-4 inline-grid h-9 w-9 place-items-center rounded-md bg-gradient-to-br text-xs font-bold">
          WA
        </span>
        <h1 className="font-display text-xl font-bold tracking-tight">Accept invite</h1>
      </div>
      <AcceptInviteForm token={token} />
    </main>
  );
}

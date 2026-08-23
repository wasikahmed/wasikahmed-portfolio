import { redirect } from 'next/navigation';
import { getAdminSession } from '@/server/session';
import { getSettings } from '@/server/queries';
import { Sidebar } from '@/components/admin/sidebar';
import { SignOutButton } from '@/components/admin/sign-out-button';
import { TotpNag } from '@/components/admin/totp-nag';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Middleware already gates this route; checked again here so a page
  // component never has to remember to — and to get the session's email
  // for the header without threading it down as a prop everywhere.
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const settings = await getSettings();

  return (
    <div className="bg-bg text-fg min-h-screen">
      <div className="mx-auto flex max-w-[1440px]">
        <aside className="border-border-subtle sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r px-4 py-6 lg:flex">
          <div className="mb-8 flex items-center gap-2.5 px-3">
            <span className="from-accent to-accent-bright font-display text-bg grid h-8 w-8 shrink-0 place-items-center rounded-md bg-gradient-to-br text-xs font-bold">
              {settings.initials}
            </span>
            <span className="font-display text-sm font-semibold">Admin</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Sidebar />
          </div>
          <div className="border-border-subtle flex items-center justify-between border-t px-3 pt-4">
            <span className="text-2xs text-fg-subtle truncate font-mono">{session.email}</span>
            <SignOutButton />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Mobile top bar — the sidebar is desktop-only above lg. */}
          <div className="border-border-subtle flex items-center justify-between border-b px-4 py-3 lg:hidden">
            <span className="font-display text-sm font-semibold">Admin</span>
            <SignOutButton />
          </div>
          <nav
            aria-label="Admin"
            className="border-border-subtle flex gap-1 overflow-x-auto border-b px-4 py-2 lg:hidden"
          >
            {[
              { label: 'Dashboard', href: '/admin' },
              { label: 'Projects', href: '/admin/projects' },
              { label: 'Writing', href: '/admin/posts' },
              { label: 'Testimonials', href: '/admin/testimonials' },
              { label: 'Experience', href: '/admin/experience' },
              { label: 'Skills', href: '/admin/skills' },
              { label: 'Media', href: '/admin/media' },
              { label: 'Leads', href: '/admin/leads' },
              { label: 'Settings', href: '/admin/settings' },
              { label: 'Security', href: '/admin/security' },
              { label: 'Audit log', href: '/admin/audit-log' },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-2xs text-fg-muted hover:bg-surface-2 hover:text-fg shrink-0 rounded-sm px-2.5 py-1 font-mono"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <main className="p-6 lg:p-10">
            {!session.totpEnabled ? <TotpNag /> : null}
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

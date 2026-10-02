import { redirect } from 'next/navigation';
import { getAdminSession } from '@/server/session';
import { getSettings } from '@/server/queries';
import { can } from '@/server/permissions';
import { Sidebar } from '@/components/admin/sidebar';
import { AdminProfile } from '@/components/admin/admin-profile';
import { TotpNag } from '@/components/admin/totp-nag';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Middleware already gates this route; checked again here so a page
  // component never has to remember to — and to get the session's email
  // for the header without threading it down as a prop everywhere.
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const settings = await getSettings();
  const canManageUsers = can(session, 'user:read');

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
            <Sidebar canManageUsers={canManageUsers} />
          </div>
          <div className="border-border-subtle border-t px-3 pt-4">
            <AdminProfile
              email={session.email}
              initials={settings.initials}
              totpEnabled={session.totpEnabled}
              align="up"
            />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Mobile top bar — the sidebar is desktop-only above lg. */}
          <div className="border-border-subtle flex items-center justify-between border-b px-4 py-3 lg:hidden">
            <span className="font-display text-sm font-semibold">Admin</span>
            <AdminProfile
              email={session.email}
              initials={settings.initials}
              totpEnabled={session.totpEnabled}
              align="down"
            />
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
              { label: 'Résumé', href: '/admin/resume' },
              { label: 'Media', href: '/admin/media' },
              { label: 'Leads', href: '/admin/leads' },
              { label: 'Site copy', href: '/admin/site-copy' },
              { label: 'Settings', href: '/admin/settings' },
              ...(canManageUsers ? [{ label: 'Users', href: '/admin/users' }] : []),
              { label: 'Security', href: '/admin/security' },
              { label: 'History', href: '/admin/history' },
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

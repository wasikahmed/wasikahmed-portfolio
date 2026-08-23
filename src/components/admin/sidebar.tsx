'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

const GROUPS: { label: string; links: { label: string; href: string }[] }[] = [
  { label: '', links: [{ label: 'Dashboard', href: '/admin' }] },
  {
    label: 'Content',
    links: [
      { label: 'Projects', href: '/admin/projects' },
      { label: 'Writing', href: '/admin/posts' },
      { label: 'Testimonials', href: '/admin/testimonials' },
      { label: 'Experience', href: '/admin/experience' },
      { label: 'Skills', href: '/admin/skills' },
    ],
  },
  {
    label: 'Site',
    links: [
      { label: 'Media', href: '/admin/media' },
      { label: 'Leads', href: '/admin/leads' },
      { label: 'Settings', href: '/admin/settings' },
    ],
  },
  {
    label: 'Account',
    links: [
      { label: 'Security', href: '/admin/security' },
      { label: 'Audit log', href: '/admin/audit-log' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="flex flex-col gap-6">
      {GROUPS.map((group, i) => (
        <div key={group.label || i}>
          {group.label ? (
            <p className="text-2xs text-fg-subtle mb-2 px-3 font-mono tracking-widest uppercase">
              {group.label}
            </p>
          ) : null}
          <ul className="flex flex-col gap-0.5">
            {group.links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'duration-fast block rounded-md px-3 py-2 text-sm transition-colors',
                      active
                        ? 'bg-accent-whisper text-accent'
                        : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

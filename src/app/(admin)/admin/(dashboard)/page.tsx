import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import {
  getAllProjects,
  getAllPosts,
  getAllTestimonials,
  getRoles,
  getTech,
  getSkillGroups,
} from '@/server/queries';
import { connectToDatabase } from '@/server/db';
import { AuditLog } from '@/server/models/audit-log';
import { Lead } from '@/server/models/lead';
import { normalizeDoc } from '@/server/mongo-utils';
import type { AuditLogEntry } from '@/lib/types';

const ACTION_COLOR: Record<AuditLogEntry['action'], string> = {
  create: 'text-accent',
  update: 'text-signal-amber',
  delete: 'text-signal-rose',
};

export default async function AdminDashboardPage() {
  await connectToDatabase();

  const [projects, posts, testimonials, roles, tech, skillGroups, recentAudit, leadCount] =
    await Promise.all([
      getAllProjects(),
      getAllPosts(),
      getAllTestimonials(),
      getRoles(),
      getTech(),
      getSkillGroups(),
      AuditLog.find().sort({ createdAt: -1 }).limit(8).lean(),
      Lead.countDocuments(),
    ]);

  const draftProjects = projects.filter((p) => p.status !== 'published').length;
  const draftPosts = posts.filter((p) => p.status !== 'published').length;

  const cards = [
    {
      label: 'Projects',
      count: projects.length,
      note: draftProjects ? `${draftProjects} draft` : 'all published',
      href: '/admin/projects',
    },
    {
      label: 'Writing',
      count: posts.length,
      note: draftPosts ? `${draftPosts} draft` : 'all published',
      href: '/admin/posts',
    },
    { label: 'Testimonials', count: testimonials.length, note: '', href: '/admin/testimonials' },
    { label: 'Experience', count: roles.length, note: '', href: '/admin/experience' },
    { label: 'Tech items', count: tech.length, note: '', href: '/admin/skills' },
    { label: 'Skill groups', count: skillGroups.length, note: '', href: '/admin/skills' },
    {
      label: 'Leads',
      count: leadCount,
      note: '',
      href: '/admin/leads',
    },
  ];

  return (
    <div>
      <Eyebrow>Dashboard</Eyebrow>
      <h1 className="font-display mt-2 text-2xl font-bold tracking-tight">Overview</h1>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card variant="flat" interactive padding="md">
              <p className="font-display text-3xl font-bold tracking-tight">{c.count}</p>
              <p className="text-fg-muted mt-1 text-sm">{c.label}</p>
              {c.note ? <p className="text-2xs text-fg-subtle mt-2">{c.note}</p> : null}
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-12">
        <p className="text-2xs text-fg-subtle mb-4 font-mono tracking-widest uppercase">
          Recent activity
        </p>
        {recentAudit.length === 0 ? (
          <Card variant="outline" padding="lg">
            <p className="text-fg-muted text-sm">Nothing changed yet.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {recentAudit.map((entry) => {
              const e = normalizeDoc(entry) as unknown as AuditLogEntry;
              return (
                <Card key={e.id} variant="flat" padding="sm" className="flex items-center gap-4">
                  <span className={`text-2xs font-mono uppercase ${ACTION_COLOR[e.action]}`}>
                    {e.action}
                  </span>
                  <span className="text-fg min-w-0 flex-1 truncate text-sm">{e.summary}</span>
                  <span className="text-2xs text-fg-subtle shrink-0 font-mono">
                    {new Date(e.createdAt).toLocaleDateString()}
                  </span>
                </Card>
              );
            })}
          </div>
        )}
        <Link
          href="/admin/audit-log"
          className="text-2xs text-fg-muted hover:text-accent mt-4 inline-block font-mono"
        >
          View full log →
        </Link>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Card } from '@/components/ui/card';
import { Tag } from '@/components/ui/tag';
import { adminFetchJson } from '@/lib/admin-fetch';
import { LeadStatusControl } from '@/components/admin/lead-status-control';
import type { Lead } from '@/lib/types';

const INTENT_LABEL: Record<Lead['intent'], string> = {
  project: 'Project',
  role: 'Role',
};

function LeadRow({ lead, onUpdate }: { lead: Lead; onUpdate: (lead: Lead) => void }) {
  return (
    <Card
      variant="flat"
      padding="sm"
      interactive
      className="flex flex-wrap items-center justify-between gap-4"
    >
      <Link href={`/admin/leads/${lead.id}`} className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {lead.status === 'new' ? (
            <span aria-hidden className="bg-signal-amber h-1.5 w-1.5 shrink-0 rounded-full" />
          ) : null}
          <p className="text-fg truncate text-sm">
            {lead.name} <span className="text-fg-subtle">· {lead.email}</span>
          </p>
        </div>
        <p className="text-2xs text-fg-subtle mt-1 font-mono uppercase">
          {INTENT_LABEL[lead.intent]} · {new Date(lead.createdAt).toLocaleString()}
        </p>
        <p className="text-fg-muted mt-1.5 line-clamp-1 text-sm">{lead.message}</p>
      </Link>

      <div className="flex shrink-0 items-center gap-3">
        <Tag
          tone={
            lead.status === 'new'
              ? 'amber'
              : lead.status === 'replied'
                ? 'accent'
                : lead.status === 'archived'
                  ? 'muted'
                  : 'default'
          }
        >
          {lead.status}
        </Tag>
        <LeadStatusControl lead={lead} onUpdate={onUpdate} size="sm" stopPropagation />
      </div>
    </Card>
  );
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[] | null>(null);

  useEffect(() => {
    adminFetchJson<{ items: Lead[] }>('/api/admin/leads')
      .then((res) => setLeads(res.items))
      .catch(() => setLeads([]));
  }, []);

  const updateLead = (updated: Lead) => {
    setLeads((prev) => prev?.map((l) => (l.id === updated.id ? updated : l)) ?? prev);
  };

  const newCount = leads?.filter((l) => l.status === 'new').length ?? 0;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Leads</Eyebrow>
          <p className="text-fg-muted mt-2 max-w-lg text-sm">Contact form submissions.</p>
        </div>
        {newCount > 0 ? <Tag tone="amber">{newCount} new</Tag> : null}
      </div>

      <div className="mt-8">
        {leads === null ? (
          <p className="text-fg-muted text-sm">Loading…</p>
        ) : leads.length === 0 ? (
          <Card variant="outline" padding="lg">
            <p className="text-fg-muted text-sm">No submissions yet.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {leads.map((lead) => (
              <LeadRow key={lead.id} lead={lead} onUpdate={updateLead} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

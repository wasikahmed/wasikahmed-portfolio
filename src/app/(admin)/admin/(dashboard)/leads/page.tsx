'use client';

import { useEffect, useState } from 'react';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Card } from '@/components/ui/card';
import { Tag } from '@/components/ui/tag';
import { Select, Textarea } from '@/components/ui/field';
import { adminFetchJson } from '@/lib/admin-fetch';
import type { Lead } from '@/lib/types';

const STATUSES: Lead['status'][] = ['new', 'read', 'replied', 'archived'];

const STATUS_TONE: Record<Lead['status'], 'default' | 'accent'> = {
  new: 'accent',
  read: 'default',
  replied: 'accent',
  archived: 'default',
};

function LeadCard({ lead, onUpdate }: { lead: Lead; onUpdate: (lead: Lead) => void }) {
  const [notes, setNotes] = useState(lead.notes ?? '');
  const [saving, setSaving] = useState(false);

  const patch = async (body: { status?: Lead['status']; notes?: string }) => {
    setSaving(true);
    try {
      const res = await adminFetchJson<{ item: Lead }>(`/api/admin/leads/${lead.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      onUpdate(res.item);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card variant="flat" padding="sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-fg text-sm">
            {lead.name} · {lead.email}
          </p>
          <p className="text-2xs text-fg-subtle mt-0.5 font-mono uppercase">
            {lead.intent} · {new Date(lead.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Tag tone={STATUS_TONE[lead.status]}>{lead.status}</Tag>
          <Select
            value={lead.status}
            disabled={saving}
            onChange={(e) => patch({ status: e.target.value as Lead['status'] })}
            className="w-auto"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {lead.company || lead.budget ? (
        <p className="text-fg-subtle mt-2 text-sm">
          {[lead.company, lead.budget].filter(Boolean).join(' · ')}
        </p>
      ) : null}

      <p className="text-fg-muted mt-2 text-sm">{lead.message}</p>

      <div className="mt-3">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => {
            if (notes !== (lead.notes ?? '')) patch({ notes });
          }}
          placeholder="Notes…"
          rows={2}
          className="text-sm"
        />
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

  return (
    <div>
      <Eyebrow>Leads</Eyebrow>
      <p className="text-fg-muted mt-2 max-w-lg text-sm">Contact form submissions.</p>

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
              <LeadCard key={lead.id} lead={lead} onUpdate={updateLead} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

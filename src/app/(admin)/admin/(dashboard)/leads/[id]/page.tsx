'use client';

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Card } from '@/components/ui/card';
import { Field, Textarea } from '@/components/ui/field';
import { adminFetchJson } from '@/lib/admin-fetch';
import { LeadStatusControl } from '@/components/admin/lead-status-control';
import type { Lead } from '@/lib/types';

const INTENT_LABEL: Record<NonNullable<Lead['intent']>, string> = {
  project: 'Project inquiry',
  role: 'Role inquiry',
};

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [lead, setLead] = useState<Lead | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  // Auto-transition new → read only once per mount, and only for the copy
  // that was actually "new" when the page opened — not on every re-render
  // that follows a manual status change.
  const autoMarkedRead = useRef(false);

  useEffect(() => {
    adminFetchJson<{ item: Lead }>(`/api/admin/leads/${id}`)
      .then((res) => {
        setLead(res.item);
        setNotes(res.item.notes ?? '');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load.'));
  }, [id]);

  useEffect(() => {
    if (!lead || lead.status !== 'new' || autoMarkedRead.current) return;
    autoMarkedRead.current = true;
    adminFetchJson<{ item: Lead }>(`/api/admin/leads/${lead.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'read' }),
    }).then((res) => setLead(res.item));
  }, [lead]);

  const saveNotes = async () => {
    if (!lead || notes === (lead.notes ?? '')) return;
    setNotesSaving(true);
    try {
      const res = await adminFetchJson<{ item: Lead }>(`/api/admin/leads/${lead.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ notes }),
      });
      setLead(res.item);
    } finally {
      setNotesSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin/leads"
        className="text-2xs text-fg-muted duration-fast hover:text-accent inline-flex items-center gap-2 font-mono transition-colors"
      >
        <span aria-hidden>←</span> Leads
      </Link>

      <Eyebrow className="mt-6">Lead</Eyebrow>

      {error ? <p className="text-signal-rose mt-6 text-sm">{error}</p> : null}

      {!lead && !error ? <p className="text-fg-muted mt-6 text-sm">Loading…</p> : null}

      {lead ? (
        <div className="mt-6 flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-fg text-xl font-semibold">{lead.name}</h1>
              <a
                href={`mailto:${lead.email}`}
                className="text-accent hover:text-accent-bright text-sm underline-offset-4 hover:underline"
              >
                {lead.email}
              </a>
              <p className="text-2xs text-fg-subtle mt-2 font-mono uppercase">
                {lead.intent ? `${INTENT_LABEL[lead.intent]} · ` : null}
                {new Date(lead.createdAt).toLocaleString()}
              </p>
            </div>
            <LeadStatusControl lead={lead} onUpdate={setLead} />
          </div>

          {lead.company || lead.budget ? (
            <Card variant="outline" padding="sm" className="flex flex-wrap gap-x-6 gap-y-2">
              {lead.company ? (
                <div>
                  <p className="text-2xs text-fg-subtle font-mono uppercase">Company</p>
                  <p className="text-fg text-sm">{lead.company}</p>
                </div>
              ) : null}
              {lead.budget ? (
                <div>
                  <p className="text-2xs text-fg-subtle font-mono uppercase">Budget</p>
                  <p className="text-fg text-sm">{lead.budget}</p>
                </div>
              ) : null}
            </Card>
          ) : null}

          <Card variant="flat" padding="md">
            <p className="text-2xs text-fg-subtle mb-2 font-mono uppercase">Message</p>
            <p className="text-fg text-sm whitespace-pre-wrap">{lead.message}</p>
          </Card>

          <Field label="Notes" htmlFor="notes" hint={notesSaving ? 'Saving…' : undefined}>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              placeholder="Internal notes…"
              rows={4}
            />
          </Field>

          {lead.source || lead.ipHash || lead.userAgent ? (
            <details className="group">
              <summary className="text-2xs text-fg-subtle cursor-pointer font-mono tracking-widest uppercase [&::-webkit-details-marker]:hidden">
                Technical details <span className="group-open:hidden">▸</span>
                <span className="hidden group-open:inline">▾</span>
              </summary>
              <div className="mt-4 flex flex-col gap-2">
                {lead.source ? (
                  <p className="text-2xs text-fg-subtle font-mono">Source: {lead.source}</p>
                ) : null}
                {lead.ipHash ? (
                  <p className="text-2xs text-fg-subtle font-mono break-all">
                    IP hash: {lead.ipHash}
                  </p>
                ) : null}
                {lead.userAgent ? (
                  <p className="text-2xs text-fg-subtle font-mono break-all">
                    User agent: {lead.userAgent}
                  </p>
                ) : null}
              </div>
            </details>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Card } from '@/components/ui/card';
import { Tag } from '@/components/ui/tag';
import { adminFetchJson } from '@/lib/admin-fetch';
import type { Lead } from '@/lib/types';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[] | null>(null);

  useEffect(() => {
    adminFetchJson<{ items: Lead[] }>('/api/admin/leads')
      .then((res) => setLeads(res.items))
      .catch(() => setLeads([]));
  }, []);

  return (
    <div>
      <Eyebrow>Leads</Eyebrow>
      <p className="text-fg-muted mt-2 max-w-lg text-sm">
        Contact form submissions. The form itself isn&apos;t wired to write here yet — Phase 5 adds
        validation, spam protection, and email notification.
      </p>

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
              <Card key={lead.id} variant="flat" padding="sm">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-fg text-sm">
                    {lead.name} · {lead.email}
                  </p>
                  <Tag tone="accent">{lead.status}</Tag>
                </div>
                <p className="text-fg-muted mt-1 text-sm">{lead.message}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

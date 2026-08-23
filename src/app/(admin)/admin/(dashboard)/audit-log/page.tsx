'use client';

import { useEffect, useState } from 'react';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { adminFetchJson } from '@/lib/admin-fetch';
import type { AuditLogEntry } from '@/lib/types';

const ACTION_COLOR: Record<AuditLogEntry['action'], string> = {
  create: 'text-accent',
  update: 'text-signal-amber',
  delete: 'text-signal-rose',
};

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Render-phase reset rather than setting it inside the effect below —
  // React's documented pattern for "value changed" — so the loading state
  // flips the instant `page` changes instead of one render late.
  const [loadedForPage, setLoadedForPage] = useState<number | null>(null);
  if (loadedForPage !== page && !loading) {
    setLoading(true);
  }

  useEffect(() => {
    adminFetchJson<{ items: AuditLogEntry[]; totalPages: number }>(
      `/api/admin/audit-log?page=${page}`,
    )
      .then((res) => {
        setEntries(res.items);
        setTotalPages(res.totalPages);
      })
      .finally(() => {
        setLoadedForPage(page);
        setLoading(false);
      });
  }, [page]);

  return (
    <div>
      <Eyebrow>Audit log</Eyebrow>
      <p className="text-fg-muted mt-2 max-w-lg text-sm">
        Every create, update, and delete made through the admin, most recent first.
      </p>

      <div className="mt-8 flex flex-col gap-2">
        {loading ? (
          <p className="text-fg-muted text-sm">Loading…</p>
        ) : entries.length === 0 ? (
          <Card variant="outline" padding="lg">
            <p className="text-fg-muted text-sm">No changes recorded yet.</p>
          </Card>
        ) : (
          entries.map((entry) => (
            <Card key={entry.id} variant="flat" padding="sm" className="flex items-center gap-4">
              <span className={`text-2xs font-mono uppercase ${ACTION_COLOR[entry.action]}`}>
                {entry.action}
              </span>
              <span className="text-fg min-w-0 flex-1 truncate text-sm">{entry.summary}</span>
              <span className="text-2xs text-fg-subtle shrink-0 font-mono">
                {new Date(entry.createdAt).toLocaleString()}
              </span>
            </Card>
          ))
        )}
      </div>

      {totalPages > 1 ? (
        <div className="mt-6 flex items-center gap-3">
          <Button
            variant="subtle"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-2xs text-fg-subtle font-mono">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="subtle"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}

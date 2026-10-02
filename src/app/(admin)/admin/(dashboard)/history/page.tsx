'use client';

import { useEffect, useState } from 'react';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/field';
import { RevisionRow } from '@/components/admin/revision-history';
import { adminFetchJson } from '@/lib/admin-fetch';
import type { Revision } from '@/lib/types';

const TYPES: { value: string; label: string }[] = [
  { value: '', label: 'Everything' },
  { value: 'project', label: 'Projects' },
  { value: 'post', label: 'Writing' },
  { value: 'role', label: 'Experience' },
  { value: 'skillGroup', label: 'Skill groups' },
  { value: 'tech', label: 'Tech' },
  { value: 'testimonial', label: 'Testimonials' },
  { value: 'settings', label: 'Settings' },
  { value: 'siteCopy', label: 'Site copy' },
];

/**
 * Every saved version across the CMS, newest first — the per-record
 * History panels on each edit page are this, filtered. This page exists
 * for the one case those panels can't cover: a deleted record has no edit
 * page left, so "Before delete" rows here are the only way back to it.
 */
export default function HistoryPage() {
  const [entityType, setEntityType] = useState('');
  const [items, setItems] = useState<Revision[] | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const query = new URLSearchParams({ page: String(page) });
    if (entityType) query.set('entityType', entityType);
    adminFetchJson<{ items: Revision[]; totalPages: number }>(`/api/admin/revisions?${query}`)
      .then((res) => {
        setItems(res.items);
        setTotalPages(res.totalPages);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load.'));
  }, [entityType, page, reloadCount]);

  return (
    <div>
      <Eyebrow>History</Eyebrow>
      <p className="text-fg-muted mt-2 max-w-lg text-sm">
        Earlier versions of your content, kept on every save and delete. Restore brings a version
        back as it was — including deleted projects, posts and roles.
      </p>

      <div className="mt-6 max-w-xs">
        <Select
          aria-label="Filter by type"
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value);
            setPage(1);
          }}
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </div>

      {notice ? <p className="text-accent mt-4 text-sm">{notice}</p> : null}

      <div className="mt-6 flex flex-col gap-2">
        {error ? (
          <p className="text-signal-rose text-sm">{error}</p>
        ) : items === null ? (
          <p className="text-fg-muted text-sm">Loading…</p>
        ) : items.length === 0 ? (
          <Card variant="outline" padding="lg">
            <p className="text-fg-muted text-sm">
              No earlier versions yet — they start collecting with the next save.
            </p>
          </Card>
        ) : (
          items.map((revision) => (
            <RevisionRow
              key={revision.id}
              revision={revision}
              showLabel
              onRestored={() => {
                setNotice(`Restored ${revision.label}.`);
                setReloadCount((n) => n + 1);
              }}
            />
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
            Newer
          </Button>
          <span className="text-2xs text-fg-subtle font-mono">
            {page} / {totalPages}
          </span>
          <Button
            variant="subtle"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Older
          </Button>
        </div>
      ) : null}
    </div>
  );
}

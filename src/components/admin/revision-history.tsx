'use client';

import { useEffect, useState } from 'react';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { adminFetch, adminFetchJson } from '@/lib/admin-fetch';
import type { Revision } from '@/lib/types';

/** Keys that change on every save, or are managed elsewhere — never worth listing as a change. */
const IGNORED_KEYS = new Set(['id', '_id', '__v', 'createdAt', 'updatedAt', 'order']);

const ACTION_LABEL: Record<Revision['action'], string> = {
  update: 'Before edit',
  delete: 'Before delete',
  restore: 'Before restore',
};

const ACTION_COLOR: Record<Revision['action'], string> = {
  update: 'text-signal-amber',
  delete: 'text-signal-rose',
  restore: 'text-accent',
};

function stable(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function display(value: unknown): string {
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

/**
 * The fields where a revision differs from `current`, or — with nothing to
 * compare against (the global history page, a deleted record) — every
 * field it has. Top-level only: a changed metric or section shows as its
 * whole array, which reads fine at CMS scale and keeps this dependency-free.
 */
export function revisionChanges(
  snapshot: Record<string, unknown>,
  current?: Record<string, unknown>,
): { key: string; before: unknown; now?: unknown }[] {
  const keys = new Set([...Object.keys(snapshot), ...Object.keys(current ?? {})]);
  return [...keys]
    .filter((key) => !IGNORED_KEYS.has(key))
    .filter((key) => !current || stable(snapshot[key]) !== stable(current[key]))
    .map((key) => ({ key, before: snapshot[key], now: current?.[key] }));
}

function ValueBlock({ label, value }: { label: string; value: unknown }) {
  const text = display(value);
  return (
    <div className="min-w-0">
      <p className="text-2xs text-fg-subtle mb-1 font-mono uppercase">{label}</p>
      <pre className="text-fg-muted bg-surface-2 max-h-48 overflow-auto rounded-sm p-2 font-sans text-xs whitespace-pre-wrap">
        {text.length > 2000 ? `${text.slice(0, 2000)}…` : text}
      </pre>
    </div>
  );
}

export function RevisionRow({
  revision,
  current,
  showLabel = false,
  onRestored,
}: {
  revision: Revision;
  current?: Record<string, unknown>;
  showLabel?: boolean;
  onRestored: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const changes = open ? revisionChanges(revision.snapshot, current) : [];

  const restore = async () => {
    setBusy(true);
    setError(null);
    const res = await adminFetch(`/api/admin/revisions/${revision.id}/restore`, {
      method: 'POST',
    });
    if (res.ok) {
      onRestored();
      return;
    }
    const body = await res.json().catch(() => null);
    setError(body?.error ?? 'Restore failed.');
    setBusy(false);
    setConfirming(false);
  };

  return (
    <Card variant="flat" padding="sm">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className={`text-2xs font-mono uppercase ${ACTION_COLOR[revision.action]}`}>
          {ACTION_LABEL[revision.action]}
        </span>
        {showLabel ? (
          <span className="text-fg min-w-0 flex-1 truncate text-sm">
            {revision.label}
            <span className="text-fg-subtle"> · {revision.entityType}</span>
          </span>
        ) : (
          <span className="flex-1" />
        )}
        <span className="text-2xs text-fg-subtle font-mono">
          {new Date(revision.createdAt).toLocaleString()} · {revision.userEmail}
        </span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="text-2xs text-accent hover:underline"
        >
          {open ? 'Hide' : current ? 'Compare' : 'View'}
        </button>
        {confirming ? (
          <span className="inline-flex items-center gap-2">
            <span className="text-2xs text-fg-muted">Restore this version?</span>
            <button
              type="button"
              disabled={busy}
              onClick={restore}
              className="text-2xs text-accent font-medium hover:underline"
            >
              {busy ? 'Restoring…' : 'Confirm'}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="text-2xs text-fg-subtle hover:text-fg"
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="text-2xs text-fg-subtle hover:text-accent"
          >
            Restore
          </button>
        )}
      </div>

      {error ? <p className="text-signal-rose mt-2 text-xs">{error}</p> : null}

      {open ? (
        <div className="border-border-subtle mt-3 flex flex-col gap-4 border-t pt-3">
          {changes.length === 0 ? (
            <p className="text-fg-subtle text-xs">Identical to the current version.</p>
          ) : (
            changes.map((change) => (
              <div key={change.key}>
                <p className="text-fg mb-1.5 font-mono text-xs">{change.key}</p>
                <div className={current ? 'grid gap-2 sm:grid-cols-2' : ''}>
                  <ValueBlock label="This version" value={change.before} />
                  {current ? <ValueBlock label="Now" value={change.now} /> : null}
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}
    </Card>
  );
}

/**
 * One record's history, for the bottom of its edit page. `current` is the
 * record as the page loaded it, which is what "Compare" diffs against.
 * After a restore the page reloads, so the form above shows the restored
 * content rather than the stale draft it was holding.
 */
export function RevisionHistory({
  entityType,
  entityId,
  current,
}: {
  entityType: string;
  entityId: string;
  current?: Record<string, unknown>;
}) {
  const [items, setItems] = useState<Revision[] | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const query = new URLSearchParams({ entityType, entityId, page: String(page) });
    adminFetchJson<{ items: Revision[]; totalPages: number }>(`/api/admin/revisions?${query}`)
      .then((res) => {
        setItems(res.items);
        setTotalPages(res.totalPages);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load history.'));
  }, [entityType, entityId, page]);

  return (
    <section className="border-border-subtle mx-auto mt-16 max-w-2xl border-t pt-8">
      <Eyebrow>History</Eyebrow>
      <p className="text-fg-muted mt-2 text-sm">
        Every save keeps the version it replaced. Restoring one also keeps the current version, so a
        restore can be undone the same way.
      </p>

      <div className="mt-6 flex flex-col gap-2">
        {error ? (
          <p className="text-signal-rose text-sm">{error}</p>
        ) : items === null ? (
          <p className="text-fg-muted text-sm">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-fg-subtle text-sm">No earlier versions yet.</p>
        ) : (
          items.map((revision) => (
            <RevisionRow
              key={revision.id}
              revision={revision}
              current={current}
              onRestored={() => window.location.reload()}
            />
          ))
        )}
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center gap-3">
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
    </section>
  );
}

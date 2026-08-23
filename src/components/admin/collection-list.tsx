'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button, ArrowRight } from '@/components/ui/button';
import { Eyebrow } from '@/components/ui/eyebrow';
import { adminFetch, adminFetchJson } from '@/lib/admin-fetch';
import { SortableList, SortableRow } from './sortable-list';
import { DeleteButton } from './delete-button';

export interface CollectionItem {
  id: string;
}

/**
 * The list view every content collection shares: fetch, drag-to-reorder
 * (persisted via the collection's /reorder endpoint), edit link, delete
 * with confirmation. Per-collection differences are just `apiBase`, the
 * row renderer, and copy — the fetch/reorder/delete mechanics are identical
 * across all six collections, so they live here once.
 */
export function CollectionList<T extends CollectionItem>({
  apiBase,
  uiBase,
  title,
  description,
  newLabel,
  emptyLabel,
  renderRow,
  confirmLabelFor,
  showHeader = true,
}: {
  apiBase: string;
  /** UI route prefix, if it differs from `apiBase`'s /api/admin/* → /admin/* default (Skills' two collections share one nav section but live at different routes). */
  uiBase?: string;
  title: string;
  description: string;
  newLabel: string;
  emptyLabel: string;
  renderRow: (item: T) => React.ReactNode;
  confirmLabelFor: (item: T) => string;
  /** Set false to omit the title/description block when embedding multiple lists on one page (Skills). */
  showHeader?: boolean;
}) {
  const [items, setItems] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const base = uiBase ?? apiBase.replace('/api/admin', '/admin');

  useEffect(() => {
    adminFetchJson<{ items: T[] }>(apiBase)
      .then((res) => setItems(res.items))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load.'));
  }, [apiBase]);

  const reorder = async (newIds: string[]) => {
    if (!items) return;
    const byId = new Map(items.map((i) => [i.id, i]));
    setItems(newIds.map((id) => byId.get(id)!));
    await adminFetch(`${apiBase}/reorder`, {
      method: 'POST',
      body: JSON.stringify({ ids: newIds }),
    });
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        {showHeader ? (
          <div>
            <Eyebrow>{title}</Eyebrow>
            <p className="text-fg-muted mt-2 max-w-lg text-sm">{description}</p>
          </div>
        ) : (
          <p className="text-2xs text-fg-subtle font-mono tracking-widest uppercase">{title}</p>
        )}
        <Button href={`${base}/new`} size={showHeader ? 'md' : 'sm'} className="group">
          {newLabel}
          <ArrowRight />
        </Button>
      </div>

      {error ? <p className="text-signal-rose text-sm">{error}</p> : null}

      {items === null && !error ? (
        <p className="text-fg-muted text-sm">Loading…</p>
      ) : items && items.length === 0 ? (
        <Card variant="outline" padding="lg">
          <p className="text-fg-muted text-sm">{emptyLabel}</p>
        </Card>
      ) : items ? (
        <SortableList ids={items.map((i) => i.id)} onReorder={reorder}>
          {items.map((item) => (
            <SortableRow key={item.id} id={item.id}>
              <Card variant="flat" padding="sm" className="flex items-center justify-between gap-4">
                <Link href={`${base}/${item.id}`} className="min-w-0 flex-1">
                  {renderRow(item)}
                </Link>
                <DeleteButton
                  apiPath={`${apiBase}/${item.id}`}
                  confirmLabel={confirmLabelFor(item)}
                  onDeleted={() =>
                    setItems((prev) => prev?.filter((i) => i.id !== item.id) ?? null)
                  }
                />
              </Card>
            </SortableRow>
          ))}
        </SortableList>
      ) : null}
    </div>
  );
}

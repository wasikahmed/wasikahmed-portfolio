'use client';

import { cn } from '@/lib/cn';
import { adminFetchJson } from '@/lib/admin-fetch';
import type { Lead } from '@/lib/types';

const STATUSES: Lead['status'][] = ['new', 'read', 'replied', 'archived'];

/** Active-state color per status — new is urgent (amber), replied is a
 * completed/positive action (accent green), archived recedes (muted),
 * read is neutral. Reuses existing design tokens only. */
const STATUS_ACTIVE_CLASS: Record<Lead['status'], string> = {
  new: 'border-signal-amber/40 bg-[color-mix(in_oklab,var(--color-signal-amber)_16%,transparent)] text-signal-amber',
  read: 'border-border-strong bg-accent-whisper text-fg',
  replied: 'border-border-strong bg-accent-soft text-accent',
  archived: 'border-border-subtle bg-surface-3 text-fg-subtle',
};

/**
 * Segmented status control shared by the leads list (compact) and detail
 * page (full size). One click sets the status directly — no dropdown, no
 * confirmation. `onUpdate` receives the server's copy of the lead so both
 * call sites stay in sync with what actually persisted.
 */
export function LeadStatusControl({
  lead,
  onUpdate,
  size = 'md',
  className,
  stopPropagation = false,
}: {
  lead: Lead;
  onUpdate: (lead: Lead) => void;
  size?: 'sm' | 'md';
  className?: string;
  stopPropagation?: boolean;
}) {
  const setStatus = async (status: Lead['status'], event: React.MouseEvent) => {
    if (stopPropagation) event.stopPropagation();
    event.preventDefault();
    if (status === lead.status) return;
    const res = await adminFetchJson<{ item: Lead }>(`/api/admin/leads/${lead.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    onUpdate(res.item);
  };

  return (
    <div
      role="group"
      aria-label="Status"
      className={cn(
        'border-border-subtle inline-flex rounded-md border p-0.5',
        size === 'sm' ? 'gap-0.5' : 'gap-1',
        className,
      )}
    >
      {STATUSES.map((status) => {
        const active = status === lead.status;
        return (
          <button
            key={status}
            type="button"
            onClick={(e) => setStatus(status, e)}
            aria-pressed={active}
            className={cn(
              'duration-fast rounded-sm border font-mono uppercase transition-colors',
              size === 'sm' ? 'text-2xs px-2 py-1' : 'px-3 py-1.5 text-xs',
              active
                ? STATUS_ACTIVE_CLASS[status]
                : 'text-fg-subtle hover:text-fg hover:bg-surface-2 border-transparent',
            )}
          >
            {status}
          </button>
        );
      })}
    </div>
  );
}

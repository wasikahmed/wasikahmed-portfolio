'use client';

import { useState } from 'react';
import { adminFetch } from '@/lib/admin-fetch';

export function DeleteButton({
  apiPath,
  label = 'Delete',
  confirmLabel,
  onDeleted,
}: {
  apiPath: string;
  label?: string;
  confirmLabel: string;
  onDeleted: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-2xs text-fg-muted">Delete {confirmLabel}?</span>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const res = await adminFetch(apiPath, { method: 'DELETE' });
            if (res.ok) onDeleted();
            else setBusy(false);
          }}
          className="text-2xs text-signal-rose font-medium hover:underline"
        >
          {busy ? 'Deleting…' : 'Confirm'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-2xs text-fg-subtle hover:text-fg"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-2xs text-fg-subtle hover:text-signal-rose"
    >
      {label}
    </button>
  );
}

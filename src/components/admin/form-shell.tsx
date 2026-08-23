'use client';

import Link from 'next/link';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Button } from '@/components/ui/button';

export function FormShell({
  backHref,
  backLabel,
  title,
  error,
  saving,
  saveLabel = 'Save',
  onSubmit,
  deleteSlot,
  children,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  error: string | null;
  saving: boolean;
  saveLabel?: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  /** Rendered next to Save — a DeleteButton when editing an existing record. */
  deleteSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={backHref}
        className="text-2xs text-fg-muted duration-fast hover:text-accent inline-flex items-center gap-2 font-mono transition-colors"
      >
        <span aria-hidden>←</span> {backLabel}
      </Link>

      <Eyebrow className="mt-6">{title}</Eyebrow>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-6">
        {children}

        {error ? <p className="text-signal-rose text-sm">{error}</p> : null}

        <div className="border-border-subtle flex items-center justify-between border-t pt-6">
          {deleteSlot ?? <span />}
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : saveLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}

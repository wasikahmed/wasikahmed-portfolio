'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Card } from '@/components/ui/card';
import { Tag } from '@/components/ui/tag';
import { Button, ArrowRight } from '@/components/ui/button';
import { DeleteButton } from '@/components/admin/delete-button';
import { useSiteHost } from '@/components/admin/forms/short-link-form';
import { adminFetchJson } from '@/lib/admin-fetch';
import { shortLinkPath } from '@/lib/short-links';
import type { ShortLink } from '@/lib/types';

/**
 * Not CollectionList: links have no order to drag, and each row needs its
 * copy buttons and click count rather than a single edit link.
 */
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-2xs text-accent hover:underline"
    >
      {copied ? 'Copied' : label}
    </button>
  );
}

function LinkRow({
  link,
  host,
  onDeleted,
}: {
  link: ShortLink;
  host: string;
  onDeleted: () => void;
}) {
  const short = `${host}${shortLinkPath(link.slug)}`;
  return (
    <Card variant="flat" padding="sm" className="flex flex-wrap items-center justify-between gap-4">
      <Link href={`/admin/short-links/${link.id}`} className="min-w-0 flex-1">
        <p className="text-fg truncate font-mono text-sm">{short}</p>
        <p className="text-2xs text-fg-subtle mt-1 truncate">
          {link.label} · {link.source}/{link.medium} → {link.destination}
        </p>
      </Link>

      <div className="flex shrink-0 items-center gap-4">
        <div className="text-right">
          <Tag tone={link.clicks > 0 ? 'accent' : 'muted'}>
            {link.clicks} {link.clicks === 1 ? 'open' : 'opens'}
          </Tag>
          <p className="text-2xs text-fg-subtle mt-1 font-mono">
            {link.lastClickedAt ? new Date(link.lastClickedAt).toLocaleDateString() : 'never'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <CopyButton text={short} label="Copy" />
          <CopyButton text={`https://${short}`} label="Copy with https://" />
        </div>
        <DeleteButton
          apiPath={`/api/admin/short-links/${link.id}`}
          confirmLabel={shortLinkPath(link.slug)}
          onDeleted={onDeleted}
        />
      </div>
    </Card>
  );
}

export default function ShortLinksPage() {
  const host = useSiteHost();
  const [links, setLinks] = useState<ShortLink[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetchJson<{ items: ShortLink[] }>('/api/admin/short-links')
      .then((res) => setLinks(res.items))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load.'));
  }, []);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Short links</Eyebrow>
          <p className="text-fg-muted mt-2 max-w-lg text-sm">
            One short link per place you share the site — an application, a job board, a bio. Each
            redirects with UTM tags and counts its opens; a name you haven&apos;t saved yet still
            works and lands on the home page.
          </p>
        </div>
        <Button href="/admin/short-links/new" className="group">
          New short link
          <ArrowRight />
        </Button>
      </div>

      {error ? <p className="text-signal-rose text-sm">{error}</p> : null}

      {links === null && !error ? (
        <p className="text-fg-muted text-sm">Loading…</p>
      ) : links && links.length === 0 ? (
        <Card variant="outline" padding="lg">
          <p className="text-fg-muted text-sm">No short links yet.</p>
        </Card>
      ) : links ? (
        <div className="flex flex-col gap-2">
          {links.map((link) => (
            <LinkRow
              key={link.id}
              link={link}
              host={host}
              onDeleted={() => setLinks((prev) => prev?.filter((l) => l.id !== link.id) ?? null)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

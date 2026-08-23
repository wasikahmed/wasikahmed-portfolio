'use client';

import { useEffect, useState } from 'react';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { DeleteButton } from '@/components/admin/delete-button';
import { adminFetch, adminFetchJson } from '@/lib/admin-fetch';
import type { Media } from '@/lib/types';

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaPage() {
  const [items, setItems] = useState<Media[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState('');
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = () => {
    adminFetchJson<{ items: Media[] }>('/api/admin/media')
      .then((res) => setItems(res.items))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load.'));
  };

  useEffect(load, []);

  const onUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file || !alt.trim()) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('alt', alt);
      const res = await adminFetch('/api/admin/media', { method: 'POST', body: form });
      // adminFetch always sets Content-Type: application/json — override
      // for this one request so the browser sets its own multipart boundary.
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? 'Upload failed.');
      }
      setFile(null);
      setAlt('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Eyebrow>Media</Eyebrow>
      <p className="text-fg-muted mt-2 max-w-lg text-sm">
        Uploaded images, referenced by URL from project and post content.
      </p>

      <Card variant="raised" padding="md" className="mt-8 max-w-lg">
        <form onSubmit={onUpload} className="flex flex-col gap-4">
          <Field label="File" htmlFor="file" hint="JPEG, PNG, WebP, GIF, or SVG — up to 8MB.">
            <input
              id="file"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-fg-muted file:bg-surface-3 file:text-fg text-sm file:mr-3 file:rounded-sm file:border-0 file:px-3 file:py-1.5 file:text-sm"
            />
          </Field>
          <Field
            label="Alt text"
            htmlFor="alt"
            hint="Required — describes the image for screen readers."
          >
            <Input id="alt" required value={alt} onChange={(e) => setAlt(e.target.value)} />
          </Field>
          <Button type="submit" disabled={!file || !alt.trim() || uploading} className="self-start">
            {uploading ? 'Uploading…' : 'Upload'}
          </Button>
        </form>
      </Card>

      {error ? <p className="text-signal-rose mt-4 text-sm">{error}</p> : null}

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items === null && !error ? (
          <p className="text-fg-muted text-sm">Loading…</p>
        ) : items && items.length === 0 ? (
          <p className="text-fg-muted text-sm">No uploads yet.</p>
        ) : (
          items?.map((m) => (
            <Card key={m.id} variant="flat" padding="none" className="overflow-hidden">
              <div className="bg-surface-2 aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element -- variable, DB-driven set of local files; next/image adds no benefit for an admin-only thumbnail grid. */}
                <img src={m.url} alt={m.alt} className="h-full w-full object-cover" />
              </div>
              <div className="p-2.5">
                <p className="text-2xs text-fg-muted truncate" title={m.alt}>
                  {m.alt}
                </p>
                <p className="text-2xs text-fg-subtle mt-0.5">
                  {m.width && m.height ? `${m.width}×${m.height} · ` : ''}
                  {formatSize(m.size)}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(m.url);
                      setCopiedId(m.id);
                      setTimeout(() => setCopiedId(null), 1500);
                    }}
                    className="text-2xs text-accent hover:underline"
                  >
                    {copiedId === m.id ? 'Copied' : 'Copy URL'}
                  </button>
                  <DeleteButton
                    apiPath={`/api/admin/media/${m.id}`}
                    confirmLabel={m.alt}
                    onDeleted={() => setItems((prev) => prev?.filter((i) => i.id !== m.id) ?? null)}
                  />
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

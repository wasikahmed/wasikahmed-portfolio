'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { adminFetch, adminFetchJson } from '@/lib/admin-fetch';
import { cn } from '@/lib/cn';
import { figureSnippet } from '@/lib/mdx-image';
import type { Media } from '@/lib/types';

/**
 * Picks an image from the media library — or uploads a new one — and hands
 * back a `<Figure>` snippet for the MDX editor to insert. Same upload
 * route and alt-text rule as /admin/media; this only saves the trip to
 * that page and back to copy a URL.
 *
 * Portalled to `<body>`: the editor sits inside the record's `<form>`, and
 * a form can't contain another — nor should pressing Enter in the alt-text
 * box here submit the post. The portal takes the dialog out of the outer
 * form's DOM, and `stopPropagation` stops the upload's submit event
 * bubbling to it through the React tree (portals don't stop that).
 */
export function ImagePicker({
  onInsert,
  onClose,
}: {
  onInsert: (snippet: string) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [items, setItems] = useState<Media[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Media | null>(null);
  const [alt, setAlt] = useState('');
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadAlt, setUploadAlt] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    dialogRef.current?.showModal();
    adminFetchJson<{ items: Media[] }>('/api/admin/media')
      .then((res) => setItems(res.items))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load.'));
  }, []);

  const select = (media: Media) => {
    setSelected(media);
    setAlt(media.alt);
  };

  const onUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!file || !uploadAlt.trim()) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('alt', uploadAlt);
      const res = await adminFetch('/api/admin/media', { method: 'POST', body: form });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? 'Upload failed.');
      const created = body.item as Media;
      setItems((prev) => [created, ...(prev ?? [])]);
      select(created);
      setFile(null);
      setUploadAlt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const insert = () => {
    if (!selected || !alt.trim()) return;
    onInsert(
      figureSnippet({
        url: selected.url,
        alt,
        caption,
        width: selected.width,
        height: selected.height,
      }),
    );
    dialogRef.current?.close();
  };

  return createPortal(
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-label="Insert image"
      className="border-border bg-surface-2 text-fg shadow-e4 backdrop:bg-bg/80 m-auto w-[calc(100%-2rem)] max-w-3xl rounded-lg border p-0 backdrop:backdrop-blur-sm"
    >
      <div className="flex max-h-[85vh] flex-col">
        <div className="border-border-subtle flex items-center justify-between border-b px-5 py-4">
          <p className="text-2xs text-fg-muted font-mono tracking-widest uppercase">Insert image</p>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="text-2xs text-fg-subtle hover:text-fg font-mono"
          >
            Close
          </button>
        </div>

        <div className="flex flex-col gap-6 overflow-y-auto p-5">
          <form onSubmit={onUpload} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Field label="Upload new" htmlFor="picker-file" className="sm:flex-1">
              <input
                id="picker-file"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="text-fg-muted file:bg-surface-3 file:text-fg text-sm file:mr-3 file:rounded-sm file:border-0 file:px-3 file:py-1.5 file:text-sm"
              />
            </Field>
            <Field label="Alt text" htmlFor="picker-upload-alt" className="sm:flex-1">
              <Input
                id="picker-upload-alt"
                value={uploadAlt}
                onChange={(e) => setUploadAlt(e.target.value)}
              />
            </Field>
            <Button
              type="submit"
              variant="subtle"
              size="sm"
              disabled={!file || !uploadAlt.trim() || uploading}
            >
              {uploading ? 'Uploading…' : 'Upload'}
            </Button>
          </form>

          {error ? <p className="text-signal-rose text-sm">{error}</p> : null}

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {items === null && !error ? (
              <p className="text-fg-muted col-span-full text-sm">Loading…</p>
            ) : items && items.length === 0 ? (
              <p className="text-fg-muted col-span-full text-sm">No uploads yet — add one above.</p>
            ) : (
              items?.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => select(m)}
                  aria-pressed={selected?.id === m.id}
                  title={m.alt}
                  className={cn(
                    'bg-surface-1 duration-fast aspect-square overflow-hidden rounded-md border transition-colors',
                    selected?.id === m.id
                      ? 'border-accent'
                      : 'border-border-subtle hover:border-border-strong',
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin-only thumbnail grid, same as /admin/media. */}
                  <img src={m.url} alt={m.alt} className="h-full w-full object-cover" />
                </button>
              ))
            )}
          </div>
        </div>

        {selected ? (
          <div className="border-border-subtle flex flex-col gap-3 border-t p-5 sm:flex-row sm:items-end">
            <Field label="Alt text" htmlFor="picker-alt" className="sm:flex-1">
              <Input id="picker-alt" value={alt} onChange={(e) => setAlt(e.target.value)} />
            </Field>
            <Field label="Caption (optional)" htmlFor="picker-caption" className="sm:flex-1">
              <Input
                id="picker-caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </Field>
            <Button type="button" size="sm" onClick={insert} disabled={!alt.trim()}>
              Insert
            </Button>
          </div>
        ) : null}
      </div>
    </dialog>,
    document.body,
  );
}

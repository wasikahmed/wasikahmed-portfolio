'use client';

import { useEffect, useState } from 'react';
import { Eyebrow, StatusDot } from '@/components/ui/eyebrow';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { DeleteButton } from '@/components/admin/delete-button';
import { adminFetch, adminFetchJson } from '@/lib/admin-fetch';
import type { ResumeVersion } from '@/lib/types';

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Opens one stored version in a new tab. Fetched rather than linked: every
 * /api/admin route checks the CSRF header, which a plain link can't send,
 * so the PDF comes back as a blob and opens from a local object URL.
 */
async function openVersion(id: string) {
  const tab = window.open('', '_blank');
  const res = await adminFetch(`/api/admin/resumes/${id}/file`);
  if (!res.ok) {
    tab?.close();
    return;
  }
  const url = URL.createObjectURL(await res.blob());
  if (tab) tab.location.href = url;
  else window.location.href = url;
  // Long enough for the tab to load it; the URL is useless after that.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function VersionRow({ version, onChange }: { version: ResumeVersion; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(version.label);
  const [notes, setNotes] = useState(version.notes ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patch = async (body: Record<string, unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await adminFetchJson(`/api/admin/resumes/${version.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      setEditing(false);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card variant={version.isCurrent ? 'raised' : 'flat'} padding="sm">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div className="min-w-0 flex-1">
          <p className="text-fg flex items-center gap-2 text-sm font-medium">
            {version.isCurrent ? <StatusDot /> : null}
            {version.label}
            {version.isCurrent ? (
              <span className="text-2xs text-accent font-mono uppercase">Live</span>
            ) : null}
          </p>
          <p className="text-2xs text-fg-subtle mt-1 font-mono">
            {new Date(version.createdAt).toLocaleString()} · {formatSize(version.size)} ·{' '}
            {version.fileName}
          </p>
          {version.notes && !editing ? (
            <p className="text-fg-muted mt-2 text-sm whitespace-pre-line">{version.notes}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => void openVersion(version.id)}
            className="text-2xs text-accent hover:underline"
          >
            Open
          </button>
          <button
            type="button"
            onClick={() => setEditing((e) => !e)}
            className="text-2xs text-fg-subtle hover:text-fg"
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
          {version.isCurrent ? null : (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => void patch({ isCurrent: true })}
                className="text-2xs text-fg-subtle hover:text-accent"
              >
                Make live
              </button>
              <DeleteButton
                apiPath={`/api/admin/resumes/${version.id}`}
                confirmLabel={version.label}
                onDeleted={onChange}
              />
            </>
          )}
        </div>
      </div>

      {editing ? (
        <form
          className="border-border-subtle mt-3 flex flex-col gap-3 border-t pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            void patch({ label, notes });
          }}
        >
          <Input required value={label} onChange={(e) => setLabel(e.target.value)} />
          <Textarea
            rows={3}
            className="min-h-0"
            placeholder="What changed in this version"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button type="submit" size="sm" disabled={busy} className="self-start">
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </form>
      ) : null}

      {error ? <p className="text-signal-rose mt-2 text-xs">{error}</p> : null}
    </Card>
  );
}

export default function ResumePage() {
  const [items, setItems] = useState<ResumeVersion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [makeCurrent, setMakeCurrent] = useState(true);
  const [uploading, setUploading] = useState(false);
  // Bumped after each upload so the file input (uncontrolled) clears.
  const [formKey, setFormKey] = useState(0);

  const load = () => {
    adminFetchJson<{ items: ResumeVersion[] }>('/api/admin/resumes')
      .then((res) => setItems(res.items))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load.'));
  };

  useEffect(load, []);

  const onUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file || !label.trim()) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('label', label);
      if (notes.trim()) form.append('notes', notes);
      form.append('makeCurrent', String(makeCurrent));
      const res = await adminFetch('/api/admin/resumes', { method: 'POST', body: form });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? 'Upload failed.');
      }
      setFile(null);
      setLabel('');
      setNotes('');
      setMakeCurrent(true);
      setFormKey((k) => k + 1);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const live = items?.find((v) => v.isCurrent);

  return (
    <div className="mx-auto max-w-2xl">
      <Eyebrow>Résumé</Eyebrow>
      <p className="text-fg-muted mt-2 max-w-lg text-sm">
        Every version you upload is kept here, private to the admin. The one marked live is what{' '}
        <a href="/resume" target="_blank" rel="noreferrer" className="text-accent hover:underline">
          /resume
        </a>{' '}
        serves — links already sent out always get the latest.
      </p>

      {items && !live ? (
        <p className="text-signal-amber mt-4 text-sm">
          No version is live yet — /resume is still serving the file bundled with the site.
        </p>
      ) : null}

      <Card variant="raised" padding="md" className="mt-8">
        <form key={formKey} onSubmit={onUpload} className="flex flex-col gap-4">
          <Field label="PDF" htmlFor="resume-file" hint="PDF only, up to 5MB.">
            <input
              id="resume-file"
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-fg-muted file:bg-surface-3 file:text-fg text-sm file:mr-3 file:rounded-sm file:border-0 file:px-3 file:py-1.5 file:text-sm"
            />
          </Field>
          <Field
            label="Label"
            htmlFor="resume-label"
            hint="How you'll recognise it later, e.g. “Oct 2026 — myMedPal added”."
          >
            <Input
              id="resume-label"
              required
              maxLength={120}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </Field>
          <Field label="What changed" htmlFor="resume-notes" hint="Optional.">
            <Textarea
              id="resume-notes"
              rows={3}
              className="min-h-0"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
          <label className="text-fg flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={makeCurrent}
              onChange={(e) => setMakeCurrent(e.target.checked)}
              className="border-border bg-surface-1 accent-accent h-4 w-4 rounded-xs"
            />
            Make this the live version
          </label>
          <Button
            type="submit"
            disabled={!file || !label.trim() || uploading}
            className="self-start"
          >
            {uploading ? 'Uploading…' : 'Upload'}
          </Button>
        </form>
      </Card>

      {error ? <p className="text-signal-rose mt-4 text-sm">{error}</p> : null}

      <div className="mt-10 flex flex-col gap-2">
        {items === null && !error ? (
          <p className="text-fg-muted text-sm">Loading…</p>
        ) : items && items.length === 0 ? (
          <p className="text-fg-subtle text-sm">No versions uploaded yet.</p>
        ) : (
          items?.map((version) => (
            <VersionRow
              key={`${version.id}-${version.isCurrent}-${version.label}`}
              version={version}
              onChange={load}
            />
          ))
        )}
      </div>
    </div>
  );
}

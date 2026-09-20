'use client';

import { useEffect, useState } from 'react';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { ObjectArrayEditor } from '@/components/admin/object-array-editor';
import { adminFetchJson } from '@/lib/admin-fetch';
import type { Settings } from '@/lib/types';

export default function SettingsPage() {
  const [draft, setDraft] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminFetchJson<{ item: Settings }>('/api/admin/settings').then((res) => setDraft(res.item));
  }, []);

  if (!draft) return <p className="text-fg-muted text-sm">Loading…</p>;

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const payload = { ...draft, portrait: draft.portrait?.url ? draft.portrait : undefined };
      const res = await adminFetchJson<{ item: Settings }>('/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setDraft(res.item);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Eyebrow>Settings</Eyebrow>
      <p className="text-fg-muted mt-2 max-w-lg text-sm">
        Site-wide facts — the hero, footer, and contact page all read from this record.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" htmlFor="name">
            <Input
              id="name"
              required
              value={draft.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </Field>
          <Field label="Initials" htmlFor="initials">
            <Input
              id="initials"
              required
              maxLength={4}
              value={draft.initials}
              onChange={(e) => set('initials', e.target.value.toUpperCase())}
            />
          </Field>
          <Field label="Role" htmlFor="role">
            <Input
              id="role"
              required
              value={draft.role}
              onChange={(e) => set('role', e.target.value)}
            />
          </Field>
          <Field label="Discipline" htmlFor="discipline">
            <Input
              id="discipline"
              required
              value={draft.discipline}
              onChange={(e) => set('discipline', e.target.value)}
            />
          </Field>
        </div>

        <Field label="Tagline" htmlFor="tagline" hint="The hero headline.">
          <Input
            id="tagline"
            required
            value={draft.tagline}
            onChange={(e) => set('tagline', e.target.value)}
          />
        </Field>

        <Field label="Proof line" htmlFor="proof" hint="The concrete sentence under the headline.">
          <Textarea
            id="proof"
            required
            rows={2}
            value={draft.proof}
            onChange={(e) => set('proof', e.target.value)}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              required
              value={draft.email}
              onChange={(e) => set('email', e.target.value)}
            />
          </Field>
          <Field label="Location" htmlFor="location">
            <Input
              id="location"
              required
              value={draft.location}
              onChange={(e) => set('location', e.target.value)}
            />
          </Field>
          <Field label="Timezone" htmlFor="timezone">
            <Input
              id="timezone"
              required
              value={draft.timezone}
              onChange={(e) => set('timezone', e.target.value)}
            />
          </Field>
          <Field label="Response time" htmlFor="responseTime">
            <Input
              id="responseTime"
              required
              value={draft.responseTime}
              onChange={(e) => set('responseTime', e.target.value)}
            />
          </Field>
        </div>

        <div className="border-border-subtle flex flex-col gap-3 rounded-md border p-4">
          <label className="text-fg flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.available}
              onChange={(e) => set('available', e.target.checked)}
              className="border-border bg-surface-1 accent-accent h-4 w-4 rounded-xs"
            />
            Available for work
          </label>
          <Field label="Availability text" htmlFor="availableFor">
            <Input
              id="availableFor"
              required
              value={draft.availableFor}
              onChange={(e) => set('availableFor', e.target.value)}
            />
          </Field>
        </div>

        <Field
          label="Portrait"
          htmlFor="portrait-url"
          hint="Optional. Paste a URL copied from the media library — shown on /about."
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              id="portrait-url"
              placeholder="https://…"
              value={draft.portrait?.url ?? ''}
              onChange={(e) =>
                set('portrait', { url: e.target.value, alt: draft.portrait?.alt ?? '' })
              }
            />
            <Input
              placeholder="Alt text"
              value={draft.portrait?.alt ?? ''}
              onChange={(e) =>
                set('portrait', { url: draft.portrait?.url ?? '', alt: e.target.value })
              }
            />
          </div>
        </Field>

        <Field label="Social links" htmlFor="socials">
          <ObjectArrayEditor
            value={draft.socials}
            onChange={(socials) => set('socials', socials)}
            fields={[
              { key: 'label', label: 'Label', required: true },
              { key: 'href', label: 'URL', required: true },
            ]}
            empty={{ label: '', href: '' }}
            addLabel="Add link"
          />
        </Field>

        {error ? <p className="text-signal-rose text-sm">{error}</p> : null}

        <div className="border-border-subtle flex items-center gap-4 border-t pt-6">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          {saved ? <span className="text-2xs text-accent">Saved.</span> : null}
        </div>
      </form>
    </div>
  );
}

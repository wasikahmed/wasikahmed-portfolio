'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Input, Textarea, Select } from '@/components/ui/field';
import { StringList } from '@/components/admin/string-list';
import { DeleteButton } from '@/components/admin/delete-button';
import { FormShell } from '@/components/admin/form-shell';
import { adminFetchJson } from '@/lib/admin-fetch';
import type { Role } from '@/lib/types';

type Draft = Omit<Role, 'id' | 'order'>;

const EMPTY: Draft = {
  title: '',
  company: '',
  period: '',
  type: 'Full-time',
  kind: 'work',
  shipped: [''],
};

export function RoleForm({ role }: { role?: Role }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(role ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { ...draft, shipped: draft.shipped.filter((s) => s.trim()) };
      if (role) {
        await adminFetchJson(`/api/admin/experience/${role.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await adminFetchJson('/api/admin/experience', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      router.push('/admin/experience');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
      setSaving(false);
    }
  };

  return (
    <FormShell
      backHref="/admin/experience"
      backLabel="All experience"
      title={role ? 'Edit role' : 'New role'}
      error={error}
      saving={saving}
      onSubmit={onSubmit}
      deleteSlot={
        role ? (
          <DeleteButton
            apiPath={`/api/admin/experience/${role.id}`}
            confirmLabel={role.title}
            onDeleted={() => router.push('/admin/experience')}
          />
        ) : undefined
      }
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Title" htmlFor="title">
          <Input
            id="title"
            required
            value={draft.title}
            onChange={(e) => set('title', e.target.value)}
          />
        </Field>
        <Field label="Company" htmlFor="company">
          <Input
            id="company"
            required
            value={draft.company}
            onChange={(e) => set('company', e.target.value)}
          />
        </Field>
        <Field label="Period" htmlFor="period" hint="e.g. 2022 — Present">
          <Input
            id="period"
            required
            value={draft.period}
            onChange={(e) => set('period', e.target.value)}
          />
        </Field>
        <Field label="Type" htmlFor="type" hint="e.g. Full-time, Ongoing">
          <Input
            id="type"
            required
            value={draft.type}
            onChange={(e) => set('type', e.target.value)}
          />
        </Field>
      </div>
      <Field
        label="Kind"
        htmlFor="kind"
        hint="Education is kept off the home page's Experience list and shown only in /about's timeline."
      >
        <Select
          id="kind"
          value={draft.kind ?? 'work'}
          onChange={(e) => set('kind', e.target.value as Role['kind'])}
        >
          <option value="work">Work</option>
          <option value="education">Education</option>
        </Select>
      </Field>
      <Field
        label="Summary"
        htmlFor="summary"
        hint="The home page line. Short fragments separated by · — keep it to one line, lead with a number, and do not restate the job title printed above it."
      >
        <Textarea
          id="summary"
          rows={2}
          value={draft.summary ?? ''}
          onChange={(e) => set('summary', e.target.value)}
        />
      </Field>
      <Field
        label="Logo"
        htmlFor="logo"
        hint="Optional. Paste a URL copied from the media library. A square image, shown in its own colours filling a small tile — leave some padding around the mark in the file itself. Leave empty to show no logo."
      >
        <Input
          id="logo"
          placeholder="https://…"
          value={draft.logo ?? ''}
          onChange={(e) => set('logo', e.target.value.trim())}
        />
      </Field>
      <Field
        label="Website"
        htmlFor="website"
        hint="Optional. The company's site — linked from the company name on the home page and /about. Leave empty if the site is down; a dead link reads worse than none."
      >
        <Input
          id="website"
          type="url"
          placeholder="https://…"
          value={draft.website ?? ''}
          onChange={(e) => set('website', e.target.value.trim())}
        />
      </Field>
      <Field label="What I shipped" htmlFor="shipped">
        <StringList value={draft.shipped} onChange={(v) => set('shipped', v)} />
      </Field>
    </FormShell>
  );
}

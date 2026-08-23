'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Input } from '@/components/ui/field';
import { StringList } from '@/components/admin/string-list';
import { DeleteButton } from '@/components/admin/delete-button';
import { FormShell } from '@/components/admin/form-shell';
import { adminFetchJson } from '@/lib/admin-fetch';
import type { Role } from '@/lib/types';

type Draft = Omit<Role, 'id' | 'order'>;

const EMPTY: Draft = { title: '', company: '', period: '', type: 'Full-time', shipped: [''] };

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
      <Field label="What I shipped" htmlFor="shipped">
        <StringList value={draft.shipped} onChange={(v) => set('shipped', v)} />
      </Field>
    </FormShell>
  );
}

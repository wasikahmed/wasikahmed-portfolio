'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Input } from '@/components/ui/field';
import { TagInput } from '@/components/admin/tag-input';
import { DeleteButton } from '@/components/admin/delete-button';
import { FormShell } from '@/components/admin/form-shell';
import { adminFetchJson } from '@/lib/admin-fetch';
import type { SkillGroup } from '@/lib/types';

type Draft = Omit<SkillGroup, 'id' | 'order'>;

const EMPTY: Draft = { category: '', items: [] };

export function SkillGroupForm({ group }: { group?: SkillGroup }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(group ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (group) {
        await adminFetchJson(`/api/admin/skill-groups/${group.id}`, {
          method: 'PATCH',
          body: JSON.stringify(draft),
        });
      } else {
        await adminFetchJson('/api/admin/skill-groups', {
          method: 'POST',
          body: JSON.stringify(draft),
        });
      }
      router.push('/admin/skills');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
      setSaving(false);
    }
  };

  return (
    <FormShell
      backHref="/admin/skills"
      backLabel="Skills"
      title={group ? 'Edit skill group' : 'New skill group'}
      error={error}
      saving={saving}
      onSubmit={onSubmit}
      deleteSlot={
        group ? (
          <DeleteButton
            apiPath={`/api/admin/skill-groups/${group.id}`}
            confirmLabel={group.category}
            onDeleted={() => router.push('/admin/skills')}
          />
        ) : undefined
      }
    >
      <Field label="Category" htmlFor="category" hint="e.g. Frontend, Infrastructure">
        <Input
          id="category"
          required
          value={draft.category}
          onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
        />
      </Field>
      <Field label="Items" htmlFor="items">
        <TagInput
          value={draft.items}
          onChange={(items) => setDraft((d) => ({ ...d, items }))}
          placeholder="e.g. React"
        />
      </Field>
    </FormShell>
  );
}

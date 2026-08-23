'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Input, Select } from '@/components/ui/field';
import { DeleteButton } from '@/components/admin/delete-button';
import { FormShell } from '@/components/admin/form-shell';
import { adminFetchJson } from '@/lib/admin-fetch';
import type { Tech, Project } from '@/lib/types';

type Draft = Omit<Tech, 'id' | 'order'>;

const EMPTY: Draft = { name: '', group: 'Language', projects: [] };
const GROUPS: Tech['group'][] = ['Language', 'Framework', 'Data', 'Infra', 'AI'];

export function TechForm({ tech }: { tech?: Tech }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(tech ?? EMPTY);
  const [projects, setProjects] = useState<Project[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetchJson<{ items: Project[] }>('/api/admin/projects')
      .then((res) => setProjects(res.items))
      .catch(() => {});
  }, []);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const toggleProject = (slug: string) => {
    set(
      'projects',
      draft.projects.includes(slug)
        ? draft.projects.filter((p) => p !== slug)
        : [...draft.projects, slug],
    );
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (tech) {
        await adminFetchJson(`/api/admin/tech/${tech.id}`, {
          method: 'PATCH',
          body: JSON.stringify(draft),
        });
      } else {
        await adminFetchJson('/api/admin/tech', { method: 'POST', body: JSON.stringify(draft) });
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
      title={tech ? 'Edit tech item' : 'New tech item'}
      error={error}
      saving={saving}
      onSubmit={onSubmit}
      deleteSlot={
        tech ? (
          <DeleteButton
            apiPath={`/api/admin/tech/${tech.id}`}
            confirmLabel={tech.name}
            onDeleted={() => router.push('/admin/skills')}
          />
        ) : undefined
      }
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" htmlFor="name">
          <Input
            id="name"
            required
            value={draft.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </Field>
        <Field label="Group" htmlFor="group">
          <Select
            id="group"
            value={draft.group}
            onChange={(e) => set('group', e.target.value as Tech['group'])}
          >
            {GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field
        label="Used on"
        htmlFor="projects"
        hint="Powers the constellation's project count and /work?tech= filter."
      >
        <div className="border-border-subtle flex flex-col gap-2 rounded-md border p-3">
          {projects.length === 0 ? (
            <p className="text-2xs text-fg-subtle">No projects yet.</p>
          ) : (
            projects.map((p) => (
              <label key={p.slug} className="text-fg flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.projects.includes(p.slug)}
                  onChange={() => toggleProject(p.slug)}
                  className="border-border bg-surface-1 accent-accent h-4 w-4 rounded-xs"
                />
                {p.title}
              </label>
            ))
          )}
        </div>
      </Field>
    </FormShell>
  );
}

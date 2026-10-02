'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Input } from '@/components/ui/field';
import { TagInput } from '@/components/admin/tag-input';
import { ObjectArrayEditor } from '@/components/admin/object-array-editor';
import { SectionsEditor } from '@/components/admin/forms/sections-editor';
import { PublishFields } from '@/components/admin/forms/publish-fields';
import { DeleteButton } from '@/components/admin/delete-button';
import { FormShell } from '@/components/admin/form-shell';
import { adminFetchJson } from '@/lib/admin-fetch';
import type { Project, Category } from '@/lib/types';

type Draft = Omit<Project, 'id' | 'order'>;

const ALL_CATEGORIES: Category[] = ['AI', 'Automation', 'Systems', 'Web'];

const EMPTY: Draft = {
  slug: '',
  title: '',
  tagline: '',
  categories: [],
  problem: '',
  headline: { value: '', label: '', baseline: '' },
  metrics: [],
  stack: [],
  role: '',
  timeline: '',
  year: new Date().getFullYear(),
  accent: 'var(--color-accent)',
  architecture: [],
  sections: [{ id: 'problem', title: 'The problem', bodyMdx: '' }],
  status: 'draft',
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function ProjectForm({ project }: { project?: Project }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(project ?? EMPTY);
  const [slugTouched, setSlugTouched] = useState(Boolean(project));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const toggleCategory = (c: Category) => {
    set(
      'categories',
      draft.categories.includes(c)
        ? draft.categories.filter((x) => x !== c)
        : [...draft.categories, c],
    );
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...draft,
        metrics: draft.metrics.length ? draft.metrics : [draft.headline],
        links: draft.links?.length ? draft.links : undefined,
        cover: draft.cover?.url ? draft.cover : undefined,
      };
      if (project) {
        await adminFetchJson(`/api/admin/projects/${project.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await adminFetchJson('/api/admin/projects', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      router.push('/admin/projects');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
      setSaving(false);
    }
  };

  return (
    <FormShell
      backHref="/admin/projects"
      backLabel="All projects"
      title={project ? 'Edit project' : 'New project'}
      error={error}
      saving={saving}
      onSubmit={onSubmit}
      deleteSlot={
        project ? (
          <DeleteButton
            apiPath={`/api/admin/projects/${project.id}`}
            confirmLabel={project.title}
            onDeleted={() => router.push('/admin/projects')}
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
            onChange={(e) => {
              set('title', e.target.value);
              if (!slugTouched) set('slug', slugify(e.target.value));
            }}
          />
        </Field>
        <Field label="Slug" htmlFor="slug" hint="Used in the URL — /work/[slug]">
          <Input
            id="slug"
            required
            pattern="[a-z0-9\-]+"
            value={draft.slug}
            onChange={(e) => {
              setSlugTouched(true);
              set('slug', e.target.value);
            }}
          />
        </Field>
      </div>

      <Field label="Tagline" htmlFor="tagline">
        <Input
          id="tagline"
          required
          value={draft.tagline}
          onChange={(e) => set('tagline', e.target.value)}
        />
      </Field>

      <Field
        label="Cover image"
        htmlFor="cover-url"
        hint="Optional. Paste a URL copied from the media library — shown on the card and the case study hero."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            id="cover-url"
            placeholder="https://…"
            value={draft.cover?.url ?? ''}
            onChange={(e) => set('cover', { url: e.target.value, alt: draft.cover?.alt ?? '' })}
          />
          <Input
            placeholder="Alt text"
            value={draft.cover?.alt ?? ''}
            onChange={(e) => set('cover', { url: draft.cover?.url ?? '', alt: e.target.value })}
          />
        </div>
      </Field>

      <Field
        label="Problem"
        htmlFor="problem"
        hint="One sentence. Shown on the card, revealed on hover."
      >
        <Input
          id="problem"
          required
          value={draft.problem}
          onChange={(e) => set('problem', e.target.value)}
        />
      </Field>

      <div>
        <span className="text-2xs text-fg-muted mb-2 block font-mono tracking-wide uppercase">
          Categories
        </span>
        <div className="flex flex-wrap gap-3">
          {ALL_CATEGORIES.map((c) => (
            <label key={c} className="text-fg flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.categories.includes(c)}
                onChange={() => toggleCategory(c)}
                className="border-border bg-surface-1 accent-accent h-4 w-4 rounded-xs"
              />
              {c}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Role" htmlFor="role">
          <Input
            id="role"
            required
            value={draft.role}
            onChange={(e) => set('role', e.target.value)}
          />
        </Field>
        <Field label="Timeline" htmlFor="timeline" hint="e.g. Q3 2023 — Q1 2024">
          <Input
            id="timeline"
            required
            value={draft.timeline}
            onChange={(e) => set('timeline', e.target.value)}
          />
        </Field>
        <Field label="Year" htmlFor="year">
          <Input
            id="year"
            type="number"
            required
            value={draft.year}
            onChange={(e) => set('year', Number(e.target.value))}
          />
        </Field>
      </div>

      <Field label="Stack" htmlFor="stack">
        <TagInput value={draft.stack} onChange={(stack) => set('stack', stack)} />
      </Field>

      <Field
        label="Headline metric"
        htmlFor="headline"
        hint="Shown on the card and as the case study's shared-transition metric."
      >
        <div className="grid gap-2 sm:grid-cols-3">
          <Input
            placeholder="Value — e.g. 92%"
            required
            value={draft.headline.value}
            onChange={(e) => set('headline', { ...draft.headline, value: e.target.value })}
          />
          <Input
            placeholder="Label — e.g. faster processing"
            required
            value={draft.headline.label}
            onChange={(e) => set('headline', { ...draft.headline, label: e.target.value })}
          />
          <Input
            placeholder="Baseline — e.g. 3.1 hrs → 14 min"
            value={draft.headline.baseline ?? ''}
            onChange={(e) => set('headline', { ...draft.headline, baseline: e.target.value })}
          />
        </div>
      </Field>

      <Field
        label="Supporting metrics"
        htmlFor="metrics"
        hint="Shown in the case study's pinned metric bar. Leave empty to use just the headline metric."
      >
        <ObjectArrayEditor
          value={draft.metrics}
          onChange={(metrics) => set('metrics', metrics)}
          fields={[
            { key: 'value', label: 'Value', required: true },
            { key: 'label', label: 'Label', required: true },
            { key: 'baseline', label: 'Baseline (optional)' },
          ]}
          empty={{ value: '', label: '', baseline: '' }}
          addLabel="Add metric"
        />
      </Field>

      <Field
        label="Architecture diagram"
        htmlFor="architecture"
        hint="Stages of the self-drawing diagram, in execution order."
      >
        <ObjectArrayEditor
          value={draft.architecture}
          onChange={(architecture) => set('architecture', architecture)}
          fields={[
            { key: 'id', label: 'Id', required: true },
            { key: 'label', label: 'Label', required: true },
            { key: 'detail', label: 'Detail', required: true },
          ]}
          empty={{ id: '', label: '', detail: '' }}
          addLabel="Add stage"
        />
      </Field>

      <Field label="External links" htmlFor="links" hint="Optional — live demo, repo, etc.">
        <ObjectArrayEditor
          value={draft.links ?? []}
          onChange={(links) => set('links', links)}
          fields={[
            { key: 'label', label: 'Label', required: true },
            { key: 'href', label: 'https://…', required: true },
          ]}
          empty={{ label: '', href: '' }}
          addLabel="Add link"
        />
      </Field>

      <div>
        <span className="text-2xs text-fg-muted mb-2 block font-mono tracking-wide uppercase">
          Case study
        </span>
        <SectionsEditor value={draft.sections} onChange={(sections) => set('sections', sections)} />
      </div>

      <PublishFields
        status={draft.status}
        publishedAt={draft.publishedAt}
        seo={draft.seo}
        onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
      />
    </FormShell>
  );
}

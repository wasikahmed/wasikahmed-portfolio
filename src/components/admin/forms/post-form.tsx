'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Input, Select } from '@/components/ui/field';
import { TagInput } from '@/components/admin/tag-input';
import { MdxEditor } from '@/components/admin/mdx-editor';
import { PublishFields } from '@/components/admin/forms/publish-fields';
import { DeleteButton } from '@/components/admin/delete-button';
import { FormShell } from '@/components/admin/form-shell';
import { adminFetchJson } from '@/lib/admin-fetch';
import type { Post } from '@/lib/types';

type Draft = Omit<Post, 'id' | 'order'>;

const EMPTY: Draft = {
  slug: '',
  kind: 'article',
  title: '',
  excerpt: '',
  date: new Date().toISOString().slice(0, 10),
  readTime: '5 min',
  tags: [],
  bodyMdx: '',
  status: 'draft',
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function PostForm({ post }: { post?: Post }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(post ?? EMPTY);
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (post) {
        await adminFetchJson(`/api/admin/posts/${post.id}`, {
          method: 'PATCH',
          body: JSON.stringify(draft),
        });
      } else {
        await adminFetchJson('/api/admin/posts', { method: 'POST', body: JSON.stringify(draft) });
      }
      router.push('/admin/posts');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
      setSaving(false);
    }
  };

  return (
    <FormShell
      backHref="/admin/posts"
      backLabel="All writing"
      title={post ? 'Edit post' : 'New post'}
      error={error}
      saving={saving}
      onSubmit={onSubmit}
      deleteSlot={
        post ? (
          <DeleteButton
            apiPath={`/api/admin/posts/${post.id}`}
            confirmLabel={post.title}
            onDeleted={() => router.push('/admin/posts')}
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
        <Field label="Slug" htmlFor="slug" hint="Used in the URL — /writing/[slug]">
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

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Kind" htmlFor="kind">
          <Select
            id="kind"
            value={draft.kind}
            onChange={(e) => set('kind', e.target.value as Post['kind'])}
          >
            <option value="article">Article</option>
            <option value="til">TIL</option>
          </Select>
        </Field>
        <Field label="Date" htmlFor="date">
          <Input
            id="date"
            type="date"
            required
            value={draft.date}
            onChange={(e) => set('date', e.target.value)}
          />
        </Field>
        <Field label="Read time" htmlFor="readTime" hint="e.g. 5 min">
          <Input
            id="readTime"
            required
            value={draft.readTime}
            onChange={(e) => set('readTime', e.target.value)}
          />
        </Field>
      </div>

      <Field label="Excerpt" htmlFor="excerpt">
        <Input
          id="excerpt"
          required
          value={draft.excerpt}
          onChange={(e) => set('excerpt', e.target.value)}
        />
      </Field>

      <Field label="Tags" htmlFor="tags">
        <TagInput value={draft.tags} onChange={(tags) => set('tags', tags)} />
      </Field>

      <MdxEditor label="Body" value={draft.bodyMdx} onChange={(v) => set('bodyMdx', v)} />

      <PublishFields
        status={draft.status}
        publishedAt={draft.publishedAt}
        seo={draft.seo}
        onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
      />
    </FormShell>
  );
}

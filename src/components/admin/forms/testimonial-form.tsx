'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Input, Textarea } from '@/components/ui/field';
import { DeleteButton } from '@/components/admin/delete-button';
import { FormShell } from '@/components/admin/form-shell';
import { adminFetchJson } from '@/lib/admin-fetch';
import type { Testimonial } from '@/lib/types';

type Draft = Omit<Testimonial, 'id' | 'order'>;

const EMPTY: Draft = {
  quote: '',
  name: '',
  title: '',
  company: '',
  initials: '',
  projectSlug: '',
  featured: true,
};

export function TestimonialForm({ testimonial }: { testimonial?: Testimonial }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(testimonial ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { ...draft, projectSlug: draft.projectSlug || undefined };
      if (testimonial) {
        await adminFetchJson(`/api/admin/testimonials/${testimonial.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await adminFetchJson('/api/admin/testimonials', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      router.push('/admin/testimonials');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
      setSaving(false);
    }
  };

  return (
    <FormShell
      backHref="/admin/testimonials"
      backLabel="All testimonials"
      title={testimonial ? 'Edit testimonial' : 'New testimonial'}
      error={error}
      saving={saving}
      onSubmit={onSubmit}
      deleteSlot={
        testimonial ? (
          <DeleteButton
            apiPath={`/api/admin/testimonials/${testimonial.id}`}
            confirmLabel={testimonial.name}
            onDeleted={() => router.push('/admin/testimonials')}
          />
        ) : undefined
      }
    >
      <Field label="Quote" htmlFor="quote">
        <Textarea
          id="quote"
          required
          rows={4}
          value={draft.quote}
          onChange={(e) => set('quote', e.target.value)}
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" htmlFor="name">
          <Input
            id="name"
            required
            value={draft.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </Field>
        <Field label="Initials" htmlFor="initials" hint="Shown in the avatar circle.">
          <Input
            id="initials"
            required
            maxLength={4}
            value={draft.initials}
            onChange={(e) => set('initials', e.target.value.toUpperCase())}
          />
        </Field>
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
      </div>
      <Field
        label="Project slug"
        htmlFor="projectSlug"
        hint="Optional — links the quote back to a case study, e.g. docflow-ai."
      >
        <Input
          id="projectSlug"
          value={draft.projectSlug ?? ''}
          onChange={(e) => set('projectSlug', e.target.value)}
        />
      </Field>
      <label className="text-fg flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={draft.featured}
          onChange={(e) => set('featured', e.target.checked)}
          className="border-border bg-surface-1 accent-accent h-4 w-4 rounded-xs"
        />
        Show on the home page
      </label>
    </FormShell>
  );
}

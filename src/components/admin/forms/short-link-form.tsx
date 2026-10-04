'use client';

import { useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { Field, Input, Textarea } from '@/components/ui/field';
import { DeleteButton } from '@/components/admin/delete-button';
import { FormShell } from '@/components/admin/form-shell';
import { adminFetchJson } from '@/lib/admin-fetch';
import {
  SHORT_LINK_CAMPAIGN,
  SHORT_LINK_NAME_MAX,
  SHORT_LINK_SOURCES,
  shortLinkPath,
} from '@/lib/short-links';
import type { ShortLink } from '@/lib/types';

type Draft = Pick<ShortLink, 'slug' | 'label' | 'source' | 'medium' | 'destination' | 'notes'>;

const EMPTY: Draft = {
  slug: '',
  label: '',
  source: 'application',
  medium: 'link',
  destination: '/',
  notes: '',
};

// HTML's `pattern` is the same rule as SHORT_LINK_NAME_PATTERN, written for
// the browser (implicitly anchored, `v` flag) so a bad name is caught
// before the round trip; the API re-checks with the real one.
const NAME_PATTERN_ATTR = '[a-z0-9]+(-[a-z0-9]+)*';

/*
 * The host the admin is open on is the host links are shared from — read
 * from the browser rather than NEXT_PUBLIC_SITE_URL, which the Docker build
 * doesn't have (AGENTS.md §9).
 */
const subscribeNever = () => () => {};
export function useSiteHost(): string {
  return useSyncExternalStore(
    subscribeNever,
    () => window.location.host,
    () => '',
  );
}

export function ShortLinkForm({ link }: { link?: ShortLink }) {
  const router = useRouter();
  const host = useSiteHost();
  const [draft, setDraft] = useState<Draft>(
    link
      ? {
          slug: link.slug,
          label: link.label,
          source: link.source,
          medium: link.medium,
          destination: link.destination,
          notes: link.notes ?? '',
        }
      : EMPTY,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { ...draft, notes: draft.notes || undefined };
      if (link) {
        await adminFetchJson(`/api/admin/short-links/${link.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await adminFetchJson('/api/admin/short-links', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      router.push('/admin/short-links');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
      setSaving(false);
    }
  };

  const slug = draft.slug || 'name';
  const tags = new URLSearchParams({
    utm_source: draft.source || '…',
    utm_medium: draft.medium || 'link',
    utm_campaign: SHORT_LINK_CAMPAIGN,
    utm_content: slug,
  });

  return (
    <FormShell
      backHref="/admin/short-links"
      backLabel="All short links"
      title={link ? 'Edit short link' : 'New short link'}
      error={error}
      saving={saving}
      onSubmit={onSubmit}
      deleteSlot={
        link ? (
          <DeleteButton
            apiPath={`/api/admin/short-links/${link.id}`}
            confirmLabel={shortLinkPath(link.slug)}
            onDeleted={() => router.push('/admin/short-links')}
          />
        ) : undefined
      }
    >
      <Field
        label="Name"
        htmlFor="slug"
        hint={
          link
            ? 'Fixed once created — the link may already be pasted somewhere.'
            : 'Lowercase letters, numbers and hyphens, e.g. pathao or fb-bio.'
        }
      >
        <Input
          id="slug"
          required
          disabled={Boolean(link)}
          maxLength={SHORT_LINK_NAME_MAX}
          pattern={NAME_PATTERN_ATTR}
          autoCapitalize="none"
          spellCheck={false}
          value={draft.slug}
          onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
        />
      </Field>
      <p className="text-fg -mt-3 font-mono text-sm">
        {host}
        {shortLinkPath(slug)}
      </p>

      <Field
        label="Where it's placed"
        htmlFor="label"
        hint="For you — e.g. Pathao application form."
      >
        <Input
          id="label"
          required
          maxLength={120}
          value={draft.label}
          onChange={(e) => set('label', e.target.value)}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Source" htmlFor="source" hint="Groups links in Umami (utm_source).">
          <Input
            id="source"
            required
            list="short-link-sources"
            maxLength={SHORT_LINK_NAME_MAX}
            pattern={NAME_PATTERN_ATTR}
            autoCapitalize="none"
            spellCheck={false}
            value={draft.source}
            onChange={(e) => set('source', e.target.value.toLowerCase())}
          />
          <datalist id="short-link-sources">
            {SHORT_LINK_SOURCES.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Field>
        <Field label="Placement" htmlFor="medium" hint="Where on it (utm_medium), e.g. form, bio.">
          <Input
            id="medium"
            required
            maxLength={SHORT_LINK_NAME_MAX}
            pattern={NAME_PATTERN_ATTR}
            autoCapitalize="none"
            spellCheck={false}
            value={draft.medium}
            onChange={(e) => set('medium', e.target.value.toLowerCase())}
          />
        </Field>
      </div>

      <Field
        label="Opens"
        htmlFor="destination"
        hint="A page on this site: /, /work, /about, /resume…"
      >
        <Input
          id="destination"
          required
          spellCheck={false}
          value={draft.destination}
          onChange={(e) => set('destination', e.target.value)}
        />
      </Field>

      <Field label="Notes" htmlFor="notes">
        <Textarea
          id="notes"
          rows={3}
          maxLength={500}
          value={draft.notes ?? ''}
          onChange={(e) => set('notes', e.target.value)}
        />
      </Field>

      <p className="text-2xs text-fg-subtle font-mono break-all">
        Redirects to {draft.destination || '/'}?{tags.toString()}
      </p>
    </FormShell>
  );
}

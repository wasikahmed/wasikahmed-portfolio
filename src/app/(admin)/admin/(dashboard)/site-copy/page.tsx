'use client';

import { useEffect, useState } from 'react';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Card } from '@/components/ui/card';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { RevisionHistory } from '@/components/admin/revision-history';
import { adminFetchJson } from '@/lib/admin-fetch';
import { SITE_COPY_GROUPS } from '@/lib/site-copy-fields';
import type { SiteCopy } from '@/lib/types';

type CopyGroups = Record<string, Record<string, string>>;

/**
 * Every heading, intro, call to action and meta description that used to
 * live in a component. The form is generated from SITE_COPY_GROUPS (lib/
 * site-copy-fields.ts), one card per page, in the order the pages appear
 * in the nav. It opens with exactly what the site is showing — the API
 * returns stored values merged over the built-in defaults.
 */
export default function SiteCopyPage() {
  const [draft, setDraft] = useState<CopyGroups | null>(null);
  const [stored, setStored] = useState<CopyGroups | null>(null);
  const [saveCount, setSaveCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminFetchJson<{ item: SiteCopy }>('/api/admin/site-copy')
      .then((res) => {
        const item = res.item as unknown as CopyGroups;
        setDraft(item);
        setStored(item);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load.'));
  }, []);

  if (!draft) {
    return error ? (
      <p className="text-signal-rose text-sm">{error}</p>
    ) : (
      <p className="text-fg-muted text-sm">Loading…</p>
    );
  }

  const set = (group: string, key: string, value: string) => {
    setSaved(false);
    setDraft((d) => (d ? { ...d, [group]: { ...d[group], [key]: value } } : d));
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await adminFetchJson<{ item: SiteCopy }>('/api/admin/site-copy', {
        method: 'PATCH',
        body: JSON.stringify(draft),
      });
      const item = res.item as unknown as CopyGroups;
      setDraft(item);
      setStored(item);
      setSaveCount((n) => n + 1);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Eyebrow>Site copy</Eyebrow>
      <p className="text-fg-muted mt-2 max-w-lg text-sm">
        Headings, intros, calls to action and search descriptions across the public pages. Facts
        about you (name, availability, story) stay in Settings.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-6">
        {SITE_COPY_GROUPS.map((group) => (
          <Card key={group.group} variant="flat" padding="md">
            <h2 className="font-display text-fg text-lg font-semibold tracking-tight">
              {group.title}
            </h2>
            <p className="text-fg-subtle mt-1 text-xs">{group.description}</p>
            <div className="mt-5 flex flex-col gap-5">
              {group.fields.map((field) => {
                const id = `${group.group}-${field.key}`;
                const value = draft[group.group]?.[field.key] ?? '';
                const over = field.max !== undefined && value.length > field.max;
                const hint = field.max
                  ? `${field.hint ? `${field.hint} ` : ''}${value.length}/${field.max}`
                  : field.hint;
                return (
                  <Field key={id} label={field.label} htmlFor={id} hint={hint}>
                    {field.multiline ? (
                      <Textarea
                        id={id}
                        required
                        rows={3}
                        className={over ? 'border-signal-rose min-h-0' : 'min-h-0'}
                        value={value}
                        onChange={(e) => set(group.group, field.key, e.target.value)}
                      />
                    ) : (
                      <Input
                        id={id}
                        required
                        className={over ? 'border-signal-rose' : undefined}
                        value={value}
                        onChange={(e) => set(group.group, field.key, e.target.value)}
                      />
                    )}
                  </Field>
                );
              })}
            </div>
          </Card>
        ))}

        {error ? <p className="text-signal-rose text-sm">{error}</p> : null}

        <div className="border-border-subtle bg-bg sticky bottom-0 flex items-center gap-4 border-t py-4">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          {saved ? (
            <span className="text-2xs text-accent">Saved — live on the next page load.</span>
          ) : null}
        </div>
      </form>

      <RevisionHistory
        key={saveCount}
        entityType="siteCopy"
        entityId="site-copy"
        current={(stored ?? undefined) as Record<string, unknown> | undefined}
      />
    </div>
  );
}

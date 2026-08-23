'use client';

import { Field, Input, Select, Textarea } from '@/components/ui/field';
import type { ContentStatus, Seo } from '@/lib/types';

/** Converts between the API's ISO string and <input type="datetime-local">'s local-time format. */
function toLocalInput(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIso(local: string): string | undefined {
  if (!local) return undefined;
  return new Date(local).toISOString();
}

/** Shared by Project and Post forms — the status/publishedAt/SEO fields every content collection carries. */
export function PublishFields({
  status,
  publishedAt,
  seo,
  onChange,
}: {
  status: ContentStatus;
  publishedAt?: string;
  seo?: Seo;
  onChange: (patch: { status?: ContentStatus; publishedAt?: string; seo?: Seo }) => void;
}) {
  return (
    <div className="border-border-subtle flex flex-col gap-5 rounded-md border p-4">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Status" htmlFor="status">
          <Select
            id="status"
            value={status}
            onChange={(e) => onChange({ status: e.target.value as ContentStatus })}
          >
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
          </Select>
        </Field>
        {status === 'scheduled' ? (
          <Field label="Publish at" htmlFor="publishedAt">
            <Input
              id="publishedAt"
              type="datetime-local"
              required
              value={toLocalInput(publishedAt)}
              onChange={(e) => onChange({ publishedAt: toIso(e.target.value) })}
            />
          </Field>
        ) : null}
      </div>

      <details className="group">
        <summary className="text-2xs text-fg-subtle cursor-pointer font-mono tracking-widest uppercase [&::-webkit-details-marker]:hidden">
          SEO overrides (optional) <span className="group-open:hidden">▸</span>
          <span className="hidden group-open:inline">▾</span>
        </summary>
        <div className="mt-4 flex flex-col gap-4">
          <Field
            label="Title override"
            htmlFor="seoTitle"
            hint="Defaults to the page title if empty."
          >
            <Input
              id="seoTitle"
              maxLength={70}
              value={seo?.title ?? ''}
              onChange={(e) => onChange({ seo: { ...seo, title: e.target.value || undefined } })}
            />
          </Field>
          <Field label="Description override" htmlFor="seoDescription">
            <Textarea
              id="seoDescription"
              rows={2}
              maxLength={200}
              value={seo?.description ?? ''}
              onChange={(e) =>
                onChange({ seo: { ...seo, description: e.target.value || undefined } })
              }
            />
          </Field>
        </div>
      </details>
    </div>
  );
}

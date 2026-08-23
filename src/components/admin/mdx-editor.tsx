'use client';

import { useEffect, useRef, useState } from 'react';
import { Label } from '@/components/ui/field';
import { adminFetchJson } from '@/lib/admin-fetch';

/**
 * MDX source on the left, the compiled result on the right — rendered
 * through the exact same `MdxContent` component the public site uses
 * (via /api/admin/mdx-preview), so "preview" means the real thing, not an
 * approximation. Debounced 400ms rather than compiling on every keystroke:
 * that reads as live to a person typing, without a server round trip per
 * character.
 */
export function MdxEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const [html, setHtml] = useState('');
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await adminFetchJson<{ html?: string; error?: string }>(
          '/api/admin/mdx-preview',
          { method: 'POST', body: JSON.stringify({ source: value }) },
        );
        setHtml(result.html ?? '');
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Preview failed.');
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [value]);

  return (
    <div>
      <Label htmlFor={`mdx-${label}`}>{label}</Label>
      <div className="grid gap-3 lg:grid-cols-2">
        <textarea
          id={`mdx-${label}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={16}
          spellCheck={false}
          className="border-border bg-surface-1 text-fg duration-fast focus:border-border-strong w-full resize-y rounded-md border p-3.5 font-mono text-xs leading-relaxed transition-[border-color,box-shadow] outline-none focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-accent)_10%,transparent)]"
        />
        <div className="border-border-subtle bg-surface-1 min-h-[16rem] overflow-y-auto rounded-md border p-4">
          {error ? (
            <p className="text-signal-rose font-mono text-xs">{error}</p>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: html }} />
          )}
        </div>
      </div>
    </div>
  );
}

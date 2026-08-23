'use client';

import { Input } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface FieldSpec<T> {
  key: keyof T & string;
  label: string;
  required?: boolean;
  placeholder?: string;
}

/**
 * Generic add/remove editor for arrays of small flat objects — Project's
 * `metrics`, `architecture`, and `links` all fit this shape (2-3 short
 * text fields per row). One implementation instead of three near-identical
 * ones for each.
 *
 * No structural constraint on `T` (e.g. `Record<string, string>`) — the
 * concrete types this is used with (`Metric`, `ArchitectureNode`, link
 * objects) don't carry index signatures, and requiring one would force
 * every caller to loosen its own type just to satisfy this component.
 * The one unchecked cast at the read site is contained here.
 */
export function ObjectArrayEditor<T>({
  value,
  onChange,
  fields,
  empty,
  addLabel,
}: {
  value: T[];
  onChange: (next: T[]) => void;
  fields: FieldSpec<T>[];
  empty: T;
  addLabel: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      {value.map((row, i) => (
        <Card key={i} variant="flat" padding="sm" className="flex items-start gap-3">
          <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
            {fields.map((f) => (
              <Input
                key={f.key}
                value={(row[f.key] as string | undefined) ?? ''}
                placeholder={f.placeholder ?? f.label}
                required={f.required}
                onChange={(e) => {
                  const next = [...value];
                  next[i] = { ...next[i], [f.key]: e.target.value };
                  onChange(next);
                }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => onChange(value.filter((_, idx) => idx !== i))}
            aria-label="Remove"
            className="text-fg-subtle hover:text-signal-rose mt-2 shrink-0"
          >
            ×
          </button>
        </Card>
      ))}
      <Button
        type="button"
        variant="subtle"
        size="sm"
        onClick={() => onChange([...value, empty])}
        className="self-start"
      >
        {addLabel}
      </Button>
    </div>
  );
}

'use client';

import { Input } from '@/components/ui/field';
import { Button } from '@/components/ui/button';

/**
 * A plain ordered list of one-line text fields — for arrays of full
 * sentences (Role.shipped) where TagInput's chip styling would be
 * unreadable. No drag-reorder here; these are short lists edited a line
 * at a time, not long collections worth a dedicated reorder gesture.
 */
export function StringList({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      {value.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={item}
            placeholder={placeholder}
            onChange={(e) => {
              const next = [...value];
              next[i] = e.target.value;
              onChange(next);
            }}
          />
          <button
            type="button"
            onClick={() => onChange(value.filter((_, idx) => idx !== i))}
            aria-label="Remove"
            className="text-fg-subtle hover:text-signal-rose shrink-0"
          >
            ×
          </button>
        </div>
      ))}
      <Button type="button" variant="subtle" size="sm" onClick={() => onChange([...value, ''])}>
        Add line
      </Button>
    </div>
  );
}

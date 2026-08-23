'use client';

import { Field, Input } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MdxEditor } from '@/components/admin/mdx-editor';
import type { CaseStudySection } from '@/lib/types';

/**
 * Project.sections — each one a full MDX document, so this doesn't fit
 * ObjectArrayEditor's compact-row shape. Up/down buttons rather than
 * drag-and-drop: dnd-kit's pointer-capture handling gets fights with a
 * textarea's own text-selection drag, and there are rarely more than
 * six or seven sections, where simple buttons are just as fast.
 */
export function SectionsEditor({
  value,
  onChange,
}: {
  value: CaseStudySection[];
  onChange: (next: CaseStudySection[]) => void;
}) {
  const update = (i: number, patch: Partial<CaseStudySection>) => {
    const next = [...value];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-6">
      {value.map((section, i) => (
        <Card key={i} variant="raised" padding="md" className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-2xs text-fg-subtle font-mono">
              Section {i + 1} of {value.length}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={i === 0}
                onClick={() => move(i, -1)}
                className="text-2xs text-fg-subtle hover:text-fg disabled:opacity-30"
              >
                ↑ Move up
              </button>
              <button
                type="button"
                disabled={i === value.length - 1}
                onClick={() => move(i, 1)}
                className="text-2xs text-fg-subtle hover:text-fg disabled:opacity-30"
              >
                ↓ Move down
              </button>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                className="text-2xs text-fg-subtle hover:text-signal-rose"
              >
                Remove
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Anchor id"
              htmlFor={`section-id-${i}`}
              hint="Used in the URL and the TOC."
            >
              <Input
                id={`section-id-${i}`}
                required
                pattern="[a-z0-9-]+"
                value={section.id}
                onChange={(e) => update(i, { id: e.target.value })}
              />
            </Field>
            <Field label="Title" htmlFor={`section-title-${i}`}>
              <Input
                id={`section-title-${i}`}
                required
                value={section.title}
                onChange={(e) => update(i, { title: e.target.value })}
              />
            </Field>
          </div>

          {section.id === 'approach' ? (
            <p className="text-2xs text-fg-subtle">
              This section renders the architecture diagram below its body — matching the id
              &quot;approach&quot; is what places it here.
            </p>
          ) : null}

          <MdxEditor
            label={`Body — ${section.title || `Section ${i + 1}`}`}
            value={section.bodyMdx}
            onChange={(v) => update(i, { bodyMdx: v })}
          />
        </Card>
      ))}

      <Button
        type="button"
        variant="subtle"
        size="sm"
        className="self-start"
        onClick={() => onChange([...value, { id: '', title: '', bodyMdx: '' }])}
      >
        Add section
      </Button>
    </div>
  );
}

import type { Metadata } from 'next';
import { Section, Container } from '@/components/ui/section';
import { Eyebrow } from '@/components/ui/eyebrow';
import type { AmbientBudget } from '@/components/ui/section';

/**
 * Three candidate section rhythms, stacked, for picking one.
 *
 * A developer reference like the rest of /design-system — noindex, absent
 * from the sitemap and unlinked from the footer. Delete this route once a
 * rhythm is chosen; it exists to be compared against, not kept.
 */
export const metadata: Metadata = {
  title: 'Section rhythm — options',
  robots: { index: false, follow: false },
};

type Density = 'compact' | 'default' | 'spacious';

interface Row {
  label: string;
  note: string;
  ambient: AmbientBudget;
  density: Density;
  band?: boolean;
}

/** Existing four layers only, reassigned so no two neighbours repeat. */
const A: Row[] = [
  { label: 'Hero', note: 'blob', ambient: ['blob'], density: 'default' },
  { label: 'Selected work', note: 'grid', ambient: ['grid'], density: 'default' },
  { label: 'Impact', note: 'noise', ambient: ['noise'], density: 'spacious' },
  { label: 'Experience', note: 'dots', ambient: ['dots'], density: 'default' },
  { label: 'Approach', note: 'grid', ambient: ['grid'], density: 'default' },
  { label: 'Shipped', note: 'noise', ambient: ['noise'], density: 'compact' },
  { label: 'Contact', note: 'blob + noise', ambient: ['blob', 'noise'], density: 'spacious' },
];

/** A, plus alternating surfaces and the new scanline texture. */
const B: Row[] = [
  { label: 'Hero', note: 'blob', ambient: ['blob'], density: 'default' },
  {
    label: 'Selected work',
    note: 'grid · banded',
    ambient: ['grid'],
    density: 'default',
    band: true,
  },
  { label: 'Impact', note: 'scanlines', ambient: ['scanlines'], density: 'spacious' },
  { label: 'Experience', note: 'dots · banded', ambient: ['dots'], density: 'default', band: true },
  { label: 'Approach', note: 'grid', ambient: ['grid'], density: 'default' },
  {
    label: 'Shipped',
    note: 'scanlines · banded',
    ambient: ['scanlines'],
    density: 'compact',
    band: true,
  },
  { label: 'Contact', note: 'blob + noise', ambient: ['blob', 'noise'], density: 'spacious' },
];

/** B, plus the container guides and an edge hatch. */
const C: Row[] = [
  { label: 'Hero', note: 'blob + guides', ambient: ['blob', 'guides'], density: 'default' },
  {
    label: 'Selected work',
    note: 'grid + guides · banded',
    ambient: ['grid', 'guides'],
    density: 'default',
    band: true,
  },
  {
    label: 'Impact',
    note: 'scanlines + hatch',
    ambient: ['scanlines', 'hatch'],
    density: 'spacious',
  },
  {
    label: 'Experience',
    note: 'dots + guides · banded',
    ambient: ['dots', 'guides'],
    density: 'default',
    band: true,
  },
  { label: 'Approach', note: 'grid + hatch', ambient: ['grid', 'hatch'], density: 'default' },
  {
    label: 'Shipped',
    note: 'scanlines + guides · banded',
    ambient: ['scanlines', 'guides'],
    density: 'compact',
    band: true,
  },
  {
    label: 'Contact',
    note: 'blob + hatch',
    ambient: ['blob', 'hatch'],
    density: 'spacious',
  },
];

const VARIANTS: { key: string; title: string; blurb: string; rows: Row[] }[] = [
  {
    key: 'A',
    title: 'A — Measured',
    blurb:
      'Only the four layers that already exist, reassigned so no two adjacent sections repeat a texture, with density varied deliberately. No new primitives, nothing to maintain.',
    rows: A,
  },
  {
    key: 'B',
    title: 'B — Banded',
    blurb:
      'A, plus alternating surface elevation and a new scanline texture. This is the one that reads as stripes: the page becomes distinct horizontal blocks instead of one continuous dark scroll.',
    rows: B,
  },
  {
    key: 'C',
    title: 'C — Blueprint',
    blurb:
      'B, plus vertical rules on the container edges and a 45° hatch held to one side. Technical-drawing feel. The most distinctive, and the easiest to overdo.',
    rows: C,
  },
];

function Sample({ rows }: { rows: Row[] }) {
  return (
    <div>
      {rows.map((row, i) => (
        <Section
          key={row.label}
          density={row.density}
          ambient={row.ambient}
          band={row.band}
          bordered={i > 0}
        >
          <Container>
            <div className="flex items-baseline justify-between gap-6">
              <p className="font-display text-fg text-2xl font-bold tracking-tight">{row.label}</p>
              <p className="text-2xs text-accent font-mono tracking-widest uppercase">{row.note}</p>
            </div>
            <p className="text-fg-muted mt-3 max-w-xl text-sm leading-relaxed">
              Body copy at the size the real sections use, so the texture is judged against type
              rather than against an empty band.
            </p>
          </Container>
        </Section>
      ))}
    </div>
  );
}

export default function RhythmPage() {
  return (
    <>
      <Section density="compact" className="pt-28">
        <Container>
          <Eyebrow rule>Internal</Eyebrow>
          <h1 className="font-display mt-5 text-4xl font-bold tracking-tighter">Section rhythm</h1>
          <p className="text-fg-muted mt-4 max-w-2xl text-pretty">
            Three candidates, each showing the real home page section order. Scroll the whole page —
            the point is the rhythm between sections, which no single screenshot shows.
          </p>
        </Container>
      </Section>

      {VARIANTS.map((variant) => (
        <div key={variant.key}>
          <Section density="compact" bordered className="bg-surface-2">
            <Container>
              <h2 className="font-display text-accent text-3xl font-bold tracking-tight">
                {variant.title}
              </h2>
              <p className="text-fg-muted mt-3 max-w-2xl text-sm leading-relaxed text-pretty">
                {variant.blurb}
              </p>
            </Container>
          </Section>
          <Sample rows={variant.rows} />
        </div>
      ))}
    </>
  );
}

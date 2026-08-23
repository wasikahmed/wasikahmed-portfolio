import type { Metadata } from 'next';
import { Section, Container } from '@/components/ui/section';
import { Card } from '@/components/ui/card';
import { Button, ArrowRight } from '@/components/ui/button';
import { Tag, TagList } from '@/components/ui/tag';
import { Eyebrow, StatusDot } from '@/components/ui/eyebrow';
import { Field, Input, Textarea, Select } from '@/components/ui/field';
import { GridTexture, NoiseTexture, DotMatrix, Blob } from '@/components/ambient';
import { MotionLab } from './motion-lab';

export const metadata: Metadata = {
  title: 'Design System — Wasik Ahmed',
  description: 'Tokens, primitives, and motion for the portfolio.',
  robots: { index: false },
};

const SURFACES = [
  { name: 'bg', className: 'bg-bg', note: 'Page ground' },
  { name: 'surface-1', className: 'bg-surface-1', note: 'Content cards' },
  { name: 'surface-2', className: 'bg-surface-2', note: 'Raised / glass' },
  { name: 'surface-3', className: 'bg-surface-3', note: 'Inset, chips' },
  { name: 'surface-4', className: 'bg-surface-4', note: 'Highest' },
];

const ACCENTS = [
  { name: 'accent-whisper', className: 'bg-accent-whisper', note: 'Tints' },
  { name: 'accent-soft', className: 'bg-accent-soft', note: 'Fills' },
  { name: 'accent', className: 'bg-accent', note: 'Primary' },
  { name: 'accent-bright', className: 'bg-accent-bright', note: 'Gradient end' },
  { name: 'accent-deep', className: 'bg-accent-deep', note: 'Shadow tone' },
];

const TYPE_SCALE = [
  { token: 'text-5xl', className: 'text-5xl', label: 'Hero' },
  { token: 'text-4xl', className: 'text-4xl', label: 'Page title' },
  { token: 'text-3xl', className: 'text-3xl', label: 'Section' },
  { token: 'text-2xl', className: 'text-2xl', label: 'Subsection' },
  { token: 'text-xl', className: 'text-xl', label: 'Card title' },
  { token: 'text-base', className: 'text-base', label: 'Body' },
  { token: 'text-sm', className: 'text-sm', label: 'Secondary' },
  { token: 'text-xs', className: 'text-xs', label: 'Meta' },
];

function Swatch({ name, className, note }: { name: string; className: string; note: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className={`border-border-subtle h-16 rounded-md border ${className}`} />
      <div>
        <div className="text-2xs text-fg font-mono">{name}</div>
        <div className="text-2xs text-fg-subtle">{note}</div>
      </div>
    </div>
  );
}

function Spec({ children }: { children: React.ReactNode }) {
  return <p className="text-fg-muted max-w-2xl text-sm leading-relaxed">{children}</p>;
}

export default function DesignSystemPage() {
  return (
    <>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Section density="spacious" ambient={['blob', 'grid']} className="pt-32">
        <Container>
          <Eyebrow rule>Design System</Eyebrow>
          <h1 className="font-display mt-6 max-w-3xl text-4xl font-bold tracking-tighter text-balance">
            Signal over noise.
          </h1>
          <p className="text-fg-muted mt-6 max-w-xl text-lg text-pretty">
            Every token, primitive, and animation in the portfolio. Motion earns its place by
            revealing information, confirming an interaction, or establishing continuity — or it
            gets cut.
          </p>
          <div className="mt-8 flex items-center gap-2">
            <StatusDot />
            <span className="text-2xs text-fg-muted font-mono">
              Phase 1 · dark only · ambient budget 2
            </span>
          </div>
        </Container>
      </Section>

      {/* ── Color ──────────────────────────────────────────────────────── */}
      <Section bordered>
        <Container>
          <Eyebrow rule>Color</Eyebrow>
          <h2 className="font-display mt-5 text-2xl font-bold tracking-tight">
            Four surfaces, five accent steps.
          </h2>
          <Spec>
            The prototype used one surface and one border colour for everything, which put every
            element on the same visual plane. An elevation scale plus a graded accent gives emphasis
            somewhere to go.
          </Spec>

          <div className="mt-10 grid gap-5 sm:grid-cols-3 lg:grid-cols-5">
            {SURFACES.map((s) => (
              <Swatch key={s.name} {...s} />
            ))}
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-3 lg:grid-cols-5">
            {ACCENTS.map((s) => (
              <Swatch key={s.name} {...s} />
            ))}
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {[
              { name: 'fg', className: 'text-fg', note: 'Primary text' },
              { name: 'fg-muted', className: 'text-fg-muted', note: 'Secondary · AA at 14px' },
              { name: 'fg-subtle', className: 'text-fg-subtle', note: 'Tertiary, large only' },
            ].map((t) => (
              <Card key={t.name} variant="flat">
                <p className={`text-base ${t.className}`}>The quick brown fox jumps</p>
                <p className="text-2xs text-fg-subtle mt-2 font-mono">
                  {t.name} — {t.note}
                </p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* ── Type ───────────────────────────────────────────────────────── */}
      <Section bordered ambient={['dots']}>
        <Container>
          <Eyebrow rule>Typography</Eyebrow>
          <h2 className="font-display mt-5 text-2xl font-bold tracking-tight">
            One fluid ramp, three families.
          </h2>
          <Spec>
            Every size interpolates with the viewport, replacing the twenty-odd per-element{' '}
            <code className="text-accent font-mono">clamp()</code> calls in the prototype. Space
            Grotesk sets display, Inter sets body, JetBrains Mono carries labels and metadata.
          </Spec>

          <div className="divide-border-subtle mt-10 flex flex-col divide-y">
            {TYPE_SCALE.map((t) => (
              <div
                key={t.token}
                className="flex flex-col gap-2 py-5 md:flex-row md:items-baseline md:gap-8"
              >
                <div className="flex w-40 shrink-0 items-baseline gap-3">
                  <span className="text-2xs text-accent font-mono">{t.token}</span>
                  <span className="text-2xs text-fg-subtle font-mono">{t.label}</span>
                </div>
                <div
                  className={`font-display min-w-0 truncate font-bold tracking-tight ${t.className}`}
                >
                  Systems that ship
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <Card variant="flat">
              <p className="font-display text-lg font-bold">Space Grotesk</p>
              <p className="text-2xs text-fg-subtle mt-1 font-mono">font-display · headings</p>
            </Card>
            <Card variant="flat">
              <p className="font-sans text-lg">Inter</p>
              <p className="text-2xs text-fg-subtle mt-1 font-mono">font-sans · body</p>
            </Card>
            <Card variant="flat">
              <p className="font-mono text-lg">JetBrains Mono</p>
              <p className="text-2xs text-fg-subtle mt-1 font-mono">font-mono · metadata</p>
            </Card>
          </div>
        </Container>
      </Section>

      {/* ── Primitives ─────────────────────────────────────────────────── */}
      <Section bordered>
        <Container>
          <Eyebrow rule>Primitives</Eyebrow>
          <h2 className="font-display mt-5 text-2xl font-bold tracking-tight">
            Buttons, surfaces, chips, fields.
          </h2>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <Card variant="raised" padding="lg" className="flex flex-col gap-6">
              <span className="text-2xs text-fg-muted font-mono tracking-wide uppercase">
                Button
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <Button className="group">
                  Primary <ArrowRight />
                </Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="subtle">Subtle</Button>
                <Button variant="link" href="/design-system">
                  Link
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button disabled>Disabled</Button>
              </div>
            </Card>

            <Card variant="raised" padding="lg" className="flex flex-col gap-6">
              <span className="text-2xs text-fg-muted font-mono tracking-wide uppercase">
                Card variants
              </span>
              <div className="grid gap-3 sm:grid-cols-2">
                <Card variant="flat" padding="sm">
                  <p className="text-fg text-sm">flat</p>
                  <p className="text-2xs text-fg-subtle mt-1">Content default</p>
                </Card>
                <Card variant="raised" padding="sm">
                  <p className="text-fg text-sm">raised</p>
                  <p className="text-2xs text-fg-subtle mt-1">Grouped content</p>
                </Card>
                <Card variant="glass" padding="sm">
                  <p className="text-fg text-sm">glass</p>
                  <p className="text-2xs text-fg-subtle mt-1">Floating UI only</p>
                </Card>
                <Card variant="outline" interactive padding="sm">
                  <p className="text-fg text-sm">interactive</p>
                  <p className="text-2xs text-fg-subtle mt-1">Hover me</p>
                </Card>
              </div>
            </Card>

            <Card variant="raised" padding="lg" className="flex flex-col gap-6">
              <span className="text-2xs text-fg-muted font-mono tracking-wide uppercase">
                Tags — capped at 3
              </span>
              <div className="flex flex-wrap gap-2">
                <Tag>default</Tag>
                <Tag tone="accent">accent</Tag>
              </div>
              <div>
                <p className="text-2xs text-fg-subtle mb-2">
                  Seven tags, three shown. Hover the counter for the rest.
                </p>
                <TagList
                  items={[
                    'TypeScript',
                    'Next.js',
                    'PostgreSQL',
                    'Docker',
                    'Redis',
                    'Terraform',
                    'FastAPI',
                  ]}
                />
              </div>
            </Card>

            <Card variant="raised" padding="lg" className="flex flex-col gap-4">
              <span className="text-2xs text-fg-muted font-mono tracking-wide uppercase">
                Fields
              </span>
              <Field label="Name" htmlFor="ds-name">
                <Input id="ds-name" placeholder="Jane Cooper" />
              </Field>
              <Field label="Project type" htmlFor="ds-type">
                <Select id="ds-type" defaultValue="">
                  <option value="" disabled>
                    Select one
                  </option>
                  <option>Automation</option>
                  <option>AI pipeline</option>
                  <option>Internal tool</option>
                </Select>
              </Field>
              <Field label="Detail" htmlFor="ds-detail" hint="What breaks today?">
                <Textarea id="ds-detail" placeholder="We process contracts by hand…" />
              </Field>
            </Card>
          </div>
        </Container>
      </Section>

      {/* ── Motion ─────────────────────────────────────────────────────── */}
      <Section bordered ambient={['noise']}>
        <Container>
          <Eyebrow rule>Motion</Eyebrow>
          <h2 className="font-display mt-5 text-2xl font-bold tracking-tight">
            Reveal, confirm, or connect.
          </h2>
          <Spec>
            Three rules govern every animation. It must reveal information, confirm an interaction,
            or establish spatial continuity. Anything that does none of the three is decoration and
            does not ship.
          </Spec>
          <div className="mt-10">
            <MotionLab />
          </div>
        </Container>
      </Section>

      {/* ── Ambient ────────────────────────────────────────────────────── */}
      <Section bordered>
        <Container>
          <Eyebrow rule>Ambient budget</Eyebrow>
          <h2 className="font-display mt-5 text-2xl font-bold tracking-tight">
            Two per viewport. Enforced by the compiler.
          </h2>
          <Spec>
            The prototype hero ran nine simultaneous ambient effects.{' '}
            <code className="text-accent font-mono">&lt;Section ambient=&#123;[…]&#125;&gt;</code>{' '}
            takes a tuple type that holds at most two entries, so a third is a build error rather
            than a code-review note.
          </Spec>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: 'grid', Comp: GridTexture, note: 'Structure' },
              { name: 'dots', Comp: DotMatrix, note: 'Softer structure' },
              { name: 'noise', Comp: NoiseTexture, note: 'Grain' },
              { name: 'blob', Comp: Blob, note: 'Light source' },
            ].map(({ name, Comp, note }) => (
              <div
                key={name}
                className="border-border-subtle bg-surface-1 relative h-40 overflow-hidden rounded-lg border"
              >
                <Comp />
                <div className="absolute bottom-3 left-3">
                  <div className="text-2xs text-fg font-mono">{name}</div>
                  <div className="text-2xs text-fg-subtle">{note}</div>
                </div>
              </div>
            ))}
          </div>

          <Card variant="outline" padding="lg" className="mt-8">
            <p className="text-2xs text-fg-muted font-mono tracking-wide uppercase">
              Section density
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {[
                ['compact', '3–4.5rem', 'Dense runs, list sections'],
                ['default', '4.5–7rem', 'Most sections'],
                ['spacious', '7–11rem', 'Hero, statement moments'],
                ['flush', '0', 'Full-bleed, adjacent blocks'],
              ].map(([token, size, use]) => (
                <div key={token} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
                  <span className="text-2xs text-accent w-24 font-mono">{token}</span>
                  <span className="text-2xs text-fg-subtle w-28 font-mono">{size}</span>
                  <span className="text-fg-muted">{use}</span>
                </div>
              ))}
            </div>
          </Card>
        </Container>
      </Section>
    </>
  );
}

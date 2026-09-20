import { cn } from '@/lib/cn';

/**
 * Ambient layers — PLAN.md §2.10.
 *
 * These are the *only* decorative background treatments in the system, and
 * `<Section>` caps them at two per viewport via a tuple type. The prototype
 * ran nine at once on the hero alone, which left the eye with no focal point
 * and no resting place.
 *
 * All of these are static. None loop. `blob` is the single exception and it
 * drifts on a 20s cycle that the reduced-motion kill switch stops dead.
 */
export type AmbientKind = 'grid' | 'noise' | 'blob' | 'dots' | 'scanlines' | 'hatch' | 'guides';

/** 48px emerald grid. A spatial anchor — use where the page needs structure. */
export function GridTexture({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0', className)}
      style={{
        backgroundImage: `
          linear-gradient(color-mix(in oklab, var(--color-accent) 4%, transparent) 1px, transparent 1px),
          linear-gradient(90deg, color-mix(in oklab, var(--color-accent) 4%, transparent) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, #000 40%, transparent 100%)',
      }}
    />
  );
}

/**
 * Film grain. The prototype ran this fixed and full-viewport with
 * `mix-blend-mode: overlay` — a full-screen compositing layer repainting on
 * every scroll, for a texture nobody consciously registers. Here it is
 * section-scoped, static, and unblended.
 */
export function NoiseTexture({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 opacity-[0.035]', className)}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }}
    />
  );
}

/** A single soft light source. One per section, never more. */
export function Blob({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute -top-1/4 left-1/2 h-[70%] w-[60%] -translate-x-1/2 rounded-full',
        className,
      )}
      style={{
        background:
          'radial-gradient(ellipse, color-mix(in oklab, var(--color-accent) 11%, transparent) 0%, transparent 70%)',
        filter: 'blur(90px)',
        animation: 'blob-drift 20s ease-in-out infinite',
      }}
    />
  );
}

/** Dot matrix. Denser than the grid — use it where the grid would be too loud. */
export function DotMatrix({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0', className)}
      style={{
        backgroundImage: `radial-gradient(color-mix(in oklab, var(--color-accent) 14%, transparent) 1px, transparent 1px)`,
        backgroundSize: '26px 26px',
        maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, #000 30%, transparent 100%)',
      }}
    />
  );
}

/**
 * Horizontal hairlines, 5px apart, masked to fade at the top and bottom
 * edges so the band has no hard seam against the section above it.
 *
 * The quietest of the textures: at 3% accent it reads as a tone rather
 * than as lines, which is the point — it gives a section a surface
 * without competing with type set on top of it.
 */
export function Scanlines({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0', className)}
      style={{
        backgroundImage: `repeating-linear-gradient(
          to bottom,
          color-mix(in oklab, var(--color-accent) 3%, transparent) 0px,
          color-mix(in oklab, var(--color-accent) 3%, transparent) 1px,
          transparent 1px,
          transparent 5px
        )`,
        maskImage: 'linear-gradient(to bottom, transparent, #000 18%, #000 82%, transparent)',
      }}
    />
  );
}

/**
 * 45° hatch, weighted to the right edge.
 *
 * Deliberately not centred and not full-bleed: a full-width diagonal
 * fights the reading direction of everything on top of it. Held to one
 * edge it behaves like a margin mark on a technical drawing.
 */
export function Hatch({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0', className)}
      style={{
        backgroundImage: `repeating-linear-gradient(
          45deg,
          color-mix(in oklab, var(--color-accent) 7%, transparent) 0px,
          color-mix(in oklab, var(--color-accent) 7%, transparent) 1px,
          transparent 1px,
          transparent 11px
        )`,
        maskImage: 'linear-gradient(to left, #000, transparent 42%)',
      }}
    />
  );
}

/**
 * Vertical rules on the container's own edges — the layout grid, made
 * faintly visible.
 *
 * Positioned with the same max-width and padding `Container` uses, so the
 * lines land exactly where the content column starts and ends rather than
 * near it. That alignment is the whole effect; a rule a few pixels off
 * reads as a mistake instead of as structure.
 */
export function Guides({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 px-6 lg:px-10', className)}
    >
      <div className="relative mx-auto h-full w-full max-w-[1280px]">
        <span
          className="absolute inset-y-0 left-0 w-px"
          style={{
            background:
              'linear-gradient(to bottom, transparent, color-mix(in oklab, var(--color-accent) 12%, transparent) 20%, color-mix(in oklab, var(--color-accent) 12%, transparent) 80%, transparent)',
          }}
        />
        <span
          className="absolute inset-y-0 right-0 w-px"
          style={{
            background:
              'linear-gradient(to bottom, transparent, color-mix(in oklab, var(--color-accent) 12%, transparent) 20%, color-mix(in oklab, var(--color-accent) 12%, transparent) 80%, transparent)',
          }}
        />
      </div>
    </div>
  );
}

const REGISTRY: Record<AmbientKind, (props: { className?: string }) => React.ReactElement> = {
  grid: GridTexture,
  noise: NoiseTexture,
  blob: Blob,
  dots: DotMatrix,
  scanlines: Scanlines,
  hatch: Hatch,
  guides: Guides,
};

export function AmbientLayer({ kind }: { kind: AmbientKind }) {
  const Component = REGISTRY[kind];
  return <Component />;
}

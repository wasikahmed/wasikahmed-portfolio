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
export type AmbientKind = 'grid' | 'noise' | 'blob' | 'dots';

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

const REGISTRY: Record<AmbientKind, (props: { className?: string }) => React.ReactElement> = {
  grid: GridTexture,
  noise: NoiseTexture,
  blob: Blob,
  dots: DotMatrix,
};

export function AmbientLayer({ kind }: { kind: AmbientKind }) {
  const Component = REGISTRY[kind];
  return <Component />;
}

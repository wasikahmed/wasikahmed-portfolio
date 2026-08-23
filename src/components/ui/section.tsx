import { AmbientLayer, type AmbientKind } from '@/components/ambient';
import { cn } from '@/lib/cn';

/**
 * The ambient budget, enforced by the type system.
 *
 * PLAN.md §2.10 caps decorative background layers at two per viewport.
 * This tuple type makes a third one a compile error rather than a code
 * review note — the constraint is the whole point of the redesign, so it
 * shouldn't rely on anyone remembering it.
 */
export type AmbientBudget =
  readonly [] | readonly [AmbientKind] | readonly [AmbientKind, AmbientKind];

type Density = 'compact' | 'default' | 'spacious' | 'flush';

const DENSITY: Record<Density, string> = {
  compact: 'py-density-compact',
  default: 'py-density-default',
  spacious: 'py-density-spacious',
  flush: 'py-0',
};

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Vertical rhythm. Varying this is what stops every section reading the
   * same — the prototype used py-28 everywhere.
   */
  density?: Density;
  /** At most two. A third is a type error. */
  ambient?: AmbientBudget;
  /** Hairline rule along the top edge. */
  bordered?: boolean;
  children: React.ReactNode;
}

export function Section({
  density = 'default',
  ambient = [],
  bordered = false,
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        'relative isolate px-6 lg:px-10',
        DENSITY[density],
        bordered && 'border-border-subtle border-t',
        className,
      )}
      {...props}
    >
      {ambient.map((kind) => (
        <AmbientLayer key={kind} kind={kind} />
      ))}
      <div className="relative">{children}</div>
    </section>
  );
}

export function Container({
  className,
  children,
  size = 'default',
}: {
  className?: string;
  children: React.ReactNode;
  /** `prose` caps line length for long-form reading. */
  size?: 'default' | 'prose' | 'wide';
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full',
        size === 'default' && 'max-w-[1280px]',
        size === 'prose' && 'max-w-[68ch]',
        size === 'wide' && 'max-w-[1520px]',
        className,
      )}
    >
      {children}
    </div>
  );
}

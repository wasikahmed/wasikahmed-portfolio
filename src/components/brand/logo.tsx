import { MARK_BRACKETS, MARK_DEFAULT, MARK_LETTER, MARK_SMALL, MARK_VIEWBOX } from '@/lib/brand';
import { cn } from '@/lib/cn';

/**
 * The logo mark — a "W" inside a bracket pair. See `src/lib/brand.ts` for the
 * geometry and the reasoning behind it.
 *
 * Monochrome, deliberately: the whole mark takes `currentColor`, so a caller
 * recolours it by setting `text-*` and nothing here has to know about the
 * accent ramp. The previous drawing carried one node in `accent-bright` to
 * encode a shipped output; at logo scale that reads as a status light, and it
 * is not coming back.
 */
export function LogoMark({
  className,
  small = false,
  ...props
}: React.ComponentProps<'svg'> & { small?: boolean }) {
  const weights = small ? MARK_SMALL : MARK_DEFAULT;

  return (
    <svg
      viewBox={MARK_VIEWBOX}
      fill="none"
      aria-hidden
      className={cn('text-accent', className)}
      {...props}
    >
      {MARK_BRACKETS.map((d) => (
        <path
          key={d}
          d={d}
          stroke="currentColor"
          strokeWidth={weights.bracket}
          strokeLinecap="square"
          opacity={weights.bracketOpacity}
        />
      ))}
      <path
        d={MARK_LETTER}
        stroke="currentColor"
        strokeWidth={weights.letter}
        strokeLinecap="square"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The wordmark. Split across two weights of foreground so the lockup has
 * internal hierarchy without a second font or a second colour — the given name
 * leads, the family name recedes.
 */
export function Wordmark({ name, className }: { name: string; className?: string }) {
  const [given, ...rest] = name.split(' ');
  const family = rest.join(' ');

  return (
    <span className={cn('font-display font-semibold tracking-tight', className)}>
      <span className="text-fg">{given}</span>
      {family ? <span className="text-fg-muted"> {family}</span> : null}
    </span>
  );
}

import { MARK_DEFAULT, MARK_NODES, MARK_PATH, MARK_SMALL, MARK_VIEWBOX } from '@/lib/brand';
import { cn } from '@/lib/cn';

/**
 * The logo mark — a "W" built as a pipeline. See `src/lib/brand.ts` for the
 * geometry and the reasoning behind it.
 *
 * Colours come from `currentColor` and the accent tokens rather than literals,
 * per AGENTS.md §4.2. The terminal node is the one deliberate exception to
 * monochrome: it is `accent-bright` because it encodes the output stage, not
 * because a second colour looked nice. Keep it.
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
      <path
        d={MARK_PATH}
        stroke="currentColor"
        strokeWidth={weights.stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {MARK_NODES.map(({ cx, cy }, i) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r={weights.node}
          className={
            i === MARK_NODES.length - 1
              ? 'fill-accent-bright duration-fast transition-colors'
              : 'fill-current'
          }
        />
      ))}
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

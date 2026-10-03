import { cn } from '@/lib/cn';

/**
 * The wordmark — the whole brand lockup since 2026-10-04, when the bracket
 * "W" mark was retired from the nav and footer. A personal site's name already
 * is its logo; the mark only restated it in a less legible form.
 *
 * Split across two weights of foreground so the lockup has internal hierarchy
 * without a second font — the given name leads, the family name recedes. The
 * full stop is the one accent: it carries the brand colour the mark used to,
 * at a size that cannot read as a status light (see the history in
 * `src/lib/brand.ts`).
 *
 * Callers that wrap this in a link add `group` to it: the family name lifts to
 * full strength on hover, which is how the lockup confirms it is clickable.
 */
export function Wordmark({ name, className }: { name: string; className?: string }) {
  const [given, ...rest] = name.split(' ');
  const family = rest.join(' ');

  return (
    <span className={cn('font-display font-semibold tracking-tight', className)}>
      <span className="text-fg">{given}</span>
      {family ? (
        <span className="text-fg-muted group-hover:text-fg duration-fast transition-colors">
          {' '}
          {family}
        </span>
      ) : null}
      <span aria-hidden className="text-accent">
        .
      </span>
    </span>
  );
}

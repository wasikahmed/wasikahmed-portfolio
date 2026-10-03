import { cn } from '@/lib/cn';
import type { BrandIconData } from '@/lib/brand-icons';

/**
 * One brand mark, in `currentColor`, sized by the caller (`size-3.5` beside
 * body text). Always decorative: every place this renders, the brand's name
 * is already in the text next to it, so a screen reader announcing it
 * twice would be noise. Renders nothing for an unknown brand, so callers
 * can pass a lookup result straight through.
 */
export function BrandIcon({
  icon,
  className,
}: {
  icon: BrandIconData | undefined;
  className?: string;
}) {
  if (!icon) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
      className={cn('size-3.5 shrink-0', className)}
      {...(icon.stroke
        ? {
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: 1.8,
            strokeLinejoin: 'round' as const,
            strokeLinecap: 'round' as const,
          }
        : { fill: 'currentColor' })}
    >
      <path d={icon.path} fillRule={icon.evenOdd ? 'evenodd' : undefined} />
    </svg>
  );
}

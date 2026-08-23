import { cn } from '@/lib/cn';

export function Tag({
  children,
  className,
  tone = 'default',
}: {
  children: React.ReactNode;
  className?: string;
  tone?: 'default' | 'accent';
}) {
  return (
    <span
      className={cn(
        'text-2xs inline-flex items-center rounded-xs border px-2 py-0.5 font-mono whitespace-nowrap',
        tone === 'default' && 'border-border-subtle bg-accent-whisper text-fg-muted',
        tone === 'accent' && 'border-border-strong bg-accent-soft text-accent',
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Caps a tag list and collapses the rest into a count.
 *
 * Chip walls are the classic portfolio noise-maker — twelve tags say less
 * than three, because nobody reads twelve. PLAN.md §2.3.
 */
export function TagList({
  items,
  max = 3,
  className,
}: {
  items: string[];
  max?: number;
  className?: string;
}) {
  const visible = items.slice(0, max);
  const overflow = items.length - visible.length;

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {visible.map((item) => (
        <Tag key={item}>{item}</Tag>
      ))}
      {overflow > 0 ? (
        <span className="text-2xs text-fg-subtle font-mono" title={items.slice(max).join(', ')}>
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}

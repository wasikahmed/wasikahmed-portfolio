import { cn } from '@/lib/cn';

/**
 * The mono section label. Optionally trails a gradient rule that fills the
 * remaining width — cheap structure that helps the eye find section starts
 * without adding another ambient layer.
 */
export function Eyebrow({
  children,
  className,
  rule = false,
}: {
  children: React.ReactNode;
  className?: string;
  rule?: boolean;
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="text-accent font-mono text-xs tracking-widest uppercase">{children}</span>
      {rule ? (
        <span
          aria-hidden
          className="from-border-strong h-px flex-1 bg-gradient-to-r to-transparent"
        />
      ) : null}
    </div>
  );
}

/** Live availability indicator. Carries state, so it earns its animation. */
export function StatusDot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('bg-accent inline-block h-1.5 w-1.5 rounded-full', className)}
      style={{ animation: 'pulse-ring 3.5s ease-in-out infinite' }}
    />
  );
}

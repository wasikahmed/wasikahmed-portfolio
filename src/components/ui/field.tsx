import { cn } from '@/lib/cn';

/*
 * 16px below `sm`, not `text-sm`: iOS Safari zooms the whole page into any
 * focused field under 16px and leaves it zoomed after the keyboard closes.
 * Disabling zoom in the viewport meta would stop it too, but at the cost of
 * pinch-zoom for everyone who needs it.
 */
const base = [
  'w-full rounded-md border border-border bg-surface-1 px-3.5 py-2.5',
  'text-base sm:text-sm text-fg placeholder:text-fg-subtle',
  'transition-[border-color,box-shadow] duration-fast',
  'focus:border-border-strong focus:outline-none',
  'focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-accent)_10%,transparent)]',
].join(' ');

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(base, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(base, 'min-h-32 resize-y', className)} {...props} />;
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(base, 'cursor-pointer', className)} {...props} />;
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        'text-2xs text-fg-muted mb-1.5 block font-mono tracking-wide uppercase',
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-2xs text-fg-subtle mt-1.5">{hint}</p> : null}
    </div>
  );
}

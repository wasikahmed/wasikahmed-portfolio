import { cn } from '@/lib/cn';

const TONES = {
  info: { border: 'border-l-accent', bg: 'bg-accent-whisper', label: 'Note' },
  warning: {
    border: 'border-l-signal-amber',
    bg: 'bg-[color-mix(in_oklab,var(--color-signal-amber)_8%,transparent)]',
    label: 'Careful',
  },
  success: {
    border: 'border-l-accent-bright',
    bg: 'bg-[color-mix(in_oklab,var(--color-accent-bright)_8%,transparent)]',
    label: 'Result',
  },
} as const;

/**
 * `<Callout>` — one of the plan's four MDX custom blocks. A short aside
 * that would otherwise be a plain paragraph indistinguishable from prose;
 * the coloured rail is the only signal, no icon or extra chrome.
 */
export function Callout({
  type = 'info',
  title,
  children,
}: {
  type?: keyof typeof TONES;
  title?: string;
  children: React.ReactNode;
}) {
  const tone = TONES[type];
  return (
    <div
      className={cn('not-prose my-6 rounded-r-md border-l-2 py-3 pr-4 pl-5', tone.border, tone.bg)}
    >
      <p className="text-2xs text-fg-subtle font-mono tracking-widest uppercase">
        {title ?? tone.label}
      </p>
      <div className="text-fg mt-1.5 text-sm leading-relaxed [&_p]:mt-2 [&_p:first-child]:mt-0">
        {children}
      </div>
    </div>
  );
}

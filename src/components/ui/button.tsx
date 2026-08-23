import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const button = cva(
  [
    'inline-flex items-center justify-center gap-2 rounded-md font-medium',
    'transition-[transform,background-color,border-color,box-shadow,color]',
    'duration-fast ease-out-quint',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:translate-y-0',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-gradient-to-br from-accent to-accent-bright text-bg',
          'hover:-translate-y-0.5 hover:shadow-[0_10px_32px_color-mix(in_oklab,var(--color-accent)_32%,transparent)]',
        ],
        ghost: [
          'border border-border text-fg',
          'hover:-translate-y-0.5 hover:border-border-strong hover:bg-accent-whisper',
        ],
        subtle: ['bg-surface-3 text-fg', 'hover:bg-surface-4'],
        link: ['rounded-none px-0 text-accent underline-offset-4', 'hover:underline'],
      },
      size: {
        sm: 'h-9 px-3.5 text-sm',
        md: 'h-11 px-5 text-sm',
        lg: 'h-12 px-6 text-base',
      },
    },
    compoundVariants: [{ variant: 'link', size: ['sm', 'md', 'lg'], class: 'h-auto px-0' }],
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type ButtonVariants = VariantProps<typeof button>;

type ButtonAsButton = ButtonVariants &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: never };

type ButtonAsLink = ButtonVariants &
  Omit<React.ComponentPropsWithoutRef<typeof Link>, 'href'> & { href: string };

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant, size, className, ...rest } = props;
  const classes = cn(button({ variant, size }), className);

  if ('href' in rest && rest.href !== undefined) {
    const { href, ...linkProps } = rest as ButtonAsLink;
    const isExternal = /^(https?:|mailto:|tel:)/.test(href);

    if (isExternal) {
      return (
        <a
          href={href}
          className={classes}
          {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          {...(linkProps as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        />
      );
    }

    return <Link href={href} className={classes} {...linkProps} />;
  }

  return <button className={classes} {...(rest as ButtonAsButton)} />;
}

/** The arrow that trails a primary CTA. Nudges right on hover of the parent. */
export function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
      className={cn(
        'duration-fast h-4 w-4 transition-transform group-hover:translate-x-0.5',
        className,
      )}
    >
      <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

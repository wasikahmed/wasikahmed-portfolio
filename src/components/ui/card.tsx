import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

/**
 * Surface treatments.
 *
 * The prototype made everything a glass card, which erased all hierarchy —
 * if every element is elevated, none of them are. Glass is now reserved for
 * genuinely interactive or floating things; content sits on flat surfaces.
 */
const card = cva('relative rounded-lg transition-all duration-base ease-out-quint', {
  variants: {
    variant: {
      /** Default for content. Flat, quiet, recedes. */
      flat: 'border border-border-subtle bg-surface-1',
      /** One step up. For grouped content that needs separating. */
      raised: 'border border-border-subtle bg-surface-2 shadow-e1',
      /** Reserved for floating UI — tooltips, popovers, pinned bars. */
      glass: 'border border-border bg-surface-2/70 shadow-e2 backdrop-blur-xl',
      /** Outline only. For empty states and secondary groupings. */
      outline: 'border border-border-subtle bg-transparent',
    },
    interactive: {
      true: 'cursor-pointer hover:-translate-y-1 hover:border-border-strong hover:shadow-e3',
      false: '',
    },
    padding: {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
  },
  defaultVariants: { variant: 'flat', interactive: false, padding: 'md' },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof card> {}

export function Card({ variant, interactive, padding, className, ...props }: CardProps) {
  return <div className={cn(card({ variant, interactive, padding }), className)} {...props} />;
}

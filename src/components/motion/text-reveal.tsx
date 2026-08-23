'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/cn';

export interface TextRevealProps {
  /** The line to reveal. Split on whitespace into animated words. */
  text: string;
  /** Words at these indices get the accent gradient. */
  accentWords?: number[];
  delay?: number;
  className?: string;
}

/**
 * Kinetic type for the hero headline: words rise from behind a clipping
 * mask in sequence, so the line assembles itself rather than fading in.
 *
 * Used once, on the largest text on the site. Reserved deliberately —
 * applying it to every heading is what turns a signature into a tic.
 */
export function TextReveal({ text, accentWords = [], delay = 0, className }: TextRevealProps) {
  const words = text.split(' ');
  const accent = new Set(accentWords);

  return (
    <motion.span
      className={cn('flex flex-wrap', className)}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.055, delayChildren: delay } },
      }}
      aria-label={text}
    >
      {words.map((word, index) => (
        // Must be a `motion` element, not a plain span: variants propagate
        // only through motion components, so a plain wrapper here would
        // break the chain and strand every word in its hidden state.
        <motion.span
          key={`${word}-${index}`}
          // The mask the word rises out of. Vertical padding keeps
          // descenders (g, y, p) from being clipped mid-animation.
          className="inline-flex overflow-hidden py-[0.12em]"
          aria-hidden
        >
          <motion.span
            className={cn(
              'inline-block',
              accent.has(index) &&
                'from-accent to-accent-bright bg-gradient-to-br bg-clip-text text-transparent',
            )}
            variants={{
              hidden: { y: '105%' },
              visible: {
                y: '0%',
                transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] },
              },
            }}
          >
            {word}
            {index < words.length - 1 ? ' ' : ''}
          </motion.span>
        </motion.span>
      ))}
    </motion.span>
  );
}

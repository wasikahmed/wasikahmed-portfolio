'use client';

import { motion, type Variants } from 'motion/react';
import { cn } from '@/lib/cn';

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

const OFFSET: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 24 },
  down: { x: 0, y: -24 },
  left: { x: 24, y: 0 },
  right: { x: -24, y: 0 },
  none: { x: 0, y: 0 },
};

export interface RevealProps {
  children: React.ReactNode;
  /** Direction the content travels *from*. */
  direction?: Direction;
  /** Seconds to wait before starting. Use for deliberate sequencing. */
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'span';
}

/**
 * Scroll-triggered reveal. Fires once, never replays on scroll-back —
 * re-animating content the reader has already seen is noise, not polish.
 *
 * Under reduced motion the `MotionProvider` collapses this to an instant
 * state change, so content still appears; it simply does not travel.
 */
export function Reveal({
  children,
  direction = 'up',
  delay = 0,
  className,
  as = 'div',
}: RevealProps) {
  const offset = OFFSET[direction];

  const variants: Variants = {
    hidden: { opacity: 0, ...offset },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.62,
        delay,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  const MotionTag = motion[as];

  return (
    <MotionTag
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15, margin: '0px 0px -80px 0px' }}
      variants={variants}
    >
      {children}
    </MotionTag>
  );
}

/**
 * Staggers direct `<Reveal>`-style children into view as a group.
 * Pair with `<StaggerItem>`.
 */
export function Stagger({
  children,
  className,
  gap = 0.07,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  /** Seconds between each child. */
  gap?: number;
  delay?: number;
}) {
  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.12, margin: '0px 0px -80px 0px' }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: gap, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  direction = 'up',
}: {
  children: React.ReactNode;
  className?: string;
  direction?: Direction;
}) {
  const offset = OFFSET[direction];

  return (
    <motion.div
      className={cn(className)}
      variants={{
        hidden: { opacity: 0, ...offset },
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

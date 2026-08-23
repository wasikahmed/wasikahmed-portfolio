'use client';

import { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { usePrefersReducedMotion } from './use-reduced-motion';
import { cn } from '@/lib/cn';

export interface MagneticProps {
  children: React.ReactNode;
  /** Maximum travel in px. Kept small on purpose — this is a hint, not a stunt. */
  strength?: number;
  className?: string;
}

/**
 * Subtle magnetic pull toward the cursor.
 *
 * Qualifies under Rule 1(b) — it confirms that a control is interactive
 * before you commit to clicking it. Reserved for primary CTAs only; the
 * full custom cursor it descends from was cut (PLAN.md §2.6) because it
 * replaced a native affordance with a laggy imitation.
 *
 * Disabled entirely for reduced motion and on coarse pointers, where
 * there is no hover state to anticipate.
 */
export function Magnetic({ children, strength = 8, className }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = usePrefersReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 260, damping: 22, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 260, damping: 22, mass: 0.4 });

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReduced || !ref.current) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const rect = ref.current.getBoundingClientRect();
    const relX = (event.clientX - rect.left) / rect.width - 0.5;
    const relY = (event.clientY - rect.top) / rect.height - 0.5;

    x.set(relX * strength * 2);
    y.set(relY * strength * 2);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={cn('inline-flex', className)}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMove}
      onMouseLeave={reset}
    >
      {children}
    </motion.div>
  );
}

'use client';

import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { usePrefersReducedMotion } from '@/components/motion/use-reduced-motion';
import { cn } from '@/lib/cn';

/**
 * Cursor-tracked glow. Hero only.
 *
 * Counts as one ambient layer against the section's budget of two.
 * Renders nothing under reduced motion or on a coarse pointer — a glow
 * that cannot follow anything is pure cost.
 *
 * Listens on its *parent* element rather than on an overlay of its own:
 * a full-cover element with pointer events enabled would swallow every
 * click on the content beneath it.
 */
export function Spotlight({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = usePrefersReducedMotion();

  const x = useMotionValue(-9999);
  const y = useMotionValue(-9999);
  const springX = useSpring(x, { stiffness: 140, damping: 26, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 140, damping: 26, mass: 0.5 });

  const left = useTransform(springX, (v) => `${v - 260}px`);
  const top = useTransform(springY, (v) => `${v - 260}px`);

  useEffect(() => {
    if (prefersReduced) return;

    const host = ref.current?.parentElement;
    if (!host) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      const rect = host.getBoundingClientRect();
      x.set(event.clientX - rect.left);
      y.set(event.clientY - rect.top);
    };

    const onLeave = () => {
      x.set(-9999);
      y.set(-9999);
    };

    host.addEventListener('pointermove', onMove, { passive: true });
    host.addEventListener('pointerleave', onLeave, { passive: true });
    return () => {
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
    };
  }, [prefersReduced, x, y]);

  if (prefersReduced) return null;

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 hidden overflow-hidden md:block',
        className,
      )}
    >
      <motion.div
        className="absolute h-[520px] w-[520px] rounded-full"
        style={{
          left,
          top,
          background:
            'radial-gradient(circle, color-mix(in oklab, var(--color-accent) 13%, transparent) 0%, transparent 68%)',
          filter: 'blur(30px)',
        }}
      />
    </div>
  );
}

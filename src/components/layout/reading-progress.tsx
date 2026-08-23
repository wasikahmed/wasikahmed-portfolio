'use client';

import { motion, useScroll, useSpring } from 'motion/react';

/**
 * Reading progress for long-form pages. Carries information — how much is
 * left — so it qualifies under Rule 1(a) despite being decorative-looking.
 */
export function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });

  return (
    <motion.div
      aria-hidden
      className="from-accent to-accent-bright fixed inset-x-0 top-16 z-40 h-px origin-left bg-gradient-to-r"
      style={{ scaleX }}
    />
  );
}

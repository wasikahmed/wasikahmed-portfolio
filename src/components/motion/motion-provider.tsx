'use client';

import { MotionConfig } from 'motion/react';

/**
 * Global motion gate. `reducedMotion="user"` makes every `motion` component
 * respect the OS setting automatically.
 *
 * This is one of three layers, all of which must exist:
 *   1. the CSS kill switch in globals.css  — catches animations we didn't author
 *   2. this provider                        — catches JS-driven motion
 *   3. usePrefersReducedMotion()            — lets components render static trees
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react';
import type { ArchitectureNode } from '@/lib/types';
import { usePrefersReducedMotion } from '@/components/motion/use-reduced-motion';

/**
 * One stage of the diagram.
 *
 * Its own component so the `useTransform` hooks run at a component's top
 * level rather than inside a loop in the parent.
 */
function Stage({
  node,
  index,
  total,
  drawn,
  still,
}: {
  node: ArchitectureNode;
  index: number;
  total: number;
  drawn: MotionValue<number>;
  still: boolean;
}) {
  const start = index / total;
  /*
   * The dim state is 0.8, not the 0.35 it used to be. On a tall viewport
   * (1440x1800) the scroll range above never completes — the diagram is
   * already past `center 0.4` before enough scroll exists to drive it, so
   * the last stages topped out around 0.67 and the first sat at 0.35 for
   * the whole visit. At 0.35 the detail line measured 1.9:1; the stage was
   * decorative-looking text nobody could read. 0.8 keeps the light-up
   * legible (the gradient rule beside it still draws the sequence) while
   * guaranteeing ~5:1 even if progress never advances at all.
   */
  const opacity = useTransform(drawn, [start, start + 0.12], [0.8, 1]);
  const x = useTransform(drawn, [start, start + 0.12], [-6, 0]);

  return (
    <motion.li
      className="relative flex gap-5 py-3.5 pl-9"
      style={still ? undefined : { opacity, x }}
    >
      <span
        aria-hidden
        className="border-border bg-bg absolute top-[1.15rem] left-0 grid h-[23px] w-[23px] place-items-center rounded-full border"
      >
        <span className="bg-accent h-1.5 w-1.5 rounded-full" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-2xs text-accent font-mono tracking-wide uppercase">
          {String(index + 1).padStart(2, '0')} · {node.label}
        </p>
        <p className="text-fg-muted mt-1 text-sm">{node.detail}</p>
      </div>
    </motion.li>
  );
}

/**
 * Signature interaction #3 (PLAN.md §2.5).
 *
 * The diagram draws itself along scroll progress, and each stage lights up
 * as the line reaches it. The animation *is* the explanation — the system
 * is revealed in the order it executes, rather than dumped as a finished
 * picture the reader has to decode backwards.
 *
 * Under reduced motion it renders complete and static: the sequencing is a
 * bonus, the information is not.
 */
export function Architecture({ nodes }: { nodes: ArchitectureNode[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = usePrefersReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    // Starts as the diagram enters and completes near mid-viewport, so it
    // finishes while the reader is still looking at it.
    offset: ['start 0.85', 'center 0.4'],
  });

  return (
    <div ref={ref} className="not-prose my-10">
      <ol className="relative flex flex-col gap-0">
        <span aria-hidden className="bg-border-subtle absolute top-3 bottom-3 left-[11px] w-px" />
        <motion.span
          aria-hidden
          className="from-accent to-accent-bright absolute top-3 bottom-3 left-[11px] w-px origin-top bg-gradient-to-b"
          style={{ scaleY: prefersReduced ? 1 : scrollYProgress }}
        />

        {nodes.map((node, index) => (
          <Stage
            key={node.id}
            node={node}
            index={index}
            total={nodes.length}
            drawn={scrollYProgress}
            still={prefersReduced}
          />
        ))}
      </ol>
    </div>
  );
}

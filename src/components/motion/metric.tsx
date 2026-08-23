'use client';

import { useEffect, useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { cn } from '@/lib/cn';
import { usePrefersReducedMotion } from './use-reduced-motion';

const COUNT_MS = 1100;

export interface MetricProps {
  /** The headline number. Strings like "$140k" or "4 min" are fine. */
  value: string;
  /** What the number means. Short — three or four words. */
  label: string;
  /**
   * The before/after that makes the number evidence rather than marketing.
   * e.g. "3.1 hrs/day → 14 min/day". Revealed once the count settles.
   */
  baseline?: string;
  className?: string;
}

/** Pulls the leading number out of "92%" / "$140k" / "4 min" for animation. */
function parseValue(value: string) {
  const match = value.match(/^([^0-9-]*)(-?[\d.,]+)(.*)$/);
  if (!match) return null;

  const [, prefix, digits, suffix] = match;
  const numeric = Number(digits.replace(/,/g, ''));
  if (!Number.isFinite(numeric)) return null;

  const decimals = digits.includes('.') ? (digits.split('.')[1]?.length ?? 0) : 0;
  return { prefix, numeric, suffix, decimals };
}

/**
 * Signature interaction #4 (PLAN.md §2.5).
 *
 * A percentage with no baseline is marketing. With one, it is evidence —
 * so the count-up is only half the component. The baseline fades in after
 * the number settles, sequenced so the eye lands on the headline first.
 *
 * The ticking number is written straight to the DOM via rAF rather than
 * through React state: re-rendering 60 times a second to animate one string
 * is wasteful, and it keeps this component free of effect-driven setState.
 */
export function Metric({ value, label, baseline, className }: MetricProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(hostRef, { once: true, amount: 0.5 });
  const prefersReduced = usePrefersReducedMotion();

  const parsed = parseValue(value);
  const animates = Boolean(parsed) && !prefersReduced;

  useEffect(() => {
    const el = numberRef.current;
    if (!inView || !el) return;

    if (!parsed || prefersReduced) {
      el.textContent = value;
      return;
    }

    const { prefix, numeric, suffix, decimals } = parsed;
    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now: number) {
      const progress = Math.min((now - start) / COUNT_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = `${prefix}${(numeric * eased).toFixed(decimals)}${suffix}`;

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        // Snap to the authored string so "$140k" doesn't render as "$140.00k".
        el.textContent = value;
      }
    });

    return () => cancelAnimationFrame(frame);
    // `parsed` is derived from `value`, which is already a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value, prefersReduced]);

  return (
    <div ref={hostRef} className={cn('flex flex-col gap-1', className)}>
      <span className="font-display text-fg text-3xl font-bold tracking-tight tabular-nums">
        {/* Server-renders the real value, so it is correct with JS disabled. */}
        <span ref={numberRef}>{animates ? `${parsed!.prefix}0${parsed!.suffix}` : value}</span>
      </span>
      <span className="text-fg-muted text-sm">{label}</span>

      {baseline ? (
        <motion.span
          className="text-2xs text-accent mt-1 font-mono"
          initial={{ opacity: 0, y: 4 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{
            duration: 0.45,
            // Wait for the count to land before revealing what it means.
            delay: animates ? COUNT_MS / 1000 : 0,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {baseline}
        </motion.span>
      ) : null}
    </div>
  );
}

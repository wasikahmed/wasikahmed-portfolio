'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Tech } from '@/lib/types';
import { usePrefersReducedMotion } from '@/components/motion/use-reduced-motion';
import { cn } from '@/lib/cn';

const WIDTH = 820;
const HEIGHT = 280;
const LENS_RADIUS = 150;
const LENS_STRENGTH = 16;

interface Placed {
  name: string;
  projects: string[];
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Deterministic PRNG so server and client produce an identical layout. */
function makeRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/** Approximate chip width from the label — mono at 11px is near-monospaced. */
function chipWidth(name: string) {
  return Math.round(name.length * 6.4) + 22;
}

/**
 * Force-directed layout, relaxed once and then frozen.
 *
 * Runs at module scope rather than per render: the seed is fixed, so the
 * result is deterministic, SSR-safe, and identical across reloads. Nodes
 * that share a project attract; everything repels; a weak pull toward
 * centre keeps the graph from drifting into the margins.
 */
function computeLayout(tech: Tech[]): { nodes: Placed[]; edges: [number, number][] } {
  const random = makeRandom(20260823);

  /*
   * Seed on a ring rather than uniformly at random. A random box start
   * lets the relaxation settle into whatever clump it began in, which
   * left one half of the graph empty; a ring gives every node room to be
   * pulled inward by its own edges.
   */
  const nodes: Placed[] = tech.map((t, i) => {
    const angle = (i / tech.length) * Math.PI * 2;
    const jitter = 0.85 + random() * 0.3;
    return {
      name: t.name,
      projects: [...t.projects],
      x: WIDTH / 2 + Math.cos(angle) * WIDTH * 0.42 * jitter,
      y: HEIGHT / 2 + Math.sin(angle) * HEIGHT * 0.36 * jitter,
      w: chipWidth(t.name),
      h: 26,
    };
  });

  // An edge means "used together on at least one project".
  const edges: [number, number][] = [];
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      if (nodes[i].projects.some((p) => nodes[j].projects.includes(p))) {
        edges.push([i, j]);
      }
    }
  }

  for (let iteration = 0; iteration < 320; iteration += 1) {
    const cooling = 1 - iteration / 320;

    // Repulsion — keeps chips from overlapping.
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i];
        const b = nodes[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.01;

        // Compare against the space the two chips actually occupy.
        const minDist = (a.w + b.w) / 2 + 30;
        if (dist < minDist) {
          const push = ((minDist - dist) / dist) * 0.5 * cooling;
          dx *= push;
          dy *= push;
          a.x -= dx;
          a.y -= dy;
          b.x += dx;
          b.y += dy;
        }
      }
    }

    // Attraction along shared-project edges.
    for (const [i, j] of edges) {
      const a = nodes[i];
      const b = nodes[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy) || 0.01;
      const ideal = 178;
      const pull = ((dist - ideal) / dist) * 0.012 * cooling;
      a.x += dx * pull;
      a.y += dy * pull;
      b.x -= dx * pull;
      b.y -= dy * pull;
    }

    // Weak centring, and keep everything inside the viewBox.
    for (const node of nodes) {
      node.x += (WIDTH / 2 - node.x) * 0.0015 * cooling;
      node.y += (HEIGHT / 2 - node.y) * 0.03 * cooling;
      node.x = Math.min(WIDTH - node.w / 2 - 6, Math.max(node.w / 2 + 6, node.x));
      node.y = Math.min(HEIGHT - node.h / 2 - 6, Math.max(node.h / 2 + 6, node.y));
    }
  }

  /*
   * Fit to frame.
   *
   * The graph is dense — every pair of tools sharing a project is an edge —
   * so attraction always settles it into a ball somewhere near the middle,
   * whatever the force constants are. Rather than fighting that, relax
   * first for good *relative* placement, then rescale the result to fill
   * the viewBox. Structure comes from the physics, use of space does not.
   */
  const pad = 8;
  const minX = Math.min(...nodes.map((n) => n.x - n.w / 2));
  const maxX = Math.max(...nodes.map((n) => n.x + n.w / 2));
  const minY = Math.min(...nodes.map((n) => n.y - n.h / 2));
  const maxY = Math.max(...nodes.map((n) => n.y + n.h / 2));

  const scaleX = (WIDTH - pad * 2) / Math.max(maxX - minX, 1);
  const scaleY = (HEIGHT - pad * 2) / Math.max(maxY - minY, 1);

  for (const node of nodes) {
    node.x = pad + (node.x - minX) * scaleX;
    node.y = pad + (node.y - minY) * scaleY;
    // Chips keep their intrinsic size, so re-clamp after scaling.
    node.x = Math.min(WIDTH - node.w / 2 - 2, Math.max(node.w / 2 + 2, node.x));
    node.y = Math.min(HEIGHT - node.h / 2 - 2, Math.max(node.h / 2 + 2, node.y));
  }

  return { nodes, edges };
}

/**
 * Signature interaction #1 (PLAN.md §2.5, §2.9).
 *
 * Replaces the prototype's twelve perpetually floating icon tiles — the
 * single biggest noise reduction on the page. Nodes are completely static
 * until the cursor approaches; hovering answers "where did you use this",
 * and clicking filters /work.
 */
export function Constellation({ tech }: { tech: Tech[] }) {
  const router = useRouter();
  const prefersReduced = usePrefersReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const nodeRefs = useRef<(SVGGElement | null)[]>([]);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const frame = useRef<number>(0);
  const [hovered, setHovered] = useState<number | null>(null);

  // Computed once per mount from the tech prop delivered for this page
  // load — the 320-iteration relaxation is too costly to redo on every
  // render, but the data itself now comes from the database rather than
  // a module-scope import, so it can no longer be precomputed at load time.
  const { nodes, edges } = useMemo(() => computeLayout(tech), [tech]);

  /** Neighbours of the hovered node, for the highlight/dim pass. */
  const neighbours = useMemo(() => {
    if (hovered === null) return null;
    const set = new Set<number>([hovered]);
    for (const [i, j] of edges) {
      if (i === hovered) set.add(j);
      if (j === hovered) set.add(i);
    }
    return set;
  }, [hovered, edges]);

  /*
   * Cursor lens. Transforms are written straight to the DOM in a rAF loop
   * rather than through React state — re-rendering fourteen nodes per frame
   * to move them a few pixels would be pure waste.
   */
  useEffect(() => {
    if (prefersReduced) return;
    const svg = svgRef.current;
    if (!svg) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const tick = () => {
      const p = pointer.current;
      for (let i = 0; i < nodes.length; i += 1) {
        const el = nodeRefs.current[i];
        if (!el) continue;

        let dx = 0;
        let dy = 0;
        if (p) {
          const vx = nodes[i].x - p.x;
          const vy = nodes[i].y - p.y;
          const dist = Math.hypot(vx, vy);
          if (dist < LENS_RADIUS && dist > 0.01) {
            // Falls off with distance, so the effect stays local.
            const force = (1 - dist / LENS_RADIUS) ** 2 * LENS_STRENGTH;
            dx = (vx / dist) * force;
            dy = (vy / dist) * force;
          }
        }
        el.style.transform = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px)`;
      }
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);

    const toLocal = (event: PointerEvent) => {
      const rect = svg.getBoundingClientRect();
      pointer.current = {
        x: ((event.clientX - rect.left) / rect.width) * WIDTH,
        y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
      };
    };
    const clear = () => {
      pointer.current = null;
    };

    svg.addEventListener('pointermove', toLocal, { passive: true });
    svg.addEventListener('pointerleave', clear, { passive: true });
    return () => {
      cancelAnimationFrame(frame.current);
      svg.removeEventListener('pointermove', toLocal);
      svg.removeEventListener('pointerleave', clear);
    };
  }, [nodes, prefersReduced]);

  const open = (name: string) => router.push(`/work?tech=${encodeURIComponent(name)}`);

  return (
    <div className="w-full">
      {/* Desktop / tablet: the graph. */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="hidden h-auto w-full touch-none select-none sm:block"
        role="group"
        aria-label="Technologies, linked where they were used on the same project"
      >
        <g>
          {edges.map(([i, j]) => {
            const dim = neighbours !== null && !(neighbours.has(i) && neighbours.has(j));
            const lit = neighbours !== null && neighbours.has(i) && neighbours.has(j);
            return (
              <line
                key={`${i}-${j}`}
                x1={nodes[i].x}
                y1={nodes[i].y}
                x2={nodes[j].x}
                y2={nodes[j].y}
                stroke="var(--color-accent)"
                strokeWidth={lit ? 1 : 0.6}
                strokeOpacity={dim ? 0.04 : lit ? 0.45 : 0.13}
                className="duration-base transition-all"
              />
            );
          })}
        </g>

        <g>
          {nodes.map((node, index) => {
            const isHovered = hovered === index;
            const dim = neighbours !== null && !neighbours.has(index);
            const count = node.projects.length;

            return (
              <g
                key={node.name}
                ref={(el) => {
                  nodeRefs.current[index] = el;
                }}
                className="duration-base cursor-pointer transition-[opacity]"
                style={{ opacity: dim ? 0.28 : 1 }}
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(index)}
                onBlur={() => setHovered(null)}
                onClick={() => open(node.name)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    open(node.name);
                  }
                }}
                tabIndex={0}
                role="link"
                aria-label={`${node.name} — used in ${count} project${count === 1 ? '' : 's'}`}
              >
                <rect
                  x={node.x - node.w / 2}
                  y={node.y - node.h / 2}
                  width={node.w}
                  height={node.h}
                  rx={6}
                  fill={isHovered ? 'var(--color-accent-soft)' : 'var(--color-surface-2)'}
                  stroke={isHovered ? 'var(--color-accent)' : 'var(--color-border)'}
                  strokeWidth={1}
                  className="duration-base transition-all"
                />
                <text
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  className="duration-base pointer-events-none font-mono transition-colors"
                  style={{
                    fontSize: 11,
                    fill: isHovered ? 'var(--color-accent)' : 'var(--color-fg-muted)',
                  }}
                >
                  {node.name}
                </text>

                {/* Project count — the payload. Only while engaged. */}
                {isHovered ? (
                  <text
                    x={node.x}
                    y={node.y - node.h / 2 - 8}
                    textAnchor="middle"
                    className="pointer-events-none font-mono"
                    style={{ fontSize: 10, fill: 'var(--color-fg-subtle)' }}
                  >
                    {count} project{count === 1 ? '' : 's'} →
                  </text>
                ) : null}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Mobile: no pointer to bend the graph with, so a tappable grid. */}
      <ul className="flex flex-wrap gap-2 sm:hidden">
        {nodes.map((node) => (
          <li key={node.name}>
            <button
              type="button"
              onClick={() => open(node.name)}
              className="border-border-subtle bg-surface-2 text-2xs text-fg-muted rounded-sm border px-2.5 py-1.5 font-mono"
            >
              {node.name}
              <span className="text-fg-subtle ml-1.5">{node.projects.length}</span>
            </button>
          </li>
        ))}
      </ul>

      <p
        className={cn(
          'text-fg-subtle mt-4 font-mono text-xs',
          prefersReduced ? '' : 'hidden sm:block',
        )}
      >
        {prefersReduced
          ? 'Select a tool to filter work by it.'
          : 'Hover to see what it was used alongside · click to filter work'}
      </p>
    </div>
  );
}

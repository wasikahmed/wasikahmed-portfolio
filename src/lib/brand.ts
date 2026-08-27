/**
 * Brand mark geometry — the single source of truth for the logo's shape.
 *
 * The mark is a "W" drawn as a four-stage pipeline: five nodes joined by one
 * continuous path, with the terminal node carrying `accent-bright` to read as
 * a shipped output. It rhymes deliberately with the tech constellation on the
 * home page, which is the site's other node-graph surface.
 *
 * Everything is authored on a 32×32 grid because the favicon is the size that
 * actually constrains the design — anything that survives 16px survives the
 * hero. `MARK_SMALL` holds the fattened variant used below ~24px, where the
 * hairline path and 3px nodes start to disappear into the tab strip.
 */

export const MARK_VIEWBOX = '0 0 32 32';

/** Vertices in draw order: input → three transforms → output. */
export const MARK_NODES = [
  { cx: 5, cy: 9 },
  { cx: 11.5, cy: 23 },
  { cx: 16, cy: 14 },
  { cx: 20.5, cy: 23 },
  { cx: 27, cy: 9 },
] as const;

export const MARK_PATH = 'M5 9 L11.5 23 L16 14 L20.5 23 L27 9';

/** Default weights. Legible from 24px up. */
export const MARK_DEFAULT = { stroke: 1.8, node: 3 } as const;

/** Weights for 16–24px. Same geometry, thickened so it holds at tab size. */
export const MARK_SMALL = { stroke: 2.4, node: 3.4 } as const;

/**
 * Token values duplicated as literals.
 *
 * AGENTS.md §4.2 bans hardcoded hex in components, and these are not for
 * components — they are for `next/og` (`icon`, `apple-icon`, `opengraph-image`),
 * which renders through Satori in a Node process with no stylesheet and no
 * `color-mix()` support. There is no way to read a Tailwind `@theme` token from
 * that context, so the values are mirrored here rather than scattered across
 * three image routes.
 *
 * These MUST be kept in sync with the accent ramp in `src/app/globals.css`.
 */
export const BRAND_COLORS = {
  bg: '#0a0e0c',
  fg: '#eaf2ed',
  fgMuted: '#93a49c',
  accent: '#0fbf7a',
  accentBright: '#7ce86a',
} as const;

/**
 * The mark as a standalone SVG string.
 *
 * Used by the image routes, which cannot render the React component: Satori
 * only accepts SVG as an `<img>` source, not as JSX children.
 */
export function markSvg({
  size = 32,
  stroke = BRAND_COLORS.accent,
  terminal = BRAND_COLORS.accentBright,
  weights = MARK_DEFAULT,
}: {
  size?: number;
  stroke?: string;
  terminal?: string;
  weights?: { stroke: number; node: number };
} = {}) {
  const circles = MARK_NODES.map(
    ({ cx, cy }, i) =>
      `<circle cx="${cx}" cy="${cy}" r="${weights.node}" fill="${
        i === MARK_NODES.length - 1 ? terminal : stroke
      }"/>`,
  ).join('');

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${MARK_VIEWBOX}">`,
    `<path d="${MARK_PATH}" fill="none" stroke="${stroke}" stroke-width="${weights.stroke}" stroke-linecap="round" stroke-linejoin="round"/>`,
    circles,
    `</svg>`,
  ].join('');
}

/**
 * `markSvg` as a data URI, which is the only form Satori's `<img src>` takes.
 *
 * Percent-encoded rather than base64 so this module stays client-safe — `Buffer`
 * is not available in the browser bundle, and `src/lib/` must be importable from
 * a Client Component (the nav is one).
 */
export function markDataUri(options?: Parameters<typeof markSvg>[0]) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markSvg(options))}`;
}

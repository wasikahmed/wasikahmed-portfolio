/**
 * Brand mark geometry — the single source of truth for the logo's shape.
 *
 * The mark is a "W" held inside a bracket pair: the monogram written the way
 * the rest of the site writes everything else. The brackets are dropped to a
 * fraction of full strength so the letter still leads, and they give the mark
 * a silhouette — the thing the previous drawing most lacked.
 *
 * It replaced a "W" drawn as a five-node pipeline (2026-09-04). That version
 * failed for three measurable reasons, all worth recording so they are not
 * reintroduced: the nodes were `r=3` on a 32-unit grid — 6px across each,
 * nearly a fifth of the canvas — against a 1.8px stroke, so it read as beads
 * on a string rather than a letter; its centre apex sat at `y=14` against
 * outer tips at `y=9`, far too shallow for a W; and the single node carrying
 * `accent-bright` read as a status light at logo scale, not as an accent.
 * Nothing here uses a second colour, and it should stay that way.
 *
 * Everything is authored on a 32×32 grid because the favicon is the size that
 * actually constrains the design — anything that survives 16px survives the
 * hero. Two drawings exist rather than one:
 *
 *   `markSvg()` — the bracket mark, for the nav, the footer, and the OG cards.
 *   `tileSvg()` — the letter reversed out of a solid accent tile, for the
 *                 favicon and the iOS icon. A filled shape holds its ground in
 *                 a row of twenty tabs where a thin glyph disappears, and it
 *                 carries its own background so the mark never lands
 *                 accent-on-white when the browser chrome is light.
 */

export const MARK_VIEWBOX = '0 0 32 32';

/** The bracket pair. Two separate paths so each keeps square terminals. */
export const MARK_BRACKETS = ['M9.5 4.5 H5.5 V27.5 H9.5', 'M22.5 4.5 H26.5 V27.5 H22.5'] as const;

/** The W, sized to sit inside the brackets with air on both sides. */
export const MARK_LETTER = 'M11.2 9.8 L14.4 22.2 L16 14.9 L17.6 22.2 L20.8 9.8';

/**
 * The W again, drawn full-width for the tile, where there are no brackets to
 * make room for. Not a scaled copy of `MARK_LETTER` — a letterform that reads
 * at 16px needs its own proportions, not the same one stretched.
 */
export const TILE_LETTER = 'M6.5 9 L11.9 23.6 L16 13.4 L20.1 23.6 L25.5 9';

/** Corner radius of the tile, on the same 32-unit grid. */
export const TILE_RADIUS = 7.5;

export interface MarkWeights {
  bracket: number;
  letter: number;
  /** Brackets are secondary to the letter; never draw them at full strength. */
  bracketOpacity: number;
}

/** Default weights. Legible from 24px up. */
export const MARK_DEFAULT: MarkWeights = { bracket: 2.3, letter: 2.7, bracketOpacity: 0.55 };

/**
 * Weights for 16–24px. Same geometry, thickened, and the brackets brought
 * closer to the letter's strength — at tab size a 55% hairline is the first
 * thing to disappear.
 */
export const MARK_SMALL: MarkWeights = { bracket: 2.8, letter: 3.2, bracketOpacity: 0.7 };

/** Stroke of the knocked-out letter on the tile. */
export const TILE_LETTER_WEIGHT = 3.1;

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
  accent: '#14b8a6',
  accentBright: '#5eead4',
} as const;

/**
 * The bracket mark as a standalone SVG string.
 *
 * Used by the image routes, which cannot render the React component: Satori
 * only accepts SVG as an `<img>` source, not as JSX children.
 */
export function markSvg({
  size = 32,
  color = BRAND_COLORS.accent,
  weights = MARK_DEFAULT,
}: {
  size?: number;
  color?: string;
  weights?: MarkWeights;
} = {}) {
  const brackets = MARK_BRACKETS.map(
    (d) =>
      `<path d="${d}" fill="none" stroke="${color}" stroke-width="${weights.bracket}" stroke-linecap="square" opacity="${weights.bracketOpacity}"/>`,
  ).join('');

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${MARK_VIEWBOX}">`,
    brackets,
    `<path d="${MARK_LETTER}" fill="none" stroke="${color}" stroke-width="${weights.letter}" stroke-linecap="square" stroke-linejoin="round"/>`,
    `</svg>`,
  ].join('');
}

/** The tile mark: letter reversed out of a solid accent tile. */
export function tileSvg({
  size = 32,
  tile = BRAND_COLORS.accent,
  letter = BRAND_COLORS.bg,
  radius = TILE_RADIUS,
}: {
  size?: number;
  tile?: string;
  letter?: string;
  /** Pass 0 for the iOS icon — the OS applies its own mask. */
  radius?: number;
} = {}) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${MARK_VIEWBOX}">`,
    `<rect width="32" height="32" rx="${radius}" fill="${tile}"/>`,
    `<path d="${TILE_LETTER}" fill="none" stroke="${letter}" stroke-width="${TILE_LETTER_WEIGHT}" stroke-linecap="square" stroke-linejoin="round"/>`,
    `</svg>`,
  ].join('');
}

/**
 * An SVG string as a data URI, which is the only form Satori's `<img src>` takes.
 *
 * Percent-encoded rather than base64 so this module stays client-safe — `Buffer`
 * is not available in the browser bundle, and `src/lib/` must be importable from
 * a Client Component (the nav is one).
 */
export function svgDataUri(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function markDataUri(options?: Parameters<typeof markSvg>[0]) {
  return svgDataUri(markSvg(options));
}

export function tileDataUri(options?: Parameters<typeof tileSvg>[0]) {
  return svgDataUri(tileSvg(options));
}

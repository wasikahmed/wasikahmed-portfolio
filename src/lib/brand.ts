/**
 * Brand constants for contexts that cannot read the stylesheet.
 *
 * There is no drawn logo mark any more. The identity is the wordmark
 * (`components/brand/wordmark.tsx`) in the nav and footer, and the portrait
 * everywhere an image has to stand alone: the favicon set and iOS icon
 * (static files in `src/app/`), and the avatar on the OG cards
 * (`public/brand/avatar.png`, loaded by `src/server/og-avatar.tsx`).
 *
 * History, so neither drawing is reintroduced by accident: a "W" drawn as a
 * five-node pipeline (until 2026-09-04) read as beads on a string at 16px,
 * and its one `accent-bright` node read as a status light. The bracket-pair
 * "W" that replaced it was retired on 2026-10-04 — next to the name it only
 * restated the name less legibly, and a photo identifies a personal site in a
 * tab strip better than a monogram does.
 */

/**
 * Token values duplicated as literals.
 *
 * AGENTS.md §4.2 bans hardcoded hex in components, and these are not for
 * components — they are for the `next/og` image routes, which render through
 * Satori in a Node process with no stylesheet and no `color-mix()` support.
 * There is no way to read a Tailwind `@theme` token from that context, so the
 * values are mirrored here rather than scattered across the image routes.
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

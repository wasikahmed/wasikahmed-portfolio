/**
 * Shared Satori font loader for every `next/og` image route (the root
 * `opengraph-image`, and the per-project/per-post ones added for PLAN.md
 * W3). Satori has no access to the fonts `next/font` downloads at build
 * time, so the display face is fetched here instead and memoised for the
 * life of the process — one fetch total, not one per route per request.
 *
 * If the fetch fails (offline build, blocked egress on the VPS) this
 * resolves to `null` rather than throwing, so callers fall through to
 * Satori's default sans instead of failing the whole image.
 */
let displayFont: ArrayBuffer | null | undefined;

export async function loadDisplayFont() {
  if (displayFont !== undefined) return displayFont;

  try {
    const css = await fetch(
      'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600&display=swap',
      { headers: { 'User-Agent': 'Mozilla/5.0' } },
    ).then((r) => r.text());

    const url = css.match(/src:\s*url\((https:[^)]+)\)/)?.[1];
    displayFont = url ? await fetch(url).then((r) => r.arrayBuffer()) : null;
  } catch {
    displayFont = null;
  }

  return displayFont;
}

import type { Metadata } from 'next';

/**
 * `${page} — ${siteName}` — the title convention every page in `(site)`
 * uses. Centralised so replacing the seven pages that used to hardcode
 * "— Wasik Ahmed" (PLAN.md W3) all read from `settings.name` the same way
 * the homepage already did, rather than five slightly different templates.
 */
export function pageTitle(page: string, siteName: string): string {
  return `${page} — ${siteName}`;
}

/**
 * `metadata.alternates.canonical` for a site-relative path. Resolves to an
 * absolute URL against the root layout's `metadataBase`, same mechanism
 * `opengraph-image` already relies on to produce an absolute image URL.
 */
export function canonical(path: string): Metadata['alternates'] {
  return { canonical: path };
}

/**
 * The site-wide social card (`src/app/opengraph-image.tsx`), as metadata.
 *
 * Next resolves a file-based `opengraph-image` into the `openGraph.images` of
 * the segment it lives in — and then, like every other `openGraph` field, a
 * child that sets its own `openGraph` replaces it wholesale. Every page in
 * `(site)` does (`pageMetadata` below, and the group layout), so the root
 * card was silently dropped from all of them: from 2026-08-30 until this was
 * caught on 2026-10-04, the homepage, /about, /work, /writing and /contact
 * shared with no image at all. Naming it explicitly is the fix — but only
 * where there is no closer card: config-based images outrank a file-based
 * one even in the file's own segment, so pages with their own
 * `opengraph-image` (the [slug] routes) must leave `images` unset. See
 * `pageMetadata`'s `ownCard`.
 *
 * `alt` mirrors the route's own `alt` export — keep the two in step.
 */
export const SITE_CARD = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  alt: 'Social card with name, role and tagline.',
};

/**
 * A page's metadata with its social-preview fields filled in to match.
 *
 * Next replaces a parent's `openGraph` object wholesale rather than merging
 * it, so a page that set only `description` used to inherit the root
 * layout's one-size-fits-all `og:description` — every link shared to
 * LinkedIn previewed with the same generic sentence, whatever page it
 * pointed at. Building both from one value keeps the search snippet and
 * the share card saying the same thing.
 */
export function pageMetadata({
  title,
  description,
  path,
  siteName,
  ownCard = false,
}: {
  title: string;
  description: string;
  path: string;
  siteName: string;
  /**
   * The page's segment has its own `opengraph-image` file. Images are then
   * left unset so that file supplies them, and `twitter` is still restated
   * (imageless) so the group layout's site card is not inherited there.
   */
  ownCard?: boolean;
}): Metadata {
  // Spread rather than `images: undefined`: Next treats a present-but-empty
  // key as "this page has no image" and drops the file-based one too.
  const images = ownCard ? {} : { images: [SITE_CARD] };
  return {
    title,
    description,
    alternates: canonical(path),
    openGraph: { type: 'website', siteName, title, description, url: path, ...images },
    // Restated whole for the same wholesale-replace reason; X falls back to
    // og:image anyway, but other `twitter:` consumers do not.
    twitter: { card: 'summary_large_image', ...images },
  };
}

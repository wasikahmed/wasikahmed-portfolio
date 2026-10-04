import type { Metadata } from 'next';

/*
 * Search results show about 60 characters of a title and 155–160 of a
 * description before cutting them off. A per-item title override gets
 * `pageTitle`'s " — {name}" (14 characters) appended, hence its lower cap.
 * Here rather than in schemas.ts so the admin forms' counters, which are
 * Client Components, can read the same numbers the API enforces.
 */
export const META_TITLE_MAX = 60;
export const SEO_TITLE_MAX = 46;
export const META_DESCRIPTION_MAX = 160;

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
 * A description cut to fit a search snippet, at a word boundary.
 *
 * Overrides are capped at the API, but the fallbacks are not: a case
 * study's `problem` or a post's `excerpt` is body copy with no length
 * limit, and the two longest ran past 220 characters — Google then cuts
 * them mid-word wherever it likes.
 */
export function snippet(text: string, max = META_DESCRIPTION_MAX): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.—–-]+$/, '')}…`;
}

/**
 * `metadata.alternates` for a site-relative path: its canonical URL, which
 * resolves to an absolute one against the root layout's `metadataBase`
 * (the same mechanism `opengraph-image` relies on), and the RSS feed.
 *
 * The feed rides along on every page rather than just /writing because
 * `alternates`, like `openGraph`, is replaced wholesale by a child segment
 * — a layout can't add it site-wide — and feed readers and crawlers look
 * for it on whatever page they were given, usually the home page.
 */
export function canonical(path: string): Metadata['alternates'] {
  return { canonical: path, types: { 'application/rss+xml': '/writing/feed.xml' } };
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
  article,
}: {
  title: string;
  description: string;
  path: string;
  siteName: string;
  /**
   * Marks the page as `og:type=article`, with the dates and tags LinkedIn
   * and other unfurlers show. Posts and case studies; every other page is
   * a `website`.
   */
  article?: { publishedTime?: string; modifiedTime?: string; tags?: string[] };
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
  const text = snippet(description);
  const openGraph: Metadata['openGraph'] = article
    ? { type: 'article', authors: [siteName], ...article }
    : { type: 'website' };
  return {
    title,
    description: text,
    alternates: canonical(path),
    openGraph: { ...openGraph, siteName, title, description: text, url: path, ...images },
    // Restated whole for the same wholesale-replace reason; X falls back to
    // og:image anyway, but other `twitter:` consumers do not.
    twitter: { card: 'summary_large_image', ...images },
  };
}

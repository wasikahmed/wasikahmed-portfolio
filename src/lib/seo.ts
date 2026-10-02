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
}: {
  title: string;
  description: string;
  path: string;
  siteName: string;
}): Metadata {
  return {
    title,
    description,
    alternates: canonical(path),
    openGraph: { type: 'website', siteName, title, description, url: path },
  };
}

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

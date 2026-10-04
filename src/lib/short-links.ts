/**
 * Short-link rules shared by the admin form (client) and the server —
 * one copy, so the form can't accept a name the API then rejects.
 */

/**
 * Lowercase words joined by single hyphens: `pathao`, `fb-bio`,
 * `bdjobs-2026`. The same shape for `source` and `medium`, which become
 * UTM values — Umami reports them verbatim, so `LinkedIn` and `linkedin`
 * would otherwise split into two rows.
 */
export const SHORT_LINK_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SHORT_LINK_NAME_MAX = 40;

/**
 * A path on this site, and nothing else: no scheme, no host, no `//`
 * (a protocol-relative URL is another host), no backslash (browsers
 * read `/\evil.com` as `//evil.com`), no query or fragment — the UTMs are
 * the only query a short link sends — and no `.`/`..` segments. Keeps /go/ from ever becoming an
 * open redirect, whoever can edit links.
 */
export const SHORT_LINK_DESTINATION_PATTERN =
  /^\/(?:(?!\.\.?(?:\/|$))[A-Za-z0-9._~-]+(?:\/(?!\.\.?(?:\/|$))[A-Za-z0-9._~-]+)*\/?)?$/;

/** Suggested `source` values — the platforms the UTM register already uses, plus applications. */
export const SHORT_LINK_SOURCES = [
  'application',
  'job-board',
  'linkedin',
  'github',
  'email',
  'social',
  'resume',
  'other',
] as const;

/**
 * Names that resolve without a saved link (src/server/short-links.ts)
 * are tagged with this source, so they group together in Umami until
 * they're saved properly.
 */
export const UNSAVED_SHORT_LINK_SOURCE = 'short-link';

/** Every short link shares the campaign every other link to the site uses (AGENTS.md §10). */
export const SHORT_LINK_CAMPAIGN = 'portfolio';

export function shortLinkPath(slug: string): string {
  return `/go/${slug}`;
}

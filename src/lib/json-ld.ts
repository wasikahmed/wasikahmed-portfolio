import type { Settings, Post, Project, Role, SkillGroup } from '@/lib/types';

/**
 * Structured data (PLAN.md W3). Plain object builders rather than a
 * component — the page renders the result as a single
 * `<script type="application/ld+json">`, and keeping the shape-building
 * here means it's trivial to unit test without a DOM.
 *
 * Every page that mentions the site's owner points at one Person node by
 * `@id` rather than restating a partial copy of it. Google merges nodes
 * that share an `@id` into one entity, which is what lets "Wasik Ahmed",
 * "Wasik Ahmed Apon", the GitHub profile and this site resolve to the same
 * person — the name alone is shared with several other people who outrank
 * this site for it.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:4000';

export const PERSON_ID = `${SITE_URL}/#person`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

const personRef = { '@id': PERSON_ID };

/** Site-relative paths (`/portrait.webp`) become absolute; absolute URLs pass through. */
function absoluteUrl(url: string): string {
  return url.startsWith('http') ? url : `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * `JSON.stringify` for a `<script>` body. The payload is CMS content, and a
 * `</script>` inside any string would close the tag early and let the rest
 * render as markup. `<` is the same character to a JSON parser.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/**
 * The full Person node. Rendered on home and /about only — everywhere else
 * refers to it by `@id`.
 *
 * `roles` and `skillGroups` are optional so a caller without them still
 * gets a valid node; they add `alumniOf` and `knowsAbout`.
 */
export function personJsonLd(
  settings: Settings,
  { roles = [], skillGroups = [] }: { roles?: Role[]; skillGroups?: SkillGroup[] } = {},
) {
  const sameAs = [
    ...settings.socials.map((social) => social.href),
    ...(settings.sameAs ?? []),
  ].filter((href) => href.startsWith('http'));

  const schools = roles
    .filter((role) => role.kind === 'education')
    .map((role) => ({ '@type': 'CollegeOrUniversity', name: role.company }));

  // Deduplicated: the same tool can sit in two skill groups.
  const knowsAbout = [...new Set(skillGroups.flatMap((group) => group.items))];

  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: settings.name,
    ...(settings.alternateNames?.length ? { alternateName: settings.alternateNames } : {}),
    jobTitle: settings.role,
    description: settings.proof,
    email: settings.email,
    url: SITE_URL,
    ...(settings.portrait?.url ? { image: absoluteUrl(settings.portrait.url) } : {}),
    homeLocation: { '@type': 'Place', name: settings.location },
    ...(schools.length ? { alumniOf: schools } : {}),
    ...(knowsAbout.length ? { knowsAbout } : {}),
    sameAs: [...new Set(sameAs)],
  };
}

export function websiteJsonLd(settings: Settings) {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE_URL,
    name: settings.name,
    ...(settings.alternateNames?.length ? { alternateName: settings.alternateNames } : {}),
    inLanguage: 'en',
    publisher: personRef,
  };
}

/**
 * /about — Google's documented markup for a page that is primarily about
 * one person.
 */
export function profilePageJsonLd(person: ReturnType<typeof personJsonLd>, dateModified?: string) {
  return {
    '@type': 'ProfilePage',
    '@id': `${SITE_URL}/about`,
    url: `${SITE_URL}/about`,
    isPartOf: { '@id': WEBSITE_ID },
    ...(dateModified ? { dateModified } : {}),
    mainEntity: person,
  };
}

/** `[{ name, path }]` from the root down, the current page last. */
export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path === '/' ? '' : crumb.path}`,
    })),
  };
}

export function articleJsonLd(post: Post) {
  const url = `${SITE_URL}/writing/${post.slug}`;
  const published = post.publishedAt ?? post.date;
  return {
    '@type': 'BlogPosting',
    '@id': url,
    headline: post.title,
    description: post.seo?.description ?? post.excerpt,
    // Only an explicit override. The route's generated card can't be named
    // here: Next serves it at `opengraph-image-<build hash>`, and the bare
    // `/opengraph-image` path 404s.
    ...(post.seo?.ogImage ? { image: absoluteUrl(post.seo.ogImage) } : {}),
    datePublished: published,
    // updatedAt moves on every save, so it is the honest "last changed".
    // Never earlier than the publish date, which a scheduled post can have.
    dateModified: post.updatedAt && post.updatedAt > published ? post.updatedAt : published,
    url,
    mainEntityOfPage: url,
    inLanguage: 'en',
    keywords: post.tags,
    author: personRef,
    publisher: personRef,
    isPartOf: { '@id': WEBSITE_ID },
  };
}

/**
 * A case study is an article about a project, so it is marked up as one —
 * `keywords` carries the stack, which is what someone searching for, say,
 * a Django real-time backend would match on.
 */
export function caseStudyJsonLd(project: Project) {
  const url = `${SITE_URL}/work/${project.slug}`;
  const image = project.seo?.ogImage || project.cover?.url;
  return {
    '@type': 'Article',
    '@id': url,
    headline: project.seo?.title ?? project.title,
    description: project.seo?.description ?? project.problem,
    // The cover, not the generated card — see articleJsonLd for why the card can't be named.
    ...(image ? { image: absoluteUrl(image) } : {}),
    ...(project.publishedAt ? { datePublished: project.publishedAt } : {}),
    // Same guard as articleJsonLd: a scheduled item was last saved before it went live.
    ...(project.updatedAt && !(project.publishedAt && project.updatedAt < project.publishedAt)
      ? { dateModified: project.updatedAt }
      : {}),
    url,
    mainEntityOfPage: url,
    inLanguage: 'en',
    keywords: project.stack,
    author: personRef,
    publisher: personRef,
    isPartOf: { '@id': WEBSITE_ID },
  };
}

/** One `<script>` per page: several nodes go in a single `@graph`. */
export function jsonLdGraph(...nodes: object[]) {
  return { '@context': 'https://schema.org', '@graph': nodes };
}

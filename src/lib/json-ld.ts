import type { Settings, Post } from '@/lib/types';

/**
 * Structured data (PLAN.md W3). Plain object builders rather than a
 * component — the page renders the result as a single
 * `<script type="application/ld+json">`, and keeping the shape-building
 * here means it's trivial to unit test without a DOM.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:4000';

export function personJsonLd(settings: Settings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: settings.name,
    jobTitle: settings.role,
    description: settings.tagline,
    email: settings.email,
    url: SITE_URL,
    sameAs: settings.socials
      .filter((social) => social.href.startsWith('http'))
      .map((social) => social.href),
  };
}

export function articleJsonLd(post: Post, settings: Settings) {
  const url = `${SITE_URL}/writing/${post.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt ?? post.date,
    dateModified: post.publishedAt ?? post.date,
    url,
    mainEntityOfPage: url,
    author: { '@type': 'Person', name: settings.name },
  };
}

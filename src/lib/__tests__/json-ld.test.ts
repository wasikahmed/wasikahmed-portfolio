import { describe, expect, it } from 'vitest';
import {
  PERSON_ID,
  articleJsonLd,
  breadcrumbJsonLd,
  caseStudyJsonLd,
  jsonLdGraph,
  personJsonLd,
  serializeJsonLd,
} from '@/lib/json-ld';
import type { Post, Project, Role, Settings } from '@/lib/types';

const settings: Settings = {
  name: 'Wasik Ahmed',
  initials: 'WA',
  role: 'Software Engineer',
  discipline: 'Backend',
  tagline: 'I build backends.',
  proof: 'Django and TypeScript systems.',
  email: 'hello@example.com',
  location: 'Dhaka, Bangladesh',
  timezone: 'UTC+6',
  available: true,
  availableFor: 'Roles',
  responseTime: '< 24h',
  socials: [
    { label: 'GitHub', href: 'https://github.com/someone' },
    { label: 'Email', href: 'mailto:hello@example.com' },
  ],
  portrait: { url: '/portrait.webp', alt: 'Portrait' },
  story: [],
  approach: [],
  alternateNames: ['Wasik Ahmed Apon'],
  sameAs: ['https://www.kaggle.com/someone', 'https://github.com/someone'],
};

const role = (overrides: Partial<Role>): Role => ({
  id: 'r',
  title: 'Engineer',
  company: 'Company',
  period: '2025',
  type: 'Full-time',
  shipped: [],
  order: 0,
  ...overrides,
});

describe('personJsonLd', () => {
  const person = personJsonLd(settings, {
    roles: [
      role({ company: 'Acme' }),
      role({ company: 'American International University-Bangladesh', kind: 'education' }),
    ],
    skillGroups: [
      { id: '1', category: 'Backend', items: ['Python', 'Django'], order: 0 },
      { id: '2', category: 'Data', items: ['PostgreSQL', 'Python'], order: 1 },
    ],
  });

  it('is the one node every other page links to', () => {
    expect(person['@id']).toBe(PERSON_ID);
  });

  // The point of the whole exercise: the name variant other profiles use.
  it('carries the alternate names', () => {
    expect(person.alternateName).toEqual(['Wasik Ahmed Apon']);
  });

  it('merges socials and extra profiles, web URLs only, without duplicates', () => {
    expect(person.sameAs).toEqual(['https://github.com/someone', 'https://www.kaggle.com/someone']);
  });

  it('lists only education entries as schools', () => {
    expect(person.alumniOf).toEqual([
      { '@type': 'CollegeOrUniversity', name: 'American International University-Bangladesh' },
    ]);
  });

  it('flattens skills without repeats', () => {
    expect(person.knowsAbout).toEqual(['Python', 'Django', 'PostgreSQL']);
  });

  it('makes a site-relative portrait absolute', () => {
    expect(person.image).toMatch(/^https?:\/\/[^/]+\/portrait\.webp$/);
  });

  it('omits what it has no data for rather than emitting empty values', () => {
    const bare = personJsonLd({ ...settings, alternateNames: [], portrait: undefined });
    expect(bare).not.toHaveProperty('alternateName');
    expect(bare).not.toHaveProperty('image');
    expect(bare).not.toHaveProperty('alumniOf');
    expect(bare).not.toHaveProperty('knowsAbout');
  });
});

describe('serializeJsonLd', () => {
  // CMS text inside a <script> body must not be able to close the tag.
  it('escapes "<" so a "</script>" in content cannot end the tag', () => {
    const out = serializeJsonLd({ headline: 'a</script><script>alert(1)</script>' });
    expect(out).not.toContain('</script>');
    expect(JSON.parse(out).headline).toBe('a</script><script>alert(1)</script>');
  });
});

describe('breadcrumbJsonLd', () => {
  it('numbers the trail from 1 and makes every item absolute', () => {
    const crumbs = breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Work', path: '/work' },
    ]);
    expect(crumbs.itemListElement.map((c) => c.position)).toEqual([1, 2]);
    expect(crumbs.itemListElement[0].item).toMatch(/^https?:\/\/[^/]+$/);
    expect(crumbs.itemListElement[1].item).toMatch(/\/work$/);
  });
});

const post: Post = {
  id: 'p',
  slug: 'a-post',
  kind: 'article',
  title: 'A post',
  excerpt: 'Excerpt.',
  date: '2026-09-20',
  readTime: '4 min',
  tags: ['Django'],
  bodyMdx: '',
  status: 'published',
  order: 0,
};

describe('articleJsonLd', () => {
  it('uses the last save as dateModified', () => {
    const node = articleJsonLd({ ...post, updatedAt: '2026-10-03T10:00:00.000Z' });
    expect(node.datePublished).toBe('2026-09-20');
    expect(node.dateModified).toBe('2026-10-03T10:00:00.000Z');
  });

  // A scheduled post is saved before it goes live.
  it('never dates a modification before publication', () => {
    const node = articleJsonLd({
      ...post,
      publishedAt: '2026-10-05T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    });
    expect(node.dateModified).toBe('2026-10-05T00:00:00.000Z');
  });

  it('credits the shared Person node', () => {
    expect(articleJsonLd(post).author).toEqual({ '@id': PERSON_ID });
  });
});

describe('caseStudyJsonLd', () => {
  const project = {
    slug: 'thing',
    title: 'Thing',
    problem: 'It was broken.',
    stack: ['Django'],
    cover: { url: 'https://res.cloudinary.com/demo/image/upload/a.png', alt: 'Cover' },
  } as Project;

  it('prefers the SEO overrides and uses the cover as the image', () => {
    const node = caseStudyJsonLd({
      ...project,
      seo: { title: 'Thing: a Django backend', description: 'Override.' },
    });
    expect(node.headline).toBe('Thing: a Django backend');
    expect(node.description).toBe('Override.');
    expect(node.image).toBe(project.cover!.url);
    expect(node.keywords).toEqual(['Django']);
  });
});

describe('jsonLdGraph', () => {
  it('puts several nodes under one context', () => {
    const graph = jsonLdGraph({ '@type': 'A' }, { '@type': 'B' });
    expect(graph['@context']).toBe('https://schema.org');
    expect(graph['@graph']).toHaveLength(2);
  });
});

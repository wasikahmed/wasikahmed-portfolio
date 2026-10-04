import { describe, expect, it } from 'vitest';
import { META_DESCRIPTION_MAX, pageMetadata, snippet } from '@/lib/seo';

describe('snippet', () => {
  it('leaves text that fits alone, collapsing whitespace', () => {
    expect(snippet('  A short   description. ')).toBe('A short description.');
  });

  it('cuts long text at a word boundary, within the limit, with an ellipsis', () => {
    const long = `${'word '.repeat(60)}end`;
    const out = snippet(long);
    expect(out.length).toBeLessThanOrEqual(META_DESCRIPTION_MAX);
    expect(out.endsWith('word…')).toBe(true);
  });

  it('drops trailing punctuation before the ellipsis', () => {
    const text = `${'a'.repeat(140)} bbbbbbbbbbbb, cccccccccccccccccccccccccccc`;
    expect(snippet(text)).toBe(`${'a'.repeat(140)} bbbbbbbbbbbb…`);
  });

  it('hard-cuts a single unbroken run rather than returning almost nothing', () => {
    const out = snippet('x'.repeat(400));
    expect(out).toBe(`${'x'.repeat(META_DESCRIPTION_MAX - 1)}…`);
  });
});

describe('pageMetadata', () => {
  const base = {
    title: 'Page — Name',
    description: 'A description.',
    path: '/page',
    siteName: 'Name',
  };

  it('is a website by default, with the canonical and the RSS feed', () => {
    const meta = pageMetadata(base);
    expect(meta.openGraph).toMatchObject({ type: 'website', url: '/page' });
    expect(meta.alternates).toEqual({
      canonical: '/page',
      types: { 'application/rss+xml': '/writing/feed.xml' },
    });
  });

  it('marks article pages as articles with their dates and tags', () => {
    const meta = pageMetadata({
      ...base,
      article: { publishedTime: '2026-09-20', modifiedTime: '2026-10-01', tags: ['Django'] },
    });
    expect(meta.openGraph).toMatchObject({
      type: 'article',
      publishedTime: '2026-09-20',
      modifiedTime: '2026-10-01',
      tags: ['Django'],
      authors: ['Name'],
    });
  });

  it('uses one fitted description for search and social', () => {
    const meta = pageMetadata({ ...base, description: 'word '.repeat(80) });
    expect((meta.description as string).length).toBeLessThanOrEqual(META_DESCRIPTION_MAX);
    expect(meta.openGraph?.description).toBe(meta.description);
  });
});

import type { Post } from '@/lib/types';

/**
 * One fictional demo post, so /writing, the RSS feed and the post page have
 * something to render on a fresh checkout. Real posts are written in the
 * CMS and never committed here (see projects.ts for why).
 */
export const posts: Omit<Post, 'id'>[] = [
  {
    slug: 'demo-post',
    kind: 'article',
    title: 'A demo post about scheduled jobs',
    excerpt:
      'Placeholder writing for local development: why a scheduled fetch shared by everyone beats one request per viewer.',
    date: '2026-09-01',
    readTime: '2 min',
    tags: ['Backend', 'Demo'],
    bodyMdx: [
      'This is a demo post seeded for local development. It exists to exercise the post layout: headings, lists, code and a callout.',
      '',
      '## Fetch once, share the result',
      '',
      'When an upstream API charges per call, letting every viewer trigger a fetch makes the bill grow with the audience. A single scheduled job can fetch on everyone’s behalf instead:',
      '',
      '- one job on a fixed interval',
      '- results written to the database',
      '- changes pushed to connected clients',
      '',
      '```python',
      '@app.task',
      'def refresh_scores():',
      '    for fixture in Fixture.objects.live():',
      '        fixture.refresh_from_upstream()',
      '```',
      '',
      '## What it costs',
      '',
      'Push needs a way to catch up clients that reconnect, and clients that are closed need a second channel. Both are planned work rather than surprises.',
    ].join('\n'),
    status: 'published',
    publishedAt: '2026-09-01T00:00:00.000Z',
    seo: {
      title: 'A demo post about scheduled jobs',
      description: 'Placeholder post seeded for local development.',
    },
    order: 0,
  },
];

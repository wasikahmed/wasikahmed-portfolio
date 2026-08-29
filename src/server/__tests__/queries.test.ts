import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

/**
 * `visibleNow()` is the one filter standing between a draft and the public
 * site (AGENTS.md §4 rule 7) — PLAN.md W6 calls this out as the
 * highest-value missing test in the repo: a regression here publishes
 * drafts. Runs against a real, ephemeral MongoDB (mongodb-memory-server)
 * rather than mocking Mongoose — the thing actually worth proving is that
 * the query filter Mongo receives is correct, not that our own mock
 * returns what we told it to.
 *
 * `MONGODB_URI` is read once at module load in db.ts, so the server must
 * be up and the env var set *before* db.ts/queries.ts are ever imported —
 * hence the dynamic `import()` inside `beforeAll` instead of a static
 * top-level one.
 */

let mongod: MongoMemoryServer;
let Project: (typeof import('../models/project'))['Project'];
let Post: (typeof import('../models/post'))['Post'];
let queries: typeof import('../queries');

const FIXED_NOW = new Date('2026-08-30T00:00:00.000Z');
const PAST = new Date(FIXED_NOW.getTime() - 86_400_000).toISOString();
const FUTURE = new Date(FIXED_NOW.getTime() + 86_400_000).toISOString();

function project(overrides: Partial<Record<string, unknown>>) {
  return {
    slug: 'p',
    title: 'P',
    tagline: 'T',
    categories: ['AI'],
    problem: 'Problem',
    headline: { value: '1', label: 'thing' },
    metrics: [],
    stack: [],
    role: 'Engineer',
    timeline: '2024',
    year: 2024,
    accent: '#000',
    architecture: [],
    sections: [],
    order: 0,
    ...overrides,
  };
}

function post(overrides: Partial<Record<string, unknown>>) {
  return {
    slug: 'p',
    kind: 'article',
    title: 'P',
    excerpt: 'E',
    date: '2024-01-01',
    readTime: '1 min',
    bodyMdx: '# hi',
    order: 0,
    ...overrides,
  };
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();

  const { connectToDatabase } = await import('../db');
  ({ Project } = await import('../models/project'));
  ({ Post } = await import('../models/post'));
  queries = await import('../queries');

  // Every query function calls this lazily, but beforeEach below talks to
  // the models directly (deleteMany/create) — without an explicit connect
  // here, those calls buffer against a connection that never opens and
  // hang until the hook times out.
  await connectToDatabase();
}, 60_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Project.deleteMany({});
  await Post.deleteMany({});
});

describe('visibility — projects', () => {
  it('getProjects excludes draft and not-yet-due scheduled, includes published and due scheduled', async () => {
    await Project.create([
      project({ slug: 'draft', status: 'draft' }),
      project({ slug: 'scheduled-future', status: 'scheduled', publishedAt: FUTURE }),
      project({ slug: 'scheduled-past', status: 'scheduled', publishedAt: PAST }),
      project({ slug: 'published', status: 'published' }),
    ]);

    const slugs = (await queries.getProjects()).map((p) => p.slug).sort();
    expect(slugs).toEqual(['published', 'scheduled-past']);
  });

  it('getAllProjects returns every status, drafts included', async () => {
    await Project.create([
      project({ slug: 'draft', status: 'draft' }),
      project({ slug: 'published', status: 'published' }),
    ]);

    const slugs = (await queries.getAllProjects()).map((p) => p.slug).sort();
    expect(slugs).toEqual(['draft', 'published']);
  });

  it('getProject returns undefined for a draft slug', async () => {
    await Project.create(project({ slug: 'draft', status: 'draft' }));
    expect(await queries.getProject('draft')).toBeUndefined();
  });

  it('getProject returns the document for a published slug', async () => {
    await Project.create(project({ slug: 'live', status: 'published' }));
    expect((await queries.getProject('live'))?.slug).toBe('live');
  });

  it('getProjectSlugs never includes a draft or not-yet-due slug', async () => {
    await Project.create([
      project({ slug: 'draft', status: 'draft' }),
      project({ slug: 'scheduled-future', status: 'scheduled', publishedAt: FUTURE }),
      project({ slug: 'published', status: 'published' }),
    ]);

    expect((await queries.getProjectSlugs()).sort()).toEqual(['published']);
  });
});

describe('getAdjacentProjects — no wrap-around (PLAN.md W5)', () => {
  it('the first project has no prev, the last has no next', async () => {
    await Project.create([
      project({ slug: 'a', status: 'published', order: 0 }),
      project({ slug: 'b', status: 'published', order: 1 }),
      project({ slug: 'c', status: 'published', order: 2 }),
    ]);

    expect(await queries.getAdjacentProjects('a')).toEqual({
      prev: undefined,
      next: expect.objectContaining({ slug: 'b' }),
    });
    expect(await queries.getAdjacentProjects('c')).toEqual({
      prev: expect.objectContaining({ slug: 'b' }),
      next: undefined,
    });
  });

  it('a single published project has neither prev nor next', async () => {
    await Project.create(project({ slug: 'only', status: 'published' }));
    expect(await queries.getAdjacentProjects('only')).toEqual({
      prev: undefined,
      next: undefined,
    });
  });
});

describe('visibility — posts', () => {
  it('getPosts excludes draft and not-yet-due scheduled, includes published and due scheduled', async () => {
    await Post.create([
      post({ slug: 'draft', status: 'draft' }),
      post({ slug: 'scheduled-future', status: 'scheduled', publishedAt: FUTURE }),
      post({ slug: 'scheduled-past', status: 'scheduled', publishedAt: PAST }),
      post({ slug: 'published', status: 'published' }),
    ]);

    const slugs = (await queries.getPosts()).map((p) => p.slug).sort();
    expect(slugs).toEqual(['published', 'scheduled-past']);
  });

  it('getAllPosts returns every status, drafts included', async () => {
    await Post.create([
      post({ slug: 'draft', status: 'draft' }),
      post({ slug: 'published', status: 'published' }),
    ]);

    const slugs = (await queries.getAllPosts()).map((p) => p.slug).sort();
    expect(slugs).toEqual(['draft', 'published']);
  });

  it('getPost returns undefined for a draft slug', async () => {
    await Post.create(post({ slug: 'draft', status: 'draft' }));
    expect(await queries.getPost('draft')).toBeUndefined();
  });

  it('getPost returns the document for a scheduled-and-due slug', async () => {
    await Post.create(post({ slug: 'due', status: 'scheduled', publishedAt: PAST }));
    expect((await queries.getPost('due'))?.slug).toBe('due');
  });

  it('getPostSlugs never includes a draft or not-yet-due slug', async () => {
    await Post.create([
      post({ slug: 'draft', status: 'draft' }),
      post({ slug: 'scheduled-future', status: 'scheduled', publishedAt: FUTURE }),
      post({ slug: 'published', status: 'published' }),
    ]);

    expect((await queries.getPostSlugs()).sort()).toEqual(['published']);
  });
});

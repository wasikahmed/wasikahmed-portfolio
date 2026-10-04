import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

/**
 * /go/<name> (short-links.ts): where each kind of name lands, what gets
 * counted, and the schema guard that keeps the redirect on this site.
 * The database is real; `after()` and the Umami upstream are stubbed, as
 * in resume-view.test.ts.
 */

const afterMock = vi.fn();
vi.mock('next/server', () => ({ after: (fn: () => unknown) => afterMock(fn) }));

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131 Safari/537.36';
const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));

let mongod: MongoMemoryServer | undefined;
let ShortLink: (typeof import('../models/short-link'))['ShortLink'];
let shortLinks: typeof import('../short-links');
let schemas: typeof import('../schemas');

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();

  const { connectToDatabase } = await import('../db');
  ({ ShortLink } = await import('../models/short-link'));
  shortLinks = await import('../short-links');
  schemas = await import('../schemas');
  await connectToDatabase();
  await ShortLink.syncIndexes();
}, 60_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

beforeEach(() => {
  vi.stubEnv('UMAMI_URL', 'https://analytics.example.com');
  vi.stubEnv('UMAMI_WEBSITE_ID', 'site-id');
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(async () => {
  afterMock.mockReset();
  fetchMock.mockClear();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  await ShortLink.deleteMany({});
});

async function open(slug: string, headers: Record<string, string> = { 'user-agent': UA }) {
  return shortLinks.shortLinkResponse(
    new Request(`http://0.0.0.0:3000/go/${slug}`, { headers }),
    slug,
  );
}

/** Runs what the route handed to `after()`, then returns the Umami event it sent. */
async function flush() {
  for (const [fn] of afterMock.mock.calls) await fn();
  const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit] | undefined;
  return call ? JSON.parse(call[1].body as string) : null;
}

async function savePathao() {
  await ShortLink.create({
    slug: 'pathao',
    label: 'Pathao application form',
    source: 'application',
    medium: 'form',
    destination: '/work',
  });
}

describe('GET /go/<name>', () => {
  it('redirects a saved link with its UTMs and counts the open', async () => {
    await savePathao();

    const res = await open('pathao');
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(
      '/work?utm_source=application&utm_medium=form&utm_campaign=portfolio&utm_content=pathao',
    );
    expect(res.headers.get('cache-control')).toBe('no-store');

    const event = await flush();
    expect(event.payload).toMatchObject({
      name: 'short_link_open',
      url: '/go/pathao',
      data: { source: 'application', link: 'pathao', saved: 'yes' },
    });
    const stored = await ShortLink.findOne({ slug: 'pathao' }).lean<{
      clicks: number;
      lastClickedAt?: Date;
    }>();
    expect(stored?.clicks).toBe(1);
    expect(stored?.lastClickedAt).toBeInstanceOf(Date);
  });

  it('matches names case-insensitively', async () => {
    await savePathao();
    const res = await open('Pathao');
    expect(res.headers.get('location')).toContain('utm_content=pathao');
    expect(res.headers.get('location')).toMatch(/^\/work\?/);
  });

  it('still lands and tags a name nobody has saved', async () => {
    const res = await open('brac');
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(
      '/?utm_source=short-link&utm_medium=link&utm_campaign=portfolio&utm_content=brac',
    );
    const event = await flush();
    expect(event.payload.data).toMatchObject({ source: 'short-link', link: 'brac', saved: 'no' });
    expect(await ShortLink.countDocuments()).toBe(0);
  });

  it('sends a name that could never be saved home, untagged and uncounted', async () => {
    for (const slug of ['bad_name', 'a--b', '-x', 'x'.repeat(41)]) {
      const res = await open(slug);
      expect(res.headers.get('location')).toBe('/');
    }
    expect(afterMock).not.toHaveBeenCalled();
  });

  it('does not count link previewers, prefetches or a signed-in admin', async () => {
    await savePathao();
    await open('pathao', { 'user-agent': 'LinkedInBot/1.0 (compatible; Mozilla/5.0)' });
    await open('pathao', { 'user-agent': 'WhatsApp/2.23.20.0 A' });
    await open('pathao', { 'user-agent': UA, 'sec-purpose': 'prefetch' });
    await open('pathao', { 'user-agent': UA, cookie: '__Secure-authjs.session-token=x' });
    expect(afterMock).not.toHaveBeenCalled();
  });

  it("counts LinkedIn's in-app browser, which is a person", async () => {
    await savePathao();
    await open('pathao', { 'user-agent': `${UA} LinkedInApp` });
    await flush();
    const stored = await ShortLink.findOne({ slug: 'pathao' }).lean<{ clicks: number }>();
    expect(stored?.clicks).toBe(1);
  });

  it('still redirects with analytics unconfigured', async () => {
    vi.stubEnv('UMAMI_URL', '');
    await savePathao();
    const res = await open('pathao');
    expect(res.status).toBe(307);
    await flush();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('shortLinkSchema', () => {
  const valid = { slug: 'pathao', label: 'Pathao form', source: 'application' };

  it('normalises names and fills defaults', () => {
    const parsed = schemas.shortLinkSchema.parse({ ...valid, slug: '  Pathao ' });
    expect(parsed).toMatchObject({ slug: 'pathao', medium: 'link', destination: '/' });
  });

  it('only accepts paths on this site as the destination', () => {
    for (const destination of ['/', '/work', '/work/scorelivepro', '/resume', '/about/']) {
      expect(schemas.shortLinkSchema.safeParse({ ...valid, destination }).success).toBe(true);
    }
    for (const destination of [
      'https://evil.com',
      '//evil.com',
      '/\\evil.com',
      '/work?x=1',
      '/work#top',
      'work',
      '/../admin',
      'javascript:alert(1)',
    ]) {
      expect(schemas.shortLinkSchema.safeParse({ ...valid, destination }).success).toBe(false);
    }
  });

  it('rejects names that would split or break UTM reports', () => {
    for (const source of ['Job Board', 'job_board', 'jobs!', '']) {
      expect(schemas.shortLinkSchema.safeParse({ ...valid, source }).success).toBe(false);
    }
  });

  it('ignores attempts to set the click count', () => {
    const parsed = schemas.shortLinkSchema.parse({ ...valid, clicks: 999 });
    expect(parsed).not.toHaveProperty('clicks');
  });
});

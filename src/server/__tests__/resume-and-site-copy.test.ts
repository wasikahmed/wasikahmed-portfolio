import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { NextRequest } from 'next/server';

/**
 * Résumé history (models/resume.ts, /api/admin/resumes, /resume) and the
 * site-copy singleton (/api/admin/site-copy, getSiteCopy's merge). Same
 * harness as the other route tests: session mocked, CSRF and Mongo real.
 */

vi.mock('../session', () => ({ getAdminSession: vi.fn() }));

const { getAdminSession } = await import('../session');
const getAdminSessionMock = vi.mocked(getAdminSession);

const CSRF_TOKEN = 'test-csrf-token';

function authedAs(role: 'viewer' | 'editor' | 'admin' | 'owner') {
  getAdminSessionMock.mockResolvedValue({
    id: '1',
    email: `${role}@example.com`,
    role,
    totpEnabled: true,
  });
}

function csrfHeaders() {
  const headers = new Headers();
  headers.set('cookie', `csrf-token=${CSRF_TOKEN}`);
  headers.set('x-csrf-token', CSRF_TOKEN);
  return headers;
}

function jsonReq(method: string, url: string, body?: unknown): NextRequest {
  const headers = csrfHeaders();
  if (body !== undefined) headers.set('content-type', 'application/json');
  return new NextRequest(`http://localhost${url}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

const PDF = Buffer.from('%PDF-1.7\n% a tiny stand-in résumé\n%%EOF\n');

function uploadReq(fields: Record<string, string>, bytes: Buffer = PDF, name = 'Wasik CV.pdf') {
  const form = new FormData();
  form.append('file', new File([new Uint8Array(bytes)], name, { type: 'application/pdf' }));
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  return new NextRequest('http://localhost/api/admin/resumes', {
    method: 'POST',
    headers: csrfHeaders(),
    body: form,
  });
}

const params = <T>(value: T) => ({ params: Promise.resolve(value) });

let mongod: MongoMemoryServer;
let ResumeVersionModel: (typeof import('../models/resume'))['ResumeVersionModel'];
let SiteCopyModel: (typeof import('../models/site-copy'))['SiteCopyModel'];
let resumesRoute: typeof import('@/app/api/admin/resumes/route');
let resumeRoute: typeof import('@/app/api/admin/resumes/[id]/route');
let publicResume: typeof import('@/app/resume/route');
let siteCopyRoute: typeof import('@/app/api/admin/site-copy/route');
let queries: typeof import('../queries');
let defaults: (typeof import('../seed-data/site-copy'))['siteCopyDefaults'];

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.AUTH_SECRET = 'test-auth-secret-do-not-use-in-real-life';

  const { connectToDatabase } = await import('../db');
  ({ ResumeVersionModel } = await import('../models/resume'));
  ({ SiteCopyModel } = await import('../models/site-copy'));
  resumesRoute = await import('@/app/api/admin/resumes/route');
  resumeRoute = await import('@/app/api/admin/resumes/[id]/route');
  publicResume = await import('@/app/resume/route');
  siteCopyRoute = await import('@/app/api/admin/site-copy/route');
  queries = await import('../queries');
  ({ siteCopyDefaults: defaults } = await import('../seed-data/site-copy'));
  await connectToDatabase();
  // The partial unique index on `isCurrent` is what the routes rely on.
  await ResumeVersionModel.syncIndexes();
}, 60_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  vi.clearAllMocks();
  await Promise.all([ResumeVersionModel.deleteMany({}), SiteCopyModel.deleteMany({})]);
});

describe('résumé uploads', () => {
  it('stores a PDF, making it live when asked', async () => {
    authedAs('admin');
    const res = await resumesRoute.POST(uploadReq({ label: 'Oct 2026', makeCurrent: 'true' }));
    expect(res.status).toBe(201);
    const { item } = await res.json();
    expect(item).toMatchObject({ label: 'Oct 2026', isCurrent: true, fileName: 'Wasik CV.pdf' });
    // The bytes never leave through the admin JSON API.
    expect(item).not.toHaveProperty('data');
  });

  it('rejects a file that is not really a PDF, whatever it claims to be', async () => {
    authedAs('admin');
    const res = await resumesRoute.POST(
      uploadReq({ label: 'Fake' }, Buffer.from('<html>not a pdf</html>')),
    );
    expect(res.status).toBe(422);
    expect(await ResumeVersionModel.countDocuments()).toBe(0);
  });

  it('keeps exactly one live version when a new one is made live', async () => {
    authedAs('admin');
    await resumesRoute.POST(uploadReq({ label: 'First', makeCurrent: 'true' }));
    await resumesRoute.POST(uploadReq({ label: 'Second', makeCurrent: 'true' }));
    const live = await ResumeVersionModel.find({ isCurrent: true }).lean();
    expect(live.map((v) => v.label)).toEqual(['Second']);
    expect(await ResumeVersionModel.countDocuments()).toBe(2);
  });

  it('lets an editor upload a draft version but not put it live', async () => {
    authedAs('editor');
    expect((await resumesRoute.POST(uploadReq({ label: 'Draft' }))).status).toBe(201);
    expect(
      (await resumesRoute.POST(uploadReq({ label: 'Live', makeCurrent: 'true' }))).status,
    ).toBe(403);
  });

  it('switches the live version, and refuses to delete it', async () => {
    authedAs('admin');
    await resumesRoute.POST(uploadReq({ label: 'Old', makeCurrent: 'true' }));
    const second = await (await resumesRoute.POST(uploadReq({ label: 'New' }))).json();

    const patched = await resumeRoute.PATCH(
      jsonReq('PATCH', `/api/admin/resumes/${second.item.id}`, { isCurrent: true }),
      params({ id: second.item.id }),
    );
    expect(patched.status).toBe(200);
    expect((await ResumeVersionModel.findOne({ isCurrent: true }).lean())?.label).toBe('New');

    const blocked = await resumeRoute.DELETE(
      jsonReq('DELETE', `/api/admin/resumes/${second.item.id}`),
      params({ id: second.item.id }),
    );
    expect(blocked.status).toBe(409);

    const old = await ResumeVersionModel.findOne({ label: 'Old' }).lean();
    const removed = await resumeRoute.DELETE(
      jsonReq('DELETE', `/api/admin/resumes/${old!._id}`),
      params({ id: String(old!._id) }),
    );
    expect(removed.status).toBe(204);
  });
});

describe('/resume', () => {
  it('falls back to the bundled file until a version is live', async () => {
    const res = await publicResume.GET(new Request('http://localhost/resume'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('/wasik-ahmed-resume.pdf');
  });

  it('serves the live version, and 304s a repeat request for the same file', async () => {
    authedAs('admin');
    await resumesRoute.POST(uploadReq({ label: 'Live', makeCurrent: 'true' }));

    const res = await publicResume.GET(new Request('http://localhost/resume'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/pdf');
    expect(Buffer.from(await res.arrayBuffer()).equals(PDF)).toBe(true);

    const etag = res.headers.get('etag')!;
    const again = await publicResume.GET(
      new Request('http://localhost/resume', { headers: { 'if-none-match': etag } }),
    );
    expect(again.status).toBe(304);
  });
});

describe('site copy', () => {
  it('falls back to the defaults field by field', () => {
    const merged = queries.mergeSiteCopy({
      home: { ctaHeading: 'Stored heading.', ctaBody: '   ' },
    });
    expect(merged.home.ctaHeading).toBe('Stored heading.');
    // Blank stored text never blanks the page.
    expect(merged.home.ctaBody).toBe(defaults.home.ctaBody);
    expect(merged.work).toEqual(defaults.work);
  });

  it('saves a complete document and serves it back merged', async () => {
    authedAs('admin');
    const body = structuredClone(defaults);
    body.contact.heading = 'Let’s talk.';
    const res = await siteCopyRoute.PATCH(jsonReq('PATCH', '/api/admin/site-copy', body));
    expect(res.status).toBe(200);
    expect((await res.json()).item.contact.heading).toBe('Let’s talk.');
  });

  it('422s on an empty field or an over-long meta description', async () => {
    authedAs('admin');
    const empty = structuredClone(defaults);
    empty.home.ctaHeading = '';
    expect(
      (await siteCopyRoute.PATCH(jsonReq('PATCH', '/api/admin/site-copy', empty))).status,
    ).toBe(422);

    const long = structuredClone(defaults);
    long.work.metaDescription = 'x'.repeat(201);
    expect((await siteCopyRoute.PATCH(jsonReq('PATCH', '/api/admin/site-copy', long))).status).toBe(
      422,
    );
  });

  it('is settings-level: an editor can read content but not rewrite site copy', async () => {
    authedAs('editor');
    const res = await siteCopyRoute.PATCH(jsonReq('PATCH', '/api/admin/site-copy', defaults));
    expect(res.status).toBe(403);
  });
});

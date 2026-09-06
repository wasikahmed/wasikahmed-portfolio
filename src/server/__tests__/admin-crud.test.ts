import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { NextRequest } from 'next/server';

/**
 * PLAN.md W6 item 2 — the four things AGENTS.md §4 rule 5 requires of every
 * admin mutation (session check, CSRF, Zod, audit log), proven against the
 * actual generic factory every collection shares rather than against one
 * hand-rolled route. Run against Project/projectSchema — it has a unique
 * index (`slug`), which is what the 409 case needs.
 *
 * `getAdminSession` is mocked rather than exercised for real: it calls into
 * the full Auth.js config (argon2, Mongoose adapter), which is its own
 * integration surface — not what this file is testing. CSRF and the
 * database side (duplicate key, audit log) are real.
 */

vi.mock('../session', () => ({ getAdminSession: vi.fn() }));

const { getAdminSession } = await import('../session');
const getAdminSessionMock = vi.mocked(getAdminSession);

const CSRF_TOKEN = 'test-csrf-token';

function authed() {
  authedAs('admin');
}

/** PLAN.md W10/W14 — same mocked session, a different role's permissions. */
function authedAs(role: 'viewer' | 'editor' | 'admin' | 'owner') {
  getAdminSessionMock.mockResolvedValue({
    id: '1',
    email: 'admin@example.com',
    role,
    totpEnabled: true,
  });
}

function unauthed() {
  getAdminSessionMock.mockResolvedValue(null);
}

/** A request carrying a matching CSRF cookie + header, unless overridden. */
function req(
  method: string,
  { body, csrf = true }: { body?: unknown; csrf?: boolean } = {},
): NextRequest {
  const headers = new Headers();
  if (csrf) {
    headers.set('cookie', `csrf-token=${CSRF_TOKEN}`);
    headers.set('x-csrf-token', CSRF_TOKEN);
  }
  if (body !== undefined) headers.set('content-type', 'application/json');
  return new NextRequest('http://localhost/api/admin/projects', {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

let mongod: MongoMemoryServer;
let Project: (typeof import('../models/project'))['Project'];
let AuditLog: (typeof import('../models/audit-log'))['AuditLog'];
let admin: typeof import('../admin-crud');
let schemas: typeof import('../schemas');

const validProject = {
  slug: 'docflow-ai',
  title: 'DocFlow AI',
  tagline: 'Contract intake that runs itself.',
  categories: ['AI'],
  problem: 'Manual review was the bottleneck.',
  headline: { value: '92%', label: 'faster processing' },
  metrics: [{ value: '92%', label: 'faster processing' }],
  stack: ['Next.js'],
  role: 'Lead engineer',
  timeline: '3 months',
  year: 2024,
  accent: '#0fbf7a',
  architecture: [{ id: 'a', label: 'Intake', detail: 'Receives documents' }],
  sections: [{ id: 's', title: 'Overview', bodyMdx: '# hi' }],
};

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.AUTH_SECRET = 'test-auth-secret-do-not-use-in-real-life';

  const { connectToDatabase } = await import('../db');
  ({ Project } = await import('../models/project'));
  ({ AuditLog } = await import('../models/audit-log'));
  admin = await import('../admin-crud');
  schemas = await import('../schemas');
  await connectToDatabase();
}, 60_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  vi.clearAllMocks();
  await Project.deleteMany({});
  await AuditLog.deleteMany({});
});

function config() {
  return {
    entityType: 'project',
    schema: schemas.projectSchema,
    summarize: (doc: { title: string }) => doc.title,
  };
}

describe('createHandler', () => {
  it('401s without a session', async () => {
    unauthed();
    const res = await admin.createHandler(Project, config())(req('POST', { body: validProject }));
    expect(res.status).toBe(401);
  });

  it('403s without a matching CSRF token', async () => {
    authed();
    const res = await admin.createHandler(
      Project,
      config(),
    )(req('POST', { body: validProject, csrf: false }));
    expect(res.status).toBe(403);
  });

  it('422s on a schema violation', async () => {
    authed();
    const invalid: Partial<typeof validProject> = { ...validProject };
    delete invalid.slug;
    const res = await admin.createHandler(Project, config())(req('POST', { body: invalid }));
    expect(res.status).toBe(422);
  });

  it('201s, persists the document, and writes an audit log entry', async () => {
    authed();
    const res = await admin.createHandler(Project, config())(req('POST', { body: validProject }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.item.slug).toBe('docflow-ai');

    const logs = await AuditLog.find().lean();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      action: 'create',
      entityType: 'project',
      userEmail: 'admin@example.com',
      summary: 'DocFlow AI',
    });
  });

  it('409s on a duplicate slug', async () => {
    authed();
    await Project.create(validProject);
    const res = await admin.createHandler(Project, config())(req('POST', { body: validProject }));
    expect(res.status).toBe(409);
    // The failed attempt must not have logged as if it succeeded.
    expect(await AuditLog.countDocuments()).toBe(0);
  });

  // PLAN.md W10/W14 — permission enforcement, not just session enforcement.
  it('403s for a role without content:write (viewer)', async () => {
    authedAs('viewer');
    const res = await admin.createHandler(Project, config())(req('POST', { body: validProject }));
    expect(res.status).toBe(403);
    expect(await Project.countDocuments()).toBe(0);
  });

  it('201s for a role with content:write but not content:publish (editor), submitting a draft', async () => {
    authedAs('editor');
    const res = await admin.createHandler(
      Project,
      config(),
    )(req('POST', { body: { ...validProject, status: 'draft' } }));
    expect(res.status).toBe(201);
  });

  // The publish boundary (PLAN.md W14 item 3) — enforced through the API,
  // not just hidden in the UI. An editor has content:write but not
  // content:publish, so a draft is fine and a published/scheduled status
  // is not, and this must be a 422 (a rejected submission), not a 403 (a
  // blocked request) — the editor is allowed to call this endpoint, just
  // not with this status value.
  it('422s when an editor (no content:publish) submits status: "published"', async () => {
    authedAs('editor');
    const res = await admin.createHandler(
      Project,
      config(),
    )(req('POST', { body: { ...validProject, status: 'published' } }));
    expect(res.status).toBe(422);
    expect(await Project.countDocuments()).toBe(0);
  });

  it('201s when an admin (has content:publish) submits status: "published"', async () => {
    authed();
    const res = await admin.createHandler(
      Project,
      config(),
    )(req('POST', { body: { ...validProject, status: 'published' } }));
    expect(res.status).toBe(201);
  });
});

describe('updateHandler', () => {
  it('404s for a missing id', async () => {
    authed();
    const missingId = new mongoose.Types.ObjectId().toString();
    const res = await admin.updateHandler(Project, config())(req('PATCH', { body: validProject }), {
      params: Promise.resolve({ id: missingId }),
    });
    expect(res.status).toBe(404);
  });

  it('updates the document and writes an audit log entry', async () => {
    authed();
    const created = await Project.create(validProject);
    const patched = { ...validProject, title: 'DocFlow AI v2' };
    const res = await admin.updateHandler(Project, config())(req('PATCH', { body: patched }), {
      params: Promise.resolve({ id: created._id.toString() }),
    });
    expect(res.status).toBe(200);

    const logs = await AuditLog.find().lean();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ action: 'update', summary: 'DocFlow AI v2' });
  });

  it('403s for a role without content:write (viewer)', async () => {
    authedAs('viewer');
    const created = await Project.create(validProject);
    const res = await admin.updateHandler(Project, config())(req('PATCH', { body: validProject }), {
      params: Promise.resolve({ id: created._id.toString() }),
    });
    expect(res.status).toBe(403);
  });

  it('422s when an editor (no content:publish) moves status to "scheduled"', async () => {
    authedAs('editor');
    const created = await Project.create({ ...validProject, status: 'draft' });
    const res = await admin.updateHandler(Project, config())(
      req('PATCH', {
        body: { ...validProject, status: 'scheduled', publishedAt: new Date().toISOString() },
      }),
      { params: Promise.resolve({ id: created._id.toString() }) },
    );
    expect(res.status).toBe(422);
    expect(await Project.findById(created._id).lean()).toMatchObject({ status: 'draft' });
  });
});

describe('deleteHandler', () => {
  it('401s without a session', async () => {
    unauthed();
    const created = await Project.create(validProject);
    const res = await admin.deleteHandler(Project, 'project')(req('DELETE'), {
      params: Promise.resolve({ id: created._id.toString() }),
    });
    expect(res.status).toBe(401);
  });

  it('204s, removes the document, and writes an audit log entry', async () => {
    authed();
    const created = await Project.create(validProject);
    const res = await admin.deleteHandler(Project, 'project')(req('DELETE'), {
      params: Promise.resolve({ id: created._id.toString() }),
    });
    expect(res.status).toBe(204);
    expect(await Project.findById(created._id)).toBeNull();

    const logs = await AuditLog.find().lean();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ action: 'delete' });
  });

  it('403s for a role without content:delete (editor)', async () => {
    authedAs('editor');
    const created = await Project.create(validProject);
    const res = await admin.deleteHandler(Project, 'project')(req('DELETE'), {
      params: Promise.resolve({ id: created._id.toString() }),
    });
    expect(res.status).toBe(403);
    expect(await Project.findById(created._id)).not.toBeNull();
  });
});

describe('getOneHandler / listHandler', () => {
  it('getOneHandler 401s without a session', async () => {
    unauthed();
    const created = await Project.create(validProject);
    const res = await admin.getOneHandler(Project)(req('GET'), {
      params: Promise.resolve({ id: created._id.toString() }),
    });
    expect(res.status).toBe(401);
  });

  it('listHandler returns every record regardless of status', async () => {
    authed();
    await Project.create([validProject, { ...validProject, slug: 'other', status: 'draft' }]);
    const res = await admin.listHandler(Project, config())();
    const body = await res.json();
    expect(body.items).toHaveLength(2);
  });
});

describe('reorderHandler', () => {
  it('401s without a session', async () => {
    unauthed();
    const res = await admin.reorderHandler(
      Project,
      'project',
    )(req('POST', { body: { ids: ['x'] } }));
    expect(res.status).toBe(401);
  });

  it('422s on an empty ids array', async () => {
    authed();
    const res = await admin.reorderHandler(Project, 'project')(req('POST', { body: { ids: [] } }));
    expect(res.status).toBe(422);
  });

  it('403s for a role without content:reorder (viewer)', async () => {
    authedAs('viewer');
    const res = await admin.reorderHandler(
      Project,
      'project',
    )(req('POST', { body: { ids: ['x'] } }));
    expect(res.status).toBe(403);
  });

  it('writes order by array position and one audit log entry for the whole batch', async () => {
    authed();
    const [a, b, c] = await Project.create([
      { ...validProject, slug: 'a', order: 0 },
      { ...validProject, slug: 'b', order: 1 },
      { ...validProject, slug: 'c', order: 2 },
    ]);

    // Reversed: c, b, a.
    const res = await admin.reorderHandler(
      Project,
      'project',
    )(req('POST', { body: { ids: [c._id.toString(), b._id.toString(), a._id.toString()] } }));
    expect(res.status).toBe(200);

    const bySlug = Object.fromEntries((await Project.find().lean()).map((p) => [p.slug, p.order]));
    expect(bySlug).toEqual({ a: 2, b: 1, c: 0 });

    const logs = await AuditLog.find().lean();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ action: 'update', entityType: 'project' });
  });
});

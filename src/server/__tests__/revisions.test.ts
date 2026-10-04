import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { NextRequest } from 'next/server';

/**
 * Content history (src/server/revisions.ts): every update and delete that
 * goes through the CRUD factory or the singleton routes keeps the previous
 * state, and restoring puts it back — re-validated, permission-checked, and
 * itself undoable. Same harness as admin-crud.test.ts: the session is
 * mocked, CSRF and Mongo are real.
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

function req(method: string, url: string, body?: unknown): NextRequest {
  const headers = new Headers();
  headers.set('cookie', `csrf-token=${CSRF_TOKEN}`);
  headers.set('x-csrf-token', CSRF_TOKEN);
  if (body !== undefined) headers.set('content-type', 'application/json');
  return new NextRequest(`http://localhost${url}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

const params = <T>(value: T) => ({ params: Promise.resolve(value) });

let mongod: MongoMemoryServer;
let Project: (typeof import('../models/project'))['Project'];
let Revision: (typeof import('../models/revision'))['Revision'];
let AuditLog: (typeof import('../models/audit-log'))['AuditLog'];
let Settings: (typeof import('../models/settings'))['Settings'];
let admin: typeof import('../admin-crud');
let schemas: typeof import('../schemas');
let revisions: typeof import('../revisions');
let restoreRoute: typeof import('@/app/api/admin/revisions/[id]/restore/route');
let listRoute: typeof import('@/app/api/admin/revisions/route');
let settingsRoute: typeof import('@/app/api/admin/settings/route');

const validProject = {
  slug: 'ledger-sync',
  title: 'Ledger Sync',
  tagline: 'Two accounting systems, one set of numbers.',
  categories: ['Systems'],
  problem: 'The two systems had to agree.',
  headline: { value: '5 min', label: 'sync interval' },
  metrics: [{ value: '5 min', label: 'sync interval' }],
  stack: ['Django'],
  role: 'Backend Engineer',
  timeline: 'Demo project',
  year: 2026,
  accent: '#0fbf7a',
  architecture: [{ id: 'a', label: 'Sync', detail: 'Every 5 minutes' }],
  sections: [{ id: 'problem', title: 'The problem', bodyMdx: 'Original text.' }],
  status: 'published',
};

const crudConfig = () => ({
  entityType: 'project',
  schema: schemas.projectSchema,
  summarize: (p: { title: string }) => p.title,
});

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.AUTH_SECRET = 'test-auth-secret-do-not-use-in-real-life';

  const { connectToDatabase } = await import('../db');
  ({ Project } = await import('../models/project'));
  ({ Revision } = await import('../models/revision'));
  ({ AuditLog } = await import('../models/audit-log'));
  ({ Settings } = await import('../models/settings'));
  admin = await import('../admin-crud');
  schemas = await import('../schemas');
  revisions = await import('../revisions');
  restoreRoute = await import('@/app/api/admin/revisions/[id]/restore/route');
  listRoute = await import('@/app/api/admin/revisions/route');
  settingsRoute = await import('@/app/api/admin/settings/route');
  await connectToDatabase();
}, 60_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  vi.clearAllMocks();
  await Promise.all([
    Project.deleteMany({}),
    Revision.deleteMany({}),
    AuditLog.deleteMany({}),
    Settings.deleteMany({}),
  ]);
});

async function updateProject(id: string, changes: Record<string, unknown>) {
  return admin.updateHandler(Project, crudConfig())(
    req('PATCH', `/api/admin/projects/${id}`, { ...validProject, ...changes }),
    params({ id }),
  );
}

describe('recording revisions', () => {
  it('keeps the previous state on every update', async () => {
    authedAs('admin');
    const created = await Project.create(validProject);
    const id = String(created._id);

    expect((await updateProject(id, { tagline: 'Second.' })).status).toBe(200);
    expect((await updateProject(id, { tagline: 'Third.' })).status).toBe(200);

    const history = await Revision.find({ entityType: 'project', entityId: id })
      .sort({ createdAt: 1 })
      .lean();
    expect(history.map((r) => r.snapshot.tagline)).toEqual([
      'Two accounting systems, one set of numbers.',
      'Second.',
    ]);
    expect(history[0]).toMatchObject({
      action: 'update',
      label: 'Ledger Sync',
      userEmail: 'admin@example.com',
    });
    expect(history[0].snapshot).not.toHaveProperty('_id');
  });

  it('records nothing when the update is rejected', async () => {
    authedAs('admin');
    const created = await Project.create(validProject);
    const res = await updateProject(String(created._id), { slug: 'NOT A SLUG' });
    expect(res.status).toBe(422);
    expect(await Revision.countDocuments()).toBe(0);
  });

  it('keeps the full record on delete', async () => {
    authedAs('admin');
    const created = await Project.create(validProject);
    const id = String(created._id);
    const res = await admin.deleteHandler(Project, 'project')(
      req('DELETE', `/api/admin/projects/${id}`),
      params({ id }),
    );
    expect(res.status).toBe(204);

    const revision = await Revision.findOne({ entityId: id }).lean();
    expect(revision?.action).toBe('delete');
    expect(revision?.snapshot.slug).toBe('ledger-sync');
  });

  it('trims a record to the newest MAX_REVISIONS_PER_RECORD', async () => {
    const id = new mongoose.Types.ObjectId().toString();
    const total = revisions.MAX_REVISIONS_PER_RECORD + 3;
    for (let i = 0; i < total; i++) {
      await revisions.recordRevision({
        entityType: 'project',
        entityId: id,
        before: { ...validProject, tagline: `v${i}` },
        action: 'update',
        userEmail: 'admin@example.com',
      });
    }
    const kept = await Revision.find({ entityId: id }).lean();
    expect(kept).toHaveLength(revisions.MAX_REVISIONS_PER_RECORD);
    expect(kept.map((r) => r.snapshot.tagline)).not.toContain('v0');
  });

  it('versions the settings singleton', async () => {
    authedAs('admin');
    const settings = {
      name: 'Wasik Ahmed',
      initials: 'WA',
      role: 'Software Engineer',
      discipline: 'Backend',
      tagline: 'First tagline.',
      proof: 'Proof.',
      email: 'a@example.com',
      location: 'Dhaka',
      timezone: 'UTC+6',
      available: true,
      availableFor: 'Open to roles',
      responseTime: '< 24h',
      socials: [],
    };
    await settingsRoute.PATCH(req('PATCH', '/api/admin/settings', settings));
    // The first save has nothing before it to keep.
    expect(await Revision.countDocuments()).toBe(0);
    await settingsRoute.PATCH(
      req('PATCH', '/api/admin/settings', { ...settings, tagline: 'Second.' }),
    );
    const revision = await Revision.findOne({ entityType: 'settings' }).lean();
    expect(revision?.snapshot.tagline).toBe('First tagline.');
  });
});

describe('restoring', () => {
  async function editedProject() {
    authedAs('admin');
    const created = await Project.create(validProject);
    const id = String(created._id);
    await updateProject(id, {
      tagline: 'Changed.',
      links: [{ label: 'Site', href: 'https://example.com' }],
    });
    const revision = await Revision.findOne({ entityId: id }).lean();
    return { id, revisionId: String(revision!._id) };
  }

  const restore = (revisionId: string) =>
    restoreRoute.POST(
      req('POST', `/api/admin/revisions/${revisionId}/restore`),
      params({ id: revisionId }),
    );

  it('puts the old version back exactly, removing fields added since', async () => {
    const { id, revisionId } = await editedProject();
    const res = await restore(revisionId);
    expect(res.status).toBe(200);

    const project = await Project.findById(id).lean();
    expect(project?.tagline).toBe('Two accounting systems, one set of numbers.');
    expect(project?.links).toBeUndefined();
  });

  it('keeps the replaced state as a new revision, so a restore can be undone', async () => {
    const { id, revisionId } = await editedProject();
    await restore(revisionId);

    const latest = await Revision.findOne({ entityId: id }).sort({ createdAt: -1 }).lean();
    expect(latest?.action).toBe('restore');
    expect(latest?.snapshot.tagline).toBe('Changed.');
    expect(await AuditLog.countDocuments({ summary: /^Restored Ledger Sync/ })).toBe(1);
  });

  it('leaves the drag-and-drop order alone', async () => {
    const { id, revisionId } = await editedProject();
    await Project.updateOne({ _id: id }, { order: 5 });
    await restore(revisionId);
    expect((await Project.findById(id).lean())?.order).toBe(5);
  });

  it('brings a deleted record back under its original id', async () => {
    authedAs('admin');
    const created = await Project.create(validProject);
    const id = String(created._id);
    await admin.deleteHandler(Project, 'project')(
      req('DELETE', `/api/admin/projects/${id}`),
      params({ id }),
    );
    const revision = await Revision.findOne({ entityId: id, action: 'delete' }).lean();

    const res = await restore(String(revision!._id));
    expect(res.status).toBe(200);
    expect((await Project.findById(id).lean())?.slug).toBe('ledger-sync');
  });

  it('409s when a deleted record’s slug has been taken since', async () => {
    authedAs('admin');
    const created = await Project.create(validProject);
    const id = String(created._id);
    await admin.deleteHandler(Project, 'project')(
      req('DELETE', `/api/admin/projects/${id}`),
      params({ id }),
    );
    await Project.create(validProject);
    const revision = await Revision.findOne({ entityId: id }).lean();
    expect((await restore(String(revision!._id))).status).toBe(409);
  });

  it('applies the publish guard: an editor cannot restore a published version', async () => {
    const { revisionId } = await editedProject();
    authedAs('editor');
    const res = await restore(revisionId);
    expect(res.status).toBe(422);
  });

  it('403s for a viewer, who cannot write content at all', async () => {
    const { revisionId } = await editedProject();
    authedAs('viewer');
    expect((await restore(revisionId)).status).toBe(403);
  });

  // Site copy's schema requires every field, and fields get added (the home
  // title and /docs description did). A version saved before that must
  // still restore, with the new fields at their defaults.
  it('restores a site-copy version saved before newer fields existed', async () => {
    authedAs('admin');
    const { siteCopyDefaults } = await import('../seed-data/site-copy');
    const { SiteCopyModel } = await import('../models/site-copy');
    const old = structuredClone(siteCopyDefaults) as unknown as Record<
      string,
      Record<string, string>
    >;
    delete old.seo.homeTitle;
    delete old.docs;
    old.about.heading = 'An older heading.';
    const revision = await Revision.create({
      entityType: 'siteCopy',
      entityId: 'site-copy',
      label: 'Site copy',
      action: 'update',
      userEmail: 'admin@example.com',
      snapshot: old,
    });

    expect((await restore(String(revision._id))).status).toBe(200);
    const stored = await SiteCopyModel.findById('site-copy').lean();
    expect(stored?.about?.heading).toBe('An older heading.');
    expect(stored?.seo?.homeTitle).toBe(siteCopyDefaults.seo.homeTitle);
    await SiteCopyModel.deleteMany({});
  });

  it('404s for an unknown revision', async () => {
    authedAs('admin');
    const missing = new mongoose.Types.ObjectId().toString();
    expect((await restore(missing)).status).toBe(404);
  });
});

describe('listing', () => {
  it('lets anyone who can read a record see its history', async () => {
    const created = await Project.create(validProject);
    authedAs('admin');
    await updateProject(String(created._id), { tagline: 'Changed.' });

    authedAs('viewer');
    const res = await listRoute.GET(
      req('GET', `/api/admin/revisions?entityType=project&entityId=${created._id}`),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).items).toHaveLength(1);
  });

  it('keeps the unscoped, everything-including-deletions view to audit:read', async () => {
    authedAs('editor');
    expect((await listRoute.GET(req('GET', '/api/admin/revisions'))).status).toBe(403);
    authedAs('admin');
    expect((await listRoute.GET(req('GET', '/api/admin/revisions'))).status).toBe(200);
  });

  it('422s on an unknown entity type', async () => {
    authedAs('admin');
    const res = await listRoute.GET(req('GET', '/api/admin/revisions?entityType=user'));
    expect(res.status).toBe(422);
  });
});

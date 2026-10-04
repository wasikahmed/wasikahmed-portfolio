import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { NextRequest } from 'next/server';

/**
 * PLAN.md W11/W14 — the /api/admin/users routes and the guards that make
 * ownership a real singleton: an owner can never be demoted, suspended,
 * or deleted, and no one (owner included) can change their own role or
 * status through this route. Same mocking strategy as admin-crud.test.ts
 * — getAdminSession mocked, everything else (Mongo, CSRF) real.
 */

vi.mock('../session', () => ({ getAdminSession: vi.fn() }));

const { getAdminSession } = await import('../session');
const getAdminSessionMock = vi.mocked(getAdminSession);

const CSRF_TOKEN = 'test-csrf-token';

function authedAs(id: string, role: 'viewer' | 'editor' | 'admin' | 'owner') {
  getAdminSessionMock.mockResolvedValue({
    id,
    email: `${role}@example.com`,
    role,
    totpEnabled: true,
  });
}

function unauthed() {
  getAdminSessionMock.mockResolvedValue(null);
}

function req(method: string, { body, csrf = true }: { body?: unknown; csrf?: boolean } = {}) {
  const headers = new Headers();
  if (csrf) {
    headers.set('cookie', `csrf-token=${CSRF_TOKEN}`);
    headers.set('x-csrf-token', CSRF_TOKEN);
  }
  if (body !== undefined) headers.set('content-type', 'application/json');
  return new NextRequest('http://localhost/api/admin/users', {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

let mongod: MongoMemoryServer | undefined;
let User: (typeof import('../models/user'))['User'];
let Invite: (typeof import('../models/invite'))['Invite'];
let AuditLog: (typeof import('../models/audit-log'))['AuditLog'];
let usersRoute: typeof import('../../app/api/admin/users/route');
let userRoute: typeof import('../../app/api/admin/users/[id]/route');
let transferRoute: typeof import('../../app/api/admin/users/[id]/transfer-ownership/route');

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.AUTH_SECRET = 'test-auth-secret-do-not-use-in-real-life';

  const { connectToDatabase } = await import('../db');
  ({ User } = await import('../models/user'));
  ({ Invite } = await import('../models/invite'));
  ({ AuditLog } = await import('../models/audit-log'));
  usersRoute = await import('../../app/api/admin/users/route');
  userRoute = await import('../../app/api/admin/users/[id]/route');
  transferRoute = await import('../../app/api/admin/users/[id]/transfer-ownership/route');
  await connectToDatabase();
}, 60_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

afterEach(async () => {
  vi.clearAllMocks();
  await User.deleteMany({});
  await Invite.deleteMany({});
  await AuditLog.deleteMany({});
});

describe('POST /api/admin/users — invite', () => {
  it('401s without a session', async () => {
    unauthed();
    const res = await usersRoute.POST(
      req('POST', { body: { email: 'a@example.com', role: 'editor' } }),
    );
    expect(res.status).toBe(401);
  });

  it('403s for a role without user:write (editor)', async () => {
    authedAs(new mongoose.Types.ObjectId().toString(), 'editor');
    const res = await usersRoute.POST(
      req('POST', { body: { email: 'a@example.com', role: 'editor' } }),
    );
    expect(res.status).toBe(403);
  });

  it('422s for an invalid role (owner is never invitable)', async () => {
    authedAs(new mongoose.Types.ObjectId().toString(), 'admin');
    const res = await usersRoute.POST(
      req('POST', { body: { email: 'a@example.com', role: 'owner' } }),
    );
    expect(res.status).toBe(422);
  });

  it('201s, creates a status: invited user with no password, and an audit entry', async () => {
    authedAs(new mongoose.Types.ObjectId().toString(), 'admin');
    const res = await usersRoute.POST(
      req('POST', { body: { email: 'new@example.com', role: 'editor' } }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.item).toMatchObject({
      email: 'new@example.com',
      role: 'editor',
      status: 'invited',
    });
    expect(body.item.passwordHash).toBeUndefined();

    const doc = await User.findOne({ email: 'new@example.com' }).lean();
    expect(doc?.passwordHash).toBeUndefined();

    const invite = await Invite.findOne({ userId: doc?._id }).lean();
    expect(invite).not.toBeNull();

    const logs = await AuditLog.find().lean();
    expect(logs).toHaveLength(1);
    expect(logs[0].summary).toMatch(/Invited new@example\.com as editor/);
  });

  it('409s when the email already exists', async () => {
    authedAs(new mongoose.Types.ObjectId().toString(), 'admin');
    await User.create({ email: 'dup@example.com', role: 'viewer', status: 'active' });
    const res = await usersRoute.POST(
      req('POST', { body: { email: 'dup@example.com', role: 'editor' } }),
    );
    expect(res.status).toBe(409);
  });
});

describe('GET /api/admin/users — list', () => {
  it('never includes passwordHash/totpSecret', async () => {
    authedAs(new mongoose.Types.ObjectId().toString(), 'admin');
    await User.create({
      email: 'has-secrets@example.com',
      role: 'viewer',
      status: 'active',
      passwordHash: 'a-real-hash',
      totpSecret: 'a-real-secret',
    });
    const res = await usersRoute.GET(req('GET'));
    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].passwordHash).toBeUndefined();
    expect(body.items[0].totpSecret).toBeUndefined();
  });
});

describe('PATCH /api/admin/users/[id] — role/status', () => {
  it("403s changing the owner's role, by anyone", async () => {
    const owner = await User.create({
      email: 'owner@example.com',
      role: 'owner',
      status: 'active',
    });
    authedAs('someone-else', 'admin');
    const res = await userRoute.PATCH(req('PATCH', { body: { role: 'admin' } }), {
      params: Promise.resolve({ id: owner._id.toString() }),
    });
    expect(res.status).toBe(403);
    expect((await User.findById(owner._id))?.role).toBe('owner');
  });

  it('403s changing your own role, even as owner', async () => {
    const owner = await User.create({
      email: 'owner@example.com',
      role: 'owner',
      status: 'active',
    });
    authedAs(owner._id.toString(), 'owner');
    const res = await userRoute.PATCH(req('PATCH', { body: { status: 'suspended' } }), {
      params: Promise.resolve({ id: owner._id.toString() }),
    });
    expect(res.status).toBe(403);
  });

  it('403s for a role without user:write (editor)', async () => {
    const target = await User.create({ email: 'e@example.com', role: 'viewer', status: 'active' });
    authedAs('someone-else', 'editor');
    const res = await userRoute.PATCH(req('PATCH', { body: { role: 'admin' } }), {
      params: Promise.resolve({ id: target._id.toString() }),
    });
    expect(res.status).toBe(403);
  });

  it('changes role and writes an audit entry', async () => {
    const target = await User.create({ email: 'e@example.com', role: 'viewer', status: 'active' });
    authedAs('someone-else', 'admin');
    const res = await userRoute.PATCH(req('PATCH', { body: { role: 'editor' } }), {
      params: Promise.resolve({ id: target._id.toString() }),
    });
    expect(res.status).toBe(200);
    expect((await User.findById(target._id))?.role).toBe('editor');
    const logs = await AuditLog.find().lean();
    expect(logs[0].summary).toMatch(/from viewer to editor/);
  });

  it('suspends and reactivates, each with its own audit entry', async () => {
    const target = await User.create({ email: 'e@example.com', role: 'viewer', status: 'active' });
    authedAs('someone-else', 'admin');

    const suspend = await userRoute.PATCH(req('PATCH', { body: { status: 'suspended' } }), {
      params: Promise.resolve({ id: target._id.toString() }),
    });
    expect(suspend.status).toBe(200);
    expect((await User.findById(target._id))?.status).toBe('suspended');

    const reactivate = await userRoute.PATCH(req('PATCH', { body: { status: 'active' } }), {
      params: Promise.resolve({ id: target._id.toString() }),
    });
    expect(reactivate.status).toBe(200);
    expect((await User.findById(target._id))?.status).toBe('active');

    const logs = await AuditLog.find().sort({ createdAt: 1 }).lean();
    expect(logs).toHaveLength(2);
    expect(logs[0].summary).toMatch(/^Suspended e@example\.com/);
    expect(logs[1].summary).toMatch(/^Reactivated e@example\.com/);
  });
});

describe('DELETE /api/admin/users/[id]', () => {
  it('403s deleting the owner', async () => {
    const owner = await User.create({
      email: 'owner@example.com',
      role: 'owner',
      status: 'active',
    });
    authedAs('someone-else', 'admin');
    const res = await userRoute.DELETE(req('DELETE'), {
      params: Promise.resolve({ id: owner._id.toString() }),
    });
    expect(res.status).toBe(403);
  });

  it('403s deleting yourself', async () => {
    const admin = await User.create({
      email: 'admin@example.com',
      role: 'admin',
      status: 'active',
    });
    authedAs(admin._id.toString(), 'admin');
    const res = await userRoute.DELETE(req('DELETE'), {
      params: Promise.resolve({ id: admin._id.toString() }),
    });
    expect(res.status).toBe(403);
  });

  it('403s for a role without user:delete (editor)', async () => {
    const target = await User.create({ email: 'e@example.com', role: 'viewer', status: 'active' });
    authedAs('someone-else', 'editor');
    const res = await userRoute.DELETE(req('DELETE'), {
      params: Promise.resolve({ id: target._id.toString() }),
    });
    expect(res.status).toBe(403);
  });

  it('204s, removes the user, cleans up pending invites, and writes an audit entry', async () => {
    const target = await User.create({ email: 'e@example.com', role: 'viewer', status: 'invited' });
    await Invite.create({
      userId: target._id,
      tokenHash: 'x',
      expiresAt: new Date(Date.now() + 1000),
    });
    authedAs('someone-else', 'admin');

    const res = await userRoute.DELETE(req('DELETE'), {
      params: Promise.resolve({ id: target._id.toString() }),
    });
    expect(res.status).toBe(204);
    expect(await User.findById(target._id)).toBeNull();
    expect(await Invite.countDocuments({ userId: target._id })).toBe(0);

    const logs = await AuditLog.find().lean();
    expect(logs[0].summary).toMatch(/Deleted e@example\.com/);
  });
});

describe('POST /api/admin/users/[id]/transfer-ownership', () => {
  it('403s for a non-owner, even admin', async () => {
    const target = await User.create({ email: 'e@example.com', role: 'admin', status: 'active' });
    authedAs('someone-else', 'admin');
    const res = await transferRoute.POST(req('POST'), {
      params: Promise.resolve({ id: target._id.toString() }),
    });
    expect(res.status).toBe(403);
  });

  it('promotes the target and demotes the current owner', async () => {
    const owner = await User.create({
      email: 'owner@example.com',
      role: 'owner',
      status: 'active',
    });
    const target = await User.create({ email: 'e@example.com', role: 'admin', status: 'active' });
    authedAs(owner._id.toString(), 'owner');

    const res = await transferRoute.POST(req('POST'), {
      params: Promise.resolve({ id: target._id.toString() }),
    });
    expect(res.status).toBe(200);
    expect((await User.findById(target._id))?.role).toBe('owner');
    expect((await User.findById(owner._id))?.role).toBe('admin');
  });

  it('422s transferring to a suspended or invited user', async () => {
    const owner = await User.create({
      email: 'owner@example.com',
      role: 'owner',
      status: 'active',
    });
    const target = await User.create({
      email: 'e@example.com',
      role: 'admin',
      status: 'suspended',
    });
    authedAs(owner._id.toString(), 'owner');

    const res = await transferRoute.POST(req('POST'), {
      params: Promise.resolve({ id: target._id.toString() }),
    });
    expect(res.status).toBe(422);
  });
});

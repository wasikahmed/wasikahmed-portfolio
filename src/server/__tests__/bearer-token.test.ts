import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { NextRequest } from 'next/server';

/**
 * PLAN.md W12/W14 item 7 — Bearer-token issuance, rotation, reuse
 * detection, and "Bearer parity": the same permission checks hold
 * whether the caller presents a cookie or a token.
 *
 * `../session` is mocked only for the last describe block below
 * (/api/admin/auth/tokens' self-service list/revoke, which is
 * cookie-session-only) — every earlier test exercises the real Bearer
 * path through `resolveAuth()`, which never touches `getAdminSession()`,
 * so mocking it here doesn't affect them.
 */
vi.mock('../session', () => ({ getAdminSession: vi.fn() }));

let mongod: MongoMemoryServer | undefined;
let User: (typeof import('../models/user'))['User'];
let RefreshToken: (typeof import('../models/refresh-token'))['RefreshToken'];
let RateLimit: (typeof import('../models/rate-limit'))['RateLimit'];
let hashPassword: (typeof import('../password'))['hashPassword'];
let resolveAuth: (typeof import('../resolve-auth'))['resolveAuth'];
let authorized: (typeof import('../resolve-auth'))['authorized'];
let tokenRoute: typeof import('../../app/api/admin/auth/token/route');
let refreshRoute: typeof import('../../app/api/admin/auth/token/refresh/route');
let tokensRoute: typeof import('../../app/api/admin/auth/tokens/route');
let tokenByIdRoute: typeof import('../../app/api/admin/auth/tokens/[id]/route');
let getAdminSessionMock: ReturnType<
  typeof vi.mocked<(typeof import('../session'))['getAdminSession']>
>;

const CSRF_TOKEN = 'test-csrf-token';

function csrfReq(url: string, method: string, body?: unknown) {
  return new NextRequest(url, {
    method,
    headers: {
      'content-type': 'application/json',
      cookie: `csrf-token=${CSRF_TOKEN}`,
      'x-csrf-token': CSRF_TOKEN,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

const PASSWORD = 'a-strong-password-123';

function jsonReq(url: string, method: string, body?: unknown, headers?: Record<string, string>) {
  return new NextRequest(url, {
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.AUTH_SECRET = 'test-auth-secret-do-not-use-in-real-life';

  const { connectToDatabase } = await import('../db');
  ({ User } = await import('../models/user'));
  ({ RefreshToken } = await import('../models/refresh-token'));
  ({ RateLimit } = await import('../models/rate-limit'));
  ({ hashPassword } = await import('../password'));
  ({ resolveAuth, authorized } = await import('../resolve-auth'));
  tokenRoute = await import('../../app/api/admin/auth/token/route');
  refreshRoute = await import('../../app/api/admin/auth/token/refresh/route');
  tokensRoute = await import('../../app/api/admin/auth/tokens/route');
  tokenByIdRoute = await import('../../app/api/admin/auth/tokens/[id]/route');
  const { getAdminSession } = await import('../session');
  getAdminSessionMock = vi.mocked(getAdminSession);
  await connectToDatabase();
}, 60_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

afterEach(async () => {
  vi.clearAllMocks();
  await User.deleteMany({});
  await RefreshToken.deleteMany({});
  // Several tests in this file reuse the same handful of emails (e.g.
  // 'editor@example.com') across many token-issuance calls; without this,
  // verifyCredentials' per-email rate limit (8/15min) starts rejecting
  // logins partway through the file with no relation to the test at hand.
  await RateLimit.deleteMany({});
});

async function makeUser(role: 'viewer' | 'editor' | 'admin' | 'owner' = 'editor') {
  return User.create({
    email: `${role}@example.com`,
    role,
    status: 'active',
    passwordHash: await hashPassword(PASSWORD),
  });
}

describe('POST /api/admin/auth/token — issue', () => {
  it('401s on a wrong password', async () => {
    await makeUser();
    const res = await tokenRoute.POST(
      jsonReq('http://localhost/api/admin/auth/token', 'POST', {
        email: 'editor@example.com',
        password: 'wrong',
      }),
    );
    expect(res.status).toBe(401);
  });

  it('issues an access + refresh token defaulting to every permission the role grants', async () => {
    await makeUser('editor');
    const res = await tokenRoute.POST(
      jsonReq('http://localhost/api/admin/auth/token', 'POST', {
        email: 'editor@example.com',
        password: PASSWORD,
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tokenType).toBe('Bearer');
    expect(typeof body.accessToken).toBe('string');
    expect(typeof body.refreshToken).toBe('string');
    expect(body.scopes).toContain('content:write');
    expect(body.scopes).not.toContain('content:publish'); // editor doesn't have it.

    expect(await RefreshToken.countDocuments()).toBe(1);
  });

  it('422s when requesting a scope the role does not grant', async () => {
    await makeUser('editor');
    const res = await tokenRoute.POST(
      jsonReq('http://localhost/api/admin/auth/token', 'POST', {
        email: 'editor@example.com',
        password: PASSWORD,
        scopes: ['content:publish'],
      }),
    );
    expect(res.status).toBe(422);
  });

  it('honors a caller-requested narrower scope list', async () => {
    await makeUser('admin');
    const res = await tokenRoute.POST(
      jsonReq('http://localhost/api/admin/auth/token', 'POST', {
        email: 'admin@example.com',
        password: PASSWORD,
        scopes: ['content:read'],
      }),
    );
    const body = await res.json();
    expect(body.scopes).toEqual(['content:read']);
  });
});

describe('POST /api/admin/auth/token/refresh', () => {
  async function issue(email: string) {
    const res = await tokenRoute.POST(
      jsonReq('http://localhost/api/admin/auth/token', 'POST', { email, password: PASSWORD }),
    );
    return res.json();
  }

  it('rotates: old token stops working, new one works', async () => {
    await makeUser('editor');
    const { refreshToken } = await issue('editor@example.com');

    const first = await refreshRoute.POST(
      jsonReq('http://localhost/api/admin/auth/token/refresh', 'POST', { refreshToken }),
    );
    expect(first.status).toBe(200);
    const { refreshToken: rotated } = await first.json();
    expect(rotated).not.toBe(refreshToken);

    // The new one works. Checked before the reuse-of-old-token case below,
    // since reuse detection legitimately revokes the whole family — including
    // `rotated` — and that behavior has its own dedicated test right after
    // this one.
    const second = await refreshRoute.POST(
      jsonReq('http://localhost/api/admin/auth/token/refresh', 'POST', {
        refreshToken: rotated,
      }),
    );
    expect(second.status).toBe(200);

    // The rotated-out original is dead on its own.
    const reuseOld = await refreshRoute.POST(
      jsonReq('http://localhost/api/admin/auth/token/refresh', 'POST', { refreshToken }),
    );
    expect(reuseOld.status).toBe(401);
  });

  it('reusing an already-rotated token revokes the whole family', async () => {
    await makeUser('editor');
    const { refreshToken } = await issue('editor@example.com');

    const rotate1 = await refreshRoute.POST(
      jsonReq('http://localhost/api/admin/auth/token/refresh', 'POST', { refreshToken }),
    );
    const { refreshToken: rotated } = await rotate1.json();

    // Reuse the original (already-rotated-out) token.
    const reuse = await refreshRoute.POST(
      jsonReq('http://localhost/api/admin/auth/token/refresh', 'POST', { refreshToken }),
    );
    expect(reuse.status).toBe(401);

    // The legitimately-rotated descendant is now revoked too.
    const rotate2 = await refreshRoute.POST(
      jsonReq('http://localhost/api/admin/auth/token/refresh', 'POST', {
        refreshToken: rotated,
      }),
    );
    expect(rotate2.status).toBe(401);
  });

  it("401s a suspended user's refresh attempt", async () => {
    const user = await makeUser('editor');
    const { refreshToken } = await issue('editor@example.com');
    await User.findByIdAndUpdate(user._id, { status: 'suspended' });

    const res = await refreshRoute.POST(
      jsonReq('http://localhost/api/admin/auth/token/refresh', 'POST', { refreshToken }),
    );
    expect(res.status).toBe(401);
  });

  it('shrinks scopes on refresh after a demotion', async () => {
    const user = await makeUser('admin');
    const { refreshToken } = await issue('admin@example.com');
    await User.findByIdAndUpdate(user._id, { role: 'viewer' });

    const res = await refreshRoute.POST(
      jsonReq('http://localhost/api/admin/auth/token/refresh', 'POST', { refreshToken }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.scopes).toEqual(['content:read', 'lead:read', 'media:read']);
  });
});

describe('resolveAuth — Bearer parity (PLAN.md W14 item 7)', () => {
  it('resolves a session from a valid Bearer token', async () => {
    await makeUser('editor');
    const { accessToken } = await (
      await tokenRoute.POST(
        jsonReq('http://localhost/api/admin/auth/token', 'POST', {
          email: 'editor@example.com',
          password: PASSWORD,
        }),
      )
    ).json();

    const auth = await resolveAuth(
      jsonReq('http://localhost/api/admin/projects', 'GET', undefined, {
        authorization: `Bearer ${accessToken}`,
      }),
    );
    expect(auth.viaBearer).toBe(true);
    expect(auth.session?.role).toBe('editor');
    expect(authorized(auth, 'content:read')).toBe(true);
    expect(authorized(auth, 'content:publish')).toBe(false); // Not granted to editor.
  });

  it('rejects a malformed/invalid Bearer token', async () => {
    const auth = await resolveAuth(
      jsonReq('http://localhost/api/admin/projects', 'GET', undefined, {
        authorization: 'Bearer not-a-real-token',
      }),
    );
    expect(auth.session).toBeNull();
  });

  it("token scopes narrower than the role can't be widened back by authorized()", async () => {
    await makeUser('admin');
    const { accessToken } = await (
      await tokenRoute.POST(
        jsonReq('http://localhost/api/admin/auth/token', 'POST', {
          email: 'admin@example.com',
          password: PASSWORD,
          scopes: ['content:read'],
        }),
      )
    ).json();

    const auth = await resolveAuth(
      jsonReq('http://localhost/api/admin/users', 'GET', undefined, {
        authorization: `Bearer ${accessToken}`,
      }),
    );
    // The role (admin) has user:read, but the token was scoped to only
    // content:read — the token's own scope list caps it regardless.
    expect(authorized(auth, 'content:read')).toBe(true);
    expect(authorized(auth, 'user:read')).toBe(false);
  });

  it('a suspended user’s existing access token is rejected before its 15-minute expiry', async () => {
    const user = await makeUser('editor');
    const { accessToken } = await (
      await tokenRoute.POST(
        jsonReq('http://localhost/api/admin/auth/token', 'POST', {
          email: 'editor@example.com',
          password: PASSWORD,
        }),
      )
    ).json();

    await User.findByIdAndUpdate(user._id, { status: 'suspended' });

    const auth = await resolveAuth(
      jsonReq('http://localhost/api/admin/projects', 'GET', undefined, {
        authorization: `Bearer ${accessToken}`,
      }),
    );
    expect(auth.session).toBeNull();
  });
});

describe('/api/admin/auth/tokens — self-service session management', () => {
  function authedAs(user: { _id: unknown; email: string; role: 'editor' | 'admin' }) {
    getAdminSessionMock.mockResolvedValue({
      id: String(user._id),
      email: user.email,
      role: user.role,
      totpEnabled: false,
    });
  }

  it('GET lists exactly one row per active family, never the token hash', async () => {
    const user = await makeUser('editor');
    authedAs({ _id: user._id, email: user.email, role: 'editor' });
    await tokenRoute.POST(
      jsonReq('http://localhost/api/admin/auth/token', 'POST', {
        email: 'editor@example.com',
        password: PASSWORD,
      }),
    );

    const res = await tokensRoute.GET();
    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].tokenHash).toBeUndefined();
  });

  it("GET never returns another user's tokens", async () => {
    const me = await makeUser('editor');
    const other = await makeUser('admin');
    await RefreshToken.create({
      userId: other._id,
      familyId: 'f-other',
      tokenHash: 'hash-other',
      scopes: ['content:read'],
      expiresAt: new Date(Date.now() + 1000 * 60),
    });

    authedAs({ _id: me._id, email: me.email, role: 'editor' });
    const res = await tokensRoute.GET();
    const body = await res.json();
    expect(body.items).toHaveLength(0);
  });

  it('DELETE /tokens/[id] revokes only that token, scoped to its owner', async () => {
    const owner = await makeUser('editor');
    const other = await makeUser('admin');
    const ownToken = await RefreshToken.create({
      userId: owner._id,
      familyId: 'f1',
      tokenHash: 'hash1',
      scopes: ['content:read'],
      expiresAt: new Date(Date.now() + 1000 * 60),
    });
    const otherToken = await RefreshToken.create({
      userId: other._id,
      familyId: 'f2',
      tokenHash: 'hash2',
      scopes: ['content:read'],
      expiresAt: new Date(Date.now() + 1000 * 60),
    });

    authedAs({ _id: owner._id, email: owner.email, role: 'editor' });

    // Not owner's token — 404 even though it's a valid id.
    const wrongOwner = await tokenByIdRoute.DELETE(
      csrfReq(`http://localhost/api/admin/auth/tokens/${otherToken._id}`, 'DELETE'),
      { params: Promise.resolve({ id: String(otherToken._id) }) },
    );
    expect(wrongOwner.status).toBe(404);
    expect((await RefreshToken.findById(otherToken._id))?.revokedAt).toBeUndefined();

    // Owner's own token — revoked.
    const ownDelete = await tokenByIdRoute.DELETE(
      csrfReq(`http://localhost/api/admin/auth/tokens/${ownToken._id}`, 'DELETE'),
      { params: Promise.resolve({ id: String(ownToken._id) }) },
    );
    expect(ownDelete.status).toBe(204);
    expect((await RefreshToken.findById(ownToken._id))?.revokedAt).toBeInstanceOf(Date);
  });

  it('DELETE /tokens (revoke all) only touches the caller’s own tokens', async () => {
    const me = await makeUser('editor');
    const other = await makeUser('admin');
    await RefreshToken.create([
      {
        userId: me._id,
        familyId: 'f1',
        tokenHash: 'h1',
        scopes: ['content:read'],
        expiresAt: new Date(Date.now() + 1000 * 60),
      },
      {
        userId: me._id,
        familyId: 'f2',
        tokenHash: 'h2',
        scopes: ['content:read'],
        expiresAt: new Date(Date.now() + 1000 * 60),
      },
      {
        userId: other._id,
        familyId: 'f3',
        tokenHash: 'h3',
        scopes: ['content:read'],
        expiresAt: new Date(Date.now() + 1000 * 60),
      },
    ]);

    authedAs({ _id: me._id, email: me.email, role: 'editor' });
    const res = await tokensRoute.DELETE(
      csrfReq('http://localhost/api/admin/auth/tokens', 'DELETE'),
    );
    expect(res.status).toBe(200);

    expect(await RefreshToken.countDocuments({ userId: me._id, revokedAt: null })).toBe(0);
    expect(await RefreshToken.countDocuments({ userId: other._id, revokedAt: null })).toBe(1);
  });
});

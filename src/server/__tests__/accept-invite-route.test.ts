import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { NextRequest } from 'next/server';

/**
 * PLAN.md W11 — the public invite-accept endpoint. TURNSTILE_SECRET_KEY
 * is deliberately left unset in this test environment, so
 * verifyTurnstile() no-ops to true (same pattern the contact form's own
 * tests would use, if it had any) — what's under test here is the token/
 * expiry/single-use logic, not Cloudflare's widget.
 */

let mongod: MongoMemoryServer | undefined;
let User: (typeof import('../models/user'))['User'];
let Invite: (typeof import('../models/invite'))['Invite'];
let saltedHash: (typeof import('../rate-limit'))['saltedHash'];
let route: typeof import('../../app/api/auth/accept-invite/[token]/route');

function req(method: string, body?: unknown) {
  return new NextRequest('http://localhost/api/auth/accept-invite/x', {
    method,
    headers: body !== undefined ? { 'content-type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

function params(token: string) {
  return { params: Promise.resolve({ token }) };
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.AUTH_SECRET = 'test-auth-secret-do-not-use-in-real-life';

  const { connectToDatabase } = await import('../db');
  ({ User } = await import('../models/user'));
  ({ Invite } = await import('../models/invite'));
  ({ saltedHash } = await import('../rate-limit'));
  route = await import('../../app/api/auth/accept-invite/[token]/route');
  await connectToDatabase();
}, 60_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

afterEach(async () => {
  await User.deleteMany({});
  await Invite.deleteMany({});
});

async function makeInvite({ expired = false } = {}) {
  const user = await User.create({
    email: 'invitee@example.com',
    role: 'editor',
    status: 'invited',
  });
  const token = 'a-raw-token-value';
  await Invite.create({
    userId: user._id,
    tokenHash: saltedHash(token),
    expiresAt: new Date(Date.now() + (expired ? -1000 : 1000 * 60 * 60)),
  });
  return { user, token };
}

describe('GET /api/auth/accept-invite/[token]', () => {
  it('401s for an unknown token', async () => {
    const res = await route.GET(req('GET'), params('does-not-exist'));
    expect(res.status).toBe(401);
  });

  it('401s for an expired token', async () => {
    const { token } = await makeInvite({ expired: true });
    const res = await route.GET(req('GET'), params(token));
    expect(res.status).toBe(401);
  });

  it('returns the email and role for a valid token', async () => {
    const { token } = await makeInvite();
    const res = await route.GET(req('GET'), params(token));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ email: 'invitee@example.com', role: 'editor' });
  });
});

describe('POST /api/auth/accept-invite/[token]', () => {
  it('401s for an unknown token', async () => {
    const res = await route.POST(
      req('POST', { name: 'A Name', password: 'a-strong-password-1' }),
      params('does-not-exist'),
    );
    expect(res.status).toBe(401);
  });

  it('422s on a short password', async () => {
    const { token } = await makeInvite();
    const res = await route.POST(req('POST', { name: 'A Name', password: 'short' }), params(token));
    expect(res.status).toBe(422);
  });

  it('activates the account: sets name/password, flips status, deletes the invite', async () => {
    const { user, token } = await makeInvite();
    const res = await route.POST(
      req('POST', { name: 'A Name', password: 'a-strong-password-1' }),
      params(token),
    );
    expect(res.status).toBe(200);

    const updated = await User.findById(user._id).lean();
    expect(updated).toMatchObject({ name: 'A Name', status: 'active' });
    expect(updated?.passwordHash).toBeTruthy();
    expect(updated?.passwordHash).not.toBe('a-strong-password-1');

    expect(await Invite.countDocuments({ userId: user._id })).toBe(0);
  });

  it('is single-use — the same token fails on a second submission', async () => {
    const { token } = await makeInvite();
    const first = await route.POST(
      req('POST', { name: 'A Name', password: 'a-strong-password-1' }),
      params(token),
    );
    expect(first.status).toBe(200);

    const second = await route.POST(
      req('POST', { name: 'Someone Else', password: 'another-strong-pass' }),
      params(token),
    );
    expect(second.status).toBe(401);
  });
});

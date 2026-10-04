import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { Secret, TOTP } from 'otpauth';

/**
 * verifyCredentials() is the rate-limit/password/TOTP/suspension check
 * shared by auth.ts's authorize() and POST /api/admin/auth/token
 * (PLAN.md W12) — extracted specifically so both call sites can be
 * proven correct once, here, rather than only through
 * e2e/admin.spec.ts's real browser login.
 */

let mongod: MongoMemoryServer | undefined;
let User: (typeof import('../models/user'))['User'];
let hashPassword: (typeof import('../password'))['hashPassword'];
let encryptTotpSecret: (typeof import('../totp'))['encryptTotpSecret'];
let verifyCredentials: (typeof import('../credentials'))['verifyCredentials'];

const PASSWORD = 'a-strong-password-123';

function fakeRequest(ip = '203.0.113.1') {
  return new Request('http://localhost/api/admin/auth/token', {
    headers: { 'x-forwarded-for': ip },
  });
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.AUTH_SECRET = 'test-auth-secret-do-not-use-in-real-life';

  const { connectToDatabase } = await import('../db');
  ({ User } = await import('../models/user'));
  ({ hashPassword } = await import('../password'));
  ({ encryptTotpSecret } = await import('../totp'));
  ({ verifyCredentials } = await import('../credentials'));
  await connectToDatabase();
}, 60_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('verifyCredentials', () => {
  it('succeeds for a correct password, no TOTP', async () => {
    await User.create({
      email: 'a@example.com',
      role: 'editor',
      status: 'active',
      passwordHash: await hashPassword(PASSWORD),
    });
    const result = await verifyCredentials('a@example.com', PASSWORD, '', fakeRequest());
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.user.email).toBe('a@example.com');
  });

  it('records lastLoginAt on success', async () => {
    const user = await User.create({
      email: 'a@example.com',
      role: 'editor',
      status: 'active',
      passwordHash: await hashPassword(PASSWORD),
    });
    await verifyCredentials('a@example.com', PASSWORD, '', fakeRequest());
    expect((await User.findById(user._id))?.lastLoginAt).toBeInstanceOf(Date);
  });

  it('rejects an unknown email with the generic reason', async () => {
    const result = await verifyCredentials('nobody@example.com', PASSWORD, '', fakeRequest());
    expect(result).toEqual({ ok: false, reason: 'invalid' });
  });

  it('rejects an invited user with no password yet, same generic reason', async () => {
    await User.create({ email: 'invited@example.com', role: 'editor', status: 'invited' });
    const result = await verifyCredentials('invited@example.com', PASSWORD, '', fakeRequest());
    expect(result).toEqual({ ok: false, reason: 'invalid' });
  });

  it('rejects a suspended account even with the correct password', async () => {
    await User.create({
      email: 'suspended@example.com',
      role: 'editor',
      status: 'suspended',
      passwordHash: await hashPassword(PASSWORD),
    });
    const result = await verifyCredentials('suspended@example.com', PASSWORD, '', fakeRequest());
    expect(result).toEqual({ ok: false, reason: 'invalid' });
  });

  it('rejects a wrong password', async () => {
    await User.create({
      email: 'a@example.com',
      role: 'editor',
      status: 'active',
      passwordHash: await hashPassword(PASSWORD),
    });
    const result = await verifyCredentials('a@example.com', 'wrong-password', '', fakeRequest());
    expect(result).toEqual({ ok: false, reason: 'invalid' });
  });

  it('requires a TOTP code when one is enrolled', async () => {
    const secret = new Secret({ size: 20 }).base32;
    await User.create({
      email: 'a@example.com',
      role: 'editor',
      status: 'active',
      passwordHash: await hashPassword(PASSWORD),
      totpSecret: encryptTotpSecret(secret),
    });
    const result = await verifyCredentials('a@example.com', PASSWORD, '', fakeRequest());
    expect(result).toEqual({ ok: false, reason: 'totp_required' });
  });

  it('succeeds with a correct TOTP code', async () => {
    const secret = new Secret({ size: 20 }).base32;
    await User.create({
      email: 'a@example.com',
      role: 'editor',
      status: 'active',
      passwordHash: await hashPassword(PASSWORD),
      totpSecret: encryptTotpSecret(secret),
    });
    const code = new TOTP({ secret }).generate();
    const result = await verifyCredentials('a@example.com', PASSWORD, code, fakeRequest());
    expect(result.ok).toBe(true);
  });

  it('rejects an incorrect TOTP code', async () => {
    const secret = new Secret({ size: 20 }).base32;
    await User.create({
      email: 'a@example.com',
      role: 'editor',
      status: 'active',
      passwordHash: await hashPassword(PASSWORD),
      totpSecret: encryptTotpSecret(secret),
    });
    const result = await verifyCredentials('a@example.com', PASSWORD, '000000', fakeRequest());
    expect(result).toEqual({ ok: false, reason: 'invalid' });
  });

  it('rate-limits after repeated attempts from the same IP', async () => {
    const ip = '198.51.100.7';
    for (let i = 0; i < 20; i++) {
      await verifyCredentials('nobody@example.com', 'x', '', fakeRequest(ip));
    }
    const result = await verifyCredentials('nobody@example.com', 'x', '', fakeRequest(ip));
    expect(result).toEqual({ ok: false, reason: 'rate_limited' });
  });
});

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

/**
 * getAdminSession() is database-backed, not JWT-trusting (PLAN.md W10) —
 * the whole point of this workstream. `auth()` (the JWT read) is mocked;
 * everything downstream of it — the User lookup, the status/role check —
 * is real.
 *
 * `getAdminSession` is wrapped in React's `cache()`, which memoizes
 * *within a single request* via Next's own request-scoped storage —
 * confirmed empirically not to memoize at all outside that context (a
 * bare Node/Vitest process has no such scope, so `cache()` just calls
 * through every time), which is exactly what lets "change the database,
 * call again" mean anything in this file.
 */

vi.mock('../auth', () => ({ auth: vi.fn() }));

let mongod: MongoMemoryServer | undefined;
let User: (typeof import('../models/user'))['User'];
let getAdminSession: (typeof import('../session'))['getAdminSession'];
let authMock: ReturnType<typeof vi.mocked<(typeof import('../auth'))['auth']>>;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();

  const { connectToDatabase } = await import('../db');
  ({ User } = await import('../models/user'));
  ({ getAdminSession } = await import('../session'));
  const { auth } = await import('../auth');
  authMock = vi.mocked(auth);
  await connectToDatabase();
}, 60_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

/**
 * Points the mocked JWT read at a given user, or at nothing. Cast via
 * `unknown` — `auth()`'s real type is a union that also covers its
 * middleware-wrapper overload (`NextMiddleware`), which shares no
 * structural overlap with the plain `{ user }` shape `getAdminSession()`
 * actually reads; TS can't tell from this call site alone which overload
 * applies, so a direct cast is rejected but an `unknown` round-trip is
 * exactly what the type error itself suggests.
 */
function jwtSaysUserIs(user: { _id: unknown; email: string } | null) {
  authMock.mockResolvedValue(
    (user ? { user: { id: String(user._id), email: user.email } } : null) as unknown as Awaited<
      ReturnType<typeof authMock>
    >,
  );
}

describe('getAdminSession — the stale-role problem, fixed (PLAN.md W10)', () => {
  it('returns the current role from the database, not a JWT claim', async () => {
    const user = await User.create({ email: 'x@example.com', role: 'editor', status: 'active' });
    jwtSaysUserIs(user);
    const session = await getAdminSession();
    expect(session).toMatchObject({ id: String(user._id), role: 'editor' });
  });

  it('a role promotion in the database is visible on the very next call — the JWT still says the old role', async () => {
    const user = await User.create({ email: 'x@example.com', role: 'editor', status: 'active' });
    jwtSaysUserIs(user); // The mocked JWT never changes below — only the database does.

    await User.findByIdAndUpdate(user._id, { role: 'admin' });
    expect((await getAdminSession())?.role).toBe('admin');
  });

  it('a suspended user is rejected on their very next request', async () => {
    const user = await User.create({ email: 'x@example.com', role: 'editor', status: 'active' });
    jwtSaysUserIs(user);
    expect(await getAdminSession()).not.toBeNull();

    await User.findByIdAndUpdate(user._id, { status: 'suspended' });
    expect(await getAdminSession()).toBeNull();
  });

  it('a deleted user is rejected', async () => {
    const user = await User.create({ email: 'x@example.com', role: 'editor', status: 'active' });
    jwtSaysUserIs(user);
    await User.findByIdAndDelete(user._id);
    expect(await getAdminSession()).toBeNull();
  });

  it('returns null when there is no JWT session at all', async () => {
    jwtSaysUserIs(null);
    expect(await getAdminSession()).toBeNull();
  });

  it('returns null rather than throwing for a malformed id', async () => {
    authMock.mockResolvedValue({
      user: { id: 'not-an-object-id', email: 'x@example.com' },
    } as unknown as Awaited<ReturnType<typeof authMock>>);
    await expect(getAdminSession()).resolves.toBeNull();
  });
});

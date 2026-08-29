/**
 * Test-only admin account for the E2E suite (PLAN.md W6 item 5/6).
 *
 * Deliberately NOT `seed-admin.ts` with a flag: that script exists to
 * bootstrap the one real production admin account and prints a fresh
 * random password every run (AGENTS.md §7 — "There is no signup route and
 * there must not be one"). This script is the same idea for a throwaway
 * account that only ever exists in a test database (local `pnpm e2e` or
 * e2e.yml's ephemeral CI Mongo) — a deterministic password from an env var,
 * and explicitly no TOTP secret, so `e2e/admin.spec.ts` can log in without
 * simulating a live authenticator code. Never run this against a database
 * anything else reads from.
 *
 * Usage: `pnpm seed:e2e-admin` (reads E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD).
 */
import mongoose from 'mongoose';
import { User } from '../src/server/models/user';
import { hashPassword } from '../src/server/password';

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set.');
    process.exit(1);
  }

  const email = (process.env.E2E_ADMIN_EMAIL ?? '').trim().toLowerCase();
  const password = process.env.E2E_ADMIN_PASSWORD ?? '';
  if (!email || !password) {
    console.error('E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD must both be set.');
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  await mongoose.connect(uri);
  // $unset totpSecret too: reruns against a database from a previous test
  // session must never leave this account behind a 2FA gate the suite has
  // no way to satisfy.
  await User.findOneAndUpdate(
    { email },
    { $set: { email, passwordHash, role: 'admin' }, $unset: { totpSecret: '' } },
    { upsert: true },
  );
  await mongoose.disconnect();

  console.log(`✓ E2E admin account ready: ${email}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

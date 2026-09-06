/**
 * Bootstraps the single `owner` account. Deliberately the only way one
 * gets created — AGENTS.md §7 "no signup route and there must not be
 * one." Every other account (PLAN.md W11) comes from the invite flow
 * instead; this script is only ever for the one owner.
 *
 * Idempotent by email: rerunning updates the existing account's password
 * rather than creating a duplicate, so it also doubles as a password-reset
 * tool if you ever lose the generated one.
 *
 * Migration (PLAN.md W9): before roles existed, the one account this
 * script bootstraps was seeded with `role: 'admin'`. The upsert below
 * forces that specific document to `role: 'owner'` on every run,
 * regardless of what it was before — that's the whole migration.
 * Deliberately scoped to just this one email rather than a blanket
 * `updateMany({ role: 'admin' })`: a local/e2e database can easily have
 * other legacy `admin`-role documents (the seeded e2e test account, for
 * one) that must stay `admin`, not all become `owner` — `owner` is a
 * singleton (see the ROLES comment in permissions.ts).
 *
 * Usage:
 *   pnpm seed:admin                       # uses ADMIN_EMAIL from .env
 *   pnpm seed:admin you@example.com       # explicit email
 */
import mongoose from 'mongoose';
import { User } from '../src/server/models/user';
import { hashPassword, generatePassword } from '../src/server/password';

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Run with: pnpm seed:admin (loads .env automatically)');
    process.exit(1);
  }

  const email = (process.argv[2] ?? process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    console.error(
      'No valid admin email. Set ADMIN_EMAIL in .env, or run: pnpm seed:admin you@example.com',
    );
    process.exit(1);
  }

  const password = generatePassword();
  const passwordHash = await hashPassword(password);

  await mongoose.connect(uri);

  const existing = await User.findOne({ email });
  if (existing && existing.role !== 'owner') {
    console.log(`✓ Migrating ${email} from role '${existing.role}' to 'owner'.`);
  }
  await User.findOneAndUpdate(
    { email },
    { email, passwordHash, role: 'owner', status: 'active' },
    { upsert: true },
  );

  await mongoose.disconnect();

  const verb = existing ? 'Password reset' : 'Admin account created';
  console.log(`\n✓ ${verb} for ${email}`);
  console.log(`\n  Password: ${password}`);
  console.log('\n  This is shown once and is not stored anywhere in plain text.');
  console.log('  Save it in a password manager now — you will need it to log in at /admin/login.');
  if (existing?.totpSecret) {
    console.log(
      '\n  Note: this account previously had 2FA enabled. Resetting the password does not\n' +
        '  disable it — you will still need an authenticator code to sign in.',
    );
  }
  console.log('');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

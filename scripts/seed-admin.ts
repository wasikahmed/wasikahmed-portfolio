/**
 * Bootstraps the single admin account. Deliberately the only way one gets
 * created — PLAN.md §3 "single admin seeded by a CLI script — no public
 * signup route exists."
 *
 * Idempotent by email: rerunning updates the existing account's password
 * rather than creating a duplicate, so it also doubles as a password-reset
 * tool if you ever lose the generated one.
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
  await User.findOneAndUpdate({ email }, { email, passwordHash, role: 'admin' }, { upsert: true });

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

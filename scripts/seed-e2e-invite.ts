/**
 * Test-only invited account for the E2E suite (PLAN.md W14 item 6).
 *
 * Mirrors seed-e2e-admin.ts's reasoning exactly, one level earlier in the
 * lifecycle: e2e/invite.spec.ts needs a real `status: 'invited'` User plus
 * a valid Invite document to drive the actual accept-invite → login →
 * permission-ceiling round trip, but the real invite token only ever
 * leaves the server inside an emailed link (src/app/api/admin/users/
 * route.ts) — there is no API response or DB field that hands it back in
 * plaintext, by design. So this script plays the part of that route's DB
 * writes directly (same shape, same `saltedHash` it uses for the token),
 * with a token this script and the test both already know, instead of the
 * suite trying to intercept an email that may not even be configured to
 * send (Gmail SMTP is optional — see .env.example). The accept, login, and
 * permission-ceiling steps that follow are all exercised for real.
 *
 * Usage: `pnpm seed:e2e-invite` (reads E2E_INVITE_EMAIL/E2E_INVITE_TOKEN).
 * Never run against a database anything else reads from.
 */
import { createHash } from 'node:crypto';
import mongoose from 'mongoose';
import { User } from '../src/server/models/user';
import { Invite } from '../src/server/models/invite';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // matches api/admin/users/route.ts

// Reimplemented rather than imported from src/server/rate-limit.ts: that
// module (like most of src/server/) starts with `import 'server-only'`,
// which throws unconditionally outside Next's own build — fine inside the
// app, fatal in a plain tsx script. Must stay byte-for-byte identical to
// `saltedHash` there (same algorithm, same salt source) or a token this
// script hashes won't match what the real accept-invite route looks up.
function saltedHash(value: string): string {
  const salt = process.env.AUTH_SECRET ?? 'dev-only-salt';
  return createHash('sha256').update(`${salt}:${value}`).digest('hex');
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set.');
    process.exit(1);
  }

  const email = (process.env.E2E_INVITE_EMAIL ?? '').trim().toLowerCase();
  const token = process.env.E2E_INVITE_TOKEN ?? '';
  if (!email || !token) {
    console.error('E2E_INVITE_EMAIL and E2E_INVITE_TOKEN must both be set.');
    process.exit(1);
  }

  await mongoose.connect(uri);

  // Reset to a fresh 'invited' state on every run — a prior run's e2e/
  // invite.spec.ts leaves this account 'active' with a password set, and
  // Invite docs are single-use (the accept route deletes them all for the
  // user on success), so both need to be put back to the pre-accept state.
  const invited = await User.findOneAndUpdate(
    { email },
    {
      $set: { email, role: 'viewer', status: 'invited' },
      $unset: { name: '', passwordHash: '', totpSecret: '' },
    },
    { upsert: true, returnDocument: 'after' },
  );

  await Invite.deleteMany({ userId: invited._id });
  await Invite.create({
    userId: invited._id,
    tokenHash: saltedHash(token),
    expiresAt: new Date(Date.now() + INVITE_TTL_MS),
  });

  await mongoose.disconnect();

  console.log(`✓ E2E invite ready: ${email} (viewer, pending accept)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// Importing this from a Client Component is a build error, not a silent
// leak — see https://nextjs.org/docs/app/getting-started/server-and-client-components#preventing-environment-poisoning
import 'server-only';

import { cache } from 'react';
import mongoose from 'mongoose';
import { auth } from './auth';
import { connectToDatabase } from './db';
import { User } from './models/user';
import { ROLES, type Role } from './permissions';

/**
 * The one typed shape the rest of the app uses for the logged-in admin.
 *
 * Auth.js v5's `Session`/`User`/`JWT` interfaces live in `@auth/core` and
 * are only re-exported (not locally declared) from `next-auth`'s own
 * modules, which means the documented `declare module "next-auth" { ... }`
 * augmentation pattern does not reliably merge under this project's
 * `moduleResolution: "bundler"` + pnpm's isolated node_modules — verified
 * empirically while wiring this up, not assumed. Rather than scatter `as`
 * casts through every admin page and API route, the cast happens once,
 * here, and everything downstream gets a real, narrow type.
 */
export interface AdminSession {
  id: string;
  email: string;
  role: Role;
  totpEnabled: boolean;
}

/**
 * Database-backed, not JWT-trusting (PLAN.md W10 — "the stale-role
 * problem"). The JWT cookie still proves *which* user is calling; this
 * function re-reads the User document on every call to decide *what they
 * may currently do*, ignoring whatever role/status the token itself
 * claims. A demoted, suspended, or deleted user is rejected here on their
 * very next request — no token-versioning scheme, no refresh-cycle
 * latency, no separate invalidation path to get wrong.
 *
 * That's one indexed `findById` per admin request, wrapped in React's
 * `cache()` exactly like `queries.ts` — multiple calls within a single
 * render or route handler hit Mongo once. For a system with a handful of
 * users this cost is invisible.
 *
 * `proxy.ts` deliberately does NOT call this — it runs in the Edge
 * runtime and cannot load Mongoose (AGENTS.md §7), so it stays
 * cookie-only and coarse ("is anyone logged in?"). This function answers
 * the finer question ("may *this* user do *this*?") for every route
 * handler and Server Component that needs it.
 */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const session = await auth();
  const jwtUser = session?.user as { id?: string; email?: string | null } | undefined;
  if (!jwtUser?.id || !mongoose.Types.ObjectId.isValid(jwtUser.id)) return null;

  await connectToDatabase();
  const user = await User.findById(jwtUser.id).lean();

  // Deleted since the token was issued, suspended, or (defensively) stuck
  // with a role value outside the current enum — all three mean "not a
  // valid admin session," not "permission denied for a valid one."
  if (!user || user.status === 'suspended') return null;
  if (!ROLES.includes(user.role as Role)) return null;

  return {
    id: String(user._id),
    email: user.email,
    role: user.role as Role,
    totpEnabled: Boolean(user.totpSecret),
  };
});

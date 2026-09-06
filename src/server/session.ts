// Importing this from a Client Component is a build error, not a silent
// leak — see https://nextjs.org/docs/app/getting-started/server-and-client-components#preventing-environment-poisoning
import 'server-only';

import { auth } from './auth';
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
 *
 * `role` widened from the literal `'admin'` to the full `Role` union
 * (PLAN.md W9) — still read straight off the JWT claim here, exactly as
 * before, so this is not yet the stale-role fix: a demoted or suspended
 * user's existing token still reports their old role until it expires.
 * PLAN.md W10 makes this function re-read the user document from the
 * database instead, which is the actual fix; landing the wider type now
 * without the DB read is what keeps W9 a no-behaviour-change addition.
 */
export interface AdminSession {
  id: string;
  email: string;
  role: Role;
  totpEnabled: boolean;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const session = await auth();
  const user = session?.user as
    { id?: string; email?: string | null; role?: string; totpEnabled?: boolean } | undefined;

  if (!user?.id || !user.email) return null;
  if (!ROLES.includes(user.role as Role)) return null;

  return {
    id: user.id,
    email: user.email,
    role: user.role as Role,
    totpEnabled: Boolean(user.totpEnabled),
  };
}

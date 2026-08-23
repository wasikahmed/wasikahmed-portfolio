// Importing this from a Client Component is a build error, not a silent
// leak — see https://nextjs.org/docs/app/getting-started/server-and-client-components#preventing-environment-poisoning
import 'server-only';

import { auth } from './auth';

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
  role: 'admin';
  totpEnabled: boolean;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const session = await auth();
  const user = session?.user as
    { id?: string; email?: string | null; role?: string; totpEnabled?: boolean } | undefined;

  if (!user?.id || !user.email || user.role !== 'admin') return null;

  return {
    id: user.id,
    email: user.email,
    role: 'admin',
    totpEnabled: Boolean(user.totpEnabled),
  };
}

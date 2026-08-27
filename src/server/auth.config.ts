import type { NextAuthConfig } from 'next-auth';

/**
 * The Edge-safe half of the Auth.js config — no Credentials provider, no
 * argon2, no Mongoose. `middleware.ts` runs in the Edge runtime, which
 * cannot load `@node-rs/argon2`'s native bindings or Mongoose's Node-only
 * APIs; importing the full config (src/server/auth.ts) into middleware
 * pulls that whole dependency graph into the Edge bundle even though
 * middleware never calls `authorize()` — the bundler can't prove that
 * statically, so it fails outright rather than silently working.
 *
 * `providers: []` here is deliberate: middleware only ever needs to
 * decode/verify the JWT session cookie via `auth()`, never to run a
 * sign-in flow, so it doesn't need any provider registered. The real
 * providers live in auth.ts, used by the `/api/auth/*` route handlers and
 * everything else, which all run in the standard Node.js runtime.
 */
export const authConfig: NextAuthConfig = {
  trustHost: true,
  // Auth.js defaults to 30 days; for a single-admin CMS that's a long time
  // for a stolen or shared-device session to stay valid. See PLAN.md W2
  // item 6.
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: '/admin/login' },
  providers: [],
  callbacks: {
    session({ session, token }) {
      const user = session.user as typeof session.user & { role: string; totpEnabled: boolean };
      user.id = token.sub as string;
      user.role = token.role as string;
      user.totpEnabled = Boolean(token.totpEnabled);
      return session;
    },
  },
};

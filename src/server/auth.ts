// Importing this from a Client Component is a build error, not a silent
// leak — see https://nextjs.org/docs/app/getting-started/server-and-client-components#preventing-environment-poisoning
import 'server-only';

import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { authConfig } from './auth.config';
import { connectToDatabase } from './db';
import { User } from './models/user';
import { verifyCredentials } from './credentials';

/**
 * The full config — Credentials provider, argon2, Mongoose. Only ever
 * imported from code that runs in the Node.js runtime (API routes, Server
 * Components, Server Actions): `middleware.ts` uses `auth.config.ts`
 * instead, which is why that split exists — see its file comment.
 */

/**
 * Thrown when credentials are correct but the account has TOTP enabled and
 * no code (or a wrong one) was supplied. The login form checks for this
 * exact code to decide whether to reveal the code field — see
 * `src/app/(admin)/admin/login/login-form.tsx`.
 */
export class TotpRequiredError extends CredentialsSignin {
  code = 'TOTP_REQUIRED';
}

/**
 * Thrown when either the per-IP or per-email sign-in rate limit trips. See
 * the `authorize` comment below for why this lives here rather than in
 * `proxy.ts` — this is the one code the login form branches on to show a
 * distinct message; see `src/app/(admin)/admin/login/login-form.tsx`.
 */
export class RateLimitedError extends CredentialsSignin {
  code = 'RATE_LIMITED';
}

/**
 * Google sign-in is entirely optional (PLAN.md W11a) — registered only
 * when both env vars are set, same no-op-if-unset pattern as Turnstile/
 * Umami/email elsewhere in this repo. `login/page.tsx` reads the same
 * two vars to decide whether to render the button at all, so an unset
 * config never shows a button that would 404.
 */
const googleConfigured = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    ...(googleConfigured ? [Google({})] : []),
    Credentials({
      credentials: {
        email: {},
        password: {},
        code: {},
      },
      // `authorize()` is the actual code path for POST /api/auth/callback/
      // credentials — `/api/auth/*` isn't in proxy.ts's matcher (AGENTS.md
      // §9), so this route has no rate limiting unless it's self-implemented,
      // same reasoning and pattern as /api/auth/forgot-password. The actual
      // rate limit / password / TOTP / suspension logic lives in
      // credentials.ts, shared with POST /api/admin/auth/token (PLAN.md
      // W12) — this just translates the result into Auth.js's
      // CredentialsSignin subclasses, which only this provider needs.
      async authorize(raw, request) {
        const email = typeof raw?.email === 'string' ? raw.email : '';
        const password = typeof raw?.password === 'string' ? raw.password : '';
        const code = typeof raw?.code === 'string' ? raw.code : '';

        const result = await verifyCredentials(email, password, code, request);
        if (!result.ok) {
          if (result.reason === 'totp_required') throw new TotpRequiredError();
          if (result.reason === 'rate_limited') throw new RateLimitedError();
          throw new CredentialsSignin('Incorrect email or password.');
        }

        return {
          id: String(result.user._id),
          email: result.user.email,
          role: result.user.role,
          totpEnabled: Boolean(result.user.totpSecret),
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    /**
     * Google's own OAuth flow proves *who* someone is; it says nothing
     * about whether this app should let them in. AGENTS.md §7 — no
     * signup route, ever — applies here exactly as it does to Credentials:
     * an email with no existing User document (or a suspended one) is
     * rejected outright, never silently turned into a new account. No
     * database adapter is configured (session strategy is `jwt`, not
     * `database`), so returning `false` here is the only place this can
     * be stopped — there's no separate "create account" step to skip.
     */
    async signIn({ user, account }) {
      if (account?.provider !== 'google') return true; // Credentials gates itself in authorize().
      if (!user.email) return false;

      await connectToDatabase();
      const dbUser = await User.findOne({ email: user.email.toLowerCase() }).lean();
      if (!dbUser || dbUser.status === 'suspended') return false;

      return true;
    },
    async jwt({ token, user, account, trigger }) {
      // Google: `user` here is only what the provider's profile mapping
      // produced (id/name/email/image from the Google account) — none of
      // our role/status data. Re-fetch by email (already vetted by
      // `signIn` above, run moments earlier in the same request) and
      // overwrite `sub` so every downstream `session.user.id` is this
      // app's real User document id, never Google's `sub` claim.
      if (account?.provider === 'google' && user?.email) {
        await connectToDatabase();
        const dbUser = await User.findOne({ email: user.email.toLowerCase() }).lean();
        if (dbUser) {
          token.sub = String(dbUser._id);
          token.role = dbUser.role;
          token.totpEnabled = Boolean(dbUser.totpSecret);
        }
        return token;
      }

      // `user` is typed `User | AdapterUser` by Auth.js; only the shape
      // `authorize()` actually returns (above) carries these fields, so
      // narrow with `in` rather than depending on ambient module
      // augmentation of `User` to merge cleanly — see auth.d.ts's comment
      // for why that merge is unreliable under this project's moduleResolution.
      if (user && 'role' in user) {
        token.role = user.role;
        token.totpEnabled = Boolean((user as { totpEnabled?: boolean }).totpEnabled);
      }

      // The JWT otherwise only reflects `totpEnabled` as of login time.
      // Enrolling/disabling 2FA mid-session (src/app/(admin)/admin/security)
      // calls `useSession().update()`, which lands here with
      // `trigger === "update"` — re-read the DB so the nag banner and
      // security page reflect the change without forcing a fresh sign-in.
      // Safe to touch Mongoose here: this callback only runs inside this
      // full config, never inside middleware's Edge-runtime auth.config.ts.
      if (trigger === 'update' && token.sub) {
        await connectToDatabase();
        const fresh = await User.findById(token.sub).lean();
        if (fresh) token.totpEnabled = Boolean(fresh.totpSecret);
      }

      return token;
    },
  },
});

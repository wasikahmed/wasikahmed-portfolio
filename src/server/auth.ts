// Importing this from a Client Component is a build error, not a silent
// leak — see https://nextjs.org/docs/app/getting-started/server-and-client-components#preventing-environment-poisoning
import 'server-only';

import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { connectToDatabase } from './db';
import { User } from './models/user';
import { verifyPassword } from './password';
import { checkRateLimit, getClientIp, hashIp, saltedHash } from './rate-limit';
import { decryptTotpSecret, verifyTotpCode } from './totp';

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

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
        code: {},
      },
      // `authorize()` is the actual code path for POST /api/auth/callback/
      // credentials — `/api/auth/*` isn't in proxy.ts's matcher (AGENTS.md
      // §9), so this route has no rate limiting unless it's self-implemented,
      // same reasoning and pattern as /api/auth/forgot-password. Checked
      // before the DB lookup so a rate-limited request costs one Mongo
      // round trip, not an argon2 hash comparison too.
      async authorize(raw, request) {
        const email = typeof raw?.email === 'string' ? raw.email.trim().toLowerCase() : '';
        const password = typeof raw?.password === 'string' ? raw.password : '';
        const code = typeof raw?.code === 'string' ? raw.code : '';

        if (!email || !password) throw new CredentialsSignin('Email and password are required.');

        const ipOk = await checkRateLimit(`login-ip:${hashIp(getClientIp(request))}`, {
          limit: 20,
          windowMs: 15 * 60 * 1000,
        });
        if (!ipOk) throw new RateLimitedError();

        // Second limit keyed by the targeted email, independent of IP, so a
        // rotating-IP attacker still can't brute-force one account.
        const emailOk = await checkRateLimit(`login-email:${saltedHash(email)}`, {
          limit: 8,
          windowMs: 15 * 60 * 1000,
        });
        if (!emailOk) throw new RateLimitedError();

        await connectToDatabase();
        const user = await User.findOne({ email }).lean();

        // Same generic error whether the email doesn't exist or the
        // password is wrong — distinguishing the two lets an attacker
        // enumerate valid admin emails for zero benefit to a real user.
        const invalid = new CredentialsSignin('Incorrect email or password.');
        if (!user) throw invalid;

        const passwordOk = await verifyPassword(user.passwordHash, password);
        if (!passwordOk) throw invalid;

        if (user.totpSecret) {
          if (!code) throw new TotpRequiredError();
          const secret = decryptTotpSecret(user.totpSecret);
          if (!verifyTotpCode(secret, code)) {
            throw new CredentialsSignin('Incorrect authentication code.');
          }
        }

        return {
          id: String(user._id),
          email: user.email,
          role: user.role,
          totpEnabled: Boolean(user.totpSecret),
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
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

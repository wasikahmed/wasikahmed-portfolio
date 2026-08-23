import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { connectToDatabase } from './db';
import { User } from './models/user';
import { verifyPassword } from './password';
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
      async authorize(raw) {
        const email = typeof raw?.email === 'string' ? raw.email.trim().toLowerCase() : '';
        const password = typeof raw?.password === 'string' ? raw.password : '';
        const code = typeof raw?.code === 'string' ? raw.code : '';

        if (!email || !password) throw new CredentialsSignin('Email and password are required.');

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

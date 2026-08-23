/*
 * `next-auth` and `next-auth/jwt` only re-export `Session`/`User`/`JWT` via
 * `export type { X } from "@auth/core/..."` — a re-export, not a local
 * declaration — so TS won't merge an augmentation aimed at `"next-auth"`
 * itself. The interfaces actually live in `@auth/core`, so that's what
 * has to be augmented.
 */
import type { DefaultSession } from '@auth/core/types';

declare module '@auth/core/types' {
  interface Session {
    user: {
      id: string;
      role: 'admin';
      totpEnabled: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    role: 'admin';
    totpEnabled: boolean;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    role?: 'admin';
    totpEnabled?: boolean;
  }
}

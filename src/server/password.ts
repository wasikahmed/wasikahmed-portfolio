import { hash, verify } from '@node-rs/argon2';

/**
 * Password hashing — argon2id via `@node-rs/argon2`.
 *
 * Chosen over the more commonly-reached-for `argon2` npm package
 * specifically for Docker: `@node-rs/argon2` ships prebuilt napi
 * binaries for every target including `linux-x64-musl`, so it installs
 * on Alpine (this project's base image) with no build toolchain at all.
 * The plain `argon2` package needs node-gyp + a C compiler, which the
 * production image deliberately does not carry (PLAN.md §4 Dockerfile).
 *
 * `hash()`'s defaults are already argon2id — the plan's specified
 * variant — so nothing further to configure.
 */

export function hashPassword(plain: string): Promise<string> {
  return hash(plain);
}

export function verifyPassword(hashValue: string, plain: string): Promise<boolean> {
  return verify(hashValue, plain);
}

/** For the seed-admin CLI script — a strong, unambiguous one-time password. */
export function generatePassword(length = 20): string {
  // Excludes visually ambiguous characters (0/O, 1/l/I) since this is
  // meant to be read off a terminal and typed once, not generated into a
  // password manager's paste buffer.
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

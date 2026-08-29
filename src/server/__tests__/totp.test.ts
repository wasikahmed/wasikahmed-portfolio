import { beforeAll, describe, expect, it } from 'vitest';
import { TOTP, Secret } from 'otpauth';

/**
 * PLAN.md W6 item 3. `encryptTotpSecret`/`decryptTotpSecret` are the AES-256-GCM
 * round trip that keeps the TOTP secret off disk in plaintext; `verifyTotpCode`
 * is the actual 2FA gate every admin login goes through. Both are pure enough
 * to test directly — no DB involved — but `totp.ts` still carries
 * `import 'server-only'`, so this needs the same vitest alias queries.test.ts
 * added.
 */

let totp: typeof import('../totp');

beforeAll(async () => {
  process.env.AUTH_SECRET = 'test-auth-secret-do-not-use-in-real-life';
  totp = await import('../totp');
});

describe('encryptTotpSecret / decryptTotpSecret', () => {
  it('round-trips a base32 secret', () => {
    const secret = new Secret({ size: 20 }).base32;
    const encrypted = totp.encryptTotpSecret(secret);
    expect(encrypted).not.toBe(secret);
    expect(totp.decryptTotpSecret(encrypted)).toBe(secret);
  });

  it('produces a different ciphertext each time (random IV)', () => {
    const secret = new Secret({ size: 20 }).base32;
    const a = totp.encryptTotpSecret(secret);
    const b = totp.encryptTotpSecret(secret);
    expect(a).not.toBe(b);
  });

  it('fails to decrypt with a tampered ciphertext (GCM auth tag)', () => {
    const secret = new Secret({ size: 20 }).base32;
    const encrypted = totp.encryptTotpSecret(secret);
    const [iv, authTag, ciphertext] = encrypted.split('.');
    // Flip the ciphertext's last character — any byte change should trip
    // GCM's authentication tag check.
    const tampered = [
      iv,
      authTag,
      `${ciphertext.slice(0, -1)}${ciphertext.endsWith('A') ? 'B' : 'A'}`,
    ].join('.');
    expect(() => totp.decryptTotpSecret(tampered)).toThrow();
  });
});

describe('verifyTotpCode', () => {
  it('accepts the current code', () => {
    const secret = new Secret({ size: 20 });
    const generator = new TOTP({ algorithm: 'SHA1', digits: 6, period: 30, secret });
    expect(totp.verifyTotpCode(secret.base32, generator.generate())).toBe(true);
  });

  it('rejects a wrong code', () => {
    const secret = new Secret({ size: 20 });
    expect(totp.verifyTotpCode(secret.base32, '000000')).toBe(false);
  });

  it('accepts a code from one period ago (drift window)', () => {
    const secret = new Secret({ size: 20 });
    const generator = new TOTP({ algorithm: 'SHA1', digits: 6, period: 30, secret });
    const codeOnePeriodAgo = generator.generate({ timestamp: Date.now() - 30_000 });
    expect(totp.verifyTotpCode(secret.base32, codeOnePeriodAgo)).toBe(true);
  });

  it('rejects a code from three periods ago (outside the drift window)', () => {
    const secret = new Secret({ size: 20 });
    const generator = new TOTP({ algorithm: 'SHA1', digits: 6, period: 30, secret });
    const codeThreePeriodsAgo = generator.generate({ timestamp: Date.now() - 90_000 });
    expect(totp.verifyTotpCode(secret.base32, codeThreePeriodsAgo)).toBe(false);
  });

  it('trims whitespace from the submitted code', () => {
    const secret = new Secret({ size: 20 });
    const generator = new TOTP({ algorithm: 'SHA1', digits: 6, period: 30, secret });
    expect(totp.verifyTotpCode(secret.base32, `  ${generator.generate()}  `)).toBe(true);
  });
});

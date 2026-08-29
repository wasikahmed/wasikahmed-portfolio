import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword, generatePassword } from '../password';

/** PLAN.md W6 item 3 — the other half (totp.test.ts covers 2FA). */

describe('hashPassword / verifyPassword', () => {
  it('round-trips a password', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(await verifyPassword(hash, 'correct horse battery staple')).toBe(true);
  });

  it('rejects the wrong password', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(await verifyPassword(hash, 'wrong password')).toBe(false);
  });

  it('produces a different hash each time (random salt)', async () => {
    const a = await hashPassword('same input');
    const b = await hashPassword('same input');
    expect(a).not.toBe(b);
  });

  it('hashes are argon2id', async () => {
    const hash = await hashPassword('whatever');
    expect(hash.startsWith('$argon2id$')).toBe(true);
  });
});

describe('generatePassword', () => {
  it('defaults to 20 characters', () => {
    expect(generatePassword()).toHaveLength(20);
  });

  it('respects a custom length', () => {
    expect(generatePassword(32)).toHaveLength(32);
  });

  it('excludes visually ambiguous characters', () => {
    // Run enough times that a flaky pass (excluded char never rolled) is
    // implausible — 200 chars total across a handful of calls.
    const generated = Array.from({ length: 10 }, () => generatePassword(20)).join('');
    expect(generated).not.toMatch(/[0O1lI]/);
  });

  it('generates different passwords each call', () => {
    expect(generatePassword()).not.toBe(generatePassword());
  });
});

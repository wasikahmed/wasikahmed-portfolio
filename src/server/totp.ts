// Importing this from a Client Component is a build error, not a silent
// leak — see https://nextjs.org/docs/app/getting-started/server-and-client-components#preventing-environment-poisoning
import 'server-only';

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { TOTP, Secret } from 'otpauth';
import QRCode from 'qrcode';

/**
 * TOTP (RFC 6238) enrollment and verification.
 *
 * The secret is encrypted at rest (AES-256-GCM, keyed from AUTH_SECRET)
 * rather than stored as plain base32 in Mongo. Verifying a code still
 * needs the raw secret — there is no hash-and-compare option the way
 * there is for passwords — so "encrypted at rest, decrypted only in this
 * module" is the realistic ceiling here without a dedicated KMS, which is
 * out of scope for a single-admin CMS.
 */

const ISSUER = 'Wasik Ahmed Portfolio';

function encryptionKey(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is not set — required to encrypt the TOTP secret.');
  // scrypt derives a fixed 32-byte key from AUTH_SECRET regardless of its
  // own length/encoding, rather than requiring AUTH_SECRET to already be
  // exactly 32 bytes.
  return scryptSync(secret, 'totp-secret-v1', 32);
}

export function encryptTotpSecret(base32Secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(base32Secret, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // iv.authTag.ciphertext, each base64 — one column, no schema for the parts.
  return [iv, authTag, ciphertext].map((b) => b.toString('base64')).join('.');
}

export function decryptTotpSecret(encrypted: string): string {
  const [ivB64, authTagB64, ciphertextB64] = encrypted.split('.');
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextB64, 'base64')),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}

/** Starts enrollment: a fresh secret plus everything needed to show the QR step. */
export async function generateTotpEnrollment(accountEmail: string) {
  const secret = new Secret({ size: 20 });
  const totp = new TOTP({
    issuer: ISSUER,
    label: accountEmail,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  });

  const otpauthUrl = totp.toString();
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl, { margin: 1, width: 240 });

  return {
    /** Plaintext — held in a short-lived signed cookie until enrollment is confirmed, never persisted unencrypted. */
    base32Secret: secret.base32,
    otpauthUrl,
    qrDataUrl,
  };
}

/** One 30s step of drift tolerance in each direction for clock skew. */
export function verifyTotpCode(base32Secret: string, code: string): boolean {
  const totp = new TOTP({
    issuer: ISSUER,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(base32Secret),
  });
  const delta = totp.validate({ token: code.trim(), window: 1 });
  return delta !== null;
}

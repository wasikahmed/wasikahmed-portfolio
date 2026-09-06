import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { PERMISSIONS } from '../permissions';

/**
 * Refresh tokens for the Bearer-token API (PLAN.md W12) — the durable,
 * revocable half of the pair. The access token is a short-lived, stateless
 * JWT (see access-token.ts) that is never stored anywhere; only its
 * refresh counterpart lives here, and only as a hash (same reasoning as
 * password-reset.ts and invite.ts: never keep the secret itself at rest).
 *
 * `familyId` groups every token descended from one original
 * `POST /api/admin/auth/token` call. Refreshing rotates: the presented
 * token is marked `revokedAt`, a new one is inserted with the same
 * `familyId`. Presenting an already-`revokedAt` token is the standard
 * signal that a refresh token was stolen and used out of order — the
 * whole family gets revoked, not just the one token, on the theory that
 * an attacker holding one token in a chain may hold others.
 *
 * `scopes` are permission strings captured at issuance (defaulting to
 * every permission the caller's role granted at that moment, or a
 * caller-requested subset). They cap what the token can ever do; they are
 * NOT re-derived from the user's current role on refresh — resolveAuth()
 * does that intersection at verification time instead, which is what
 * makes a demotion take effect without needing to touch every
 * already-issued token.
 */
const refreshTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    familyId: { type: String, required: true },
    tokenHash: { type: String, required: true, unique: true },
    scopes: { type: [String], enum: PERMISSIONS, required: true },
    label: { type: String }, // Optional, caller-supplied — "laptop", "CI pipeline", shown in /admin/security.
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
    lastUsedAt: { type: Date },
  },
  { timestamps: true },
);

// TTL cleanup once genuinely expired — same pattern as password-reset.ts/
// invite.ts. A revoked-but-not-yet-expired token stays queryable (by
// familyId) so /admin/security can still show it was revoked, not just
// make it vanish.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ userId: 1, familyId: 1 });

export type RefreshTokenDocument = InferSchemaType<typeof refreshTokenSchema>;
export const RefreshToken =
  (mongoose.models.RefreshToken as Model<RefreshTokenDocument>) ??
  mongoose.model<RefreshTokenDocument>('RefreshToken', refreshTokenSchema);

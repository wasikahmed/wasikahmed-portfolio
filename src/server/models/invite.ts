import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

/**
 * One-time tokens for the invite-accept flow (PLAN.md W11) — same shape as
 * password-reset.ts's PasswordReset, deliberately: TTL-indexed, only a
 * hash of the token stored, never the token itself. Differs only in what
 * it protects: a link (`/admin/accept-invite/[token]`), not a 6-digit
 * code typed into a form, so the token is longer and URL-safe rather than
 * numeric.
 *
 * The invited User document itself (status: 'invited', no passwordHash)
 * is created immediately when the invite is sent — this collection only
 * ever holds the proof that a given accept link is genuine and unexpired.
 */
const inviteSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

inviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type InviteDocument = InferSchemaType<typeof inviteSchema>;
export const Invite =
  (mongoose.models.Invite as Model<InviteDocument>) ??
  mongoose.model<InviteDocument>('Invite', inviteSchema);

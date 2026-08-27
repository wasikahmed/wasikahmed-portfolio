import mongoose, { Schema, type InferSchemaType } from 'mongoose';

/**
 * One-time codes for the "forgot password" flow. TTL-indexed like
 * rate-limit.ts — codes expire on their own, no cleanup job needed. Only
 * a hash of the code is stored, same reasoning as rate-limit.ts's IP
 * hashing: never keep the secret itself at rest.
 */
const passwordResetSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  codeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type PasswordResetDocument = InferSchemaType<typeof passwordResetSchema>;
export const PasswordReset =
  mongoose.models.PasswordReset ?? mongoose.model('PasswordReset', passwordResetSchema);

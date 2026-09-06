import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

/**
 * Admin auth. Seeded only by `pnpm seed:admin`, never through a public
 * signup route (AGENTS.md §7) — there is no signup route and there must
 * not be one.
 */
const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    totpSecret: { type: String },
    role: { type: String, enum: ['admin'], default: 'admin' },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof userSchema>;
export const User =
  (mongoose.models.User as Model<UserDocument>) ?? mongoose.model<UserDocument>('User', userSchema);

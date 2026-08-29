import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

/**
 * Phase 4 — admin auth. Schema only for now; seeded by a CLI script, never
 * through a public signup route (PLAN.md §3 "Auth — defense in depth").
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

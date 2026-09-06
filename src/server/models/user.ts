import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { ROLES } from '../permissions';

/**
 * Admin auth. The `owner` account is seeded only by `pnpm seed:admin`,
 * never through a public signup route (AGENTS.md §7) — there is no
 * signup route and there must not be one. Every other account (PLAN.md
 * W11) is created by the invite flow, which is the only other writer of
 * this collection.
 */
const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    // A user list showing only email addresses is unusable (PLAN.md W9).
    // Absent for the seeded owner until they set it; required going
    // forward once the invite-accept flow (W11) collects it.
    name: { type: String },
    // Optional — an invited user (W11) has no password until they accept.
    // `authorize()` in auth.ts must reject a passwordless account
    // explicitly rather than falling through to `verifyPassword(undefined,
    // ...)`, which would throw instead of cleanly denying the login.
    passwordHash: { type: String },
    totpSecret: { type: String },
    role: { type: String, enum: ROLES, default: 'viewer' },
    // Deactivation must not be a delete — audit-log entries reference the
    // user, and deleting the account loses the trail. `invited` is the
    // state between "invite sent" and "invite accepted"; see W11.
    status: {
      type: String,
      enum: ['invited', 'active', 'suspended'],
      default: 'active',
    },
    lastLoginAt: { type: Date },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof userSchema>;
export const User =
  (mongoose.models.User as Model<UserDocument>) ?? mongoose.model<UserDocument>('User', userSchema);

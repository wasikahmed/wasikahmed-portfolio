import mongoose, { Schema, type InferSchemaType } from 'mongoose';

/**
 * Sliding-window counters for public, unauthenticated endpoints (currently
 * just POST /api/contact). Mongo with a TTL index rather than in-memory —
 * an in-memory counter resets on every deploy and doesn't work if the app
 * ever runs more than one instance. See PLAN.md W1/W2.
 */
const rateLimitSchema = new Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, required: true, default: 0 },
  expiresAt: { type: Date, required: true },
});

rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type RateLimitDocument = InferSchemaType<typeof rateLimitSchema>;
export const RateLimit = mongoose.models.RateLimit ?? mongoose.model('RateLimit', rateLimitSchema);

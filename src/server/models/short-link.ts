import mongoose, { Schema, type InferSchemaType } from 'mongoose';

/**
 * A tracked short link: `/go/<slug>` redirects to `destination` with the
 * UTM tags below attached (src/server/short-links.ts).
 *
 * `clicks` and `lastClickedAt` are written only by the redirect itself —
 * shortLinkSchema (schemas.ts) doesn't accept them, so an admin save can
 * never reset or invent a count.
 */
const shortLinkSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    source: { type: String, required: true },
    medium: { type: String, default: 'link' },
    destination: { type: String, default: '/' },
    notes: { type: String },
    clicks: { type: Number, default: 0 },
    lastClickedAt: { type: Date },
  },
  { timestamps: true },
);

export type ShortLinkDocument = InferSchemaType<typeof shortLinkSchema>;
export const ShortLink = mongoose.models.ShortLink ?? mongoose.model('ShortLink', shortLinkSchema);

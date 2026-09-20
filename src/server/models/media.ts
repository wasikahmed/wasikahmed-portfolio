import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

/**
 * The media library — uploaded assets, stored on Cloudinary (see
 * /api/admin/media and src/server/cloudinary.ts), scoped to this app's own
 * folder on an account that also hosts other projects' media.
 */
const mediaSchema = new Schema(
  {
    // Cloudinary's asset id — required to delete or transform the asset
    // later; `url` alone (Cloudinary's `secure_url`) isn't enough for that.
    publicId: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    alt: { type: String, required: true },
    width: { type: Number },
    height: { type: Number },
    size: { type: Number, required: true },
    contentType: { type: String, required: true },
  },
  { timestamps: true },
);

export type MediaDocument = InferSchemaType<typeof mediaSchema>;
export const Media =
  (mongoose.models.Media as Model<MediaDocument>) ??
  mongoose.model<MediaDocument>('Media', mediaSchema);

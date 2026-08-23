import mongoose, { Schema, type InferSchemaType } from 'mongoose';

/** The media library — uploaded assets, stored on local disk in dev (see /api/admin/media). */
const mediaSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
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
export const Media = mongoose.models.Media ?? mongoose.model('Media', mediaSchema);

import mongoose, { Schema, type InferSchemaType } from 'mongoose';

/** Phase 4 — media library. Schema only for now. */
const mediaSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    alt: { type: String, required: true },
    width: { type: Number },
    height: { type: Number },
    blurhash: { type: String },
  },
  { timestamps: true },
);

export type MediaDocument = InferSchemaType<typeof mediaSchema>;
export const Media = mongoose.models.Media ?? mongoose.model('Media', mediaSchema);

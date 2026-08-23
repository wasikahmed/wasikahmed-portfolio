import mongoose, { Schema, type InferSchemaType } from 'mongoose';

/** Phase 6 — first-party view counts. Schema only for now. */
const pageViewSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    count: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type PageViewDocument = InferSchemaType<typeof pageViewSchema>;
export const PageView = mongoose.models.PageView ?? mongoose.model('PageView', pageViewSchema);

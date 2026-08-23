import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const postSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    kind: { type: String, enum: ['article', 'til'], required: true },
    title: { type: String, required: true },
    excerpt: { type: String, required: true },
    date: { type: String, required: true },
    readTime: { type: String, required: true },
    tags: { type: [String], default: [] },
    body: { type: [String], required: true },
    status: { type: String, enum: ['draft', 'scheduled', 'published'], default: 'published' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type PostDocument = InferSchemaType<typeof postSchema>;
export const Post = mongoose.models.Post ?? mongoose.model('Post', postSchema);

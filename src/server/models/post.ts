import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const seoSchema = new Schema(
  {
    title: { type: String },
    description: { type: String },
    ogImage: { type: String },
  },
  { _id: false },
);

const postSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    kind: { type: String, enum: ['article', 'til'], required: true },
    title: { type: String, required: true },
    excerpt: { type: String, required: true },
    date: { type: String, required: true },
    readTime: { type: String, required: true },
    tags: { type: [String], default: [] },
    // MDX source — see project.ts's caseStudySectionSchema comment.
    bodyMdx: { type: String, required: true },
    status: { type: String, enum: ['draft', 'scheduled', 'published'], default: 'draft' },
    publishedAt: { type: Date },
    seo: { type: seoSchema, default: undefined },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type PostDocument = InferSchemaType<typeof postSchema>;
export const Post = mongoose.models.Post ?? mongoose.model('Post', postSchema);

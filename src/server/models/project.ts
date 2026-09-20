import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const metricSchema = new Schema(
  {
    value: { type: String, required: true },
    label: { type: String, required: true },
    baseline: { type: String },
  },
  { _id: false },
);

const architectureNodeSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    detail: { type: String, required: true },
  },
  { _id: false },
);

const caseStudySectionSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    // MDX source, not an array of paragraphs — PLAN.md's locked editor
    // decision ("Bodies stored as MDX text").
    bodyMdx: { type: String, required: true },
  },
  { _id: false },
);

const linkSchema = new Schema(
  { label: { type: String, required: true }, href: { type: String, required: true } },
  { _id: false },
);

const seoSchema = new Schema(
  {
    title: { type: String },
    description: { type: String },
    ogImage: { type: String },
  },
  { _id: false },
);

const mediaRefSchema = new Schema(
  { url: { type: String, required: true }, alt: { type: String, required: true } },
  { _id: false },
);

const projectSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    tagline: { type: String, required: true },
    categories: {
      type: [String],
      enum: ['AI', 'Automation', 'Systems', 'Web'],
      required: true,
    },
    problem: { type: String, required: true },
    headline: { type: metricSchema, required: true },
    metrics: { type: [metricSchema], required: true },
    stack: { type: [String], required: true },
    role: { type: String, required: true },
    timeline: { type: String, required: true },
    year: { type: Number, required: true },
    accent: { type: String, required: true },
    cover: { type: mediaRefSchema, default: undefined },
    architecture: { type: [architectureNodeSchema], required: true },
    sections: { type: [caseStudySectionSchema], required: true },
    links: { type: [linkSchema], default: undefined },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'published'],
      default: 'draft',
    },
    publishedAt: { type: Date },
    seo: { type: seoSchema, default: undefined },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type ProjectDocument = InferSchemaType<typeof projectSchema>;

// `models.Project` guards against Mongoose's "OverwriteModelError" when this
// module is re-evaluated by Next's dev/HMR module graph.
export const Project = mongoose.models.Project ?? mongoose.model('Project', projectSchema);

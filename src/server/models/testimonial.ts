import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const testimonialSchema = new Schema(
  {
    quote: { type: String, required: true },
    name: { type: String, required: true },
    title: { type: String, required: true },
    company: { type: String, required: true },
    initials: { type: String, required: true },
    projectSlug: { type: String },
    featured: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type TestimonialDocument = InferSchemaType<typeof testimonialSchema>;
export const Testimonial =
  mongoose.models.Testimonial ?? mongoose.model('Testimonial', testimonialSchema);

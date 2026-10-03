import mongoose, { Schema, type InferSchemaType } from 'mongoose';

/** Contact form submissions — written by POST /api/contact. */
const leadSchema = new Schema(
  {
    // No longer asked (the form's "role or project?" select went in 2026-10);
    // kept so leads that already carry it still show it in /admin/leads.
    intent: { type: String, enum: ['project', 'role'] },
    name: { type: String, required: true },
    email: { type: String, required: true },
    company: { type: String },
    budget: { type: String },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ['new', 'read', 'replied', 'archived'],
      default: 'new',
    },
    notes: { type: String },
    source: { type: String },
    ipHash: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true },
);

export type LeadDocument = InferSchemaType<typeof leadSchema>;
export const Lead = mongoose.models.Lead ?? mongoose.model('Lead', leadSchema);

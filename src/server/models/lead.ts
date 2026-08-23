import mongoose, { Schema, type InferSchemaType } from 'mongoose';

/** Phase 5 — contact submissions. Schema only for now; no writes until the API route lands. */
const leadSchema = new Schema(
  {
    intent: { type: String, enum: ['project', 'role'], required: true },
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

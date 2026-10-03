import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const roleSchema = new Schema(
  {
    title: { type: String, required: true },
    company: { type: String, required: true },
    period: { type: String, required: true },
    type: { type: String, required: true },
    kind: { type: String, enum: ['work', 'education'], default: 'work' },
    summary: { type: String },
    logo: { type: String },
    website: { type: String },
    shipped: { type: [String], required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type RoleDocument = InferSchemaType<typeof roleSchema>;
// Collection name "roles" — "Experience" as a model name reads oddly for a
// single item; the export name stays `Role` to match the domain concept.
export const Role = mongoose.models.Role ?? mongoose.model('Role', roleSchema);

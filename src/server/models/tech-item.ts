import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const techItemSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    group: {
      type: String,
      enum: ['Language', 'Framework', 'Data', 'Infra', 'AI'],
      required: true,
    },
    projects: { type: [String], default: [] },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type TechItemDocument = InferSchemaType<typeof techItemSchema>;
export const TechItem = mongoose.models.TechItem ?? mongoose.model('TechItem', techItemSchema);

import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const skillGroupSchema = new Schema(
  {
    category: { type: String, required: true, unique: true },
    items: { type: [String], required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type SkillGroupDocument = InferSchemaType<typeof skillGroupSchema>;
export const SkillGroup =
  mongoose.models.SkillGroup ?? mongoose.model('SkillGroup', skillGroupSchema);

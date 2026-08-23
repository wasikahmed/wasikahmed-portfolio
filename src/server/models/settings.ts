import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const linkSchema = new Schema(
  { label: { type: String, required: true }, href: { type: String, required: true } },
  { _id: false },
);

/**
 * Singleton — always exactly one document, found/updated by this fixed id
 * rather than a query. `findSettings()` / `upsertSettings()` in queries.ts
 * are the only intended access points.
 */
export const SETTINGS_SINGLETON_ID = 'settings';

const settingsSchema = new Schema(
  {
    _id: { type: String, default: SETTINGS_SINGLETON_ID },
    name: { type: String, required: true },
    initials: { type: String, required: true },
    role: { type: String, required: true },
    discipline: { type: String, required: true },
    tagline: { type: String, required: true },
    proof: { type: String, required: true },
    email: { type: String, required: true },
    location: { type: String, required: true },
    timezone: { type: String, required: true },
    available: { type: Boolean, required: true },
    availableFor: { type: String, required: true },
    responseTime: { type: String, required: true },
    socials: { type: [linkSchema], default: [] },
  },
  { timestamps: true },
);

export type SettingsDocument = InferSchemaType<typeof settingsSchema>;
export const Settings = mongoose.models.Settings ?? mongoose.model('Settings', settingsSchema);

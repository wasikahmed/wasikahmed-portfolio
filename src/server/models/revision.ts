import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

/**
 * Content history — the full previous state of a CMS record, captured
 * immediately before every update, delete and restore (src/server/
 * revisions.ts). The audit log answers "who changed what, when" in one
 * line; this is what makes a bad save undoable.
 *
 * `snapshot` is Mixed on purpose: it holds whichever collection's shape the
 * record had, and it is validated against that collection's Zod schema
 * again at restore time rather than trusted as stored.
 */
const revisionSchema = new Schema(
  {
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    label: { type: String, required: true },
    action: { type: String, enum: ['update', 'delete', 'restore'], required: true },
    userEmail: { type: String, required: true },
    snapshot: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

revisionSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
revisionSchema.index({ createdAt: -1 });

export type RevisionDocument = InferSchemaType<typeof revisionSchema>;
export const Revision =
  (mongoose.models.Revision as Model<RevisionDocument>) ??
  mongoose.model<RevisionDocument>('Revision', revisionSchema);

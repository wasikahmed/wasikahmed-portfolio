import mongoose, { Schema, type InferSchemaType } from 'mongoose';

/** Phase 4 — admin change history. Schema only for now. */
const auditLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

export type AuditLogDocument = InferSchemaType<typeof auditLogSchema>;
export const AuditLog = mongoose.models.AuditLog ?? mongoose.model('AuditLog', auditLogSchema);

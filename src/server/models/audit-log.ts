import mongoose, { Schema, type InferSchemaType } from 'mongoose';

/**
 * Admin change history. `userEmail` is denormalized rather than an
 * ObjectId ref to `User` — with exactly one admin account (PLAN.md's
 * single-admin design), a join buys nothing and costs a populate() on
 * every read of the log.
 */
const auditLogSchema = new Schema(
  {
    userEmail: { type: String, required: true },
    action: { type: String, enum: ['create', 'update', 'delete'], required: true },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    summary: { type: String, required: true },
  },
  { timestamps: true },
);

export type AuditLogDocument = InferSchemaType<typeof auditLogSchema>;
export const AuditLog = mongoose.models.AuditLog ?? mongoose.model('AuditLog', auditLogSchema);

import { connectToDatabase } from './db';
import { AuditLog } from './models/audit-log';

export async function writeAuditLog(entry: {
  userEmail: string;
  action: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string;
  summary: string;
}) {
  await connectToDatabase();
  await AuditLog.create(entry);
}

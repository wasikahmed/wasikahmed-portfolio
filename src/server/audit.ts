// Importing this from a Client Component is a build error, not a silent
// leak — see https://nextjs.org/docs/app/getting-started/server-and-client-components#preventing-environment-poisoning
import 'server-only';

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

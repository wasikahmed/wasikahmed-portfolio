import { Lead } from '@/server/models/lead';
import { leadUpdateSchema } from '@/server/schemas';
import { getOneHandler, updateHandler } from '@/server/admin-crud';

const config = {
  entityType: 'lead',
  schema: leadUpdateSchema,
  summarize: (l: { status?: string; notes?: string }) =>
    l.status ? `Marked lead as ${l.status}` : 'Updated lead notes',
  // Not content — status here is a triage state (new/read/replied/
  // archived), not a publish gate. See admin-crud.ts's module comment.
  resource: 'lead' as const,
};

export const GET = getOneHandler(Lead, 'lead');
export const PATCH = updateHandler(Lead, config);

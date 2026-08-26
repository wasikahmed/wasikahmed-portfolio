import { Lead } from '@/server/models/lead';
import { leadUpdateSchema } from '@/server/schemas';
import { updateHandler } from '@/server/admin-crud';

const config = {
  entityType: 'lead',
  schema: leadUpdateSchema,
  summarize: (l: { status?: string; notes?: string }) =>
    l.status ? `Marked lead as ${l.status}` : 'Updated lead notes',
};

export const PATCH = updateHandler(Lead, config);

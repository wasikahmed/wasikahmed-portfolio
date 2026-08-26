import { Lead } from '@/server/models/lead';
import { leadUpdateSchema } from '@/server/schemas';
import { getOneHandler, updateHandler } from '@/server/admin-crud';

const config = {
  entityType: 'lead',
  schema: leadUpdateSchema,
  summarize: (l: { status?: string; notes?: string }) =>
    l.status ? `Marked lead as ${l.status}` : 'Updated lead notes',
};

export const GET = getOneHandler(Lead);
export const PATCH = updateHandler(Lead, config);

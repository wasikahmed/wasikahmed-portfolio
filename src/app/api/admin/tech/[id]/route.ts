import { TechItem } from '@/server/models/tech-item';
import { techItemSchema } from '@/server/schemas';
import { getOneHandler, updateHandler, deleteHandler } from '@/server/admin-crud';

const config = {
  entityType: 'tech',
  schema: techItemSchema,
  summarize: (t: { name: string }) => t.name,
};

export const GET = getOneHandler(TechItem);
export const PATCH = updateHandler(TechItem, config);
export const DELETE = deleteHandler(TechItem, 'tech');

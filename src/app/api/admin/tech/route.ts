import { TechItem } from '@/server/models/tech-item';
import { techItemSchema } from '@/server/schemas';
import { listHandler, createHandler } from '@/server/admin-crud';

const config = {
  entityType: 'tech',
  schema: techItemSchema,
  summarize: (t: { name: string }) => t.name,
};

export const GET = listHandler(TechItem, config);
export const POST = createHandler(TechItem, config);

import { Role } from '@/server/models/role';
import { roleSchema } from '@/server/schemas';
import { listHandler, createHandler } from '@/server/admin-crud';

const config = {
  entityType: 'role',
  schema: roleSchema,
  summarize: (r: { title: string; company: string }) => `${r.title} at ${r.company}`,
};

export const GET = listHandler(Role, config);
export const POST = createHandler(Role, config);

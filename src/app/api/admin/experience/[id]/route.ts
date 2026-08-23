import { Role } from '@/server/models/role';
import { roleSchema } from '@/server/schemas';
import { getOneHandler, updateHandler, deleteHandler } from '@/server/admin-crud';

const config = {
  entityType: 'role',
  schema: roleSchema,
  summarize: (r: { title: string; company: string }) => `${r.title} at ${r.company}`,
};

export const GET = getOneHandler(Role);
export const PATCH = updateHandler(Role, config);
export const DELETE = deleteHandler(Role, 'role');

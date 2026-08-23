import { Project } from '@/server/models/project';
import { projectSchema } from '@/server/schemas';
import { getOneHandler, updateHandler, deleteHandler } from '@/server/admin-crud';

const config = {
  entityType: 'project',
  schema: projectSchema,
  summarize: (p: { title: string; slug: string }) => `${p.title} (${p.slug})`,
};

export const GET = getOneHandler(Project);
export const PATCH = updateHandler(Project, config);
export const DELETE = deleteHandler(Project, 'project');

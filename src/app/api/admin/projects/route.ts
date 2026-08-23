import { Project } from '@/server/models/project';
import { projectSchema } from '@/server/schemas';
import { listHandler, createHandler } from '@/server/admin-crud';

const config = {
  entityType: 'project',
  schema: projectSchema,
  summarize: (p: { title: string; slug: string }) => `${p.title} (${p.slug})`,
  sort: { order: 1, year: -1 } as const,
};

export const GET = listHandler(Project, config);
export const POST = createHandler(Project, config);

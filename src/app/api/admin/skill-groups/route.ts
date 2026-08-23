import { SkillGroup } from '@/server/models/skill-group';
import { skillGroupSchema } from '@/server/schemas';
import { listHandler, createHandler } from '@/server/admin-crud';

const config = {
  entityType: 'skillGroup',
  schema: skillGroupSchema,
  summarize: (g: { category: string }) => g.category,
};

export const GET = listHandler(SkillGroup, config);
export const POST = createHandler(SkillGroup, config);

import { SkillGroup } from '@/server/models/skill-group';
import { skillGroupSchema } from '@/server/schemas';
import { getOneHandler, updateHandler, deleteHandler } from '@/server/admin-crud';

const config = {
  entityType: 'skillGroup',
  schema: skillGroupSchema,
  summarize: (g: { category: string }) => g.category,
};

export const GET = getOneHandler(SkillGroup);
export const PATCH = updateHandler(SkillGroup, config);
export const DELETE = deleteHandler(SkillGroup, 'skillGroup');

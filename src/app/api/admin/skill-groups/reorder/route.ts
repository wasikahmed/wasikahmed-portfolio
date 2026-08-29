import { SkillGroup } from '@/server/models/skill-group';
import { reorderHandler } from '@/server/admin-crud';

export const POST = reorderHandler(SkillGroup, 'skillGroup');

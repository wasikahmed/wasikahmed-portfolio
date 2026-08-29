import { Project } from '@/server/models/project';
import { reorderHandler } from '@/server/admin-crud';

export const POST = reorderHandler(Project, 'project');

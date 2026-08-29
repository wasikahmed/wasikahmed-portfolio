import { TechItem } from '@/server/models/tech-item';
import { reorderHandler } from '@/server/admin-crud';

export const POST = reorderHandler(TechItem, 'tech');

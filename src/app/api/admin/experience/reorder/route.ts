import { Role } from '@/server/models/role';
import { reorderHandler } from '@/server/admin-crud';

export const POST = reorderHandler(Role, 'role');

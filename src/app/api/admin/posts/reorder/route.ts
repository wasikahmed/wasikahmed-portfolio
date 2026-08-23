import { Post } from '@/server/models/post';
import { reorderHandler } from '@/server/admin-crud';

export const POST = reorderHandler(Post);

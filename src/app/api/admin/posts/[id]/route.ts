import { Post } from '@/server/models/post';
import { postSchema } from '@/server/schemas';
import { getOneHandler, updateHandler, deleteHandler } from '@/server/admin-crud';

const config = {
  entityType: 'post',
  schema: postSchema,
  summarize: (p: { title: string; slug: string }) => `${p.title} (${p.slug})`,
};

export const GET = getOneHandler(Post);
export const PATCH = updateHandler(Post, config);
export const DELETE = deleteHandler(Post, 'post');

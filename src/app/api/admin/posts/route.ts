import { Post } from '@/server/models/post';
import { postSchema } from '@/server/schemas';
import { listHandler, createHandler } from '@/server/admin-crud';

const config = {
  entityType: 'post',
  schema: postSchema,
  summarize: (p: { title: string; slug: string }) => `${p.title} (${p.slug})`,
  sort: { order: 1, date: -1 } as const,
};

export const GET = listHandler(Post, config);
export const POST = createHandler(Post, config);

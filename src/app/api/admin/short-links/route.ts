import { ShortLink } from '@/server/models/short-link';
import { shortLinkSchema } from '@/server/schemas';
import { listHandler, createHandler } from '@/server/admin-crud';

const config = {
  entityType: 'shortLink',
  schema: shortLinkSchema,
  summarize: (l: { slug: string; label: string }) => `/go/${l.slug} (${l.label})`,
  // Newest first — there is no drag-to-reorder for links.
  sort: { createdAt: -1 as const },
};

export const GET = listHandler(ShortLink, config);
export const POST = createHandler(ShortLink, config);

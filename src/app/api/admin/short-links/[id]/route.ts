import { ShortLink } from '@/server/models/short-link';
import { shortLinkSchema } from '@/server/schemas';
import { getOneHandler, updateHandler, deleteHandler } from '@/server/admin-crud';

const config = {
  entityType: 'shortLink',
  schema: shortLinkSchema,
  summarize: (l: { slug: string; label: string }) => `/go/${l.slug} (${l.label})`,
};

export const GET = getOneHandler(ShortLink);
export const PATCH = updateHandler(ShortLink, config);
export const DELETE = deleteHandler(ShortLink, 'shortLink');

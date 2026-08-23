import { Testimonial } from '@/server/models/testimonial';
import { testimonialSchema } from '@/server/schemas';
import { getOneHandler, updateHandler, deleteHandler } from '@/server/admin-crud';

const config = {
  entityType: 'testimonial',
  schema: testimonialSchema,
  summarize: (t: { name: string; company: string }) => `${t.name}, ${t.company}`,
};

export const GET = getOneHandler(Testimonial);
export const PATCH = updateHandler(Testimonial, config);
export const DELETE = deleteHandler(Testimonial, 'testimonial');

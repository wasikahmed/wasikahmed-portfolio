import { Testimonial } from '@/server/models/testimonial';
import { testimonialSchema } from '@/server/schemas';
import { listHandler, createHandler } from '@/server/admin-crud';

const config = {
  entityType: 'testimonial',
  schema: testimonialSchema,
  summarize: (t: { name: string; company: string }) => `${t.name}, ${t.company}`,
};

export const GET = listHandler(Testimonial, config);
export const POST = createHandler(Testimonial, config);

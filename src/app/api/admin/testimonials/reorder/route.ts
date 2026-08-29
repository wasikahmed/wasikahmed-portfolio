import { Testimonial } from '@/server/models/testimonial';
import { reorderHandler } from '@/server/admin-crud';

export const POST = reorderHandler(Testimonial, 'testimonial');

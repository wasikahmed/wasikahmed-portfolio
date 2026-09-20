import type { Testimonial } from '@/lib/types';

/**
 * Deliberately empty.
 *
 * The seed used to carry three quotes from invented people at invented
 * companies, which is the single most expensive thing a portfolio can get
 * caught doing. Home now renders `Shipped` — public artefacts a reader can
 * open — in place of the testimonials section. The collection and its admin
 * surface stay, so a real quote from a real client can be added through
 * /admin the day there is one to add.
 */
export const testimonials: Omit<Testimonial, 'id'>[] = [];

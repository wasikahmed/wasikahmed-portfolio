import type { Testimonial } from '@/lib/types';

/** PLACEHOLDER — this is only the initial state `pnpm seed` writes; edit or replace it through the admin UI. */
export const testimonials: Omit<Testimonial, 'id'>[] = [
  {
    quote:
      'Wasik understood the problem faster than I could explain it, and delivered something that actually fixed it. Six months of daily use, no incidents.',
    name: 'Sarah Chen',
    title: 'CTO',
    company: 'LegalFlow',
    initials: 'SC',
    projectSlug: 'docflow-ai',
    featured: true,
    order: 0,
  },
  {
    quote:
      'He thinks about the business problem before touching code. We got something the team uses, not something we demo and abandon.',
    name: 'Marcus Webb',
    title: 'Founder',
    company: 'AutoStack',
    initials: 'MW',
    projectSlug: 'pipelineos',
    featured: true,
    order: 1,
  },
  {
    quote:
      'Our team spent two quarters on this scheduling problem. Wasik found the core constraint in a discovery call and shipped in three weeks.',
    name: 'Priya Nair',
    title: 'Head of Operations',
    company: 'Fieldforce',
    initials: 'PN',
    projectSlug: 'autoschedule',
    featured: true,
    order: 2,
  },
];

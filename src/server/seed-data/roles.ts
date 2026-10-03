import type { Role } from '@/lib/types';

/**
 * A fictional timeline, newest first. The real one is edited in the CMS.
 * Home's Experience section shows the first three work entries and links to
 * /about#experience for the rest, so order matters: education sits last.
 */
export const roles: Omit<Role, 'id'>[] = [
  {
    title: 'Software Engineer',
    company: 'Example Company',
    period: 'Jan 2026 — Present',
    type: 'Full-time · Remote',
    summary: 'Demo role · backend services · CI/CD',
    shipped: [
      'Placeholder entry seeded for local development',
      'Built and maintained backend services and their deployment pipeline',
    ],
    order: 0,
  },
  {
    title: 'Junior Developer',
    company: 'Sample Studio',
    period: 'Jun 2025 — Dec 2025',
    type: 'Full-time · On-site',
    summary: 'Demo role · web apps · integrations',
    shipped: [
      'Placeholder entry seeded for local development',
      'Delivered features across several client web apps',
    ],
    order: 1,
  },
  {
    title: 'Software Engineering Intern',
    company: 'Demo Labs',
    period: 'Jan 2025 — May 2025',
    type: 'Internship · Hybrid',
    summary: 'Demo role · automation · internal tools',
    shipped: ['Placeholder entry seeded for local development'],
    order: 2,
  },
  {
    title: 'B.Sc. in Computer Science',
    company: 'Example University',
    kind: 'education',
    period: '2021 — 2025',
    type: 'Education',
    summary: 'Demo education entry',
    shipped: ['Placeholder entry seeded for local development'],
    order: 3,
  },
];

import type { Role } from '@/lib/types';

export const roles: Omit<Role, 'id'>[] = [
  {
    title: 'Senior Software Engineer',
    company: 'Meridian AI',
    period: '2022 — Present',
    type: 'Full-time',
    shipped: [
      'Built a document intelligence pipeline processing 12,000+ contracts a month',
      'Cut infrastructure cost 40% by moving batch jobs to async workers',
      'Led a monolith-to-services migration without a single outage',
      'Replaced a 3,000-line rules engine with an LLM classification layer',
    ],
    order: 0,
  },
  {
    title: 'Software Engineer',
    company: 'Fieldworks SaaS',
    period: '2020 — 2022',
    type: 'Full-time',
    shipped: [
      'Built the scheduling engine behind 10,000+ weekly shift assignments',
      'Designed the real-time event system for the field operations dashboard',
      'Shipped a public REST API used by eight third-party integrations',
      'Mentored two junior engineers, both promoted within a year',
    ],
    order: 1,
  },
  {
    title: 'Backend Engineer',
    company: 'Pulse Agency',
    period: '2019 — 2020',
    type: 'Full-time',
    shipped: [
      'Delivered six client projects across fintech, retail, and logistics',
      'Built a shared API gateway used by every agency product',
      'Introduced automated testing — coverage went from 0% to 74%',
    ],
    order: 2,
  },
  {
    title: 'Independent',
    company: 'Consulting',
    period: '2023 — Present',
    type: 'Ongoing',
    shipped: [
      'AI document processing for a legal tech firm',
      'Constraint-solving scheduler for a staffing agency',
      'Inventory platform for a twelve-store retail chain',
      'Deployment automation for a growing SaaS team',
    ],
    order: 3,
  },
];

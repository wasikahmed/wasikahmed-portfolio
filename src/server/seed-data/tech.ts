import type { Tech, SkillGroup } from '@/lib/types';

/**
 * The constellation's data source. `projects` is what makes signature
 * interaction #1 informative rather than decorative — hovering a node
 * answers "where did you actually use this", and clicking filters /work.
 *
 * Every slug here must exist in seed-data/projects.ts, or the node filters
 * to nothing. Sixteen nodes is the practical ceiling before the graph stops
 * being readable; anything else a recruiter needs lives in `skillGroups`.
 */
export const tech: Omit<Tech, 'id'>[] = [
  { name: 'Python', group: 'Language', projects: ['scorelivepro', 'advergo'], order: 0 },
  { name: 'TypeScript', group: 'Language', projects: ['neeramoy', 'portfolio-cms'], order: 1 },
  { name: 'Django', group: 'Framework', projects: ['scorelivepro', 'advergo'], order: 2 },
  {
    name: 'Django REST Framework',
    group: 'Framework',
    projects: ['scorelivepro', 'advergo'],
    order: 3,
  },
  { name: 'Celery', group: 'Infra', projects: ['scorelivepro', 'advergo'], order: 4 },
  { name: 'WebSockets', group: 'Infra', projects: ['scorelivepro'], order: 5 },
  { name: 'Next.js', group: 'Framework', projects: ['advergo', 'portfolio-cms'], order: 6 },
  { name: 'React', group: 'Framework', projects: ['advergo', 'portfolio-cms'], order: 7 },
  { name: 'Angular', group: 'Framework', projects: ['neeramoy'], order: 8 },
  { name: 'Electron', group: 'Framework', projects: ['neeramoy'], order: 9 },
  { name: 'PostgreSQL', group: 'Data', projects: ['scorelivepro', 'advergo'], order: 10 },
  { name: 'Redis', group: 'Data', projects: ['scorelivepro', 'advergo'], order: 11 },
  { name: 'SQLite', group: 'Data', projects: ['neeramoy'], order: 12 },
  {
    name: 'Docker',
    group: 'Infra',
    projects: ['scorelivepro', 'advergo', 'portfolio-cms'],
    order: 13,
  },
  { name: 'n8n', group: 'AI', projects: ['inbox-automation'], order: 14 },
  { name: 'LLM APIs', group: 'AI', projects: ['inbox-automation'], order: 15 },
];

/**
 * /about's skills panel. Mirrors the resume's own grouping so the two
 * documents never drift — a recruiter reading both should see one person.
 */
export const skillGroups: Omit<SkillGroup, 'id'>[] = [
  {
    category: 'Languages',
    items: ['Python', 'TypeScript', 'JavaScript', 'SQL'],
    order: 0,
  },
  {
    category: 'Backend',
    items: [
      'Django',
      'Django REST Framework',
      'Celery',
      'Django Channels',
      'WebSockets',
      'REST APIs',
    ],
    order: 1,
  },
  {
    category: 'Frontend & Desktop',
    items: ['Next.js', 'React', 'Angular', 'Electron', 'Tailwind CSS'],
    order: 2,
  },
  {
    category: 'Databases',
    items: ['PostgreSQL', 'Redis', 'SQLite', 'MongoDB'],
    order: 3,
  },
  {
    category: 'DevOps & Tools',
    items: ['Docker', 'GitHub Actions', 'Nginx', 'Linux', 'Cloudflare', 'AWS Cognito', 'Firebase'],
    order: 4,
  },
  {
    category: 'Automation & AI',
    items: ['n8n', 'LLM APIs', 'AI agents', 'Human-in-the-loop workflows', 'SaaS API integrations'],
    order: 5,
  },
];

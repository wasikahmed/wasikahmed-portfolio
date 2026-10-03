import type { Tech, SkillGroup } from '@/lib/types';

/**
 * The constellation's data source. `projects` is what makes signature
 * interaction #1 informative rather than decorative — hovering a node
 * answers "where did you actually use this", and clicking filters /work
 * by `project.stack`.
 *
 * Every slug here must exist in seed-data/projects.ts, and every name must
 * appear in that project's `stack`, or the node filters to nothing. Sixteen
 * nodes is the practical ceiling before the graph stops being readable.
 */
export const tech: Omit<Tech, 'id'>[] = [
  { name: 'Python', group: 'Language', projects: ['ledger-sync'], order: 0 },
  { name: 'TypeScript', group: 'Language', projects: ['order-desk', 'fieldnotes'], order: 1 },
  { name: 'Django', group: 'Framework', projects: ['ledger-sync'], order: 2 },
  { name: 'Next.js', group: 'Framework', projects: ['order-desk'], order: 3 },
  { name: 'React', group: 'Framework', projects: ['order-desk'], order: 4 },
  { name: 'Electron', group: 'Framework', projects: ['fieldnotes'], order: 5 },
  { name: 'PostgreSQL', group: 'Data', projects: ['ledger-sync', 'order-desk'], order: 6 },
  { name: 'Redis', group: 'Data', projects: ['ledger-sync'], order: 7 },
  { name: 'SQLite', group: 'Data', projects: ['fieldnotes'], order: 8 },
  { name: 'Celery', group: 'Infra', projects: ['ledger-sync'], order: 9 },
  { name: 'Docker', group: 'Infra', projects: ['ledger-sync', 'order-desk'], order: 10 },
  { name: 'n8n', group: 'AI', projects: ['mail-sorter'], order: 11 },
  { name: 'LLM APIs', group: 'AI', projects: ['mail-sorter'], order: 12 },
];

/** /about's skills panel. Fictional, like the rest of the seed. */
export const skillGroups: Omit<SkillGroup, 'id'>[] = [
  { category: 'Languages', items: ['Python', 'TypeScript', 'SQL'], order: 0 },
  { category: 'Backend', items: ['Django', 'Celery', 'REST APIs'], order: 1 },
  { category: 'Frontend & Desktop', items: ['Next.js', 'React', 'Electron'], order: 2 },
  { category: 'Databases', items: ['PostgreSQL', 'Redis', 'SQLite'], order: 3 },
  { category: 'DevOps & Tools', items: ['Docker', 'GitHub Actions', 'Linux'], order: 4 },
  { category: 'Automation & AI', items: ['n8n', 'LLM APIs'], order: 5 },
];

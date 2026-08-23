import type { Tech, SkillGroup } from '@/lib/types';

/**
 * The constellation's data source. `projects` is what makes signature
 * interaction #1 informative rather than decorative — hovering a node
 * answers "where did you actually use this", and clicking filters /work.
 */
export const tech: Omit<Tech, 'id'>[] = [
  {
    name: 'TypeScript',
    group: 'Language',
    projects: ['autoschedule', 'pipelineos'],
    order: 0,
  },
  {
    name: 'Python',
    group: 'Language',
    projects: ['docflow-ai', 'inventorypulse'],
    order: 1,
  },
  {
    name: 'React',
    group: 'Framework',
    projects: ['docflow-ai', 'inventorypulse'],
    order: 2,
  },
  {
    name: 'Next.js',
    group: 'Framework',
    projects: ['autoschedule'],
    order: 3,
  },
  {
    name: 'FastAPI',
    group: 'Framework',
    projects: ['docflow-ai'],
    order: 4,
  },
  {
    name: 'PostgreSQL',
    group: 'Data',
    projects: ['docflow-ai', 'autoschedule', 'inventorypulse'],
    order: 5,
  },
  {
    name: 'Redis',
    group: 'Data',
    projects: ['docflow-ai', 'inventorypulse'],
    order: 6,
  },
  {
    name: 'Celery',
    group: 'Data',
    projects: ['docflow-ai'],
    order: 7,
  },
  {
    name: 'Docker',
    group: 'Infra',
    projects: ['autoschedule', 'pipelineos'],
    order: 8,
  },
  {
    name: 'Terraform',
    group: 'Infra',
    projects: ['inventorypulse', 'pipelineos'],
    order: 9,
  },
  {
    name: 'GitHub Actions',
    group: 'Infra',
    projects: ['pipelineos'],
    order: 10,
  },
  {
    name: 'OR-Tools',
    group: 'AI',
    projects: ['autoschedule'],
    order: 11,
  },
  {
    name: 'OpenAI',
    group: 'AI',
    projects: ['docflow-ai'],
    order: 12,
  },
  {
    name: 'WebSockets',
    group: 'Infra',
    projects: ['inventorypulse'],
    order: 13,
  },
];

export const skillGroups: Omit<SkillGroup, 'id'>[] = [
  {
    category: 'Languages',
    items: ['TypeScript', 'Python', 'SQL', 'Go', 'Bash'],
    order: 0,
  },
  {
    category: 'Frontend',
    items: ['React', 'Next.js', 'Tailwind CSS', 'Motion', 'Vite'],
    order: 1,
  },
  {
    category: 'Backend',
    items: ['FastAPI', 'Node.js', 'PostgreSQL', 'MongoDB', 'Redis', 'Celery'],
    order: 2,
  },
  {
    category: 'Infrastructure',
    items: ['Docker', 'Terraform', 'GitHub Actions', 'Cloudflare', 'Linux'],
    order: 3,
  },
  {
    category: 'AI & Optimisation',
    items: ['LLM pipelines', 'RAG', 'OR-Tools', 'Constraint solving'],
    order: 4,
  },
];

import type { Tech } from './types';

/**
 * The constellation's data source. `projects` is what makes signature
 * interaction #1 informative rather than decorative — hovering a node
 * answers "where did you actually use this", and clicking filters /work.
 */
export const tech: Tech[] = [
  { name: 'TypeScript', group: 'Language', projects: ['autoschedule', 'pipelineos'] },
  { name: 'Python', group: 'Language', projects: ['docflow-ai', 'inventorypulse'] },
  { name: 'React', group: 'Framework', projects: ['docflow-ai', 'inventorypulse'] },
  { name: 'Next.js', group: 'Framework', projects: ['autoschedule'] },
  { name: 'FastAPI', group: 'Framework', projects: ['docflow-ai'] },
  { name: 'PostgreSQL', group: 'Data', projects: ['docflow-ai', 'autoschedule', 'inventorypulse'] },
  { name: 'Redis', group: 'Data', projects: ['docflow-ai', 'inventorypulse'] },
  { name: 'Celery', group: 'Data', projects: ['docflow-ai'] },
  { name: 'Docker', group: 'Infra', projects: ['autoschedule', 'pipelineos'] },
  { name: 'Terraform', group: 'Infra', projects: ['inventorypulse', 'pipelineos'] },
  { name: 'GitHub Actions', group: 'Infra', projects: ['pipelineos'] },
  { name: 'OR-Tools', group: 'AI', projects: ['autoschedule'] },
  { name: 'OpenAI', group: 'AI', projects: ['docflow-ai'] },
  { name: 'WebSockets', group: 'Infra', projects: ['inventorypulse'] },
];

export const skillGroups = [
  {
    category: 'Languages',
    items: ['TypeScript', 'Python', 'SQL', 'Go', 'Bash'],
  },
  {
    category: 'Frontend',
    items: ['React', 'Next.js', 'Tailwind CSS', 'Motion', 'Vite'],
  },
  {
    category: 'Backend',
    items: ['FastAPI', 'Node.js', 'PostgreSQL', 'MongoDB', 'Redis', 'Celery'],
  },
  {
    category: 'Infrastructure',
    items: ['Docker', 'Terraform', 'GitHub Actions', 'Cloudflare', 'Linux'],
  },
  {
    category: 'AI & Optimisation',
    items: ['LLM pipelines', 'RAG', 'OR-Tools', 'Constraint solving'],
  },
];

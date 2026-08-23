export interface Project {
  slug: string;
  title: string;
  category: string[];
  problem: string;
  outcome: string;
  metric: string;
  metricLabel: string;
  description: string;
  stack: string[];
  role: string;
  timeline: string;
  image: string;
  color: string;
}

export interface Post {
  slug: string;
  type: 'article' | 'til';
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags: string[];
}

export interface Testimonial {
  quote: string;
  name: string;
  title: string;
  company: string;
  avatar: string;
}

export const projects: Project[] = [
  {
    slug: 'docflow-ai',
    title: 'DocFlow AI',
    category: ['AI', 'Automation'],
    problem: 'Lawyers at a 40-person firm spent 3+ hours daily extracting structured data from contracts and filing paperwork manually.',
    outcome: 'Cut document processing time by 92%',
    metric: '92%',
    metricLabel: 'faster processing',
    description: 'An AI-powered document pipeline that extracts, classifies, and routes contract data with zero manual intervention — integrating directly into the firm\'s existing DMS.',
    stack: ['Python', 'GPT-4o', 'FastAPI', 'React', 'PostgreSQL', 'Celery'],
    role: 'Lead Engineer',
    timeline: 'Q3 2023 — Q1 2024',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&h=560&fit=crop&auto=format',
    color: '#0FBF7A',
  },
  {
    slug: 'autoschedule',
    title: 'AutoSchedule',
    category: ['Automation', 'Systems'],
    problem: 'A staffing agency with 120 field workers built weekly schedules in a spreadsheet. Six hours every Monday, three people, and it was still wrong half the time.',
    outcome: 'Scheduling time dropped from 6 hours to 11 minutes',
    metric: '97%',
    metricLabel: 'time saved weekly',
    description: 'A constraint-solving scheduling engine that factors availability, certifications, client preferences, and labor law — then generates a legally compliant schedule in seconds.',
    stack: ['TypeScript', 'Next.js', 'PostgreSQL', 'OR-Tools', 'Resend', 'Vercel'],
    role: 'Full-Stack Engineer',
    timeline: 'Q4 2023 — Q2 2024',
    image: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=900&h=560&fit=crop&auto=format',
    color: '#7CE86A',
  },
  {
    slug: 'inventorypulse',
    title: 'InventoryPulse',
    category: ['Systems', 'Web'],
    problem: 'A regional retail chain with 12 locations had no real-time inventory visibility. Stockouts were causing an estimated $180k/month in lost sales.',
    outcome: 'Recovered $140k/month in previously lost sales',
    metric: '$140k',
    metricLabel: 'monthly revenue recovered',
    description: 'Real-time inventory tracking with predictive reorder alerts, webhook integrations across 3 POS systems, and a live operations dashboard for the buying team.',
    stack: ['Python', 'Redis', 'React', 'WebSockets', 'PostgreSQL', 'Terraform'],
    role: 'Lead Engineer',
    timeline: 'Q1 2024 — Q3 2024',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=900&h=560&fit=crop&auto=format',
    color: '#F5A524',
  },
  {
    slug: 'pipelineos',
    title: 'PipelineOS',
    category: ['Automation', 'Systems'],
    problem: 'Deployments at a growing SaaS company required 3 engineers, 45 minutes of coordination, and a mental checklist that no one fully remembered.',
    outcome: 'Deployments now take 4 minutes with zero manual steps',
    metric: '4 min',
    metricLabel: 'down from 45-min deploys',
    description: 'Internal deployment automation with environment promotion, rollback controls, secret management, and a Slack-native command interface that the whole team actually uses.',
    stack: ['TypeScript', 'Docker', 'GitHub Actions', 'Terraform', 'Vault', 'Slack API'],
    role: 'Platform Engineer',
    timeline: 'Q2 2024',
    image: 'https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=900&h=560&fit=crop&auto=format',
    color: '#0B5C4E',
  },
];

export const posts: Post[] = [
  {
    slug: 'when-to-build-vs-buy-ai',
    type: 'article',
    title: 'When to Build vs. Buy Your AI Stack',
    excerpt: 'Every founder asks this. After building custom AI pipelines for a dozen clients, here\'s the decision framework I actually use — and why the answer is almost never "just use the API."',
    date: '2024-11-14',
    readTime: '8 min read',
    tags: ['AI', 'Architecture'],
  },
  {
    slug: 'constraint-solving-business-software',
    type: 'article',
    title: 'Constraint Solving Is Underrated in Business Software',
    excerpt: 'Before reaching for ML, a lot of scheduling and assignment problems have cleaner, deterministic solutions using classical operations research. Here\'s how I think about it.',
    date: '2024-10-02',
    readTime: '12 min read',
    tags: ['Systems', 'Algorithms'],
  },
  {
    slug: 'n8n-production-lessons',
    type: 'til',
    title: 'TIL: n8n in production is not the same as n8n in demos',
    excerpt: 'Three failure modes I hit on my first serious n8n deployment and how I fixed each one.',
    date: '2024-09-18',
    readTime: '4 min read',
    tags: ['Automation', 'DevOps'],
  },
  {
    slug: 'postgres-listen-notify',
    type: 'til',
    title: 'TIL: Postgres LISTEN/NOTIFY is good enough for most real-time features',
    excerpt: 'Before you add Redis pub/sub, check if you actually need it. Postgres does a lot.',
    date: '2024-09-05',
    readTime: '3 min read',
    tags: ['PostgreSQL', 'Backend'],
  },
  {
    slug: 'shipping-fast-vs-right',
    type: 'article',
    title: 'The Myth of "Ship Fast" in Custom Software',
    excerpt: 'Speed and quality aren\'t opposites — but they require fundamentally different kinds of discipline. Here\'s how I think about both.',
    date: '2024-08-20',
    readTime: '7 min read',
    tags: ['Engineering', 'Process'],
  },
];

export const testimonials: Testimonial[] = [
  {
    quote: "Wasik understood the problem faster than I could explain it, and delivered something that actually fixed it. We've used the system every day for six months without a single issue.",
    name: 'Sarah Chen',
    title: 'CTO',
    company: 'LegalFlow',
    avatar: 'SC',
  },
  {
    quote: "He's rare in that he thinks about the business problem before touching any code. The result was something our team actually uses — not something we demo and abandon.",
    name: 'Marcus Webb',
    title: 'Founder',
    company: 'AutoStack',
    avatar: 'MW',
  },
  {
    quote: "Our engineering team had spent two quarters trying to solve this scheduling problem. Wasik figured out the core constraint in a discovery call and shipped the solution in three weeks.",
    name: 'Priya Nair',
    title: 'Head of Operations',
    company: 'Fieldforce',
    avatar: 'PN',
  },
];

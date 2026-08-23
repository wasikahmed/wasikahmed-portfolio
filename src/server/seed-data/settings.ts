/** Seed data for the settings singleton. Edited live via the admin from Phase 4 onward. */
export const settingsSeed = {
  name: 'Wasik Ahmed',
  initials: 'WA',
  role: 'Software Engineer',
  discipline: 'AI & Automation',
  tagline: 'I build systems that do the work for you.',
  proof: 'Document pipelines, schedulers, and internal tools — shipped to production, not demos.',
  email: 'hello@example.com',
  location: 'Toronto, CA',
  timezone: 'EST · UTC−5',
  available: true,
  availableFor: 'Open to full-time roles & contract projects',
  responseTime: '< 24h',
  socials: [
    { label: 'GitHub', href: 'https://github.com' },
    { label: 'LinkedIn', href: 'https://linkedin.com' },
    { label: 'Email', href: 'mailto:hello@example.com' },
  ],
} as const;

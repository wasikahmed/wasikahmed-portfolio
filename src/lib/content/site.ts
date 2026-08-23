/** Site-wide settings. Becomes the `settings` singleton collection in Phase 3. */
export const site = {
  name: 'Wasik Ahmed',
  initials: 'WA',
  role: 'Software Engineer',
  discipline: 'AI & Automation',
  tagline: 'I build systems that do the work for you.',
  /** Concrete proof line for the hero — not a slogan. */
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

export const NAV_LINKS = [
  { label: 'Work', href: '/work' },
  { label: 'Writing', href: '/writing' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
] as const;

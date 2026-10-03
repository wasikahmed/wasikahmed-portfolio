/**
 * Fictional seed data for the settings singleton. The live site's settings
 * are edited in the admin; this is only what a fresh database starts with,
 * and what getSettings() falls back to before anything is seeded.
 */
export const settingsSeed = {
  name: 'Demo Person',
  initials: 'DP',
  role: 'Software Engineer',
  discipline: 'Backend · Full-Stack',
  // Nine words or fewer reads best: the hero's TextReveal accents the first two.
  tagline: 'Demo content for a fresh checkout.',
  proof:
    'Placeholder settings seeded for local development. Edit them in the admin under Settings.',
  email: 'hello@example.com',
  location: 'Example City',
  timezone: 'UTC',
  available: true,
  availableFor: 'Open to software engineering roles',
  responseTime: '< 24h',
  socials: [
    { label: 'GitHub', href: 'https://github.com' },
    { label: 'LinkedIn', href: 'https://linkedin.com' },
    { label: 'Email', href: 'mailto:hello@example.com' },
  ],
  /*
   * A fixed brand asset in public/, deliberately not a media-library upload:
   * it is not user-managed content, and it is the one image on the site that
   * must never 404 because a third-party media host is unreachable.
   */
  portrait: {
    url: '/portrait.webp',
    alt: 'Portrait',
  },
  // /about's narrative and home's Approach list.
  story: [
    'This is placeholder story text seeded for local development.',
    'On the live site this section is written in the admin under Settings, along with every other piece of personal copy.',
  ],
  approach: [
    {
      title: 'Model the problem, not the screen',
      body: 'Placeholder approach item. Getting the data model right first is most of the work.',
    },
    {
      title: 'Make it possible to tell what happened',
      body: 'Placeholder approach item. Audit trails and logs that reconstruct a decision after the fact.',
    },
    {
      title: 'Ship it the way it will actually run',
      body: 'Placeholder approach item. Tests on every push, automated deploys, rollback on a failed health check.',
    },
  ],
} as const;

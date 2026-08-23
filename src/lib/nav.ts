/** App navigation — not content, so it stays a static constant rather than a DB read. */
export const NAV_LINKS = [
  { label: 'Work', href: '/work' },
  { label: 'Writing', href: '/writing' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
] as const;

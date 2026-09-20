/** Seed data for the settings singleton. Edited live via the admin thereafter. */
export const settingsSeed = {
  name: 'Wasik Ahmed',
  initials: 'WA',
  role: 'Software Engineer',
  discipline: 'Backend & Automation',
  /*
   * Nine words, first two accented by the hero's TextReveal. "in production"
   * is the load-bearing half: it is what separates this from a portfolio of
   * tutorials, and every project below can back it up with a public artifact.
   */
  tagline: 'I build backends that run in production.',
  proof:
    'Django and TypeScript systems behind a 10K-download sports app, an offline-first clinic desktop app, and a live B2B order platform.',
  email: 'aponwasikahmed@gmail.com',
  location: 'Dhaka, Bangladesh',
  timezone: 'BST · UTC+6',
  available: true,
  availableFor: 'Open to software engineering roles — remote preferred',
  responseTime: '< 24h',
  socials: [
    { label: 'GitHub', href: 'https://github.com/wasikahmed' },
    { label: 'LinkedIn', href: 'https://linkedin.com/in/wasikahmed' },
    { label: 'Email', href: 'mailto:aponwasikahmed@gmail.com' },
  ],
  /*
   * A fixed brand asset in public/, deliberately not a media-library upload:
   * it is not user-managed content, and it is the one image on the site that
   * must never 404 because a third-party media host is unreachable.
   */
  portrait: {
    url: '/portrait.webp',
    alt: 'Wasik Ahmed',
  },
  /*
   * /about's narrative and home's Approach list. These were hardcoded
   * consts inside their components until now — the most personal copy on
   * the site was the only copy that needed a deploy to change.
   */
  story: [
    'I am a backend engineer based in Dhaka, finishing a Computer Science degree at AIUB while working full-time on production systems. The degree gave me the theory; the last two years of shipping gave me everything else.',
    'Most of my work is Django and Python on the server, with TypeScript wherever the frontend has to meet it. I like the problems that live behind the interface — data models, background jobs, sync, the things that decide whether a product holds up once real people are using it.',
    'That has meant a live football app syncing match data every fifteen seconds for ten thousand-plus installs, a clinic desktop app that had to keep working with the internet switched off, and a B2B ordering system I am the sole backend engineer on.',
    'More recently it has also meant automation — n8n pipelines and LLM workflows with a human kept in the loop. Not because the tools are fashionable, but because they are usually the right answer when the goal is to remove repetitive work without removing judgement.',
  ],
  approach: [
    {
      title: 'Model the problem, not the screen',
      body: 'Advergo sells bespoke and off-the-shelf at once. Treating one as a variant of the other looks efficient for a week and then fills the codebase with conditionals that exist only to undo the wrong abstraction. Getting the shape right first is most of the work.',
    },
    {
      title: 'Make it possible to tell what happened',
      body: 'Anything that quotes a price, files a record or emails a customer needs an answer to "what did it do, and why". Audit trails on every mutation, confidence kept visible, logs that reconstruct a decision after the fact.',
    },
    {
      title: 'Keep a human where judgement belongs',
      body: 'The LLM reply drafting at Factoryze writes, a person sends. That ceiling is deliberate: one confidently wrong automated message to a paying guest costs more than every minute the approval step saves.',
    },
    {
      title: 'Ship it the way it will actually run',
      body: 'Tests on every push, Docker images, automated deploys, rollback on a failed health check. Four bugs in this site only ever appeared in production — the dev server and the real thing diverge exactly where you are not looking.',
    },
  ],
} as const;

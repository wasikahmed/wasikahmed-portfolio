import type { Project } from '@/lib/types';

/**
 * The real work, newest and strongest first.
 *
 * Every metric here is one that can be checked — a store listing, an npm
 * release count, a test suite, a route count. Nothing is a projection and
 * nothing is a business-outcome figure I was not in a position to measure,
 * because a number a reader cannot verify costs more credibility than it
 * buys. Where a project's detail is genuinely not public, the section says
 * so rather than inventing a substitute.
 *
 * `cover` currently points at a generated abstract SVG per project, not a
 * screenshot. Deliberate: a mocked-up interface presented as a product shot
 * is the same class of claim as an invented metric. Replace each one with a
 * real screenshot when there is one to use — nothing else has to change.
 */
export const projects: Omit<Project, 'id'>[] = [
  {
    slug: 'scorelivepro',
    title: 'ScoreLivePro',
    tagline: 'Live football scores that stay live.',
    categories: ['Systems', 'Web'],
    problem:
      'A live score app is only worth opening if the number on screen is current. Match data had to reach every open client within seconds — without paying the sports API for one call per user.',
    headline: {
      value: '10K+',
      label: 'downloads',
      baseline: 'Google Play and the App Store',
    },
    metrics: [
      {
        value: '10K+',
        label: 'downloads',
        baseline: 'Google Play and the App Store',
      },
      {
        value: '15s',
        label: 'match data sync interval',
        baseline: 'pushed to clients, not polled by them',
      },
      {
        value: '2',
        label: 'platforms, one backend',
        baseline: 'Android and iOS off the same API',
      },
    ],
    stack: [
      'Python',
      'Django',
      'Django REST Framework',
      'Celery',
      'Redis',
      'PostgreSQL',
      'WebSockets',
      'Firebase',
      'Docker',
      'GitHub Actions',
    ],
    role: 'Sole Backend Engineer',
    timeline: 'Dec 2025 — Feb 2026',
    year: 2026,
    accent: 'var(--color-accent)',
    cover: {
      url: '/work/scorelivepro.svg',
      alt: 'ScoreLivePro — abstract node field in the project accent',
    },
    architecture: [
      {
        id: 'fetch',
        label: 'Scheduled fetch',
        detail: 'Celery pulls the paid sports API on a beat',
      },
      {
        id: 'target',
        label: 'Targeted fetch',
        detail: 'Only fixtures actually in play are refreshed',
      },
      {
        id: 'store',
        label: 'Persist',
        detail: 'PostgreSQL holds the authoritative match state',
      },
      {
        id: 'fanout',
        label: 'Fan-out',
        detail: 'WebSocket push to every open client',
      },
      {
        id: 'notify',
        label: 'Firebase',
        detail: 'Reaches clients that are closed',
      },
    ],
    sections: [
      {
        id: 'problem',
        title: 'The problem',
        bodyMdx:
          'A football score that is thirty seconds stale is not a score, it is a rumour. The product promise was live data, which meant the gap between a goal being recorded upstream and a user seeing it had to stay small enough that nobody thought about it.\n\nThe constraint that shaped everything was commercial rather than technical: match data came from a paid third-party API billed per call. The naive design — each client polls, the server forwards — multiplies that bill by the number of people watching, which is exactly the wrong way for costs to scale with success.',
      },
      {
        id: 'approach',
        title: 'The approach',
        bodyMdx:
          'The fix is to invert who does the asking. One scheduled Celery job fetches on behalf of everyone, on a fifteen-second beat, and the result fans out over WebSockets to whoever happens to be connected. The number of upstream calls becomes a function of how many matches are live, not how many people are watching them.\n\nFetching was then narrowed further: only fixtures actually in play get refreshed on the beat. A match that finished an hour ago and a match that kicks off tomorrow do not need polling, and most of the fixture list is one or the other at any given moment.\n\nFirebase covers the case WebSockets cannot — a client that is not open. The same state change that pushes down a socket becomes a notification for everyone else.',
      },
      {
        id: 'results',
        title: 'Where it landed',
        bodyMdx:
          'The app is live on Google Play with over ten thousand downloads and on the App Store, served by one Django backend I was the sole engineer on. Deploys ran through GitHub Actions and Docker.\n\nAlongside it I built and maintained Django backends for several other international client products — REST APIs, third-party integrations and production fixes — coordinating with clients across time zones.',
      },
    ],
    links: [
      {
        label: 'Google Play',
        href: 'https://play.google.com/store/apps/details?id=com.scorelivepro.app',
      },
      { label: 'App Store', href: 'https://apps.apple.com/us/app/scorelivepro/id6758834768' },
    ],
    status: 'published',
    publishedAt: '2026-03-01T00:00:00.000Z',
    order: 0,
  },
  {
    slug: 'advergo',
    title: 'Advergo',
    tagline: 'Bespoke orders and retail on one backend.',
    categories: ['Web', 'Systems'],
    problem:
      'A sportswear manufacturer sells two ways at once — bespoke B2B orders that begin life as a quote, and off-the-shelf B2C retail. Both had to run on one system without either becoming a special case.',
    headline: {
      value: '244',
      label: 'automated tests per push',
      baseline: 'green before anything reaches production',
    },
    metrics: [
      {
        value: '244',
        label: 'automated tests per push',
        baseline: 'green before anything reaches production',
      },
      {
        value: '65',
        label: 'REST endpoints',
        baseline: 'one modular Django backend',
      },
      {
        value: '2',
        label: 'order paths, one system',
        baseline: 'B2B quote-to-invoice and B2C retail',
      },
    ],
    stack: [
      'Python',
      'Django',
      'Django REST Framework',
      'PostgreSQL',
      'Next.js',
      'React',
      'Docker',
      'GitHub Actions',
    ],
    role: 'Sole Backend Engineer',
    timeline: 'Jul 2026 — Present',
    year: 2026,
    accent: 'var(--color-accent-bright)',
    cover: { url: '/work/advergo.svg', alt: 'Advergo — abstract node field in the project accent' },
    architecture: [
      {
        id: 'catalog',
        label: 'Catalogue',
        detail: 'Shared by both the retail and custom paths',
      },
      {
        id: 'quote',
        label: 'Quote',
        detail: 'Where a B2B order starts, before a price exists',
      },
      {
        id: 'invoice',
        label: 'Invoice',
        detail: 'Generated as a PDF from the accepted quote',
      },
      {
        id: 'rbac',
        label: 'Access control',
        detail: 'Role-based, with 2FA on admin accounts',
      },
      {
        id: 'audit',
        label: 'Audit trail',
        detail: 'Every mutation recorded with who and when',
      },
    ],
    sections: [
      {
        id: 'problem',
        title: 'The problem',
        bodyMdx:
          'Retail and bespoke manufacturing look like the same business from outside and behave nothing alike underneath. A retail order has a price the moment it is placed. A custom order does not have a price at all until someone has looked at the specification and quoted it, and the quote may go back and forth before it becomes an invoice.\n\nModelling one as a variation of the other is the trap. Retail becomes a quote that is instantly accepted, or custom becomes a product with a blank price — and either way the code fills with conditionals that exist only to undo the wrong abstraction.',
      },
      {
        id: 'approach',
        title: 'The approach',
        bodyMdx:
          'The two paths share a catalogue and diverge immediately after it. A quote is its own object with its own lifecycle, and an invoice is produced from an accepted one along with its PDF. Retail skips that stage entirely rather than pretending to pass through it.\n\nThe backend is deliberately modular — sixty-five REST endpoints grouped by the thing they act on, not by the screen that calls them. That is what makes the second order path additive instead of invasive.',
      },
      {
        id: 'trust',
        title: 'Making it trustworthy',
        bodyMdx:
          'This is a system that quotes prices and issues invoices, so the interesting question is not whether it works but whether you can tell what it did. Role-based access control decides who can act, admin accounts carry a second factor, and every mutation writes an audit entry recording who made it and when.\n\nThe CI pipeline runs 244 automated tests on every push. That number matters less as a statistic than as a working condition: it is what makes it reasonable to keep changing a live commercial system rather than freezing it.',
      },
      {
        id: 'results',
        title: 'Where it stands',
        bodyMdx:
          'The system is live at advergo.org and I remain its sole backend engineer. The client has retained me for a second phase.',
      },
    ],
    links: [{ label: 'advergo.org', href: 'https://advergo.org' }],
    status: 'published',
    publishedAt: '2026-08-01T00:00:00.000Z',
    order: 1,
  },
  {
    slug: 'neeramoy',
    title: 'Neeramoy',
    tagline: 'A clinic that keeps working when the internet does not.',
    categories: ['Systems'],
    problem:
      'Doctors still need patient records, scheduling and billing when the connection drops. Software that stops at the first failed request is not usable in a clinic that loses its line most afternoons.',
    headline: {
      value: '0',
      label: 'connectivity required',
      baseline: 'the full clinic workflow runs offline',
    },
    metrics: [
      {
        value: '0',
        label: 'connectivity required',
        baseline: 'the full clinic workflow runs offline',
      },
      {
        value: '14',
        label: 'npm releases',
        baseline: 'neeramoy-sdk, maintained Jun–Oct 2025',
      },
      {
        value: '2',
        label: 'sources of truth, reconciled',
        baseline: 'local SQLite against the cloud',
      },
    ],
    stack: ['TypeScript', 'Angular', 'Electron', 'SQLite', 'AWS Cognito', 'Node.js'],
    role: 'Co-Developer — Data & Sync',
    timeline: 'May 2025 — Nov 2025',
    year: 2025,
    accent: 'var(--color-accent-deep)',
    cover: {
      url: '/work/neeramoy.svg',
      alt: 'Neeramoy — abstract node field in the project accent',
    },
    architecture: [
      {
        id: 'shell',
        label: 'Electron shell',
        detail: 'Angular UI that assumes nothing about the network',
      },
      {
        id: 'local',
        label: 'Local SQLite',
        detail: 'Every write lands here first, always',
      },
      {
        id: 'queue',
        label: 'Pending queue',
        detail: 'Offline changes wait in order',
      },
      {
        id: 'sync',
        label: 'Sync engine',
        detail: 'Reconciles local records on reconnect',
      },
      {
        id: 'sdk',
        label: 'neeramoy-sdk',
        detail: 'Typed client, AWS Cognito OTP auth',
      },
    ],
    sections: [
      {
        id: 'problem',
        title: 'The problem',
        bodyMdx:
          'Most applications treat the network as present and an outage as an error state. For a clinic that is backwards. The connection is the unreliable part; the doctor in front of a patient is not going to wait for it.\n\nSo offline could not be a degraded mode with half the features greyed out. Consultations, records, scheduling and billing all had to work with the line down, and the software had to sort out the consequences later without anyone thinking about it.',
      },
      {
        id: 'approach',
        title: 'The approach',
        bodyMdx:
          'Local SQLite is the source of truth the application talks to, and it is the only one the UI knows about. Every write lands there first and returns immediately, online or not. There is no code path where the interface waits on a server.\n\nChanges made while disconnected accumulate in an ordered queue. On reconnect the sync engine works through it and reconciles against the cloud. Designing that reconciliation — deciding what wins when the same record moved in both places, and in what order to replay work so the result is the same either way — was the substance of the project.',
      },
      {
        id: 'sdk',
        title: 'The SDK',
        bodyMdx:
          'The cloud side is reached through `neeramoy-sdk`, a typed TypeScript client I published to npm. It carries the whole backend surface including authentication, which runs on AWS Cognito with OTP.\n\nPublishing it as a package rather than embedding it in the desktop app meant the contract had to be explicit and versioned — and it is still there, fourteen releases in, rather than a single publish that was never touched again.',
      },
      {
        id: 'results',
        title: 'Where it landed',
        bodyMdx:
          'Neeramoy shipped as an Angular and Electron desktop app that lets a clinic run fully offline. I co-built it, designed the SQLite data layer and sync engine, and published the SDK.\n\nAlongside it I worked across several of the company’s other products, developing features and fixing API, database and scheduling issues.',
      },
    ],
    links: [{ label: 'neeramoy-sdk on npm', href: 'https://www.npmjs.com/package/neeramoy-sdk' }],
    status: 'published',
    publishedAt: '2025-12-01T00:00:00.000Z',
    order: 2,
  },
  {
    slug: 'inbox-automation',
    title: 'Inbox & Onboarding Automation',
    tagline: 'An inbox that sorts itself, and a human who still decides.',
    categories: ['AI', 'Automation'],
    problem:
      'A short-term-rental property manager’s day ran through one inbox and four disconnected SaaS tools. Onboarding a guest meant retyping the same details into each of them.',
    headline: {
      value: '8',
      label: 'inbox categories triaged',
      baseline: 'Gmail and Outlook, automatically',
    },
    metrics: [
      {
        value: '8',
        label: 'inbox categories triaged',
        baseline: 'across Gmail and Outlook',
      },
      {
        value: '4',
        label: 'SaaS tools joined up',
        baseline: 'Jurny, Autohost, Monday.com, QuickBooks',
      },
      {
        value: '100%',
        label: 'replies human-approved',
        baseline: 'drafted by a model, sent by a person',
      },
    ],
    stack: ['n8n', 'LLM APIs', 'Gmail', 'Outlook', 'Telegram', 'Monday.com', 'QuickBooks'],
    role: 'Software Engineer Intern',
    timeline: 'May 2026 — Present',
    year: 2026,
    accent: 'var(--color-accent)',
    cover: {
      url: '/work/inbox-automation.svg',
      alt: 'Inbox & Onboarding Automation — abstract node field in the project accent',
    },
    architecture: [
      {
        id: 'ingest',
        label: 'Ingest',
        detail: 'Gmail and Outlook into one pipeline',
      },
      {
        id: 'classify',
        label: 'Classify',
        detail: 'LLM sorts each message into 8 categories',
      },
      {
        id: 'draft',
        label: 'Draft',
        detail: 'A reply is written, not sent',
      },
      {
        id: 'approve',
        label: 'Approve',
        detail: 'Telegram, with revision rounds',
      },
      {
        id: 'log',
        label: 'Log',
        detail: 'Every step recorded end to end',
      },
    ],
    sections: [
      {
        id: 'problem',
        title: 'The problem',
        bodyMdx:
          'Short-term-rental operations are a coordination job dressed up as an inbox. Bookings arrive in one system, guest screening happens in another, tasks live in a third and the money lands in a fourth. The property manager is the integration layer, and the integration runs on copy and paste.\n\nThe email side had the same shape. A large share of the messages were routine and a small share genuinely needed judgement, but they arrived mixed together, so everything got read with the same attention.',
      },
      {
        id: 'approach',
        title: 'The approach',
        bodyMdx:
          'Guest onboarding became an n8n workflow spanning Jurny, Autohost, Monday.com and QuickBooks, so a booking propagates across all four without anyone retyping it.\n\nFor the inbox, an LLM classifies each incoming message into one of eight categories across both Gmail and Outlook. That alone changes the job from reading everything to reading the category that needs a person.',
      },
      {
        id: 'human',
        title: 'Keeping the human in the loop',
        bodyMdx:
          'The system drafts replies. It does not send them. Each draft goes to Telegram for approval, and the manager can ask for a revision and get another pass rather than being forced to choose between accepting the draft and writing it from scratch.\n\nThis was a deliberate ceiling, not a limitation waiting to be lifted. These are messages to paying guests, and the cost of one confidently wrong automated reply is far higher than the cost of a person tapping approve. Every step is logged end to end, so what the system did and why is reconstructable after the fact.',
      },
    ],
    status: 'published',
    publishedAt: '2026-07-01T00:00:00.000Z',
    order: 3,
  },
  {
    slug: 'portfolio-cms',
    title: 'This Site',
    tagline: 'The portfolio is the case study.',
    categories: ['Web', 'Systems'],
    problem:
      'A portfolio is usually a static page about engineering rather than a piece of it. This one is the work: a public site and a genuinely multi-user CMS behind it, built and deployed the way a product would be.',
    headline: {
      value: '43',
      label: 'API routes',
      baseline: 'every mutation gated four ways',
    },
    metrics: [
      {
        value: '43',
        label: 'API routes',
        baseline: 'session, CSRF, schema and audit log on each mutation',
      },
      {
        value: '238',
        label: 'tests green in CI',
        baseline: 'plus a Playwright suite on a daily schedule',
      },
      {
        value: '15',
        label: 'data models',
        baseline: 'content, auth, audit and rate limiting',
      },
    ],
    stack: [
      'TypeScript',
      'Next.js',
      'React',
      'MongoDB',
      'Mongoose',
      'Auth.js',
      'Zod',
      'Tailwind CSS',
      'Docker',
      'Cloudflare',
    ],
    role: 'Designer & Engineer',
    timeline: '2026 — Present',
    year: 2026,
    accent: 'var(--color-accent-bright)',
    cover: {
      url: '/work/portfolio-cms.svg',
      alt: 'This site — abstract node field in the project accent',
    },
    architecture: [
      {
        id: 'edge',
        label: 'Edge proxy',
        detail: 'Session gate and a per-request CSP nonce',
      },
      {
        id: 'auth',
        label: 'Auth',
        detail: 'Argon2id, encrypted TOTP, Bearer tokens',
      },
      {
        id: 'perms',
        label: 'Permissions',
        detail: 'Re-read from the database on every request',
      },
      {
        id: 'crud',
        label: 'CRUD factory',
        detail: 'One gate six collections share',
      },
      {
        id: 'deploy',
        label: 'Deploy',
        detail: 'Docker to a VPS behind a Cloudflare Tunnel',
      },
    ],
    sections: [
      {
        id: 'why',
        title: 'Why build it this way',
        bodyMdx:
          'Content lives in MongoDB and is edited through an admin CMS, not by committing a file. That decision is what makes everything else necessary: the moment there is a write path, there is authentication, authorisation, validation, an audit trail and a deployment story.\n\nThe alternative — a static site with the text in the repository — would have been a fraction of the work and would have demonstrated a fraction of the thing.',
      },
      {
        id: 'writes',
        title: 'The write path',
        bodyMdx:
          'Every admin mutation passes four gates: a session check, CSRF verification, schema validation, and an audit log entry. These are not applied by convention but by a shared factory the collections route through, so a new collection cannot quietly skip one.\n\nPermissions are resolved from the database on every request rather than trusted from the token. A user demoted or suspended a second ago is refused on their very next call — the session cookie and programmatic Bearer tokens both resolve through the same gate, and a token’s scopes are intersected with the holder’s current role rather than the role that was baked in when it was issued.',
      },
      {
        id: 'broke',
        title: 'What only production found',
        bodyMdx:
          'The code sat finished and unpushed for two weeks. Deploying it surfaced four bugs in an afternoon that no amount of local testing had.\n\nA stale edge-access configuration left over from an earlier design was failing closed and locking every real admin out. Two CI secrets had been added in the wrong namespace, which silently disabled bot protection and notification email. Sign-out redirected to the container’s own bind address, because the auth library falls back to the `Host` header when no canonical URL is configured and the container binds to `0.0.0.0`.\n\nThe fourth is the one worth keeping. The API reference page rendered completely blank in production and worked perfectly in development. It was a client component with no data dependency, so the framework prerendered it at build time — baking in a CSP nonce that is regenerated per request, so every script on the page was blocked. Development always renders per request, which is exactly why it never appeared there.\n\nThe lesson generalises past this site: "it works" means the running production artefact, not the dev server. The two diverge precisely where you are not looking.',
      },
      {
        id: 'deploy',
        title: 'How it ships',
        bodyMdx:
          'A push to `main` runs typecheck, lint, formatting, unit tests and a production build. Only if that passes does an image get built and pushed, and only then does a deploy step bring it up on the VPS. The browser suite runs separately on pull requests and a daily schedule, so a slow test run never blocks a hotfix.\n\nThe server has no open inbound port — the only way in is a Cloudflare Tunnel. A failed health check rolls the previous image back automatically, and the job still fails, because a rollback means production is safe, not that the change was good.',
      },
    ],
    links: [{ label: 'API reference', href: 'https://wasikahmed.me/docs' }],
    status: 'published',
    publishedAt: '2026-09-01T00:00:00.000Z',
    order: 4,
  },
];

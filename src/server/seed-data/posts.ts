import type { Post } from '@/lib/types';

/** PLACEHOLDER CONTENT — replaced through the admin UI in Phase 8. */
export const posts: Post[] = [
  {
    slug: 'when-to-build-vs-buy-ai',
    kind: 'article',
    title: 'When to build vs. buy your AI stack',
    excerpt:
      'After building custom AI pipelines for a dozen clients, here is the decision framework I actually use — and why the answer is almost never "just call the API".',
    date: '2024-11-14',
    readTime: '8 min',
    tags: ['AI', 'Architecture'],
    body: [
      'Every founder asks this within the first twenty minutes of a discovery call, and the honest answer is that the question is usually framed wrong. "Build or buy" implies two options. In practice there are three, and the third one is where most projects should land.',
      'You can buy a finished product, build the whole thing yourself, or — most often correctly — buy the model and build the system around it. The model is the commodity. The system is where the value is.',
      'The useful test is not capability, it is coupling. If the thing you need is genuinely generic, buy it. If it touches your data model, your compliance posture, or your existing tooling in any non-trivial way, you are going to end up building the integration anyway, and a bought product will fight you the entire time.',
      'The second test is failure behaviour. Ask what happens when the tool is wrong. If a vendor cannot tell you how their confidence scoring works, you cannot build a review process around it, and without a review process you cannot put it anywhere that matters.',
    ],
  },
  {
    slug: 'constraint-solving-business-software',
    kind: 'article',
    title: 'Constraint solving is underrated in business software',
    excerpt:
      'Before reaching for machine learning, a lot of scheduling and assignment problems have cleaner, deterministic answers from classical operations research.',
    date: '2024-10-02',
    readTime: '12 min',
    tags: ['Systems', 'Algorithms'],
    body: [
      'A surprising share of the problems that get labelled "we need AI for this" are actually constraint satisfaction problems with a known, exact solution method that predates the current wave by about fifty years.',
      'Scheduling, assignment, routing, resource allocation, timetabling — these have hard constraints and an objective function. That is not a learning problem. That is a solver problem.',
      'The practical advantage is explainability. When a constraint solver says no, it can tell you exactly which constraints conflict. When a model says no, you get a number.',
      'The tell is whether your rules are written down somewhere or inferred from examples. If a domain expert can state the rules — even messily, even incompletely — you probably want a solver.',
    ],
  },
  {
    slug: 'n8n-production-lessons',
    kind: 'til',
    title: 'n8n in production is not n8n in a demo',
    excerpt: 'Three failure modes I hit on a first serious deployment, and the fix for each.',
    date: '2024-09-18',
    readTime: '4 min',
    tags: ['Automation', 'DevOps'],
    body: [
      'Retries are not idempotent by default. A workflow that partially completed and then retried happily created duplicate records for about a day before anyone noticed.',
      'Execution history grows without bound and will fill the disk. Set a retention policy on day one rather than discovering this at 2am.',
      'Credentials are stored encrypted but the encryption key defaults to something derived from the install. Back it up separately, or a restore gives you a working instance with no working credentials.',
    ],
  },
  {
    slug: 'postgres-listen-notify',
    kind: 'til',
    title: 'Postgres LISTEN/NOTIFY is good enough for most real-time features',
    excerpt: 'Before adding Redis pub/sub, check whether you actually need it.',
    date: '2024-09-05',
    readTime: '3 min',
    tags: ['PostgreSQL', 'Backend'],
    body: [
      'If you already run Postgres and need to push updates to connected clients, LISTEN/NOTIFY handles a genuinely large amount of load before it becomes the bottleneck.',
      'The catch worth knowing: notifications are not durable. A listener that is disconnected when the notify fires never receives it. For a live dashboard that is fine. For anything that must not be missed, it is not.',
      'The other catch is the 8000-byte payload limit. Send an identifier and let the client fetch, rather than sending the row.',
    ],
  },
  {
    slug: 'shipping-fast-vs-right',
    kind: 'article',
    title: 'The myth of "ship fast" in custom software',
    excerpt:
      'Speed and quality are not opposites, but they require fundamentally different kinds of discipline.',
    date: '2024-08-20',
    readTime: '7 min',
    tags: ['Engineering', 'Process'],
    body: [
      'The "move fast and break things" framing was coined by a company that owned its own distribution and could absorb the breakage. Most custom software has neither property.',
      'What actually makes projects fast is not lower standards, it is smaller scope and shorter feedback loops. Those are different levers, and only one of them costs you anything later.',
      'The version of speed I trust is: ship the smallest thing that is genuinely finished, to real users, early. The version I do not trust is shipping something unfinished and calling the remainder a phase two that never gets funded.',
    ],
  },
];

import type { Post } from '@/lib/types';

/**
 * One post, written rather than seeded as placeholder copy.
 *
 * The seed used to carry five invented articles. An empty writing section
 * costs nothing; five titles nobody wrote cost credibility the first time
 * someone clicks one. Anything added here should be the same: a thing
 * actually built, written up afterwards.
 */
export const posts: Omit<Post, 'id'>[] = [
  {
    slug: 'live-data-should-cost-you-once',
    kind: 'article',
    title: 'Live data should cost you once, not once per viewer',
    excerpt:
      'The default way to build a live-score feature bills you for every person watching. Inverting who does the asking turns a cost that scales with success into one that does not.',
    date: '2026-09-20',
    readTime: '6 min',
    tags: ['Backend', 'Architecture', 'Django'],
    bodyMdx: [
      'I spent a stretch as the sole backend engineer on a live football app — match data on screen, updated continuously, for an audience on Google Play and the App Store. The interesting engineering problem was not making the data live. It was making it live without the bill growing every time somebody installed the app.',
      '',
      'Match data came from a third-party sports API, billed per call. That single detail decides the architecture, and it is the kind of constraint that is easy to notice too late — because the obvious design works perfectly in development, where there is one user, and fails commercially in production, where there are thousands.',
      '',
      '![Fan-in versus fan-out: per-viewer polling multiplies upstream API calls, while one scheduled fetch pushed to all clients does not.](/writing/fan-out.svg)',
      '',
      '## The default is fan-in, and it is backwards',
      '',
      'The path of least resistance looks like this: the client asks the server for the current score, the server asks the upstream API, the answer comes back. Repeat on a timer. It is a handful of lines, it is easy to reason about, and every request is trivially correct because it goes all the way to the source.',
      '',
      'It also means your upstream call volume is `viewers × polling frequency`. Ten thousand people watching a match on a five-second timer is two thousand calls a second for one fixture. The cost is not merely high, it is *proportional to how well the product is doing*, which is the worst possible shape for a cost curve. Every marketing win is also an infrastructure bill.',
      '',
      'Caching helps and is worth doing, but it treats the symptom. The structure is still that demand for data is driven by the number of people asking.',
      '',
      '## Invert who does the asking',
      '',
      'The fix is to stop letting clients drive upstream fetches at all. One scheduled job fetches on behalf of everybody — in our case a Celery beat on a fifteen-second interval — writes the result to the database, and pushes the change out over WebSockets to whoever happens to be connected.',
      '',
      'Now the call volume is `live fixtures × polling frequency`. It has no term for the number of viewers in it. The tenth user and the ten-thousandth are free, upstream. That is the whole idea, and everything else is detail.',
      '',
      'Fifteen seconds was a product decision, not a technical one. It is short enough that nobody experiences the score as stale and long enough to stay affordable. Worth setting deliberately, because that number is the actual dial on the bill.',
      '',
      '## Then narrow what you fetch',
      '',
      'The second saving is less obvious and was worth roughly as much. A fixture list is mostly not live. Matches that finished two hours ago do not change, and matches that kick off tomorrow have nothing to report. Polling the whole list on the beat means paying repeatedly for rows that are, by definition, static.',
      '',
      'Refreshing only fixtures actually in play cuts the volume again, and unlike shortening the interval it costs the user nothing. The data that does not change is not less fresh for being left alone.',
      '',
      '<Callout type="info" title="The general shape">',
      'Before optimising how often you fetch, check whether you should be fetching that row at all. Interval tuning trades freshness for cost; scope tuning is usually free.',
      '</Callout>',
      '',
      '## What fan-out actually costs you',
      '',
      'This is not free, and pretending otherwise is how the design gets adopted and then resented. Three things get harder.',
      '',
      '**You now own the state.** With per-request fetching the upstream API is the source of truth and you are a pipe. Once you fetch on a schedule, your database is what clients see, and any gap between it and reality is yours. Getting that wrong is worse than being slow, because it is invisible.',
      '',
      '**Connections are stateful.** A client that reconnects after a dropped socket needs the current state, not just the next change. Push delivers deltas; something still has to answer "what did I miss".',
      '',
      '**Not every client is connected.** A socket only reaches an app that is open. Reaching the rest means a second channel — we used Firebase — and that means one state change has two delivery paths that must not contradict each other.',
      '',
      'None of these are reasons to poll per user. They are the work you take on in exchange for a cost curve that does not punish growth, and they should be planned for rather than discovered.',
      '',
      '## The rule I would keep',
      '',
      'When a data source charges per call, the first architectural question is not how to make requests faster or cache them better. It is **whether the number of upstream calls has a term in it for the number of users**. If it does, no amount of tuning changes the shape of the problem — it only moves the point at which success becomes expensive.',
      '',
      'Getting that term out of the equation is usually a smaller change than it sounds like, and it is much cheaper to make before launch than after.',
    ].join('\n'),
    status: 'published',
    publishedAt: '2026-09-20T00:00:00.000Z',
    seo: {
      title: 'Live data should cost you once, not once per viewer',
      description:
        'Per-user polling makes upstream API cost scale with your audience. Inverting to a scheduled fetch with WebSocket fan-out removes the viewer term entirely.',
    },
    order: 0,
  },
];

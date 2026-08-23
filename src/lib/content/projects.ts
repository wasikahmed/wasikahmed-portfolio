import type { Project } from './types';

/**
 * Seeded from the prototype's placeholder data, enriched with the fields the
 * new design needs: metric baselines, architecture graphs, and real case-study
 * bodies (the prototype hardcoded one body and reused it for every slug).
 *
 * PLACEHOLDER CONTENT — replaced through the admin UI in Phase 8.
 */
export const projects: Project[] = [
  {
    slug: 'docflow-ai',
    title: 'DocFlow AI',
    tagline: 'Contract intake that runs itself.',
    categories: ['AI', 'Automation'],
    problem:
      'Lawyers at a 40-person firm spent three hours a day pulling structured data out of contracts by hand.',
    headline: { value: '92%', label: 'faster processing', baseline: '3.1 hrs/day → 14 min/day' },
    metrics: [
      { value: '92%', label: 'faster processing', baseline: '3.1 hrs/day → 14 min/day' },
      { value: '12k', label: 'contracts / month', baseline: 'was 900 at capacity' },
      { value: '0.4%', label: 'correction rate', baseline: 'human baseline was 2.1%' },
    ],
    stack: ['Python', 'FastAPI', 'PostgreSQL', 'Celery', 'Redis', 'React'],
    role: 'Lead Engineer',
    timeline: 'Q3 2023 — Q1 2024',
    year: 2024,
    accent: 'var(--color-accent)',
    architecture: [
      { id: 'intake', label: 'Intake', detail: 'Watches a mailbox and an S3 drop folder' },
      { id: 'ocr', label: 'OCR + chunk', detail: 'Tesseract fallback for scanned PDFs' },
      { id: 'classify', label: 'Classify', detail: 'Doc type + confidence score' },
      { id: 'extract', label: 'Extract', detail: '14 fields against a strict schema' },
      { id: 'review', label: 'Review gate', detail: 'Low confidence routes to a human' },
      { id: 'sync', label: 'DMS sync', detail: 'Writes back to the existing system' },
    ],
    sections: [
      {
        id: 'problem',
        title: 'The problem',
        body: [
          'The firm handled roughly 900 contracts a month, and every one was read by a paralegal who copied fourteen fields into their document management system by hand. It took about three hours a day across the team, and it was the first thing to slip when work got busy.',
          'The partners had already tried two off-the-shelf tools. Both failed on the same thing: about a third of incoming contracts were scanned PDFs of signed originals, and neither product handled them. A tool that works on two-thirds of your documents does not remove the manual step — it just makes it less predictable.',
        ],
      },
      {
        id: 'constraints',
        title: 'Constraints',
        body: [
          'Nothing could leave their infrastructure. This ruled out most hosted document-AI services and shaped the whole design.',
          'The existing DMS was not going anywhere. Whatever we built had to write into it through an API that was documented in a PDF from 2017.',
          'Wrong data was far worse than no data. A missed contract is an inconvenience; a contract filed with the wrong renewal date is a liability.',
        ],
      },
      {
        id: 'approach',
        title: 'The approach',
        body: [
          'The core decision was to treat confidence as a first-class output rather than an implementation detail. Every extracted field carries a score, and anything below threshold routes to a human review queue instead of being written back silently.',
          'That single choice is what made the system trustworthy enough to actually adopt. The team could see exactly what it was unsure about, which meant they stopped double-checking the things it was sure about.',
        ],
      },
      {
        id: 'build',
        title: 'What it took to build',
        body: [
          'Scanned documents drove most of the engineering. Clean digital PDFs are close to solved; a fax of a signed page is not. The pipeline runs a quality check first and only pays for OCR when it has to.',
          'Extraction runs against a strict schema rather than free-form prompting. The model fills a defined shape, and anything that does not parse is a failure we can see rather than a plausible-looking hallucination we cannot.',
        ],
      },
      {
        id: 'challenges',
        title: 'What broke',
        body: [
          'The first version wrote back to the DMS immediately and asynchronously. Within a week it had filed four contracts against the wrong matter number, because the DMS matched on a client name field that was not unique. We moved to a two-phase write with an explicit reconciliation step.',
          'The confidence threshold was also wrong at launch — too permissive. We had set it by intuition. After two weeks of logged corrections we set it from the actual error curve, and the correction rate dropped by roughly two thirds.',
        ],
      },
      {
        id: 'results',
        title: 'Results',
        body: [
          'Processing time fell from about 3.1 hours a day to 14 minutes, almost all of which is now reviewing the flagged queue rather than typing. Throughput went from around 900 contracts a month to over 12,000 without adding staff.',
          'The correction rate settled at 0.4%, against a measured human baseline of 2.1% — the system is not just faster than the manual process, it is more accurate than it was.',
        ],
      },
      {
        id: 'next',
        title: "What I'd do next",
        body: [
          'The review queue is a plain list. It should be ordered by expected cost of being wrong, so a disputed renewal date outranks a misspelled counterparty.',
          'Retrieval over the extracted corpus is the obvious next step, and the schema work has already done most of the groundwork for it.',
        ],
      },
    ],
  },
  {
    slug: 'autoschedule',
    title: 'AutoSchedule',
    tagline: 'Six hours of spreadsheet work, gone.',
    categories: ['Automation', 'Systems'],
    problem:
      'A staffing agency built weekly schedules for 120 field workers in a spreadsheet. Three people, six hours, still wrong half the time.',
    headline: { value: '97%', label: 'time saved weekly', baseline: '6 hrs → 11 min every Monday' },
    metrics: [
      { value: '97%', label: 'time saved weekly', baseline: '6 hrs → 11 min every Monday' },
      { value: '120', label: 'workers scheduled', baseline: 'across 50+ client sites' },
      { value: '0', label: 'compliance breaches', baseline: 'was ~3 per quarter' },
    ],
    stack: ['TypeScript', 'Next.js', 'PostgreSQL', 'OR-Tools', 'Resend', 'Docker'],
    role: 'Full-Stack Engineer',
    timeline: 'Q4 2023 — Q2 2024',
    year: 2024,
    accent: 'var(--color-accent-bright)',
    architecture: [
      { id: 'input', label: 'Availability', detail: 'Worker submissions + time-off' },
      { id: 'rules', label: 'Rule set', detail: 'Certifications, labour law, client prefs' },
      { id: 'solve', label: 'Solver', detail: 'CP-SAT constraint model' },
      { id: 'verify', label: 'Verify', detail: 'Hard-constraint assertion pass' },
      { id: 'publish', label: 'Publish', detail: 'Notify workers, sync to payroll' },
    ],
    sections: [
      {
        id: 'problem',
        title: 'The problem',
        body: [
          "Every Monday morning three coordinators sat down with a spreadsheet and built the week's schedule for 120 field workers. It took about six hours. By Wednesday it was usually wrong anyway — someone called in sick, a certification had lapsed, a client changed a site requirement.",
          'The real cost was not the six hours. It was that nobody could answer "can we take this job?" without redoing the whole thing.',
        ],
      },
      {
        id: 'constraints',
        title: 'Constraints',
        body: [
          'Labour law is not negotiable. Rest periods between shifts and weekly hour caps are hard constraints, and violating one is a regulatory problem rather than an unhappy worker.',
          'Certifications gate specific sites. A worker without a current ticket for a site cannot be assigned to it, and tickets expire mid-week.',
          'The coordinators had to stay in control. A system that produced a schedule they could not adjust would not have been used.',
        ],
      },
      {
        id: 'approach',
        title: 'The approach',
        body: [
          'This is a constraint satisfaction problem, not a machine learning one. Before reaching for anything statistical it was worth checking whether the problem had a deterministic answer — and it did.',
          'The model separates hard constraints (law, certification, availability) from soft ones (preferred sites, travel distance, fairness of weekend rotation). Hard constraints must hold; soft ones are weighted into an objective the solver maximises.',
          'That separation is what makes the output explainable. When a coordinator asks why someone was not assigned, the answer is a specific violated constraint rather than a score.',
        ],
      },
      {
        id: 'build',
        title: 'What it took to build',
        body: [
          "Most of the work was not the solver. It was getting the rules out of three coordinators' heads and into a form that could be written down, including several they did not know they were applying.",
          'A verification pass runs after every solve and asserts every hard constraint independently of the solver. If the solver is ever wrong, the system refuses to publish rather than quietly producing an illegal schedule.',
        ],
      },
      {
        id: 'challenges',
        title: 'What broke',
        body: [
          'The first model was over-constrained and regularly returned no solution at all, with no explanation. That is worse than a bad schedule. We added relaxation: when the problem is infeasible, the solver reports the minimal set of constraints that would need to give.',
          'Fairness was also harder than expected. The first version optimised purely for travel distance and gave the same three people every weekend shift, because they lived closest to the sites that ran weekends.',
        ],
      },
      {
        id: 'results',
        title: 'Results',
        body: [
          'Schedule generation dropped from about six hours to eleven minutes, most of which is a coordinator reviewing and nudging rather than building from scratch.',
          'Compliance breaches went to zero and have stayed there, from roughly three a quarter before. The verification pass has never let one through.',
        ],
      },
      {
        id: 'next',
        title: "What I'd do next",
        body: [
          "Mid-week re-solving is the obvious gap. Today a Wednesday sickness is still handled manually because a full re-solve would churn everyone's schedule.",
          'The fix is to re-solve with the current schedule as a soft anchor, so it changes as little as possible while restoring feasibility.',
        ],
      },
    ],
  },
  {
    slug: 'inventorypulse',
    title: 'InventoryPulse',
    tagline: 'Stock visibility across twelve locations.',
    categories: ['Systems', 'Web'],
    problem:
      'A twelve-store retail chain had no real-time stock visibility. Stockouts were costing an estimated $180k a month.',
    headline: {
      value: '$140k',
      label: 'monthly revenue recovered',
      baseline: 'of $180k/mo lost to stockouts',
    },
    metrics: [
      {
        value: '$140k',
        label: 'monthly revenue recovered',
        baseline: 'of $180k/mo lost to stockouts',
      },
      { value: '12', label: 'locations live', baseline: 'across 3 POS systems' },
      { value: '90s', label: 'stock data latency', baseline: 'was next-day at best' },
    ],
    stack: ['Python', 'Redis', 'PostgreSQL', 'React', 'WebSockets', 'Terraform'],
    role: 'Lead Engineer',
    timeline: 'Q1 2024 — Q3 2024',
    year: 2024,
    accent: 'var(--color-signal-amber)',
    architecture: [
      { id: 'pos', label: 'POS adapters', detail: 'Three vendors, three data shapes' },
      { id: 'normalize', label: 'Normalise', detail: 'One SKU model across all stores' },
      { id: 'stream', label: 'Event stream', detail: 'Redis streams, 90s worst case' },
      { id: 'forecast', label: 'Reorder model', detail: 'Velocity + lead time per SKU' },
      { id: 'alert', label: 'Alerts', detail: 'Buying team dashboard + push' },
    ],
    sections: [
      {
        id: 'problem',
        title: 'The problem',
        body: [
          'Twelve stores, three different point-of-sale systems, and no shared view of stock. Head office found out about a stockout when a store manager phoned to complain, which was typically two days after it started.',
          'The finance team had estimated the cost at around $180,000 a month in lost sales. Nobody could verify that number, which was itself part of the problem.',
        ],
      },
      {
        id: 'constraints',
        title: 'Constraints',
        body: [
          'Replacing the POS systems was off the table. Two were mid-contract and one was deeply customised.',
          'Store connectivity was unreliable. Two locations had genuinely bad internet, so the system had to tolerate a store going dark for an hour without corrupting its stock picture.',
          'The buying team were not technical. Whatever came out of this had to be usable by people who lived in spreadsheets.',
        ],
      },
      {
        id: 'approach',
        title: 'The approach',
        body: [
          'An adapter per POS vendor, normalising into one internal SKU model. This is unglamorous and it was most of the value — once every store speaks the same language, the rest of the system gets simple.',
          'Events rather than polling. Each adapter emits stock movements to a Redis stream, so a store that drops offline replays its backlog on reconnect instead of losing the window.',
        ],
      },
      {
        id: 'build',
        title: 'What it took to build',
        body: [
          'SKU reconciliation was the hard part. The same product had three different identifiers across the three systems, and about 8% of them did not match cleanly on any field.',
          'We built a matching pass with a manual review queue for the ambiguous remainder, rather than pretending an automated match was reliable enough to trust.',
        ],
      },
      {
        id: 'challenges',
        title: 'What broke',
        body: [
          'The reorder model initially treated all SKUs the same and generated far too many alerts — around 200 a day, which the buying team correctly started ignoring within a week.',
          'Weighting by revenue impact and cutting to a daily digest for anything non-urgent brought it to roughly fifteen actionable alerts a day, which people actually read.',
        ],
      },
      {
        id: 'results',
        title: 'Results',
        body: [
          'Stock data latency went from next-day to about 90 seconds worst case. The buying team can see a developing stockout while there is still time to act on it.',
          'Measured against the prior year, roughly $140,000 a month of the estimated $180,000 in lost sales was recovered.',
        ],
      },
      {
        id: 'next',
        title: "What I'd do next",
        body: [
          'Inter-store transfers are the obvious next lever — often the stock exists four miles away rather than needing reordering at all.',
          'Supplier lead times are currently static per vendor when they clearly vary by season.',
        ],
      },
    ],
  },
  {
    slug: 'pipelineos',
    title: 'PipelineOS',
    tagline: 'Deploys that do not need a meeting.',
    categories: ['Automation', 'Systems'],
    problem:
      'Deploys took three engineers, 45 minutes of coordination, and a mental checklist nobody fully remembered.',
    headline: { value: '4 min', label: 'per deploy', baseline: 'down from 45 min and 3 people' },
    metrics: [
      { value: '4 min', label: 'per deploy', baseline: 'down from 45 min and 3 people' },
      { value: '11×', label: 'deploy frequency', baseline: '2/week → 22/week' },
      { value: '<1 min', label: 'rollback time', baseline: 'previously ~20 min' },
    ],
    stack: ['TypeScript', 'Docker', 'GitHub Actions', 'Terraform', 'Vault', 'Slack API'],
    role: 'Platform Engineer',
    timeline: 'Q2 2024',
    year: 2024,
    accent: 'var(--color-accent-deep)',
    architecture: [
      { id: 'trigger', label: 'Trigger', detail: 'Merge to main, or a Slack command' },
      { id: 'gate', label: 'Gates', detail: 'Tests, migrations, secret checks' },
      { id: 'promote', label: 'Promote', detail: 'staging → prod, same artefact' },
      { id: 'observe', label: 'Watch', detail: 'Error rate + latency for 10 min' },
      { id: 'rollback', label: 'Auto-rollback', detail: 'Reverts on breach, no human' },
    ],
    sections: [
      {
        id: 'problem',
        title: 'The problem',
        body: [
          'Deploying required three engineers on a call for about 45 minutes, following a checklist that lived partly in a wiki and partly in the head of whoever had done it most recently.',
          'The predictable consequence was that the team deployed twice a week, batching up changes, which made each deploy riskier and reinforced the reason they were doing it carefully in the first place.',
        ],
      },
      {
        id: 'constraints',
        title: 'Constraints',
        body: [
          'Database migrations had bitten them before, so any automation had to handle them explicitly rather than hoping.',
          'Secrets were scattered across three places including, in two cases, a private repository.',
          'The team had to trust it on day one. A deploy tool nobody believes gets bypassed, and then you have two deploy processes.',
        ],
      },
      {
        id: 'approach',
        title: 'The approach',
        body: [
          'Build the same artefact once and promote it through environments, rather than rebuilding per environment. If staging passed, the exact bytes that passed are what reach production.',
          'Automated rollback on an observed error-rate or latency breach, with no human in the loop. The fastest a person can notice and react is minutes; the system does it in under one.',
        ],
      },
      {
        id: 'build',
        title: 'What it took to build',
        body: [
          'Migrations are gated separately from code. Destructive migrations require an explicit approval step; additive ones run automatically. Encoding that distinction removed most of the fear.',
          'The Slack interface mattered more than expected. Making deploys visible where the team already worked did more for adoption than any amount of dashboard.',
        ],
      },
      {
        id: 'challenges',
        title: 'What broke',
        body: [
          'The first auto-rollback implementation triggered on a traffic spike that was not an error, rolling back a perfectly good deploy and causing more disruption than the thing it was protecting against.',
          'The fix was comparing against a rolling baseline rather than a fixed threshold, plus requiring the breach to persist for 90 seconds.',
        ],
      },
      {
        id: 'results',
        title: 'Results',
        body: [
          'Deploys went from 45 minutes and three people to about four minutes and nobody. Frequency went from twice a week to around twenty-two times.',
          'Rollback went from roughly twenty minutes of manual work to under a minute, automatically.',
        ],
      },
      {
        id: 'next',
        title: "What I'd do next",
        body: [
          'Progressive delivery is the next step — routing a small share of traffic to the new version before committing to it.',
          'The observation window is currently a flat ten minutes when it should scale with how much of the system a change touches.',
        ],
      },
    ],
  },
];

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}

export function adjacentProjects(slug: string) {
  const index = projects.findIndex((p) => p.slug === slug);
  if (index === -1) return { prev: undefined, next: undefined };
  return {
    prev: index > 0 ? projects[index - 1] : projects[projects.length - 1],
    next: index < projects.length - 1 ? projects[index + 1] : projects[0],
  };
}

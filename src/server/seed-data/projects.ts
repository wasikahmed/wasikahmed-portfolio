import type { Project } from '@/lib/types';

/**
 * Fictional demo content. None of these projects exist.
 *
 * The live site's real case studies are written in the CMS and live only in
 * production MongoDB; this file exists so a fresh checkout, the E2E suite
 * and a local admin have something to render. Keeping it fictional means
 * the repository never carries claims about real work that drift out of
 * date the moment the CMS copy is edited.
 *
 * The four entries are shaped to exercise the site rather than to read
 * well: every category filter matches at least one project, `AI` matches
 * exactly one, and each `stack` entry the constellation links to (see
 * tech.ts) appears in at least one project. e2e/site.spec.ts depends on
 * those properties, so change both together.
 */
export const projects: Omit<Project, 'id'>[] = [
  {
    slug: 'ledger-sync',
    title: 'Ledger Sync',
    tagline: 'Two accounting systems, one set of numbers.',
    categories: ['Systems', 'Automation'],
    problem:
      'A fictional wholesaler kept invoices in one accounting system and payments in another, and reconciled them by hand every week. The two had to agree without anyone exporting a spreadsheet.',
    headline: {
      value: '5 min',
      label: 'sync interval',
      baseline: 'down from a weekly manual export',
    },
    metrics: [
      {
        value: '5 min',
        label: 'sync interval',
        baseline: 'down from a weekly manual export',
      },
      {
        value: '2',
        label: 'systems kept in step',
        baseline: 'invoices on one side, payments on the other',
      },
      {
        value: '0',
        label: 'duplicate records',
        baseline: 'idempotent upserts keyed on the source ID',
      },
    ],
    stack: ['Python', 'Django', 'Celery', 'PostgreSQL', 'Redis', 'Docker'],
    role: 'Backend Engineer',
    timeline: 'Demo project',
    year: 2026,
    accent: 'var(--color-accent)',
    cover: {
      url: '/work/ledger-sync.svg',
      alt: 'Ledger Sync — abstract node field in the project accent',
    },
    architecture: [
      { id: 'schedule', label: 'Schedule', detail: 'Celery beat triggers a sync run' },
      { id: 'pull', label: 'Pull', detail: 'Fetch changes from both systems since the last run' },
      { id: 'match', label: 'Match', detail: 'Pair invoices with payments by reference' },
      { id: 'write', label: 'Write', detail: 'Idempotent upserts into PostgreSQL' },
      { id: 'report', label: 'Report', detail: 'Unmatched items surface for a person to check' },
    ],
    sections: [
      {
        id: 'problem',
        title: 'The problem',
        bodyMdx:
          'This is a demo case study. Two systems each held half of the truth, and the only thing joining them was a person with a spreadsheet once a week. Anything that went wrong in between stayed invisible until the next export.',
      },
      {
        id: 'approach',
        title: 'The approach',
        bodyMdx:
          'A scheduled job pulls changes from both sides, matches them by reference and writes the result with upserts keyed on each source record, so a retried run converges instead of duplicating. A Redis lock stops two runs overlapping.\n\nAnything that cannot be matched is not guessed at. It goes on a short list for a person to review.',
      },
      {
        id: 'results',
        title: 'Where it landed',
        bodyMdx:
          'In this fictional version the weekly export disappears, and the review list becomes the only manual step left.',
      },
    ],
    links: [{ label: 'Example link', href: 'https://example.com' }],
    status: 'published',
    publishedAt: '2026-09-01T00:00:00.000Z',
    order: 0,
  },
  {
    slug: 'order-desk',
    title: 'Order Desk',
    tagline: 'Quotes, orders and invoices in one place.',
    categories: ['Web'],
    problem:
      'A fictional print shop took custom orders over email and tracked them in a shared inbox. Customers needed a quote, a status page and an invoice without staff retyping the same details three times.',
    headline: {
      value: '1',
      label: 'record per order',
      baseline: 'quote, status and invoice share it',
    },
    metrics: [
      {
        value: '1',
        label: 'record per order',
        baseline: 'quote, status and invoice share it',
      },
      {
        value: '4',
        label: 'order states',
        baseline: 'quoted, accepted, in production, delivered',
      },
    ],
    stack: ['TypeScript', 'Next.js', 'React', 'PostgreSQL', 'Docker'],
    role: 'Full-Stack Engineer',
    timeline: 'Demo project',
    year: 2026,
    accent: 'var(--color-accent-bright)',
    cover: {
      url: '/work/order-desk.svg',
      alt: 'Order Desk — abstract node field in the project accent',
    },
    architecture: [
      { id: 'quote', label: 'Quote', detail: 'Staff price a request' },
      { id: 'accept', label: 'Accept', detail: 'The customer accepts from a link' },
      { id: 'track', label: 'Track', detail: 'Status changes are visible to both sides' },
      { id: 'invoice', label: 'Invoice', detail: 'Generated from the accepted quote' },
    ],
    sections: [
      {
        id: 'problem',
        title: 'The problem',
        bodyMdx:
          'This is a demo case study. Every order lived in three places — an email thread, a spreadsheet and an invoice template — and they disagreed often enough that customers stopped trusting any of them.',
      },
      {
        id: 'approach',
        title: 'The approach',
        bodyMdx:
          'One order record carries the whole lifecycle. A quote becomes an order when the customer accepts it, and the invoice is generated from that accepted quote rather than typed again.',
      },
    ],
    links: [{ label: 'Example link', href: 'https://example.com' }],
    status: 'published',
    publishedAt: '2026-08-01T00:00:00.000Z',
    order: 1,
  },
  {
    slug: 'fieldnotes',
    title: 'Fieldnotes',
    tagline: 'A desktop notebook that works without a connection.',
    categories: ['Systems'],
    problem:
      'Fictional survey teams worked in places with no signal and lost notes whenever a sync failed halfway. The app had to treat offline as the normal case, not an error.',
    headline: {
      value: '100%',
      label: 'usable offline',
      baseline: 'sync is a background detail, not a requirement',
    },
    metrics: [
      {
        value: '100%',
        label: 'usable offline',
        baseline: 'sync is a background detail, not a requirement',
      },
      {
        value: '3',
        label: 'desktop platforms',
        baseline: 'macOS, Windows and Linux from one codebase',
      },
    ],
    stack: ['TypeScript', 'Electron', 'SQLite'],
    role: 'Desktop Engineer',
    timeline: 'Demo project',
    year: 2025,
    accent: 'var(--color-accent-deep)',
    cover: {
      url: '/work/fieldnotes.svg',
      alt: 'Fieldnotes — abstract node field in the project accent',
    },
    architecture: [
      { id: 'local', label: 'Local store', detail: 'SQLite is the source of truth on the device' },
      { id: 'queue', label: 'Outbox', detail: 'Changes queue while offline' },
      { id: 'sync', label: 'Sync', detail: 'The queue drains when a connection returns' },
    ],
    sections: [
      {
        id: 'problem',
        title: 'The problem',
        bodyMdx:
          'This is a demo case study. An app that assumes the network is there turns every dropped connection into lost work.',
      },
      {
        id: 'approach',
        title: 'The approach',
        bodyMdx:
          'Every write lands in a local SQLite database first and is queued for upload. The queue drains in order when a connection returns, so nothing the user did depends on the network being up at the time.',
      },
    ],
    links: [],
    status: 'published',
    publishedAt: '2026-07-01T00:00:00.000Z',
    order: 2,
  },
  {
    slug: 'mail-sorter',
    title: 'Mail Sorter',
    tagline: 'Inbox triage with a person still in charge.',
    categories: ['AI', 'Automation'],
    problem:
      'A fictional support team spent the first hour of every day sorting email. Most of it fell into a handful of categories, but a wrong automated reply would cost more than the hour saved.',
    headline: {
      value: '6',
      label: 'triage categories',
      baseline: 'every draft reply approved by a person',
    },
    metrics: [
      {
        value: '6',
        label: 'triage categories',
        baseline: 'every draft reply approved by a person',
      },
    ],
    stack: ['n8n', 'LLM APIs', 'Webhooks'],
    role: 'Automation Engineer',
    timeline: 'Demo project',
    year: 2026,
    accent: 'var(--color-accent)',
    cover: {
      url: '/work/mail-sorter.svg',
      alt: 'Mail Sorter — abstract node field in the project accent',
    },
    architecture: [
      { id: 'receive', label: 'Receive', detail: 'New mail arrives by webhook' },
      { id: 'classify', label: 'Classify', detail: 'An LLM picks one of six categories' },
      { id: 'draft', label: 'Draft', detail: 'A reply is drafted, never sent' },
      { id: 'approve', label: 'Approve', detail: 'A person sends, edits or rejects it' },
    ],
    sections: [
      {
        id: 'problem',
        title: 'The problem',
        bodyMdx:
          'This is a demo case study. Sorting mail is repetitive, but answering it is not, and the two had been bundled into one job.',
      },
      {
        id: 'approach',
        title: 'The approach',
        bodyMdx:
          'The workflow classifies and drafts; a person decides. Nothing leaves the inbox without an approval, and every decision is logged so a wrong category can be traced back to the message that caused it.',
      },
    ],
    links: [],
    status: 'published',
    publishedAt: '2026-06-01T00:00:00.000Z',
    order: 3,
  },
];

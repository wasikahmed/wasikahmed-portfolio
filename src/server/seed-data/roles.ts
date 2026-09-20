import type { Role } from '@/lib/types';

/**
 * The real timeline, newest first. Home's Experience section shows the first
 * three and links to /about#experience for the rest, so order matters: the
 * degree sits last deliberately, where it reads as context rather than as
 * the headline.
 */
export const roles: Omit<Role, 'id'>[] = [
  {
    title: 'Freelance Software Engineer',
    company: 'Advergo Sports & Fashion Wear Ltd.',
    period: 'Jul 2026 — Present',
    type: 'Freelance · Remote',
    summary: '65 endpoints · 244 tests in CI · quote-to-invoice',
    shipped: [
      'Sole backend engineer on a live B2B custom-order and B2C retail system (advergo.org), built with Django, Next.js and PostgreSQL',
      'Designed a modular Django backend of 65 REST endpoints and a quote-to-invoice flow with automated PDF generation',
      'Added role-based access control, admin 2FA and audit trails across every mutation',
      'Built the CI/CD pipeline that runs 244 automated tests on every push',
      'Retained for phase two',
    ],
    order: 0,
  },
  {
    title: 'Software Engineer Intern',
    company: 'Factoryze Technologies Limited',
    period: 'May 2026 — Present',
    type: 'Internship · Hybrid',
    summary: 'LLM inbox triage · 8 categories · human-approved',
    shipped: [
      'Automated short-term-rental guest onboarding in n8n across Jurny, Autohost, Monday.com and QuickBooks',
      'Built LLM-based email triage for Gmail and Outlook, sorting a property manager’s inbox into 8 categories',
      'Developed LLM reply drafting with human approval in Telegram, supporting revision rounds and full logging',
    ],
    order: 1,
  },
  {
    title: 'Junior Backend Developer',
    company: 'Join Venture AI',
    period: 'Dec 2025 — Feb 2026',
    type: 'Full-time · On-site',
    summary: '10K+ installs · 15s live sync · Celery + WebSockets',
    shipped: [
      'Sole backend engineer for ScoreLivePro, a live football app on Google Play (10K+ downloads) and the App Store',
      'Implemented live updates that sync match data every 15 seconds via Celery, pushed over WebSockets and Firebase',
      'Reduced paid sports-API spend through targeted fetching rather than blanket polling',
      'Shipped CI/CD with GitHub Actions and Docker',
      'Built and maintained Django backends for multiple international client products, coordinating across time zones',
    ],
    order: 2,
  },
  {
    title: 'Junior Software Engineer',
    company: 'MADD Technology',
    /* Joined as an intern in May and converted in August; one entry rather
       than two, because the work is continuous and splitting it reads as
       padding. */
    period: 'May 2025 — Nov 2025',
    type: 'Intern → Junior Engineer · On-site',
    summary: 'Offline-first clinic app · SQLite sync engine · npm SDK',
    shipped: [
      'Co-built Neeramoy, an Angular + Electron desktop app that lets doctors run a clinic fully offline',
      'Designed its SQLite data layer and sync engine, reconciling offline records with the cloud on reconnect',
      'Published neeramoy-sdk on npm — a typed TypeScript API client with AWS Cognito OTP auth, 14 releases to date',
      'Developed features and fixed API, database and scheduling issues across multiple company products',
    ],
    order: 3,
  },
  {
    title: 'B.Sc. in Computer Science & Engineering',
    company: 'American International University-Bangladesh (AIUB)',
    kind: 'education',
    period: 'May 2022 — Present',
    type: 'Education · Major in Information Systems',
    summary: 'Information Systems major · alongside full-time engineering work',
    shipped: [
      'Major in Information Systems',
      'Worked professionally as a software engineer throughout the final two years of the degree',
    ],
    order: 4,
  },
];

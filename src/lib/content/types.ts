/**
 * Content types.
 *
 * Phase 3 replaces this module with Mongo + Mongoose, so these shapes are
 * deliberately close to the collection schemas in PLAN.md §3 — the swap
 * should change where the data comes from, not what consumers see.
 */

export type Category = 'AI' | 'Automation' | 'Systems' | 'Web';

export interface Metric {
  value: string;
  label: string;
  /** The before→after that turns a number into evidence. PLAN.md §2.5 #4. */
  baseline?: string;
}

/** A stage in a case study's system diagram. Drives the self-drawing SVG. */
export interface ArchitectureNode {
  id: string;
  label: string;
  detail: string;
}

export interface CaseStudySection {
  id: string;
  title: string;
  body: string[];
}

export interface Project {
  slug: string;
  title: string;
  tagline: string;
  categories: Category[];
  /** One sentence. What was broken. */
  problem: string;
  /** The headline metric, shown on cards and the case-study bar. */
  headline: Metric;
  /** Supporting metrics for the case-study "at a glance" bar. */
  metrics: Metric[];
  stack: string[];
  role: string;
  timeline: string;
  year: number;
  accent: string;
  architecture: ArchitectureNode[];
  sections: CaseStudySection[];
  /** Optional external links. Absent means "not public", not "missing". */
  links?: { label: string; href: string }[];
}

export interface Post {
  slug: string;
  kind: 'article' | 'til';
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags: string[];
  body: string[];
}

export interface Testimonial {
  quote: string;
  name: string;
  title: string;
  company: string;
  initials: string;
  /** Ties the quote to the project it came from. */
  projectSlug?: string;
}

export interface Role {
  title: string;
  company: string;
  period: string;
  type: string;
  shipped: string[];
}

export interface Tech {
  name: string;
  /** Which projects use it — powers the constellation's "used in N projects". */
  projects: string[];
  group: 'Language' | 'Framework' | 'Data' | 'Infra' | 'AI';
}

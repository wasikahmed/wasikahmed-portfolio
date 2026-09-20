/**
 * Content types — shared by the Mongoose models (`src/server/models/`),
 * the query layer (`src/server/queries.ts`), and every component that
 * renders content. This is the contract: components only ever see these
 * shapes, never a Mongoose document.
 */

export type Category = 'AI' | 'Automation' | 'Systems' | 'Web';
export type ContentStatus = 'draft' | 'scheduled' | 'published';

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
  /** MDX source. PLAN.md's locked editor decision — "Bodies stored as MDX text". */
  bodyMdx: string;
}

export interface Seo {
  title?: string;
  description?: string;
  ogImage?: string;
}

/** A picked image — a URL from the media library plus the alt text it needs. */
export interface MediaRef {
  url: string;
  alt: string;
}

export interface Project {
  /** Mongo's `_id`, as a string — the stable key admin CRUD targets. */
  id: string;
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
  /** Hero/card image (PLAN.md W15 item 1). Absent renders exactly as before. */
  cover?: MediaRef;
  architecture: ArchitectureNode[];
  sections: CaseStudySection[];
  /** Optional external links. Absent means "not public", not "missing". */
  links?: { label: string; href: string }[];
  status: ContentStatus;
  publishedAt?: string;
  seo?: Seo;
  order: number;
}

export interface Post {
  id: string;
  slug: string;
  kind: 'article' | 'til';
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags: string[];
  /** MDX source. */
  bodyMdx: string;
  status: ContentStatus;
  publishedAt?: string;
  seo?: Seo;
  order: number;
}

export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  title: string;
  company: string;
  initials: string;
  /** Ties the quote to the project it came from. */
  projectSlug?: string;
  featured: boolean;
  order: number;
}

export interface Role {
  id: string;
  title: string;
  company: string;
  period: string;
  type: string;
  shipped: string[];
  order: number;
}

export interface Tech {
  id: string;
  name: string;
  /** Which projects use it — powers the constellation's "used in N projects". */
  projects: string[];
  group: 'Language' | 'Framework' | 'Data' | 'Infra' | 'AI';
  order: number;
}

export interface SkillGroup {
  id: string;
  category: string;
  items: string[];
  order: number;
}

/** One numbered step in home's "How I actually work" section. */
export interface ApproachStep {
  title: string;
  body: string;
}

/** The settings singleton — site-wide facts editable from the admin. */
export interface Settings {
  name: string;
  initials: string;
  role: string;
  discipline: string;
  tagline: string;
  proof: string;
  email: string;
  location: string;
  timezone: string;
  available: boolean;
  availableFor: string;
  responseTime: string;
  socials: { label: string; href: string }[];
  /** /about's portrait (PLAN.md W15 item 1). Absent renders exactly as before. */
  portrait?: MediaRef;
  /**
   * /about's narrative, one entry per paragraph, and home's Approach
   * section. Both were hardcoded consts in their components, which made the
   * most personal copy on the site the only copy needing a deploy to change
   * — squarely against the premise that content lives in the database.
   */
  story: string[];
  approach: ApproachStep[];
}

export interface Media {
  id: string;
  publicId: string;
  url: string;
  alt: string;
  width?: number;
  height?: number;
  size: number;
  contentType: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  intent: 'project' | 'role';
  name: string;
  email: string;
  company?: string;
  budget?: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  notes?: string;
  /**
   * Set server-side in POST /api/contact, never client input — deliberately
   * absent from `leadSchema` (the untrusted-submission contract). Captured
   * for moderation/triage but wasn't surfaced anywhere until PLAN.md W5.
   */
  source?: string;
  ipHash?: string;
  userAgent?: string;
  createdAt: string;
}

/**
 * The admin/API-client-safe view of a User document — never
 * passwordHash/totpSecret (see src/server/user-fields.ts, the one place
 * that builds this shape server-side).
 */
export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: 'viewer' | 'editor' | 'admin' | 'owner';
  status: 'invited' | 'active' | 'suspended';
  lastLoginAt?: string;
  invitedBy?: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  userEmail: string;
  action: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string;
  summary: string;
  createdAt: string;
}

/**
 * One row from GET /api/admin/auth/tokens — a Bearer token session (PLAN.md
 * W12). Never carries `tokenHash`; the API strips it before responding.
 */
export interface ApiToken {
  id: string;
  scopes: string[];
  label?: string;
  expiresAt: string;
  lastUsedAt?: string;
  createdAt: string;
}

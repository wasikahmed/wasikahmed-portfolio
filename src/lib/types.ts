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
  /**
   * What this entry is, which decides where it appears.
   *
   * /about's timeline shows everything interleaved by date; home's
   * "Where I've built." section shows only work, because a university is
   * not somewhere you built anything. Discriminating on this rather than
   * on the free-text `type` field matters: `type` is edited in the admin,
   * so renaming "Education · …" to "Degree · …" would silently put the
   * degree back on the home page with nothing to catch it.
   *
   * Optional, defaulting to 'work', so every role written before this
   * existed keeps rendering exactly where it did.
   */
  kind?: 'work' | 'education';
  /**
   * The one line home's Experience list shows for this role.
   *
   * Separate from `shipped` on purpose. A CV bullet is scanned inside a
   * list under a heading, so it can restate the role and name its tools;
   * the single line representing a job on the home page cannot — it sits
   * directly under the title it would otherwise repeat.
   *
   * Written as middot-separated fragments rather than prose: at this size
   * a full sentence wraps to two lines and the section reads heavy, while
   * the fragments keep the numbers and stay on one. Optional — absent
   * falls back to the first `shipped` entry, which is how this rendered
   * before the field existed.
   */
  summary?: string;
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

/**
 * Page copy that used to be hardcoded in components — headings, intros,
 * calls to action and meta descriptions — now edited from /admin/site-copy.
 * A singleton like Settings, kept separate from it so Settings stays "facts
 * about the person" and this stays "words on the pages".
 *
 * Grouped by the page each string appears on, which is also how the admin
 * form is laid out. Headings that mention how many projects are live take
 * `{count}`/`{Count}`/`{s}` tokens (see `fillCount` in format.ts).
 */
export interface SiteCopy {
  seo: { siteDescription: string };
  home: {
    workHeading: string;
    impactHeading: string;
    impactIntro: string;
    experienceHeading: string;
    approachHeading: string;
    approachIntro: string;
    shippedHeading: string;
    shippedMoreTitle: string;
    shippedMoreBody: string;
    ctaHeading: string;
    ctaBody: string;
  };
  about: { metaDescription: string; heading: string; skillsHeading: string };
  work: { metaDescription: string; heading: string; intro: string };
  writing: { metaDescription: string; heading: string; intro: string };
  contact: { metaDescription: string; heading: string; intro: string };
  caseStudy: { ctaText: string };
  footer: { unavailableText: string };
}

/**
 * One uploaded résumé PDF (admin view — never carries the file bytes; those
 * are only read by the two routes that stream them). Exactly one version is
 * `isCurrent`, and that is what /resume serves.
 */
export interface ResumeVersion {
  id: string;
  label: string;
  notes?: string;
  fileName: string;
  size: number;
  sha256: string;
  isCurrent: boolean;
  uploadedBy: string;
  createdAt: string;
}

/**
 * A saved copy of a CMS record as it was *before* a change — the content
 * the audit log only describes in one line. Restoring one writes the
 * snapshot back (and records the state it replaced, so a restore is itself
 * undoable).
 */
export interface Revision {
  id: string;
  entityType: string;
  entityId: string;
  /** Human-readable name of the record, captured at snapshot time. */
  label: string;
  action: 'update' | 'delete' | 'restore';
  userEmail: string;
  snapshot: Record<string, unknown>;
  createdAt: string;
}

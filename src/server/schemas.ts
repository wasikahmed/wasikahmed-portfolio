import { z } from 'zod';

/**
 * Zod schemas — the validation boundary for every content collection.
 *
 * The seed script validates against these before writing to Mongo, and
 * Phase 4's admin API routes reuse them for the same purpose, so content
 * cannot reach the database in a shape the site doesn't expect.
 *
 * Kept in `src/server/` (never bundled to the client) since these mirror
 * the Mongoose schemas 1:1 by hand — there is no single source of truth
 * generating both, so a change to one field shape means updating both
 * files. Small enough surface that automatic derivation was not worth
 * the added dependency yet.
 */

export const metricSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  baseline: z.string().optional(),
});

export const architectureNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  detail: z.string().min(1),
});

export const caseStudySectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  body: z.array(z.string().min(1)).min(1),
});

export const linkSchema = z.object({
  label: z.string().min(1),
  href: z.string().url(),
});

export const categorySchema = z.enum(['AI', 'Automation', 'Systems', 'Web']);

export const projectSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'lowercase letters, digits, and hyphens only'),
  title: z.string().min(1),
  tagline: z.string().min(1),
  categories: z.array(categorySchema).min(1),
  problem: z.string().min(1),
  headline: metricSchema,
  metrics: z.array(metricSchema).min(1),
  stack: z.array(z.string().min(1)).min(1),
  role: z.string().min(1),
  timeline: z.string().min(1),
  year: z.number().int().min(2000).max(2100),
  accent: z.string().min(1),
  architecture: z.array(architectureNodeSchema).min(1),
  sections: z.array(caseStudySectionSchema).min(1),
  links: z.array(linkSchema).optional(),
  order: z.number().int().default(0),
});

export const postSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'lowercase letters, digits, and hyphens only'),
  kind: z.enum(['article', 'til']),
  title: z.string().min(1),
  excerpt: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD'),
  readTime: z.string().min(1),
  tags: z.array(z.string().min(1)),
  body: z.array(z.string().min(1)).min(1),
  order: z.number().int().default(0),
});

export const testimonialSchema = z.object({
  quote: z.string().min(1),
  name: z.string().min(1),
  title: z.string().min(1),
  company: z.string().min(1),
  initials: z.string().min(1).max(4),
  projectSlug: z.string().optional(),
  featured: z.boolean().default(true),
  order: z.number().int().default(0),
});

export const roleSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  period: z.string().min(1),
  type: z.string().min(1),
  shipped: z.array(z.string().min(1)).min(1),
  order: z.number().int().default(0),
});

export const techGroupSchema = z.enum(['Language', 'Framework', 'Data', 'Infra', 'AI']);

export const techItemSchema = z.object({
  name: z.string().min(1),
  group: techGroupSchema,
  projects: z.array(z.string().min(1)),
  order: z.number().int().default(0),
});

export const skillGroupSchema = z.object({
  category: z.string().min(1),
  items: z.array(z.string().min(1)).min(1),
  order: z.number().int().default(0),
});

export const settingsSchema = z.object({
  name: z.string().min(1),
  initials: z.string().min(1).max(4),
  role: z.string().min(1),
  discipline: z.string().min(1),
  tagline: z.string().min(1),
  proof: z.string().min(1),
  email: z.string().email(),
  location: z.string().min(1),
  timezone: z.string().min(1),
  available: z.boolean(),
  availableFor: z.string().min(1),
  responseTime: z.string().min(1),
  socials: z.array(linkSchema),
});

/** Phase 5 — contact submissions. Validated here already so the API route just imports this. */
export const leadSchema = z.object({
  intent: z.enum(['project', 'role']),
  name: z.string().min(1).max(200),
  email: z.string().email(),
  company: z.string().max(200).optional(),
  budget: z.string().max(100).optional(),
  message: z.string().min(1).max(5000),
});

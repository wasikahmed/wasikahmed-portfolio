import { z, type ZodType } from 'zod';
import { can, PERMISSIONS, type Role } from './permissions';
import {
  SHORT_LINK_DESTINATION_PATTERN,
  SHORT_LINK_NAME_MAX,
  SHORT_LINK_NAME_PATTERN,
} from '@/lib/short-links';

/**
 * Zod schemas — the validation boundary for every content collection.
 *
 * The seed script validates against these before writing to Mongo, and
 * the admin API routes (src/app/api/admin/**) reuse them for the same
 * purpose, so content cannot reach the database in a shape the site
 * doesn't expect — whether it arrived via the seed script or a CMS form.
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
  bodyMdx: z.string().min(1),
});

export const linkSchema = z.object({
  label: z.string().min(1),
  href: z.string().url(),
});

export const categorySchema = z.enum(['AI', 'Automation', 'Systems', 'Web']);

/** Shared across every content collection — PLAN.md §3. */
export const statusSchema = z.enum(['draft', 'scheduled', 'published']);

/*
 * Deliberately looser than what the admin inputs allow (lib/seo.ts's
 * SEO_TITLE_MAX / META_DESCRIPTION_MAX): content history restores old
 * snapshots through these same schemas (revisions.ts), and tightening them
 * would make every older version with a longer title unrestorable. The
 * forms steer new text to fit a search result; `snippet()` cuts anything
 * longer at render time.
 */
export const seoSchema = z.object({
  title: z.string().max(70).optional(),
  description: z.string().max(200).optional(),
  // Absolute: the [slug] opengraph-image routes fetch it server-side,
  // where a site-relative path has no host to resolve against.
  ogImage: z.string().url().optional(),
});

/**
 * A picked image, pasted in from the media library's "Copy URL" action
 * (PLAN.md W15 item 1) — the same shallow reference pattern `seoSchema`'s
 * `ogImage` already used, just paired with the alt text every image on the
 * public site needs. Not a live reference to a `Media` document: deleting
 * the underlying upload doesn't cascade here, same trade-off `ogImage`
 * already made.
 */
/**
 * A picked image. Media-library uploads are absolute Cloudinary URLs, but a
 * root-relative path is equally valid: the portrait is a fixed brand asset
 * served from public/ rather than user-managed content, so it must never
 * depend on a third-party host being reachable (see seed-data/settings.ts).
 * The Mongoose side is a plain String, so this is the only gate to widen.
 */
export const approachStepSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
});

export const mediaRefSchema = z.object({
  url: z
    .string()
    .min(1)
    .refine((v) => v.startsWith('/') || z.string().url().safeParse(v).success, {
      message: 'Must be an absolute URL or a root-relative path',
    }),
  alt: z.string().min(1),
});

const publishFields = {
  status: statusSchema.default('draft'),
  publishedAt: z.string().datetime().optional(),
  seo: seoSchema.optional(),
};

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
  cover: mediaRefSchema.optional(),
  architecture: z.array(architectureNodeSchema).min(1),
  sections: z.array(caseStudySectionSchema).min(1),
  links: z.array(linkSchema).optional(),
  order: z.number().int().default(0),
  ...publishFields,
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
  bodyMdx: z.string().min(1),
  order: z.number().int().default(0),
  ...publishFields,
});

/**
 * `content:publish` enforced at the schema boundary, not just the route
 * (PLAN.md W10) — a session without it may still submit `status: 'draft'`,
 * but not `'scheduled'`/`'published'`. Wrapping `projectSchema`/
 * `postSchema` here (rather than checking `result.data.status` after the
 * fact in `admin-crud.ts`) means the rule holds for create, update, and
 * any future path that validates against these two schemas directly —
 * not only the two call sites that happen to exist today.
 *
 * Only ever applied to `projectSchema`/`postSchema` — never to
 * `leadUpdateSchema`, whose own `status` field is a triage state (new/
 * read/replied/archived), not a publish gate, and must never require
 * `content:publish` to change.
 */
export function withPublishGuard<T>(
  schema: ZodType<T>,
  session: { role: Role } | null,
): ZodType<T> {
  return schema.superRefine((data, ctx) => {
    // Not `T extends { status?: string }` on the signature above: TS
    // treats an all-optional-properties object type as "weak" and refuses
    // to accept a schema whose output has no properties in common with it
    // (testimonial/role/tech/skill-group all have this at every call
    // site). Checking `status` at runtime, on a value TS otherwise sees as
    // `T`, gets the same safety without that false-positive constraint.
    const status = (data as { status?: unknown }).status;
    if (typeof status === 'string' && status !== 'draft' && !can(session, 'content:publish')) {
      ctx.addIssue({
        code: 'custom',
        path: ['status'],
        message: 'You do not have permission to publish or schedule content.',
      });
    }
  });
}

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

const shortLinkName = z
  .string()
  .trim()
  .toLowerCase()
  .max(SHORT_LINK_NAME_MAX)
  .regex(SHORT_LINK_NAME_PATTERN, 'Lowercase letters, numbers and single hyphens only.');

/**
 * A `/go/<slug>` link (models/short-link.ts). `clicks`/`lastClickedAt` are
 * deliberately absent: only the redirect writes them.
 */
export const shortLinkSchema = z.object({
  slug: shortLinkName,
  /** Where the link is placed — "Pathao application form". Admin-only. */
  label: z.string().trim().min(1).max(120),
  source: shortLinkName,
  medium: shortLinkName.default('link'),
  destination: z
    .string()
    .trim()
    .regex(SHORT_LINK_DESTINATION_PATTERN, 'A path on this site, like / or /work.')
    .default('/'),
  notes: z.string().max(500).optional(),
});

export const roleSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  period: z.string().min(1),
  type: z.string().min(1),
  kind: z.enum(['work', 'education']).default('work'),
  summary: z.string().optional(),
  // '' rather than absent to clear it: updates go through
  // findByIdAndUpdate, which never removes a key that arrives undefined.
  logo: z.union([z.literal(''), mediaRefSchema.shape.url]).optional(),
  // http(s) only: this becomes a public link, and `javascript:` is a URL too.
  website: z
    .union([
      z.literal(''),
      z
        .string()
        .url()
        .refine((v) => /^https?:\/\//.test(v), { message: 'Must start with http:// or https://' }),
    ])
    .optional(),
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

/** What wa.me wants: digits only, country code first, no `+`. */
export function whatsappDigits(value: string): string {
  return value.replace(/\D/g, '');
}

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
  // Empty clears it. Spaces, dashes and brackets are fine (it is stored as
  // typed, and read back that way in the admin); /whatsapp strips them.
  // 8–15 digits is E.164's range, country code included.
  whatsapp: z
    .string()
    .trim()
    .refine(
      (v) => v === '' || (/^\+?[\d\s().-]+$/.test(v) && /^\d{8,15}$/.test(whatsappDigits(v))),
      { message: 'Use the full international number, country code first, e.g. +44 7700 900123.' },
    )
    .optional(),
  socials: z.array(linkSchema),
  portrait: mediaRefSchema.optional(),
  // Defaulted, not required: settings documents written before these
  // existed must keep validating rather than locking the admin out.
  story: z.array(z.string().min(1)).default([]),
  approach: z.array(approachStepSchema).default([]),
  // Structured data only (lib/json-ld.ts) — never rendered on a page.
  alternateNames: z.array(z.string().trim().min(1)).default([]),
  sameAs: z.array(z.string().trim().url()).default([]),
});

const copyText = z.string().trim().min(1);
// Meta descriptions get the same 200-character API ceiling `seoSchema`
// applies (see its comment for why the form's 160 isn't enforced here).
const metaDescription = z.string().trim().min(1).max(200);
// A whole <title>, not a fragment `pageTitle` adds a suffix to — the home
// page's is written out in full so it can carry the name variants.
const metaTitle = z.string().trim().min(1).max(70);

/**
 * PATCH /api/admin/site-copy — the whole document every time, every field
 * required. Partial saves would make "what is on the page right now" depend
 * on which fields happened to be stored versus defaulted; requiring the
 * full shape means a saved document is always complete.
 */
export const siteCopySchema = z.object({
  seo: z.object({ siteDescription: metaDescription, homeTitle: metaTitle }),
  home: z.object({
    workHeading: copyText,
    impactHeading: copyText,
    impactIntro: copyText,
    experienceHeading: copyText,
    approachHeading: copyText,
    approachIntro: copyText,
    shippedHeading: copyText,
    shippedMoreTitle: copyText,
    shippedMoreBody: copyText,
    ctaHeading: copyText,
    ctaBody: copyText,
  }),
  about: z.object({ metaDescription, heading: copyText, skillsHeading: copyText }),
  work: z.object({ metaDescription, heading: copyText, intro: copyText }),
  writing: z.object({ metaDescription, heading: copyText, intro: copyText }),
  contact: z.object({ metaDescription, heading: copyText, intro: copyText }),
  caseStudy: z.object({ ctaText: copyText }),
  docs: z.object({ metaDescription }),
  footer: z.object({ unavailableText: copyText }),
  notFound: z.object({ heading: copyText, body: copyText }),
});

/**
 * Résumé upload metadata — the PDF itself arrives as multipart form data,
 * same split as `mediaSchema`. `makeCurrent` is a form checkbox, so it
 * arrives as the string "true" or not at all.
 */
export const resumeUploadSchema = z.object({
  label: z.string().trim().min(1).max(120),
  notes: z.string().trim().max(2000).optional(),
  makeCurrent: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});

/** PATCH /api/admin/resumes/[id] — rename, re-note, or make this the live version. */
export const resumeUpdateSchema = z
  .object({
    label: z.string().trim().min(1).max(120).optional(),
    notes: z.string().trim().max(2000).optional(),
    isCurrent: z.literal(true).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update.' });

/** The public submission contract for POST /api/contact. */
export const leadSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  company: z.string().max(200).optional(),
  budget: z.string().max(100).optional(),
  message: z.string().min(1).max(5000),
  turnstileToken: z.string().optional(),
});

/** Admin-only fields on an existing lead — status transitions and notes. */
export const leadUpdateSchema = z.object({
  status: z.enum(['new', 'read', 'replied', 'archived']).optional(),
  notes: z.string().max(5000).optional(),
});

/** Media library upload metadata — the file itself arrives as multipart form data. */
export const mediaSchema = z.object({
  alt: z.string().min(1).max(300),
});

// `'owner'` deliberately excluded from every schema below — it's a
// singleton that moves only through the explicit transfer-ownership
// action (PLAN.md W11), never through an invite or a role-change PATCH.
const invitableRoleSchema = z.enum(['viewer', 'editor', 'admin']);

/** POST /api/admin/users — creates a status: 'invited' user, no password yet. */
export const inviteSchema = z.object({
  email: z.string().email(),
  role: invitableRoleSchema,
});

/**
 * PATCH /api/admin/users/[id] — role and/or status, independently
 * optional so the route can be used for either a role change or a
 * suspend/reactivate without a second endpoint. `'invited'` is
 * deliberately not a settable status here — it's an internal state the
 * invite flow itself manages, never something an admin sets directly.
 */
export const userUpdateSchema = z.object({
  role: invitableRoleSchema.optional(),
  status: z.enum(['active', 'suspended']).optional(),
});

/**
 * POST /api/auth/accept-invite/[token] — sets the name and password an
 * invited user never had. The token itself comes from the route param,
 * not this schema — see the route file.
 */
export const acceptInviteSchema = z.object({
  name: z.string().min(1).max(200),
  password: z.string().min(12, 'At least 12 characters.'),
  turnstileToken: z.string().optional(),
});

/**
 * POST /api/admin/auth/token — issues a Bearer token pair (PLAN.md W12).
 * `scopes`, when given, must be a subset of what the caller's role
 * currently grants — validated in the route (schemas.ts has no access to
 * the caller's role), not here.
 */
export const tokenRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  code: z.string().optional(),
  scopes: z.array(z.enum(PERMISSIONS)).min(1).optional(),
  label: z.string().max(100).optional(),
});

/** POST /api/admin/auth/token/refresh. */
export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

/** PATCH /api/admin/password — self-service, no `can()` check (see route). */
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(12, 'At least 12 characters.'),
});

/** POST /api/admin/totp/confirm — the code from the authenticator app being enrolled. */
export const totpConfirmSchema = z.object({ code: z.string().min(6).max(6) });

/** POST /api/admin/totp/disable — current password required to de-provision 2FA. */
export const totpDisableSchema = z.object({ password: z.string().min(1) });

/** POST /api/auth/forgot-password — public, pre-auth (see route). */
export const forgotPasswordSchema = z.object({ email: z.string().email() });

/** POST /api/auth/reset-password — public, pre-auth (see route). */
export const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(12, 'At least 12 characters.'),
});

/**
 * Drag-to-reorder body for every `content:` collection's reorder endpoint
 * (admin-crud.ts's `reorderHandler`) — the full list of ids in their new
 * order.
 */
export const reorderSchema = z.object({ ids: z.array(z.string().min(1)).min(1) });

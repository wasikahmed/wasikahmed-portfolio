// Importing this from a Client Component is a build error, not a silent
// leak — see https://nextjs.org/docs/app/getting-started/server-and-client-components#preventing-environment-poisoning
import 'server-only';

import { cache } from 'react';
import { connectToDatabase } from './db';
import { Project } from './models/project';
import { Post } from './models/post';
import { Testimonial } from './models/testimonial';
import { Role } from './models/role';
import { TechItem } from './models/tech-item';
import { SkillGroup } from './models/skill-group';
import { Settings, SETTINGS_SINGLETON_ID } from './models/settings';
import { settingsSeed } from './seed-data/settings';
import { normalizeDoc } from './mongo-utils';
import type {
  Project as ProjectType,
  Post as PostType,
  Testimonial as TestimonialType,
  Role as RoleType,
  Tech as TechType,
  SkillGroup as SkillGroupType,
  Settings as SettingsType,
} from '@/lib/types';

/**
 * The typed query layer — the site renders entirely from the database.
 * Every function here is server-only and
 * wrapped in React's `cache()`, so calling e.g. `getProjects()` from three
 * different Server Components in one request hits Mongo once.
 *
 * Two visibility tiers, deliberately kept in separate function families:
 *   - `get*` — public, only content that is actually live right now
 *     (published, or scheduled with a `publishedAt` in the past). What
 *     the site renders.
 *   - `getAll*` — admin, every record regardless of status. What the CMS
 *     list views operate on. (Single-record admin reads don't live here:
 *     the CMS edit views fetch through `/api/admin/*`, which goes to the
 *     Mongoose model directly via the CRUD factory in `admin-crud.ts`.)
 * Conflating them would mean one missed status check away from a draft
 * leaking onto the public site.
 */

/** `status: published`, or `scheduled` whose publish time has already passed. */
function visibleNow() {
  return {
    $or: [{ status: 'published' }, { status: 'scheduled', publishedAt: { $lte: new Date() } }],
  };
}

// ── Projects — public ───────────────────────────────────────────────────

export const getProjects = cache(async (): Promise<ProjectType[]> => {
  await connectToDatabase();
  const docs = await Project.find(visibleNow()).sort({ order: 1, year: -1 }).lean();
  return docs.map((d) => normalizeDoc(d)) as unknown as ProjectType[];
});

export const getProject = cache(async (slug: string): Promise<ProjectType | undefined> => {
  await connectToDatabase();
  const doc = await Project.findOne({ slug, ...visibleNow() }).lean();
  return doc ? (normalizeDoc(doc) as unknown as ProjectType) : undefined;
});

export const getProjectSlugs = cache(async (): Promise<string[]> => {
  await connectToDatabase();
  const docs = await Project.find(visibleNow(), 'slug').lean();
  return docs.map((d) => d.slug);
});

export async function getAdjacentProjects(slug: string) {
  const projects = await getProjects();
  const index = projects.findIndex((p) => p.slug === slug);
  if (index === -1) return { prev: undefined, next: undefined };
  // Matches getAdjacentPosts below: no wrap-around. A site with exactly
  // one published project used to link "Next project" back to itself
  // (PLAN.md W5) — the case-study page already guards `next`/`prev` being
  // undefined, so there's no reason for this one to differ.
  return {
    prev: index > 0 ? projects[index - 1] : undefined,
    next: index < projects.length - 1 ? projects[index + 1] : undefined,
  };
}

// ── Projects — admin ─────────────────────────────────────────────────────

export const getAllProjects = cache(async (): Promise<ProjectType[]> => {
  await connectToDatabase();
  const docs = await Project.find().sort({ order: 1, year: -1 }).lean();
  return docs.map((d) => normalizeDoc(d)) as unknown as ProjectType[];
});

// ── Posts — public ───────────────────────────────────────────────────────

export const getPosts = cache(async (): Promise<PostType[]> => {
  await connectToDatabase();
  const docs = await Post.find(visibleNow()).sort({ order: 1, date: -1 }).lean();
  return docs.map((d) => normalizeDoc(d)) as unknown as PostType[];
});

export const getPost = cache(async (slug: string): Promise<PostType | undefined> => {
  await connectToDatabase();
  const doc = await Post.findOne({ slug, ...visibleNow() }).lean();
  return doc ? (normalizeDoc(doc) as unknown as PostType) : undefined;
});

export const getPostSlugs = cache(async (): Promise<string[]> => {
  await connectToDatabase();
  const docs = await Post.find(visibleNow(), 'slug').lean();
  return docs.map((d) => d.slug);
});

export async function getAdjacentPosts(slug: string) {
  const posts = await getPosts();
  const index = posts.findIndex((p) => p.slug === slug);
  if (index === -1) return { prev: undefined, next: undefined };
  return {
    prev: index > 0 ? posts[index - 1] : undefined,
    next: index < posts.length - 1 ? posts[index + 1] : undefined,
  };
}

// ── Posts — admin ────────────────────────────────────────────────────────

export const getAllPosts = cache(async (): Promise<PostType[]> => {
  await connectToDatabase();
  const docs = await Post.find().sort({ order: 1, date: -1 }).lean();
  return docs.map((d) => normalizeDoc(d)) as unknown as PostType[];
});

// ── Testimonials ────────────────────────────────────────────────────────

export const getTestimonials = cache(async (): Promise<TestimonialType[]> => {
  await connectToDatabase();
  const docs = await Testimonial.find({ featured: true }).sort({ order: 1 }).lean();
  return docs.map((d) => normalizeDoc(d)) as unknown as TestimonialType[];
});

export const getAllTestimonials = cache(async (): Promise<TestimonialType[]> => {
  await connectToDatabase();
  const docs = await Testimonial.find().sort({ order: 1 }).lean();
  return docs.map((d) => normalizeDoc(d)) as unknown as TestimonialType[];
});

// ── Experience / roles ──────────────────────────────────────────────────

export const getRoles = cache(async (): Promise<RoleType[]> => {
  await connectToDatabase();
  const docs = await Role.find().sort({ order: 1 }).lean();
  return docs.map((d) => normalizeDoc(d)) as unknown as RoleType[];
});

// ── Skills / tech ───────────────────────────────────────────────────────

export const getTech = cache(async (): Promise<TechType[]> => {
  await connectToDatabase();
  const docs = await TechItem.find().sort({ order: 1 }).lean();
  return docs.map((d) => normalizeDoc(d)) as unknown as TechType[];
});

export const getSkillGroups = cache(async (): Promise<SkillGroupType[]> => {
  await connectToDatabase();
  const docs = await SkillGroup.find().sort({ order: 1 }).lean();
  return docs.map((d) => normalizeDoc(d)) as unknown as SkillGroupType[];
});

// ── Settings (singleton) ───────────────────────────────────────────────

export const getSettings = cache(async (): Promise<SettingsType> => {
  await connectToDatabase();
  const doc = await Settings.findById(SETTINGS_SINGLETON_ID).lean();
  // Falls back to the seed shape rather than throwing — a missing settings
  // doc (unseeded DB) should degrade to sensible defaults, not 500 every
  // page. Spread into fresh mutable objects: settingsSeed is `as const` for
  // the seed script's literal-narrowing benefit, which is incompatible with
  // the mutable Settings shape components expect.
  if (!doc) {
    return { ...settingsSeed, socials: settingsSeed.socials.map((s) => ({ ...s })) };
  }
  // Settings' `_id` is the fixed singleton key, not a per-record identity
  // like every other collection's — dropped rather than exposed as `id`.
  const normalized = normalizeDoc(doc);
  delete (normalized as Record<string, unknown>).id;
  return normalized as SettingsType;
});

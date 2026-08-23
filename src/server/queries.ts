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
 * The typed query layer — PLAN.md Phase 3 exit criteria: "site renders
 * entirely from the database."
 *
 * Every function here is server-only (imports Mongoose) and wrapped in
 * React's `cache()`, so calling `getProjects()` from three different
 * Server Components in the same request hits Mongo once, not three times —
 * the request-scoped memoization Next.js expects this pattern to use,
 * rather than threading data through props purely to avoid refetching.
 *
 * Every function returns a plain object matching the shapes in
 * `@/lib/types`, stripped of Mongoose's `_id`/`__v`/document machinery via
 * `.lean()`, so nothing downstream needs to know Mongo is involved.
 */

function stripMongoId<T extends { _id?: unknown; __v?: unknown }>(doc: T): Omit<T, '_id' | '__v'> {
  const clone: T = { ...doc };
  delete clone._id;
  delete clone.__v;
  return clone;
}

// ── Projects ────────────────────────────────────────────────────────────

export const getProjects = cache(async (): Promise<ProjectType[]> => {
  await connectToDatabase();
  const docs = await Project.find({ status: 'published' }).sort({ order: 1, year: -1 }).lean();
  return docs.map((d) => stripMongoId(d)) as unknown as ProjectType[];
});

export const getProject = cache(async (slug: string): Promise<ProjectType | undefined> => {
  await connectToDatabase();
  const doc = await Project.findOne({ slug, status: 'published' }).lean();
  return doc ? (stripMongoId(doc) as unknown as ProjectType) : undefined;
});

export const getProjectSlugs = cache(async (): Promise<string[]> => {
  await connectToDatabase();
  const docs = await Project.find({ status: 'published' }, 'slug').lean();
  return docs.map((d) => d.slug);
});

export async function getAdjacentProjects(slug: string) {
  const projects = await getProjects();
  const index = projects.findIndex((p) => p.slug === slug);
  if (index === -1) return { prev: undefined, next: undefined };
  return {
    prev: index > 0 ? projects[index - 1] : projects[projects.length - 1],
    next: index < projects.length - 1 ? projects[index + 1] : projects[0],
  };
}

// ── Posts ───────────────────────────────────────────────────────────────

export const getPosts = cache(async (): Promise<PostType[]> => {
  await connectToDatabase();
  const docs = await Post.find({ status: 'published' }).sort({ order: 1, date: -1 }).lean();
  return docs.map((d) => stripMongoId(d)) as unknown as PostType[];
});

export const getPost = cache(async (slug: string): Promise<PostType | undefined> => {
  await connectToDatabase();
  const doc = await Post.findOne({ slug, status: 'published' }).lean();
  return doc ? (stripMongoId(doc) as unknown as PostType) : undefined;
});

export const getPostSlugs = cache(async (): Promise<string[]> => {
  await connectToDatabase();
  const docs = await Post.find({ status: 'published' }, 'slug').lean();
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

// ── Testimonials ────────────────────────────────────────────────────────

export const getTestimonials = cache(async (): Promise<TestimonialType[]> => {
  await connectToDatabase();
  const docs = await Testimonial.find({ featured: true }).sort({ order: 1 }).lean();
  return docs.map((d) => stripMongoId(d)) as unknown as TestimonialType[];
});

// ── Experience ──────────────────────────────────────────────────────────

export const getRoles = cache(async (): Promise<RoleType[]> => {
  await connectToDatabase();
  const docs = await Role.find().sort({ order: 1 }).lean();
  return docs.map((d) => stripMongoId(d)) as unknown as RoleType[];
});

// ── Skills / tech ───────────────────────────────────────────────────────

export const getTech = cache(async (): Promise<TechType[]> => {
  await connectToDatabase();
  const docs = await TechItem.find().sort({ order: 1 }).lean();
  return docs.map((d) => stripMongoId(d)) as unknown as TechType[];
});

export const getSkillGroups = cache(async (): Promise<SkillGroupType[]> => {
  await connectToDatabase();
  const docs = await SkillGroup.find().sort({ order: 1 }).lean();
  return docs.map((d) => ({ category: d.category, items: d.items }));
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
  return stripMongoId(doc) as SettingsType;
});

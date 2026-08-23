/**
 * Seeds the database from src/server/seed-data/* — the content that used
 * to be static imports in Phase 2, now the source of truth for the
 * initial state of each collection (PLAN.md §6, Phase 3).
 *
 * Idempotent: upserts by each collection's natural key, so running this
 * repeatedly converges rather than duplicating. Validates every record
 * against the Zod schemas before writing anything, and fails loudly —
 * a `--dry-run` bad seed should never partially land in the database.
 *
 * Usage: `pnpm seed` (real run) or `pnpm seed --dry-run` (validate only).
 */
import mongoose from 'mongoose';
import { z } from 'zod';

import { Project } from '../src/server/models/project';
import { Post } from '../src/server/models/post';
import { Testimonial } from '../src/server/models/testimonial';
import { Role } from '../src/server/models/role';
import { TechItem } from '../src/server/models/tech-item';
import { SkillGroup } from '../src/server/models/skill-group';
import { Settings, SETTINGS_SINGLETON_ID } from '../src/server/models/settings';

import {
  projectSchema,
  postSchema,
  testimonialSchema,
  roleSchema,
  techItemSchema,
  skillGroupSchema,
  settingsSchema,
} from '../src/server/schemas';

import { projects } from '../src/server/seed-data/projects';
import { posts } from '../src/server/seed-data/posts';
import { testimonials } from '../src/server/seed-data/testimonials';
import { roles } from '../src/server/seed-data/roles';
import { tech, skillGroups } from '../src/server/seed-data/tech';
import { settingsSeed } from '../src/server/seed-data/settings';

const dryRun = process.argv.includes('--dry-run');

function validateAll<T>(schema: z.ZodType<T>, items: unknown[], label: string): T[] {
  const validated: T[] = [];
  for (const [index, item] of items.entries()) {
    const result = schema.safeParse(item);
    if (!result.success) {
      console.error(`✗ ${label}[${index}] failed validation:`);
      console.error(z.prettifyError(result.error));
      process.exit(1);
    }
    validated.push(result.data);
  }
  console.log(`✓ ${label}: ${validated.length} record(s) valid`);
  return validated;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Run with: pnpm seed (loads .env automatically)');
    process.exit(1);
  }

  // Validate everything first — before any connection or write, so a bad
  // seed record is caught the same way whether or not Mongo is reachable.
  const validProjects = validateAll(projectSchema, projects, 'projects');
  const validPosts = validateAll(postSchema, posts, 'posts');
  const validTestimonials = validateAll(testimonialSchema, testimonials, 'testimonials');
  const validRoles = validateAll(roleSchema, roles, 'roles');
  const validTech = validateAll(techItemSchema, tech, 'tech');
  const validSkillGroups = validateAll(skillGroupSchema, skillGroups, 'skillGroups');
  const validSettings = settingsSchema.parse(settingsSeed);

  if (dryRun) {
    console.log('\n--dry-run: validation passed, nothing written.');
    return;
  }

  console.log(`\nConnecting to ${uri}...`);
  await mongoose.connect(uri);

  const results = await Promise.all([
    ...validProjects.map((p) =>
      Project.findOneAndUpdate({ slug: p.slug }, p, { upsert: true, returnDocument: 'after' }),
    ),
    ...validPosts.map((p) =>
      Post.findOneAndUpdate({ slug: p.slug }, p, { upsert: true, returnDocument: 'after' }),
    ),
    ...validTestimonials.map((t) =>
      Testimonial.findOneAndUpdate({ name: t.name, company: t.company }, t, {
        upsert: true,
        returnDocument: 'after',
      }),
    ),
    ...validRoles.map((r) =>
      Role.findOneAndUpdate({ title: r.title, company: r.company }, r, {
        upsert: true,
        returnDocument: 'after',
      }),
    ),
    ...validTech.map((t) =>
      TechItem.findOneAndUpdate({ name: t.name }, t, { upsert: true, returnDocument: 'after' }),
    ),
    ...validSkillGroups.map((g) =>
      SkillGroup.findOneAndUpdate({ category: g.category }, g, {
        upsert: true,
        returnDocument: 'after',
      }),
    ),
    Settings.findByIdAndUpdate(SETTINGS_SINGLETON_ID, validSettings, {
      upsert: true,
      returnDocument: 'after',
    }),
  ]);

  console.log(`\n✓ Seeded ${results.length} document(s) across 7 collections.`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

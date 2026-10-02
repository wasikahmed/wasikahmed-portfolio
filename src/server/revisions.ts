// Importing this from a Client Component is a build error, not a silent
// leak — see https://nextjs.org/docs/app/getting-started/server-and-client-components#preventing-environment-poisoning
import 'server-only';

import type { Model } from 'mongoose';
import { z } from 'zod';
import { connectToDatabase } from './db';
import { writeAuditLog } from './audit';
import { Revision } from './models/revision';
import { Project } from './models/project';
import { Post } from './models/post';
import { Testimonial } from './models/testimonial';
import { Role } from './models/role';
import { TechItem } from './models/tech-item';
import { SkillGroup } from './models/skill-group';
import { Settings, SETTINGS_SINGLETON_ID } from './models/settings';
import { SiteCopyModel, SITE_COPY_SINGLETON_ID } from './models/site-copy';
import {
  projectSchema,
  postSchema,
  testimonialSchema,
  roleSchema,
  techItemSchema,
  skillGroupSchema,
  settingsSchema,
  siteCopySchema,
  withPublishGuard,
} from './schemas';
import type { Permission, Role as UserRole } from './permissions';

/**
 * Content history (see models/revision.ts for the why).
 *
 * One registry entry per versioned record type, keyed by the same
 * `entityType` string the audit log already uses, so the two read as one
 * story. Everything that differs per type — which model, which schema to
 * re-validate a snapshot against, which permissions gate reading and
 * restoring it, what to call the record in a list — lives here, and the
 * routes stay generic. Adding a collection to history is one entry.
 *
 * Leads, media, users and résumés are deliberately absent: leads are inbound
 * messages rather than authored content, media and résumés are files with
 * their own keep-everything history, and user records are security state
 * that should never be "restored" to an older role or password.
 */

type AnyModel = Model<Record<string, unknown>>;

interface RevisionEntry {
  model: AnyModel;
  schema: z.ZodObject<z.ZodRawShape>;
  /** Fixed `_id` for singletons; absent for collections. */
  singletonId?: string;
  readPermission: Permission;
  writePermission: Permission;
  /** Whether restoring must pass the `content:publish` guard. */
  publishGuard?: boolean;
  label: (snapshot: Record<string, unknown>) => string;
}

const str = (v: unknown) => (typeof v === 'string' ? v : '');

export const REVISION_TYPES = {
  project: {
    model: Project as AnyModel,
    schema: projectSchema,
    readPermission: 'content:read',
    writePermission: 'content:write',
    publishGuard: true,
    label: (s) => str(s.title) || str(s.slug),
  },
  post: {
    model: Post as AnyModel,
    schema: postSchema,
    readPermission: 'content:read',
    writePermission: 'content:write',
    publishGuard: true,
    label: (s) => str(s.title) || str(s.slug),
  },
  testimonial: {
    model: Testimonial as AnyModel,
    schema: testimonialSchema,
    readPermission: 'content:read',
    writePermission: 'content:write',
    label: (s) => `${str(s.name)}, ${str(s.company)}`,
  },
  role: {
    model: Role as AnyModel,
    schema: roleSchema,
    readPermission: 'content:read',
    writePermission: 'content:write',
    label: (s) => `${str(s.title)} — ${str(s.company)}`,
  },
  tech: {
    model: TechItem as AnyModel,
    schema: techItemSchema,
    readPermission: 'content:read',
    writePermission: 'content:write',
    label: (s) => str(s.name),
  },
  skillGroup: {
    model: SkillGroup as AnyModel,
    schema: skillGroupSchema,
    readPermission: 'content:read',
    writePermission: 'content:write',
    label: (s) => str(s.category),
  },
  settings: {
    model: Settings as unknown as AnyModel,
    schema: settingsSchema,
    singletonId: SETTINGS_SINGLETON_ID,
    readPermission: 'settings:read',
    writePermission: 'settings:write',
    label: () => 'Site settings',
  },
  siteCopy: {
    model: SiteCopyModel as unknown as AnyModel,
    schema: siteCopySchema,
    singletonId: SITE_COPY_SINGLETON_ID,
    readPermission: 'settings:read',
    writePermission: 'settings:write',
    label: () => 'Site copy',
  },
} satisfies Record<string, RevisionEntry>;

export type RevisionType = keyof typeof REVISION_TYPES;

export function isRevisionType(value: unknown): value is RevisionType {
  return typeof value === 'string' && Object.hasOwn(REVISION_TYPES, value);
}

export function revisionEntry(type: RevisionType): RevisionEntry {
  return REVISION_TYPES[type];
}

/**
 * Enough to be useful, bounded so a record edited every day for years
 * doesn't grow its history without limit. The audit log keeps the full
 * one-line trail regardless.
 */
export const MAX_REVISIONS_PER_RECORD = 50;

/** Strips the storage-only keys so a snapshot is just the record's content. */
function toSnapshot(doc: Record<string, unknown>): Record<string, unknown> {
  const snapshot = { ...doc };
  delete snapshot._id;
  delete snapshot.__v;
  return snapshot;
}

/**
 * Saves `before` — the record exactly as it was prior to the change being
 * made — then trims that record's history to the newest
 * MAX_REVISIONS_PER_RECORD. Called by every write path for a versioned type:
 * admin-crud.ts's update/delete handlers, the settings and site-copy PATCH
 * routes, and `restoreRevision` below.
 */
export async function recordRevision({
  entityType,
  entityId,
  before,
  action,
  userEmail,
}: {
  entityType: RevisionType;
  entityId: string;
  before: Record<string, unknown>;
  action: 'update' | 'delete' | 'restore';
  userEmail: string;
}) {
  await connectToDatabase();
  const snapshot = toSnapshot(before);
  await Revision.create({
    entityType,
    entityId,
    label: REVISION_TYPES[entityType].label(snapshot) || entityType,
    action,
    userEmail,
    snapshot,
  });

  const stale = await Revision.find({ entityType, entityId }, '_id')
    .sort({ createdAt: -1 })
    .skip(MAX_REVISIONS_PER_RECORD)
    .lean();
  if (stale.length) {
    await Revision.deleteMany({ _id: { $in: stale.map((r) => r._id) } });
  }
}

export type RestoreResult =
  { ok: true; entityId: string } | { ok: false; status: 404 | 409 | 422; error: string };

/**
 * Writes a revision's snapshot back as the record's current state.
 *
 * The snapshot is re-validated against today's schema rather than written
 * blindly: a revision taken before a schema change could otherwise put a
 * shape on the live site that the rest of the code no longer expects, and
 * the publish guard has to hold here exactly as it does on a normal save —
 * an editor restoring a published version is publishing it.
 *
 * Restoring is itself recorded (the state being replaced becomes a new
 * 'restore' revision), so a wrong restore is one more restore away from
 * undone. A record's drag-and-drop `order` is kept as it is now, not
 * rolled back with the content — reordering is managed from the list view,
 * and a restore quietly moving a project to an old position would read as
 * a bug.
 */
export async function restoreRevision(
  revisionId: string,
  session: { email: string; role: UserRole },
): Promise<RestoreResult> {
  await connectToDatabase();
  const revision = await Revision.findById(revisionId).lean();
  if (!revision || !isRevisionType(revision.entityType)) {
    return { ok: false, status: 404, error: 'Not found.' };
  }

  const entityType = revision.entityType;
  const entry = REVISION_TYPES[entityType] as RevisionEntry;
  const schema = entry.publishGuard ? withPublishGuard(entry.schema, session) : entry.schema;
  // JSON round trip first: Mongo hands snapshot dates back as `Date`
  // objects, while the write schemas take ISO strings (`publishedAt`) —
  // exactly the form a normal save through the API arrives in.
  const parsed = schema.safeParse(JSON.parse(JSON.stringify(revision.snapshot)));
  if (!parsed.success) {
    return {
      ok: false,
      status: 422,
      error: `This version no longer matches the current format and can't be restored: ${z.prettifyError(parsed.error)}`,
    };
  }

  const data = parsed.data as Record<string, unknown>;
  const id = entry.singletonId ?? revision.entityId;
  const current = await entry.model.findById(id).lean();

  try {
    if (current) {
      if ('order' in data && 'order' in current) delete data.order;
      await recordRevision({
        entityType,
        entityId: revision.entityId,
        before: current as Record<string, unknown>,
        action: 'restore',
        userEmail: session.email,
      });
      // `$unset` every schema field the snapshot doesn't have, so an
      // optional field added since (a cover image, a summary line) goes
      // away too — "restore" means the record as it was, not a merge.
      const missing = Object.keys(entry.schema.shape).filter(
        (key) => !(key in data) && key !== 'order',
      );
      await entry.model.updateOne(
        { _id: id },
        {
          $set: data,
          ...(missing.length ? { $unset: Object.fromEntries(missing.map((k) => [k, ''])) } : {}),
        },
        { runValidators: true },
      );
    } else {
      // A deleted record comes back under its original id, so its history
      // and audit trail stay attached to it (and a singleton under its
      // fixed one).
      await entry.model.create({ _id: id, ...data });
    }
  } catch (err) {
    if (typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000) {
      return {
        ok: false,
        status: 409,
        error:
          'Another record already uses the same identifying field (for example the slug). Rename one first.',
      };
    }
    throw err;
  }

  await writeAuditLog({
    userEmail: session.email,
    action: current ? 'update' : 'create',
    entityType,
    entityId: revision.entityId,
    summary: `Restored ${revision.label} to its version from ${revision.createdAt.toISOString()}`,
  });

  return { ok: true, entityId: revision.entityId };
}

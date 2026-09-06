// Importing this from a Client Component is a build error, not a silent
// leak — see https://nextjs.org/docs/app/getting-started/server-and-client-components#preventing-environment-poisoning
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import type { Model } from 'mongoose';
import type { ZodType } from 'zod';
import { z } from 'zod';
import { connectToDatabase } from './db';
import { getAdminSession, type AdminSession } from './session';
import { verifyCsrf } from './csrf';
import { writeAuditLog } from './audit';
import { normalizeDoc } from './mongo-utils';
import { can, type Permission } from './permissions';
import { withPublishGuard } from './schemas';

/**
 * Generic CRUD route factory for the admin API.
 *
 * Seven content collections (projects, posts, testimonials, roles, tech,
 * skill groups) each need list/create/read/update/delete/reorder behind
 * identical auth, CSRF, validation, and audit-logging rules. Hand-writing
 * that seven times would mean seven places to fix the same bug; this
 * factory means there is exactly one.
 *
 * Auth is checked again here even though middleware already gates
 * `/api/admin/*` — defense in depth, and it also gives us the session's
 * email for the audit log, which middleware doesn't expose to the route.
 *
 * PLAN.md W10 added permission enforcement on top of that session check.
 * `listHandler`/`createHandler`/`deleteHandler`/`reorderHandler` are only
 * ever called for the six `content:` collections (verified against every
 * call site when this landed), so they hardcode the matching `content:*`
 * permission rather than threading a parameter through every route file
 * that calls them. `getOneHandler`/`updateHandler` are the two shared with
 * `leads/[id]/route.ts`, so those take an explicit `resource` and default
 * to `'content'` — the one call site that isn't gets it passed explicitly.
 */

type Resource = 'content' | 'lead';

interface CrudConfig<T> {
  entityType: string;
  schema: ZodType<T>;
  /** Picks the field(s) used to summarize a record in the audit log. */
  summarize: (doc: T) => string;
  /** Default sort for the list endpoint. */
  sort?: Record<string, 1 | -1>;
  /**
   * Which resource's permissions gate create/update. Defaults to
   * `'content'` — every collection through this factory except leads.
   * Controls both the base read/write permission *and* whether the
   * `content:publish` schema guard applies (leads' `status` field is a
   * triage state, not a publish gate, and must never require it).
   */
  resource?: Resource;
}

const READ_PERMISSION: Record<Resource, Permission> = {
  content: 'content:read',
  lead: 'lead:read',
};

const WRITE_PERMISSION: Record<Resource, Permission> = {
  content: 'content:write',
  lead: 'lead:write',
};

async function requirePermission(
  permission: Permission,
): Promise<{ session: AdminSession; response: null } | { session: null; response: NextResponse }> {
  const session = await getAdminSession();
  if (!session) {
    return {
      session: null,
      response: NextResponse.json({ error: 'Not authenticated.' }, { status: 401 }),
    };
  }
  if (!can(session, permission)) {
    return {
      session: null,
      response: NextResponse.json({ error: 'Not permitted.' }, { status: 403 }),
    };
  }
  return { session, response: null };
}

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
}

export function listHandler<T>(model: Model<Record<string, unknown>>, config: CrudConfig<T>) {
  return async function GET() {
    const { response } = await requirePermission('content:read');
    if (response) return response;

    await connectToDatabase();
    const docs = await model
      .find()
      .sort(config.sort ?? { order: 1 })
      .lean();
    return NextResponse.json({ items: docs.map((d) => normalizeDoc(d)) });
  };
}

export function createHandler<T>(model: Model<Record<string, unknown>>, config: CrudConfig<T>) {
  return async function POST(request: NextRequest) {
    const { session, response } = await requirePermission('content:write');
    if (response) return response;
    const csrfError = verifyCsrf(request);
    if (csrfError) return csrfError;

    const body = await request.json().catch(() => null);
    // Always content — createHandler is never called for leads (see the
    // module comment) — so the publish guard is always in play, and it's
    // a no-op for schemas with no `status` field.
    const result = withPublishGuard(config.schema, session).safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: z.prettifyError(result.error) }, { status: 422 });
    }

    await connectToDatabase();
    try {
      const created = await model.create(result.data as Record<string, unknown>);
      const doc = created.toObject();

      await writeAuditLog({
        userEmail: session.email,
        action: 'create',
        entityType: config.entityType,
        entityId: String(doc._id),
        summary: config.summarize(result.data),
      });

      return NextResponse.json({ item: normalizeDoc(doc) }, { status: 201 });
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        return NextResponse.json(
          { error: 'A record with that identifying field already exists.' },
          { status: 409 },
        );
      }
      throw err;
    }
  };
}

export function getOneHandler(
  model: Model<Record<string, unknown>>,
  resource: Resource = 'content',
) {
  return async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const { response } = await requirePermission(READ_PERMISSION[resource]);
    if (response) return response;

    const { id } = await params;
    await connectToDatabase();
    const doc = await model.findById(id).lean();
    if (!doc) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    return NextResponse.json({ item: normalizeDoc(doc) });
  };
}

export function updateHandler<T>(model: Model<Record<string, unknown>>, config: CrudConfig<T>) {
  const resource = config.resource ?? 'content';
  return async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const { session, response } = await requirePermission(WRITE_PERMISSION[resource]);
    if (response) return response;
    const csrfError = verifyCsrf(request);
    if (csrfError) return csrfError;

    const { id } = await params;
    const body = await request.json().catch(() => null);
    // Only apply the publish guard for content — leadUpdateSchema's
    // `status` is a triage state, not a publish gate (see the module
    // comment and withPublishGuard's own doc comment in schemas.ts).
    const schema =
      resource === 'content' ? withPublishGuard(config.schema, session) : config.schema;
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: z.prettifyError(result.error) }, { status: 422 });
    }

    await connectToDatabase();
    try {
      const updated = await model
        .findByIdAndUpdate(id, result.data as Record<string, unknown>, {
          returnDocument: 'after',
          runValidators: true,
        })
        .lean();
      if (!updated) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

      await writeAuditLog({
        userEmail: session.email,
        action: 'update',
        entityType: config.entityType,
        entityId: id,
        summary: config.summarize(result.data),
      });

      return NextResponse.json({ item: normalizeDoc(updated) });
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        return NextResponse.json(
          { error: 'A record with that identifying field already exists.' },
          { status: 409 },
        );
      }
      throw err;
    }
  };
}

export function deleteHandler(model: Model<Record<string, unknown>>, entityType: string) {
  return async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const { session, response } = await requirePermission('content:delete');
    if (response) return response;
    const csrfError = verifyCsrf(request);
    if (csrfError) return csrfError;

    const { id } = await params;
    await connectToDatabase();
    const deleted = await model.findByIdAndDelete(id).lean();
    if (!deleted) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

    await writeAuditLog({
      userEmail: session.email,
      action: 'delete',
      entityType,
      entityId: id,
      summary: `Deleted ${entityType} ${id}`,
    });

    return new NextResponse(null, { status: 204 });
  };
}

const reorderSchema = z.object({ ids: z.array(z.string().min(1)).min(1) });

/**
 * Drag-to-reorder: body is the full list of ids in their new order.
 *
 * `entityType` makes this the one mutation that was missing an audit
 * entry (AGENTS.md §4 rule 5, a known gap — PLAN.md W5) — one entry per
 * reorder rather than per item, since the operation is a single logical
 * change even though it touches every row.
 */
export function reorderHandler(model: Model<Record<string, unknown>>, entityType: string) {
  return async function POST(request: NextRequest) {
    const { session, response } = await requirePermission('content:reorder');
    if (response) return response;
    const csrfError = verifyCsrf(request);
    if (csrfError) return csrfError;

    const body = await request.json().catch(() => null);
    const result = reorderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: z.prettifyError(result.error) }, { status: 422 });
    }

    await connectToDatabase();
    // One round trip instead of N sequential findByIdAndUpdate calls
    // (PLAN.md W5) — same effect, ordering still comes from array index.
    await model.bulkWrite(
      result.data.ids.map((id, index) => ({
        updateOne: { filter: { _id: id }, update: { order: index } },
      })),
    );

    await writeAuditLog({
      userEmail: session.email,
      action: 'update',
      entityType,
      entityId: 'reorder',
      summary: `Reordered ${result.data.ids.length} ${entityType}(s)`,
    });

    return NextResponse.json({ ok: true });
  };
}

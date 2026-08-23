import { NextResponse, type NextRequest } from 'next/server';
import type { Model } from 'mongoose';
import type { ZodType } from 'zod';
import { z } from 'zod';
import { connectToDatabase } from './db';
import { getAdminSession } from './session';
import { verifyCsrf } from './csrf';
import { writeAuditLog } from './audit';
import { normalizeDoc } from './mongo-utils';

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
 */

interface CrudConfig<T> {
  entityType: string;
  schema: ZodType<T>;
  /** Picks the field(s) used to summarize a record in the audit log. */
  summarize: (doc: T) => string;
  /** Default sort for the list endpoint. */
  sort?: Record<string, 1 | -1>;
}

async function requireSession() {
  const session = await getAdminSession();
  if (!session) {
    return {
      session: null,
      response: NextResponse.json({ error: 'Not authenticated.' }, { status: 401 }),
    };
  }
  return { session, response: null };
}

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
}

export function listHandler<T>(model: Model<Record<string, unknown>>, config: CrudConfig<T>) {
  return async function GET() {
    const { response } = await requireSession();
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
    const { session, response } = await requireSession();
    if (response) return response;
    const csrfError = verifyCsrf(request);
    if (csrfError) return csrfError;

    const body = await request.json().catch(() => null);
    const result = config.schema.safeParse(body);
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

export function getOneHandler(model: Model<Record<string, unknown>>) {
  return async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const { response } = await requireSession();
    if (response) return response;

    const { id } = await params;
    await connectToDatabase();
    const doc = await model.findById(id).lean();
    if (!doc) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    return NextResponse.json({ item: normalizeDoc(doc) });
  };
}

export function updateHandler<T>(model: Model<Record<string, unknown>>, config: CrudConfig<T>) {
  return async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const { session, response } = await requireSession();
    if (response) return response;
    const csrfError = verifyCsrf(request);
    if (csrfError) return csrfError;

    const { id } = await params;
    const body = await request.json().catch(() => null);
    const result = config.schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: z.prettifyError(result.error) }, { status: 422 });
    }

    await connectToDatabase();
    try {
      const updated = await model
        .findByIdAndUpdate(id, result.data as Record<string, unknown>, {
          new: true,
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
    const { session, response } = await requireSession();
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

/** Drag-to-reorder: body is the full list of ids in their new order. */
export function reorderHandler(model: Model<Record<string, unknown>>) {
  return async function POST(request: NextRequest) {
    const { response } = await requireSession();
    if (response) return response;
    const csrfError = verifyCsrf(request);
    if (csrfError) return csrfError;

    const body = await request.json().catch(() => null);
    const result = reorderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: z.prettifyError(result.error) }, { status: 422 });
    }

    await connectToDatabase();
    await Promise.all(
      result.data.ids.map((id, index) => model.findByIdAndUpdate(id, { order: index })),
    );

    return NextResponse.json({ ok: true });
  };
}

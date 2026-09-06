import { NextResponse } from 'next/server';
import { buildOpenApiDocument } from '@/server/openapi';

/**
 * The generated OpenAPI spec (PLAN.md W13) — public and unauthenticated,
 * a deliberate choice made explicitly, not a default (see openapi.ts's
 * module comment). Outside `/api/admin`, so none of proxy.ts's session
 * gating applies; it only ever needs the security headers every route
 * gets. `/docs` fetches this at render time.
 *
 * Rebuilt on every request rather than cached: this is a handful of Zod
 * schemas run through a synchronous document builder, not a database
 * query — the cost of getting it wrong (a stale spec after a deploy) is
 * not worth optimizing away a cost this small.
 */
export async function GET() {
  return NextResponse.json(buildOpenApiDocument());
}

import { NextResponse } from 'next/server';
import { pingDatabase } from '@/server/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const dbOk = await pingDatabase();

  return NextResponse.json(
    {
      status: dbOk ? 'ok' : 'degraded',
      db: dbOk ? 'up' : 'down',
      timestamp: new Date().toISOString(),
    },
    // A down DB still returns a response (so the process itself is alive),
    // but at a status Docker's HEALTHCHECK (Phase 7) can treat as unhealthy.
    { status: dbOk ? 200 : 503 },
  );
}

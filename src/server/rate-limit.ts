import 'server-only';

import { createHash } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { connectToDatabase } from './db';
import { RateLimit } from './models/rate-limit';

/** Never store a raw IP — a salted hash is enough to rate-limit without keeping PII around. */
export function hashIp(ip: string): string {
  const salt = process.env.AUTH_SECRET ?? 'dev-only-salt';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

/** Best-effort client IP from the headers a reverse proxy (Cloudflare, Docker) sets. */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

/**
 * Fixed-window counter, atomic via findOneAndUpdate + upsert. Returns
 * whether the caller is still within `limit` requests per `windowMs`.
 */
export async function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): Promise<boolean> {
  await connectToDatabase();

  // upsert: true guarantees a document comes back.
  const doc = (await RateLimit.findOneAndUpdate(
    { key },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(Date.now() + windowMs) } },
    { upsert: true, new: true },
  ).lean()) as { count: number };

  return doc.count <= limit;
}

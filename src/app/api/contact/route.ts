import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/server/db';
import { Lead } from '@/server/models/lead';
import { leadSchema } from '@/server/schemas';
import { getSettings } from '@/server/queries';
import { checkRateLimit, getClientIp, hashIp } from '@/server/rate-limit';
import { verifyTurnstile } from '@/server/turnstile';
import { sendLeadNotification } from '@/server/email';

/**
 * Public — no session, no CSRF (there is no cookie to check for an
 * anonymous visitor). Abuse is contained by Turnstile + IP-hash rate
 * limiting instead. See PLAN.md W1.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const ipHash = hashIp(ip);

  const withinLimit = await checkRateLimit(`contact:${ipHash}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!withinLimit) {
    return NextResponse.json({ error: 'Too many submissions. Try again later.' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const result = leadSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: z.prettifyError(result.error) }, { status: 422 });
  }

  const turnstileOk = await verifyTurnstile(result.data.turnstileToken, ip);
  if (!turnstileOk) {
    return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 422 });
  }

  const { intent, name, email, company, budget, message } = result.data;
  const lead = { intent, name, email, company, budget, message };

  await connectToDatabase();
  await Lead.create({
    ...lead,
    source: 'contact-form',
    ipHash,
    userAgent: request.headers.get('user-agent') ?? undefined,
  });

  const settings = await getSettings();
  await sendLeadNotification(lead, settings.email);

  return NextResponse.json({ ok: true }, { status: 201 });
}

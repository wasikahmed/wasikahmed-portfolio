import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/server/db';
import { Lead } from '@/server/models/lead';
import { leadSchema } from '@/server/schemas';
import { getSettings } from '@/server/queries';
import { checkRateLimit, getClientIp, hashIp } from '@/server/rate-limit';
import { verifyTurnstile } from '@/server/turnstile';
import { sendLeadNotification, sendLeadReceipt } from '@/server/email';

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

  const { name, email, company, budget, message } = result.data;
  const lead = { name, email, company, budget, message };

  await connectToDatabase();
  await Lead.create({
    ...lead,
    source: 'contact-form',
    ipHash,
    userAgent: request.headers.get('user-agent') ?? undefined,
  });

  // The lead is saved — from here on, an email failure is ours to see in
  // the logs, not the visitor's to retry. Reporting it as an error used to
  // invite a resubmit, which only duplicated a lead that already existed.
  const settings = await getSettings();
  const [notified, receipt] = await Promise.allSettled([
    sendLeadNotification(lead, settings.email),
    sendLeadReceipt(email, settings),
  ]);
  if (notified.status === 'rejected') {
    console.error('[contact] lead notification failed', notified.reason);
  }
  if (receipt.status === 'rejected') {
    console.error('[contact] lead receipt failed', receipt.reason);
  }

  return NextResponse.json(
    { ok: true, receiptSent: receipt.status === 'fulfilled' && receipt.value },
    { status: 201 },
  );
}

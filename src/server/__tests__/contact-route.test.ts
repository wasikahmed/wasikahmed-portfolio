import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { NextRequest } from 'next/server';

/**
 * POST /api/contact past Turnstile (TURNSTILE_SECRET_KEY is unset here, so
 * verifyTurnstile() no-ops — the same choice accept-invite-route.test.ts
 * makes), and GET /whatsapp. Email is mocked: what is under test is what
 * the route does with a send's outcome, not Gmail.
 */

const sendLeadNotification = vi.fn();
const sendLeadReceipt = vi.fn();
vi.mock('../email', () => ({ sendLeadNotification, sendLeadReceipt }));

let mongod: MongoMemoryServer;
let Lead: (typeof import('../models/lead'))['Lead'];
let Settings: (typeof import('../models/settings'))['Settings'];
let SETTINGS_SINGLETON_ID: (typeof import('../models/settings'))['SETTINGS_SINGLETON_ID'];
let settingsSeed: (typeof import('../seed-data/settings'))['settingsSeed'];
let contact: typeof import('../../app/api/contact/route');
let whatsapp: typeof import('../../app/whatsapp/route');

let ip = 0;
function submit(body: unknown) {
  return contact.POST(
    new NextRequest('http://localhost/api/contact', {
      method: 'POST',
      // A fresh address per call, so the 5-per-hour limit never trips here.
      headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.0.0.${++ip}` },
      body: JSON.stringify(body),
    }),
  );
}

const valid = { name: 'Jane Doe', email: 'jane@example.com', message: 'Hello there.' };

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();

  const { connectToDatabase } = await import('../db');
  ({ Lead } = await import('../models/lead'));
  ({ Settings, SETTINGS_SINGLETON_ID } = await import('../models/settings'));
  ({ settingsSeed } = await import('../seed-data/settings'));
  contact = await import('../../app/api/contact/route');
  whatsapp = await import('../../app/whatsapp/route');
  await connectToDatabase();
}, 60_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await Lead.deleteMany({});
  await Settings.deleteMany({});
  vi.resetAllMocks();
});

describe('POST /api/contact', () => {
  it('saves the lead, notifies the owner, and sends the visitor a receipt', async () => {
    sendLeadNotification.mockResolvedValue(undefined);
    sendLeadReceipt.mockResolvedValue(true);

    const res = await submit(valid);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true, receiptSent: true });

    const leads = await Lead.find().lean();
    expect(leads).toHaveLength(1);
    expect(leads[0].intent).toBeUndefined();
    expect(sendLeadReceipt).toHaveBeenCalledWith('jane@example.com', expect.anything());
  });

  it('still succeeds when email fails, since the lead is already saved', async () => {
    sendLeadNotification.mockRejectedValue(new Error('SMTP down'));
    sendLeadReceipt.mockRejectedValue(new Error('SMTP down'));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await submit(valid);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true, receiptSent: false });
    expect(await Lead.countDocuments()).toBe(1);
    expect(error).toHaveBeenCalledTimes(2);
  });

  it('reports receiptSent: false when no receipt went out (Gmail unconfigured)', async () => {
    sendLeadNotification.mockResolvedValue(undefined);
    sendLeadReceipt.mockResolvedValue(false);

    const res = await submit(valid);
    expect(await res.json()).toEqual({ ok: true, receiptSent: false });
  });
});

describe('GET /whatsapp', () => {
  async function saveSettings(whatsappNumber?: string) {
    await Settings.create({
      // A mutable copy: the seed is `as const`, which Mongoose's types refuse.
      ...(JSON.parse(JSON.stringify(settingsSeed)) as Record<string, unknown>),
      _id: SETTINGS_SINGLETON_ID,
      name: 'Jane Doe',
      whatsapp: whatsappNumber,
    });
  }

  it('redirects to wa.me with digits only and a prefilled greeting', async () => {
    await saveSettings('+44 7700 900123');

    const res = await whatsapp.GET();
    expect(res.status).toBe(307);
    const location = new URL(res.headers.get('location')!);
    expect(location.origin + location.pathname).toBe('https://wa.me/447700900123');
    expect(location.searchParams.get('text')).toBe('Hi Jane, I found you through your portfolio.');
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('falls back to /contact when no number is set', async () => {
    await saveSettings('');

    const res = await whatsapp.GET();
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('/contact');
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildServerEvent,
  clientIp,
  handleUmamiProxy,
  isCountableOpen,
  openSource,
  resolveRoute,
  sendServerEvent,
} from '../umami-proxy';

/**
 * The analytics relay (umami-proxy.ts). What matters most here is what it
 * refuses: it must never become an open relay into the Umami instance, and
 * the visitor IP it attaches must come from Cloudflare, not the body.
 */

const WEBSITE_ID = 'bb762169-f7cd-477d-aa0e-cdc39901b295';
const UMAMI = 'https://analytics.example.com';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubEnv('UMAMI_URL', `${UMAMI}/`);
  vi.stubEnv('UMAMI_WEBSITE_ID', WEBSITE_ID);
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  // A fresh Response per call: a body can only be read once.
  fetchMock.mockImplementation(
    async () =>
      new Response(JSON.stringify({ cache: 'token' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(`http://localhost/x/${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const event = (overrides: Record<string, unknown> = {}) => ({
  type: 'event',
  payload: { website: WEBSITE_ID, url: '/', hostname: 'wasikahmed.me', ...overrides },
});

/** The JSON body the relay sent upstream, from the last fetch call. */
function forwardedBody() {
  const [, init] = fetchMock.mock.calls.at(-1)!;
  return JSON.parse(init.body as string);
}

describe('resolveRoute', () => {
  it('maps the two scripts and the recorder config, nothing else, for GET', () => {
    expect(resolveRoute('GET', ['a.js'], WEBSITE_ID)?.upstream).toBe('/script.js');
    expect(resolveRoute('GET', ['r.js'], WEBSITE_ID)?.upstream).toBe('/recorder.js');
    expect(resolveRoute('GET', ['api', 'websites', WEBSITE_ID, 'recorder'], WEBSITE_ID)?.kind).toBe(
      'recorder-config',
    );
    expect(resolveRoute('GET', ['api', 'websites', 'someone-else', 'recorder'], WEBSITE_ID)).toBe(
      null,
    );
    expect(resolveRoute('GET', ['api', 'websites'], WEBSITE_ID)).toBe(null);
    expect(resolveRoute('GET', ['api', 'auth', 'verify'], WEBSITE_ID)).toBe(null);
  });

  it('sends every POST but the recorder to the fixed collect endpoint', () => {
    expect(resolveRoute('POST', ['api', 'hit'], WEBSITE_ID)?.upstream).toBe('/api/send');
    expect(resolveRoute('POST', ['api', 'auth', 'login'], WEBSITE_ID)?.upstream).toBe('/api/send');
    expect(resolveRoute('POST', ['api', 'record'], WEBSITE_ID)?.upstream).toBe('/api/record');
    expect(resolveRoute('DELETE', ['api', 'hit'], WEBSITE_ID)).toBe(null);
  });
});

describe('clientIp', () => {
  it("prefers Cloudflare's header over the forwarding chain", () => {
    const headers = new Headers({
      'cf-connecting-ip': '203.0.113.7',
      'x-forwarded-for': '198.51.100.1, 10.0.0.1',
    });
    expect(clientIp(headers)).toBe('203.0.113.7');
  });

  it('falls back to the first x-forwarded-for hop off Cloudflare', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '198.51.100.1, 10.0.0.1' }))).toBe(
      '198.51.100.1',
    );
    expect(clientIp(new Headers())).toBeUndefined();
  });
});

describe('handleUmamiProxy', () => {
  it('404s everything when analytics is unconfigured', async () => {
    vi.stubEnv('UMAMI_URL', '');
    const res = await handleUmamiProxy(post('api/hit', event()), ['api', 'hit']);
    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards a beacon to /api/send with the visitor's Cloudflare IP and user agent", async () => {
    const res = await handleUmamiProxy(
      post('api/hit', event(), {
        'cf-connecting-ip': '203.0.113.7',
        'user-agent': 'Mozilla/5.0 Test',
        'x-umami-cache': 'session-token',
      }),
      ['api', 'hit'],
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ cache: 'token' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${UMAMI}/api/send`);
    const headers = new Headers(init.headers);
    expect(headers.get('x-umami-cache')).toBe('session-token');
    expect(headers.get('user-agent')).toBe('Mozilla/5.0 Test');
    expect(forwardedBody().payload).toMatchObject({
      ip: '203.0.113.7',
      userAgent: 'Mozilla/5.0 Test',
      website: WEBSITE_ID,
    });
  });

  it('never trusts an ip the browser put in the payload', async () => {
    await handleUmamiProxy(
      post('api/hit', event({ ip: '8.8.8.8' }), { 'cf-connecting-ip': '203.0.113.7' }),
      ['api', 'hit'],
    );
    expect(forwardedBody().payload.ip).toBe('203.0.113.7');

    await handleUmamiProxy(post('api/hit', event({ ip: '8.8.8.8' })), ['api', 'hit']);
    expect(forwardedBody().payload.ip).toBeUndefined();
  });

  it('refuses a beacon for any other website on the instance', async () => {
    const res = await handleUmamiProxy(post('api/hit', event({ website: 'someone-else' })), [
      'api',
      'hit',
    ]);
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses bodies that are not collect payloads, even on a login-shaped path', async () => {
    for (const body of [
      { username: 'admin', password: 'x' },
      { type: 'login', payload: { website: WEBSITE_ID } },
      'not json',
    ]) {
      const res = await handleUmamiProxy(post('api/auth/login', body), ['api', 'auth', 'login']);
      expect(res.status).toBe(400);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('forwards recorder chunks with the session token but no injected ip', async () => {
    const body = { type: 'record', payload: { website: WEBSITE_ID, events: [], timestamp: 1 } };
    const res = await handleUmamiProxy(
      post('api/record', body, { 'x-umami-cache': 'session-token', 'cf-connecting-ip': '1.2.3.4' }),
      ['api', 'record'],
    );
    expect(res.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${UMAMI}/api/record`);
    expect(new Headers(init.headers).get('x-umami-cache')).toBe('session-token');
    expect(forwardedBody().payload.ip).toBeUndefined();
  });

  it('rejects oversized bodies before reading them', async () => {
    const res = await handleUmamiProxy(
      post('api/record', event(), { 'content-length': String(2_000_000) }),
      ['api', 'record'],
    );
    expect(res.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('serves the tracker script as JavaScript, cacheably', async () => {
    fetchMock.mockResolvedValue(new Response('!function(){}()', { status: 200 }));
    const res = await handleUmamiProxy(new Request('http://localhost/x/a.js'), ['a.js']);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('javascript');
    expect(res.headers.get('cache-control')).toContain('max-age=3600');
    expect(fetchMock.mock.calls[0][0]).toBe(`${UMAMI}/script.js`);
  });

  it('502s, rather than throwing, when Umami is unreachable', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));
    const res = await handleUmamiProxy(post('api/hit', event()), ['api', 'hit']);
    expect(res.status).toBe(502);
  });
});

describe('server-sent events (résumé opens)', () => {
  const UA =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/131 Safari/537.36';
  const config = { origin: UMAMI, websiteId: WEBSITE_ID };
  const open = (url = 'http://0.0.0.0:3000/resume', headers: Record<string, string> = {}) =>
    new Request(url, { headers: { 'user-agent': UA, ...headers } });

  it('counts a plain GET, and the first range request of a PDF viewer', () => {
    expect(isCountableOpen(open())).toBe(true);
    expect(isCountableOpen(open(undefined, { range: 'bytes=0-65535' }))).toBe(true);
  });

  it('does not count follow-up ranges, prefetches, HEAD, missing UAs or a signed-in admin', () => {
    expect(isCountableOpen(open(undefined, { range: 'bytes=65536-131071' }))).toBe(false);
    expect(isCountableOpen(open(undefined, { 'sec-purpose': 'prefetch;prerender' }))).toBe(false);
    expect(isCountableOpen(open(undefined, { purpose: 'prefetch' }))).toBe(false);
    expect(
      isCountableOpen(
        new Request('http://localhost/resume', { method: 'HEAD', headers: { 'user-agent': UA } }),
      ),
    ).toBe(false);
    expect(isCountableOpen(new Request('http://localhost/resume'))).toBe(false);
    expect(
      isCountableOpen(open(undefined, { cookie: 'theme=dark; __Secure-authjs.session-token=abc' })),
    ).toBe(false);
    expect(isCountableOpen(open(undefined, { cookie: 'authjs.session-token=abc' }))).toBe(false);
  });

  it('names the source from utm_source, then the referrer, then direct', () => {
    const site = 'wasikahmed.me';
    expect(
      openSource(new URL('http://x/resume?utm_source=GitHub'), 'https://github.com/', site),
    ).toBe('github');
    expect(openSource(new URL('http://x/resume'), 'https://www.linkedin.com/feed/', site)).toBe(
      'linkedin.com',
    );
    expect(openSource(new URL('http://x/resume'), 'https://wasikahmed.me/about', site)).toBe(
      'site',
    );
    expect(openSource(new URL('http://x/resume'), 'not a url', site)).toBe('direct');
    expect(openSource(new URL('http://x/resume'), null, site)).toBe('direct');
  });

  it("builds a collect body like the tracker's: path and query only, visitor IP and UA", () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://wasikahmed.me');
    const body = buildServerEvent(
      open('http://0.0.0.0:3000/resume?utm_source=github&utm_medium=readme', {
        'cf-connecting-ip': '203.0.113.7',
        referer: 'https://github.com/',
        'accept-language': 'en-GB,en;q=0.9',
      }),
      config,
      'resume_view',
      { response: 'full' },
    );
    expect(body).toEqual({
      type: 'event',
      payload: {
        website: WEBSITE_ID,
        hostname: 'wasikahmed.me',
        url: '/resume?utm_source=github&utm_medium=readme',
        referrer: 'https://github.com/',
        language: 'en-GB',
        name: 'resume_view',
        data: { source: 'github', response: 'full' },
        userAgent: UA,
        ip: '203.0.113.7',
      },
    });
  });

  it("posts to /api/send with the visitor's user agent, and swallows failures", async () => {
    const body = buildServerEvent(open(), config, 'resume_view');
    await sendServerEvent(config, body);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${UMAMI}/api/send`);
    expect(new Headers(init.headers).get('user-agent')).toBe(UA);

    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(sendServerEvent(config, body)).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

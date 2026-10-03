import 'server-only';

/**
 * First-party relay for Umami (AGENTS.md §10, PLAN.md §1).
 *
 * The tracker and the session recorder are served from this origin under
 * `/x/` and post back to it, rather than loading straight from the Umami
 * host. Two reasons, both measured rather than assumed:
 *
 * - Ad blockers. A developer audience runs them at a high rate, and every
 *   common filter list matches the Umami host or its script name. A
 *   same-origin path with a neutral name is not on any of them.
 * - Visitor location. The Umami instance sits behind Cloudflare, and this
 *   server reaches it through Cloudflare too, so a plain rewrite would
 *   arrive with *this VPS* as `cf-connecting-ip` — every visitor would
 *   share one IP, collapsing sessions, and Cloudflare's own country headers
 *   would describe the VPS. Umami's collect endpoint accepts `payload.ip`
 *   and, when it is present, skips CDN location headers and resolves the
 *   location itself (src/lib/detect.ts in Umami 3.x) — so the visitor's
 *   real IP goes in the payload, and Umami needs no configuration of its
 *   own for any of this.
 *
 * Deliberately an allowlist, not a pass-through: only the five things the
 * two scripts actually request are reachable, collect always lands on
 * Umami's fixed `/api/send` whatever path the tracker posts to, and every
 * body must name this site's website ID. Without that, this would be an
 * open relay into the Umami instance's admin API that launders the
 * caller's IP.
 */

const COLLECT_TYPES = new Set(['event', 'identify', 'performance']);
const RECORD_TYPES = new Set(['record', 'heatmap']);

// The recorder chunks its uploads at 500 KB (recorder.js's own limit);
// double that leaves headroom without accepting arbitrary payloads.
const MAX_BODY_BYTES = 1_000_000;
const UPSTREAM_TIMEOUT_MS = 8_000;

export interface UmamiConfig {
  origin: string;
  websiteId: string;
}

/**
 * Both unset = analytics off everywhere: no script tags render and every
 * `/x/` path 404s. Same no-op-if-unset convention as email and Turnstile.
 * Read per call rather than at module load so tests (and a changed
 * container `.env`) never see a stale value.
 */
export function getUmamiConfig(): UmamiConfig | null {
  const url = process.env.UMAMI_URL;
  const websiteId = process.env.UMAMI_WEBSITE_ID;
  if (!url || !websiteId) return null;
  try {
    return { origin: new URL(url).origin, websiteId };
  } catch {
    // Malformed URL — fail closed (analytics off) rather than throw on
    // every page render.
    return null;
  }
}

/** Public paths the layout's script tags point at. */
export const TRACKER_PATH = '/x/a.js';
export const RECORDER_PATH = '/x/r.js';

type Route =
  | { kind: 'script'; upstream: string }
  | { kind: 'recorder-config'; upstream: string }
  | { kind: 'collect'; upstream: '/api/send' }
  | { kind: 'record'; upstream: '/api/record' };

/**
 * `segments` is everything after `/x/`. The tracker posts to
 * `<its own directory>` + the instance's `COLLECT_API_ENDPOINT` (`/api/hit`
 * on the current instance, `/api/send` by default) — any POST that isn't
 * the recorder's is treated as collect, because the upstream target is
 * fixed and the body is validated, so the incoming path grants nothing.
 */
export function resolveRoute(method: string, segments: string[], websiteId: string): Route | null {
  const path = segments.join('/');

  if (method === 'GET') {
    if (path === 'a.js') return { kind: 'script', upstream: '/script.js' };
    if (path === 'r.js') return { kind: 'script', upstream: '/recorder.js' };
    if (path === `api/websites/${websiteId}/recorder`) {
      return { kind: 'recorder-config', upstream: `/api/websites/${websiteId}/recorder` };
    }
    return null;
  }

  if (method === 'POST') {
    if (path === 'api/record') return { kind: 'record', upstream: '/api/record' };
    return { kind: 'collect', upstream: '/api/send' };
  }

  return null;
}

/**
 * The visitor's address. Cloudflare sets `cf-connecting-ip` on every
 * request it forwards and overwrites any client-supplied value, and the
 * Tunnel is the only ingress to this server (AGENTS.md §7) — so in
 * production it cannot be spoofed. The fallbacks only matter off
 * Cloudflare, i.e. local development.
 */
export function clientIp(headers: Headers): string | undefined {
  return (
    headers.get('cf-connecting-ip') ??
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    undefined
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function jsonError(status: number, message: string): Response {
  return Response.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

async function upstreamFetch(url: string, init: RequestInit): Promise<Response | null> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
  } catch {
    return null;
  }
}

export async function handleUmamiProxy(request: Request, segments: string[]): Promise<Response> {
  const config = getUmamiConfig();
  if (!config) return jsonError(404, 'Not found.');

  const route = resolveRoute(request.method, segments, config.websiteId);
  if (!route) return jsonError(404, 'Not found.');

  const upstreamUrl = `${config.origin}${route.upstream}`;
  const userAgent = request.headers.get('user-agent') ?? '';

  if (route.kind === 'script' || route.kind === 'recorder-config') {
    // Scripts change only when the Umami instance is upgraded; the
    // recorder's sampling config only when someone edits the website in
    // Umami. Caching both in Next's data cache means a page view doesn't
    // cost a round trip to the Umami host.
    const revalidate = route.kind === 'script' ? 3600 : 300;
    const res = await upstreamFetch(upstreamUrl, { next: { revalidate } });
    if (!res?.ok) return jsonError(502, 'Analytics unavailable.');
    return new Response(await res.text(), {
      status: 200,
      headers: {
        'Content-Type':
          route.kind === 'script'
            ? 'application/javascript; charset=utf-8'
            : 'application/json; charset=utf-8',
        'Cache-Control': `public, max-age=${revalidate}, stale-while-revalidate=86400`,
      },
    });
  }

  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_BODY_BYTES) return jsonError(413, 'Payload too large.');
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return jsonError(413, 'Payload too large.');

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return jsonError(400, 'Invalid JSON.');
  }

  const allowedTypes = route.kind === 'collect' ? COLLECT_TYPES : RECORD_TYPES;
  if (
    !isRecord(body) ||
    typeof body.type !== 'string' ||
    !allowedTypes.has(body.type) ||
    !isRecord(body.payload) ||
    body.payload.website !== config.websiteId
  ) {
    return jsonError(400, 'Bad request.');
  }

  if (route.kind === 'collect') {
    // Always overwritten, never trusted from the browser: a client-sent
    // `ip` would let anyone place their visits anywhere in the world.
    const ip = clientIp(request.headers);
    if (ip) body.payload.ip = ip;
    else delete body.payload.ip;
    if (userAgent) body.payload.userAgent = userAgent;
  }

  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (userAgent) headers.set('User-Agent', userAgent);
  // The session token Umami hands back from collect; the recorder ties
  // every replay chunk to a session with it, and the tracker sends it to
  // keep a session's events together.
  const cache = request.headers.get('x-umami-cache');
  if (cache) headers.set('x-umami-cache', cache);

  const res = await upstreamFetch(upstreamUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res) return jsonError(502, 'Analytics unavailable.');

  return new Response(await res.text(), {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('content-type') ?? 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

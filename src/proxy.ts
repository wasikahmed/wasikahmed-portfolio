import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import type { NextAuthRequest } from 'next-auth';
import { authConfig } from '@/server/auth.config';
import { ensureCsrfCookie } from '@/server/csrf';
import { verifyAccessToken } from '@/server/access-token';

// Edge-safe instance — built from auth.config.ts (no providers, no argon2,
// no Mongoose). See auth.config.ts's comment: importing the full config
// here would pull the Credentials provider's argon2/Mongoose dependency
// graph into the Edge Middleware bundle and fail the build outright, since
// neither runs in Edge.
const { auth } = NextAuth(authConfig);

const PUBLIC_ADMIN_PATHS = [
  '/admin/login',
  '/admin/forgot-password',
  '/admin/accept-invite',
  // Bearer token issuance/refresh (PLAN.md W12) — pre-auth by design, like
  // the page paths above, even though it lives under /api/admin. Does NOT
  // match '/api/admin/auth/tokens' (list/revoke, plural) — that route is
  // cookie-session-gated and must stay behind this check; the prefix
  // match below requires a trailing '/', which 'tokens' never has.
  '/api/admin/auth/token',
];

/**
 * Nonce-based CSP, wired up per Next.js's documented middleware pattern
 * (https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy):
 * the nonce is set on both the outgoing *request* headers (so App Router's
 * renderer sees it and stamps its own RSC/hydration `<script>` tags with a
 * matching `nonce` attribute — see `getScriptNonceFromHeader` in Next's
 * source) and the *response* headers (so the browser actually enforces it).
 * `strict-dynamic` means a script loaded by an already-trusted script (e.g.
 * the Turnstile widget inserting its own `<script>` tag at runtime) is
 * trusted too, regardless of host — the explicit Cloudflare host entry
 * below is the fallback for browsers old enough not to support
 * `strict-dynamic`.
 *
 * `style-src 'unsafe-inline'` is a deliberate, known trade-off: Framer
 * Motion and Shiki both write the `style` attribute directly (motion for
 * every animated frame, Shiki per syntax token), and CSP has no nonce
 * mechanism for the `style` HTML attribute itself — only for `<style>`
 * blocks. Style-attribute injection can't execute script on its own, which
 * is the meaningfully dangerous case `script-src`'s nonce is closing.
 *
 * `'unsafe-eval'` is added to `script-src` outside production only —
 * Turbopack/webpack's HMR client relies on it in dev, and there is no
 * tunnel or real attacker surface in front of `pnpm dev`.
 *
 * Umami's origin (when `NEXT_PUBLIC_UMAMI_SCRIPT_URL` is set — see the root
 * layout's analytics script) is derived once at module load rather than
 * parsed per request: the nonce'd `<script>` tag
 * itself loads fine under `strict-dynamic` regardless of host, but the
 * tracking beacon it fires is a `fetch`/`XHR` to that same origin by
 * default, which `connect-src` has to explicitly allow.
 */
const umamiOrigin = (() => {
  try {
    return process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL
      ? new URL(process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL).origin
      : null;
  } catch {
    // Malformed env value — fail closed (no extra CSP origin) rather than
    // crash every request's middleware.
    return null;
  }
})();

function buildCsp(nonce: string): string {
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    'https://challenges.cloudflare.com',
    ...(process.env.NODE_ENV === 'production' ? [] : ["'unsafe-eval'"]),
  ].join(' ');

  const connectSrc = [
    "'self'",
    'https://challenges.cloudflare.com',
    ...(umamiOrigin ? [umamiOrigin] : []),
  ].join(' ');

  return [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data:`,
    `font-src 'self'`,
    `connect-src ${connectSrc}`,
    `frame-src https://challenges.cloudflare.com`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
  ].join('; ');
}

/** Applied to every response this middleware runs on — page or API. */
function applySecurityHeaders(response: NextResponse, nonce: string): void {
  response.headers.set('Content-Security-Policy', buildCsp(nonce));
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Belt-and-braces alongside frame-ancestors above — older browsers that
  // predate CSP2's frame-ancestors still respect this header.
  response.headers.set('X-Frame-Options', 'DENY');
}

/** Web Crypto, not `node:crypto` — this runs in the Edge runtime, same reasoning as csrf.ts. */
function randomNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export default auth(async (request: NextAuthRequest) => {
  const { pathname } = request.nextUrl;

  const nonce = randomNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('Content-Security-Policy', buildCsp(nonce));

  const isAdminArea = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  const isApi = pathname.startsWith('/api/admin');

  // Everything outside /admin and /api/admin (the public site, /api/auth/*,
  // /api/contact, the generated icon/OG routes) only needs the security
  // headers — none of the session/CSRF gating below applies to it.
  if (!isAdminArea) {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    applySecurityHeaders(response, nonce);
    return response;
  }

  const isPublicAdminPage = PUBLIC_ADMIN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (isPublicAdminPage) {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    applySecurityHeaders(response, nonce);
    return response;
  }

  // Bearer token (PLAN.md W12) — checked before the cookie-session gate,
  // API routes only (a page request has nowhere to put an Authorization
  // header). This is a cheap, stateless signature/expiry check so a
  // garbage or expired token 401s here rather than reaching the route; it
  // does NOT confirm the user still exists or isn't suspended — jwtVerify
  // can't do a DB lookup and Mongoose can't run in the Edge runtime this
  // file executes in anyway. That check, plus re-deriving current scopes
  // from the live role, happens once in resolve-auth.ts's resolveAuth(),
  // which every route already calls before it does anything permission-
  // gated. Skipping the cookie-session check for a request that clears
  // this is correct, not just convenient: `request.auth?.user` is always
  // empty for a Bearer-only client, since it never had a session cookie
  // to begin with.
  const authHeader = request.headers.get('authorization');
  const bearerToken = isApi && authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (bearerToken) {
    const payload = await verifyAccessToken(bearerToken);
    if (!payload) {
      const response = NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
      applySecurityHeaders(response, nonce);
      return response;
    }
    // No CSRF cookie to set or verify: a Bearer request carries no ambient
    // cookie, so it can't be forged cross-site (resolve-auth.ts's
    // `authorized()` comment makes the same point for the route side).
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    applySecurityHeaders(response, nonce);
    return response;
  }

  // Session — the only gate now that Cloudflare Access is gone (AGENTS.md
  // §7). `auth()` wrapping this handler populates `request.auth` from the
  // JWT session cookie; no DB call needed here.
  if (!request.auth?.user) {
    let response: NextResponse;
    if (isApi) {
      response = NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    } else {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      response = NextResponse.redirect(loginUrl);
    }
    applySecurityHeaders(response, nonce);
    return response;
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  // Only page requests need the cookie *set*; mutation routes only need
  // to *verify* it (see verifyCsrf in each route handler).
  if (!isApi) ensureCsrfCookie(request, response);
  applySecurityHeaders(response, nonce);
  return response;
});

export const config = {
  // Broad on purpose — the security headers above should land on every
  // response. `_next/static`/`_next/image`/`favicon.ico` are excluded
  // because they're immutable build assets and Next's own image
  // optimizer, neither of which render anything a CSP applies to.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

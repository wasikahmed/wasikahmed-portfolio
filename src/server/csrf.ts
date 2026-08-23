import { NextResponse, type NextRequest } from 'next/server';

/**
 * CSRF protection for admin mutations — PLAN.md §3 "CSRF tokens on all
 * admin mutations".
 *
 * Double-submit cookie: a random token is set as a *readable* (non-
 * httpOnly) cookie, and every mutating request must echo it back in an
 * `x-csrf-token` header. A cross-origin page can trigger the request (that
 * is what CSRF is) but cannot read the cookie to learn the token — the
 * browser's same-origin policy blocks that — so it cannot produce a
 * matching header. The session cookie alone (httpOnly, SameSite=Lax)
 * already blocks most forgery, but SameSite=Lax still allows top-level
 * cross-site *navigations* through, which is the gap this closes.
 *
 * The cookie is set from `middleware.ts`, not a Server Component — Next.js
 * only allows cookie mutation from Server Actions, Route Handlers, and
 * middleware, not from a plain component render.
 *
 * Token generation uses the Web Crypto API rather than `node:crypto` —
 * this module is imported by middleware, which runs in the Edge runtime
 * and doesn't have Node's crypto module; `crypto.getRandomValues` is a
 * standard global in both Edge and Node.js.
 */

const COOKIE_NAME = 'csrf-token';
const HEADER_NAME = 'x-csrf-token';

function randomToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Called from middleware on every `/admin/*` request; sets the cookie once per browser. */
export function ensureCsrfCookie(request: NextRequest, response: NextResponse): void {
  if (request.cookies.get(COOKIE_NAME)?.value) return;

  const token = randomToken();
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

/** Call at the top of every admin mutation route handler (POST/PATCH/DELETE). */
export function verifyCsrf(request: NextRequest): NextResponse | null {
  const cookieToken = request.cookies.get(COOKIE_NAME)?.value;
  const headerToken = request.headers.get(HEADER_NAME);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return NextResponse.json({ error: 'CSRF token missing or invalid.' }, { status: 403 });
  }
  return null;
}

export const CSRF_HEADER_NAME = HEADER_NAME;
export const CSRF_COOKIE_NAME = COOKIE_NAME;

import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import type { NextAuthRequest } from 'next-auth';
import { authConfig } from '@/server/auth.config';
import { verifyCloudflareAccess } from '@/server/cloudflare-access';
import { ensureCsrfCookie } from '@/server/csrf';

// Edge-safe instance — built from auth.config.ts (no providers, no argon2,
// no Mongoose), not the full config in auth.ts. See auth.config.ts's
// comment: importing the full config here would pull the Credentials
// provider's argon2/Mongoose dependency graph into the Edge Middleware
// bundle and fail the build outright, since neither runs in Edge.
const { auth } = NextAuth(authConfig);

const PUBLIC_ADMIN_PATHS = ['/admin/login', '/admin/forgot-password'];

export default auth(async (request: NextAuthRequest) => {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith('/api/admin');
  const isPublicAdminPage = PUBLIC_ADMIN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (isPublicAdminPage) return NextResponse.next();

  // Layer 1 — edge trust. No-ops until CF_ACCESS_* is configured (Phase 7).
  const accessOk = await verifyCloudflareAccess(request);
  if (!accessOk) {
    return isApi
      ? NextResponse.json({ error: 'Access denied.' }, { status: 403 })
      : NextResponse.redirect(new URL('/', request.url));
  }

  // Layer 2 — app session. `auth()` wrapping this handler populates
  // `request.auth` from the JWT session cookie; no DB call needed here.
  if (!request.auth?.user) {
    if (isApi) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  // Only page requests need the cookie *set*; mutation routes only need
  // to *verify* it (see verifyCsrf in each route handler).
  if (!isApi) ensureCsrfCookie(request, response);
  return response;
});

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};

import { createRemoteJWKSet, jwtVerify } from 'jose';

/**
 * Cloudflare Access verification — PLAN.md §3 "Auth — defense in depth",
 * layer 1. The production tunnel fronts /admin with an Access policy;
 * Cloudflare attaches a signed `Cf-Access-Jwt-Assertion` header to every
 * request that reaches the origin. Verifying it here means the app trusts
 * the edge cryptographically rather than by the assumption that nothing
 * else can reach it. CF_ACCESS_TEAM_DOMAIN/CF_ACCESS_AUD have been real,
 * populated env vars in production since 2026-08-27 (PLAN.md "Cloudflare
 * Access") — this is not a "not deployed yet" no-op there.
 *
 * A no-op only in local dev / CI, where there is no tunnel in front of
 * `pnpm dev` or the Docker dev stack to attach the header, so requiring it
 * there would lock out local development entirely. In production, an
 * unset var is not "not deployed yet" — it means something broke a
 * previously-active security layer (a botched `.env` rewrite, a GitHub
 * variable deleted by mistake), so this fails *closed* instead of quietly
 * reopening the gate. See PLAN.md's "Cloudflare Access" section, "What is
 * NOT yet confirmed" — this was flagged as a decision left deliberately
 * open; resolved here in favor of fail-closed.
 */

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  const teamDomain = process.env.CF_ACCESS_TEAM_DOMAIN;
  if (!teamDomain) return null;
  jwks ??= createRemoteJWKSet(new URL(`https://${teamDomain}/cdn-cgi/access/certs`));
  return jwks;
}

export function cloudflareAccessConfigured(): boolean {
  return Boolean(process.env.CF_ACCESS_TEAM_DOMAIN && process.env.CF_ACCESS_AUD);
}

export async function verifyCloudflareAccess(request: Request): Promise<boolean> {
  if (!cloudflareAccessConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      // Vars are expected to always be set in production — see the module
      // comment. Losing them isn't "not deployed yet," it's a regression;
      // fail closed and log loudly rather than silently falling back open.
      console.error(
        '[cloudflare-access] CF_ACCESS_TEAM_DOMAIN/CF_ACCESS_AUD are unset in production. ' +
          'Failing closed on /admin — this should never happen once deployed; check .env.',
      );
      return false;
    }
    return true; // Local dev / CI: no tunnel in front, nothing to verify against.
  }

  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) return false;

  const keySet = getJwks();
  if (!keySet) return false;

  try {
    await jwtVerify(token, keySet, { audience: process.env.CF_ACCESS_AUD });
    return true;
  } catch {
    return false;
  }
}

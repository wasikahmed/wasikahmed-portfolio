import { createRemoteJWKSet, jwtVerify } from 'jose';

/**
 * Cloudflare Access verification — PLAN.md §3 "Auth — defense in depth",
 * layer 1. Once the production tunnel fronts /admin with an Access policy
 * (Phase 7), Cloudflare attaches a signed `Cf-Access-Jwt-Assertion` header
 * to every request that reaches the origin. Verifying it here means the
 * app trusts the edge cryptographically rather than by the assumption
 * that nothing else can reach it.
 *
 * A no-op locally and until Phase 7 sets CF_ACCESS_TEAM_DOMAIN /
 * CF_ACCESS_AUD — there is no tunnel in front of `pnpm dev` or the
 * Docker dev stack to attach the header, so requiring it here would
 * lock out local development entirely.
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
  if (!cloudflareAccessConfigured()) return true; // Not deployed behind Access yet.

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

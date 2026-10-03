import 'server-only';

/**
 * The widget's public site key, read at request time and handed to the
 * client as a prop.
 *
 * It used to be `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, read in the widget
 * itself — and Next inlines `NEXT_PUBLIC_*` into the client bundle at
 * build time. The Docker build never has it (deploy.yml only writes it into
 * the runtime .env), so production shipped a bundle where the key was
 * undefined: the widget rendered nothing, every submission arrived with no
 * token, and the secret key the server *did* have rejected all of them.
 * Same fix as UMAMI_URL: server-only, read per request, so changing it is
 * a variable edit plus a redeploy, never a rebuild.
 */
export function turnstileSiteKey(): string | undefined {
  return process.env.TURNSTILE_SITE_KEY || undefined;
}

/**
 * Verifies a Cloudflare Turnstile token server-side. No-ops (returns true)
 * when TURNSTILE_SECRET_KEY isn't set — true in local dev, never true in
 * production. Same pattern as src/server/email.ts.
 */
export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  const body = new URLSearchParams({ secret, response: token, remoteip: ip });
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) return false;
  const data = (await res.json()) as { success: boolean };
  return data.success;
}

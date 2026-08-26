import 'server-only';

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

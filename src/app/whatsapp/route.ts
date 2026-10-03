import { getSettings } from '@/server/queries';
import { whatsappDigits } from '@/server/schemas';

/**
 * /whatsapp → wa.me/<number>, with a greeting prefilled.
 *
 * A redirect rather than a wa.me link in the page, so the number never
 * appears in the HTML: scrapers harvesting phone numbers for WhatsApp spam
 * read markup, they don't follow every same-origin link. Anyone who clicks
 * still gets straight into a chat, and the click is counted the same way
 * /resume's are (analytics-client.tsx).
 *
 * Every Location here is a relative path or wa.me — never built from
 * `request.url`, which inside the container carries the `HOSTNAME=0.0.0.0`
 * bind address (AGENTS.md §7).
 */

// Reads the database on every request, and the number can change in the
// admin at any time — never let `next build` bake one answer in (§9).
export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = await getSettings();
  const digits = whatsappDigits(settings.whatsapp ?? '');

  // Unset (or cleared) in the admin: send a stale link somewhere useful.
  if (!digits) {
    return new Response(null, { status: 307, headers: { Location: '/contact' } });
  }

  const firstName = settings.name.split(/\s+/)[0];
  const text = `Hi ${firstName}, I found you through your portfolio.`;

  return new Response(null, {
    status: 307,
    headers: {
      Location: `https://wa.me/${digits}?text=${encodeURIComponent(text)}`,
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}

import { ImageResponse } from 'next/og';
import { BRAND_COLORS } from '@/lib/brand';
import { loadDisplayFont } from '@/lib/og-font';
import { avatarBadge, loadAvatar } from '@/server/og-avatar';
import { getSettings } from '@/server/queries';

/*
 * Default social card. PLAN.md lists "no OG images" as an open SEO gap; this
 * closes the site-wide default. Per-page cards (a project's own card, a post's
 * own card) still need their own `opengraph-image` routes.
 *
 * Dynamic because it reads the settings singleton, same as every other page in
 * `(site)`. `getSettings()` falls back to the seed shape when Mongo is
 * unreachable, which is what makes this safe inside `next build`.
 */

export const dynamic = 'force-dynamic';
// Describes the card itself rather than restating its text: the alt has to
// be a build-time constant, and anything copied from the CMS here would go
// stale the first time the tagline changed.
export const alt = 'Social card with name, role and tagline.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  const [settings, font, avatar] = await Promise.all([
    getSettings(),
    loadDisplayFont(),
    loadAvatar(),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 64,
        background: BRAND_COLORS.bg,
        padding: '72px 80px',
        fontFamily: font ? 'Space Grotesk' : 'sans-serif',
      }}
    >
      {/* Text left, a large portrait right. Previews show this card at
          roughly 40% scale; a corner avatar shrank to ~40px there, which is
          too small to read as a face. If the file is missing the text column
          simply takes the full width. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, flex: 1 }}>
        <div style={{ display: 'flex', fontSize: 64, letterSpacing: '-0.03em' }}>
          <span style={{ color: BRAND_COLORS.fg }}>{settings.tagline}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 32, color: BRAND_COLORS.accent }}>{settings.name}</span>
          <div style={{ display: 'flex', gap: 14, fontSize: 24, color: BRAND_COLORS.fgMuted }}>
            <span>{settings.role}</span>
            <span>·</span>
            <span>{settings.discipline}</span>
          </div>
        </div>
      </div>

      {avatarBadge(avatar, 300)}
    </div>,
    {
      ...size,
      fonts: font
        ? [{ name: 'Space Grotesk', data: font, style: 'normal', weight: 600 as const }]
        : undefined,
    },
  );
}

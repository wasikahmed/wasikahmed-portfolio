import { ImageResponse } from 'next/og';
import { BRAND_COLORS, markDataUri } from '@/lib/brand';
import { loadDisplayFont } from '@/lib/og-font';
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
export const alt = 'Wasik Ahmed — Software engineer building AI and automation systems.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  const [settings, font] = await Promise.all([getSettings(), loadDisplayFont()]);

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: BRAND_COLORS.bg,
        padding: '72px 80px',
        fontFamily: font ? 'Space Grotesk' : 'sans-serif',
      }}
    >
      <img src={markDataUri({ size: 88 })} width={88} height={88} alt="" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', fontSize: 68, letterSpacing: '-0.03em' }}>
          <span style={{ color: BRAND_COLORS.fg }}>{settings.tagline}</span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 28,
            color: BRAND_COLORS.fgMuted,
          }}
        >
          <span style={{ color: BRAND_COLORS.accent }}>{settings.name}</span>
          <span style={{ color: BRAND_COLORS.fgMuted }}>·</span>
          <span>{settings.role}</span>
          <span style={{ color: BRAND_COLORS.fgMuted }}>·</span>
          <span>{settings.discipline}</span>
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: font
        ? [{ name: 'Space Grotesk', data: font, style: 'normal', weight: 600 as const }]
        : undefined,
    },
  );
}

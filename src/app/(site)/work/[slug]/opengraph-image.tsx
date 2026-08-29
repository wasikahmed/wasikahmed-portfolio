import { ImageResponse } from 'next/og';
import { BRAND_COLORS, markDataUri } from '@/lib/brand';
import { loadDisplayFont } from '@/lib/og-font';
import { getProject } from '@/server/queries';

/*
 * Per-case-study OG card (PLAN.md W3) — the root `opengraph-image.tsx`
 * only ever produced the one generic site card, so every project shared
 * a social preview with everything else. Honors a CMS-set `seo.ogImage`
 * when present (the schema has always had the field — publish-fields.tsx
 * just never grew a UI to set it — Satori can composite a remote URL as an
 * `<img>` the same way it does the brand mark's data URI); otherwise
 * generates one from the project's own headline metric, same technique as
 * the site default.
 */

export const alt = 'Case study card';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function ProjectOpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [project, font] = await Promise.all([getProject(slug), loadDisplayFont()]);
  const fontFamily = font ? 'Space Grotesk' : 'sans-serif';
  const fonts = font
    ? [{ name: 'Space Grotesk', data: font, style: 'normal' as const, weight: 600 as const }]
    : undefined;

  if (!project) {
    // No matching slug — render the same shell with a neutral fallback
    // rather than throwing, since a dead OG image is worse than a plain one.
    return new ImageResponse(
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: BRAND_COLORS.bg,
          fontFamily,
        }}
      >
        <img src={markDataUri({ size: 96 })} width={96} height={96} alt="" />
      </div>,
      { ...size, fonts },
    );
  }

  if (project.seo?.ogImage) {
    return new ImageResponse(
      <img
        src={project.seo.ogImage}
        width={size.width}
        height={size.height}
        alt=""
        style={{ objectFit: 'cover' }}
      />,
      size,
    );
  }

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
        fontFamily,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <img src={markDataUri({ size: 48 })} width={48} height={48} alt="" />
        <span style={{ fontSize: 24, color: BRAND_COLORS.fgMuted }}>Case study</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', fontSize: 60, letterSpacing: '-0.03em' }}>
          <span style={{ color: BRAND_COLORS.fg }}>{project.title}</span>
        </div>
        <div style={{ display: 'flex', fontSize: 28, color: BRAND_COLORS.fgMuted }}>
          {project.tagline}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 12,
            fontSize: 44,
            color: BRAND_COLORS.accent,
          }}
        >
          <span>{project.headline.value}</span>
          <span style={{ fontSize: 22, color: BRAND_COLORS.fgMuted }}>
            {project.headline.label}
          </span>
        </div>
      </div>
    </div>,
    { ...size, fonts },
  );
}

import { ImageResponse } from 'next/og';
import { BRAND_COLORS, markDataUri } from '@/lib/brand';
import { loadDisplayFont } from '@/lib/og-font';
import { getPost } from '@/server/queries';

/*
 * Per-post OG card — same reasoning as work/[slug]'s, see that file's
 * comment (PLAN.md W3).
 */

export const alt = 'Article card';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function PostOpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [post, font] = await Promise.all([getPost(slug), loadDisplayFont()]);
  const fontFamily = font ? 'Space Grotesk' : 'sans-serif';
  const fonts = font
    ? [{ name: 'Space Grotesk', data: font, style: 'normal' as const, weight: 600 as const }]
    : undefined;

  if (!post) {
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

  if (post.seo?.ogImage) {
    return new ImageResponse(
      <img
        src={post.seo.ogImage}
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
        <span style={{ fontSize: 24, color: BRAND_COLORS.fgMuted }}>
          {post.kind === 'til' ? 'TIL' : 'Writing'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', fontSize: 56, letterSpacing: '-0.03em' }}>
          <span style={{ color: BRAND_COLORS.fg }}>{post.title}</span>
        </div>
        <div style={{ display: 'flex', fontSize: 26, color: BRAND_COLORS.fgMuted }}>
          {post.excerpt}
        </div>
      </div>
    </div>,
    { ...size, fonts },
  );
}

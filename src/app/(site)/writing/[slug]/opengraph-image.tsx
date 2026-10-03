import { ImageResponse } from 'next/og';
import { BRAND_COLORS } from '@/lib/brand';
import { loadDisplayFont } from '@/lib/og-font';
import { avatarBadge, loadAvatar, ogByline } from '@/server/og-avatar';
import { getPost, getSettings } from '@/server/queries';

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
  const [post, settings, font, avatar] = await Promise.all([
    getPost(slug),
    getSettings(),
    loadDisplayFont(),
    loadAvatar(),
  ]);
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
        {avatarBadge(avatar, 120)}
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
      {ogByline(avatar, settings.name, post.kind === 'til' ? 'TIL' : 'Writing')}

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

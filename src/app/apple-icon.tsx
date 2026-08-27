import { ImageResponse } from 'next/og';
import { BRAND_COLORS, MARK_SMALL, markDataUri } from '@/lib/brand';

/*
 * Apple touch icon — 180×180, generated rather than committed as a PNG.
 *
 * iOS ignores `icon.svg` and squares off whatever it gets, so this needs its
 * own route: a solid ground (no transparency, or iOS composites it on black)
 * with the mark inset to roughly 60% so it survives the home-screen mask.
 */

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: BRAND_COLORS.bg,
      }}
    >
      <img src={markDataUri({ size: 112, weights: MARK_SMALL })} width={112} height={112} alt="" />
    </div>,
    size,
  );
}

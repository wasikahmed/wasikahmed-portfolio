import { ImageResponse } from 'next/og';
import { tileDataUri } from '@/lib/brand';

/*
 * Apple touch icon — 180×180, generated rather than committed as a PNG.
 *
 * iOS ignores `icon.svg` and squares off whatever it gets, so this needs its
 * own route. It renders the tile variant full-bleed with `radius: 0`: iOS
 * applies its own corner mask, and a tile carrying its own 7.5-unit radius
 * inside that mask leaves a visible ring of dead space at the corners.
 *
 * Full-bleed also removes the old need for a separate background layer — the
 * tile *is* the ground, so there is no transparency for iOS to composite onto
 * black.
 */

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    <img
      src={tileDataUri({ size: 180, radius: 0 })}
      width={180}
      height={180}
      alt=""
      style={{ width: '100%', height: '100%' }}
    />,
    size,
  );
}

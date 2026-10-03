import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { BRAND_COLORS } from '@/lib/brand';

/*
 * The portrait for the `next/og` cards, where the retired logo mark used to
 * sit (see `src/lib/brand.ts`).
 *
 * Read from `public/` rather than fetched over HTTP: an OG route rendering
 * itself would need to know its own public origin, and inside Docker that is
 * exactly the `HOSTNAME=0.0.0.0` confusion AGENTS.md §7 records. `public/` is
 * copied next to the standalone server (Dockerfile), and `server.js` chdirs
 * there, so `process.cwd()` resolves it in production as it does in dev.
 *
 * The file is pre-cropped and pre-masked to a circle with transparent corners,
 * so Satori only has to place it. Memoised for the life of the process; a
 * missing file resolves to `null` and the cards render without it rather than
 * failing — a card with no face beats no card.
 */
let avatar: string | null | undefined;

export async function loadAvatar() {
  if (avatar !== undefined) return avatar;

  try {
    const bytes = await readFile(path.join(process.cwd(), 'public', 'brand', 'avatar.png'));
    avatar = `data:image/png;base64,${bytes.toString('base64')}`;
  } catch {
    avatar = null;
  }

  return avatar;
}

/**
 * The avatar inside a thin accent ring — the ring is what ties a photo with a
 * sky behind it to a dark, teal-accented card. Satori renders plain elements
 * only, hence a function returning JSX rather than a component with hooks.
 */
export function avatarBadge(src: string | null, size: number) {
  if (!src) return null;
  const ring = Math.max(2, Math.round(size / 60));

  return (
    <div
      style={{
        display: 'flex',
        padding: ring * 2,
        borderRadius: 9999,
        border: `${ring}px solid ${BRAND_COLORS.accent}`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- rendered by Satori into a PNG, never into a page; next/image does not exist there. */}
      <img src={src} width={size} height={size} alt="" style={{ borderRadius: 9999 }} />
    </div>
  );
}

/**
 * The header row of the per-page cards: avatar, then name over the card's
 * kind. The name is here because a preview is shown at roughly 40% scale —
 * at that size the face alone does not say whose case study this is.
 */
export function ogByline(src: string | null, name: string, label: string) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      {avatarBadge(src, 104)}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 34, color: BRAND_COLORS.fg }}>{name}</span>
        <span style={{ fontSize: 26, color: BRAND_COLORS.fgMuted }}>{label}</span>
      </div>
    </div>
  );
}

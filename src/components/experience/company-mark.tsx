import { cn } from '@/lib/cn';

/**
 * A company's logo in a small tile. Callers render it only when the role
 * has a logo: a role without one shows no tile at all.
 *
 * That replaced an initials placeholder ("AS", "FT") shown on logo-less
 * rows once any row had a logo, to keep the titles aligned. In practice
 * it read as a broken image, and it said nothing the company name beside
 * it didn't, so a row with no logo is now simply a row with no tile.
 *
 * The logo is shown as-is, in its own colours, filling the tile edge to
 * edge. That makes the file responsible for its own padding and ground: a
 * transparent mark needs margin baked in, and a logo drawn for white
 * (thin lines that vanish on a dark tile) should keep its white square.
 *
 * It started as a single-colour CSS mask, so every logo matched the page.
 * It didn't survive contact with real logos: a seal or a two-colour mark
 * flattened to one grey stopped looking like the company at all.
 *
 * Always decorative: the company name is the text right beside it.
 */
export function CompanyMark({ logo, className }: { logo: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'border-border-subtle bg-surface-2 grid size-10 shrink-0 place-items-center overflow-hidden rounded-md border',
        className,
      )}
    >
      {/* A plain <img>, not next/image: the URL is whatever was pasted in
          the admin, and next/image throws at render for any host missing
          from images.remotePatterns. At 40px there is nothing to optimise. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo} alt="" width={40} height={40} className="size-full object-contain" />
    </span>
  );
}

/** "https://www.example.com/" → "example.com", for link text. */
export function displayHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

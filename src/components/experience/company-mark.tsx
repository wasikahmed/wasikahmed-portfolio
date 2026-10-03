import { cn } from '@/lib/cn';

/**
 * A company's logo in a small tile, or its initials when there isn't one.
 *
 * The logo is shown as-is, in its own colours, filling the tile edge to
 * edge. That makes the file responsible for its own padding and ground: a
 * transparent mark needs margin baked in, and a logo drawn for white
 * (thin lines that vanish on a dark tile) should keep its white square.
 * Logos come in every shape there is; letting each file decide is what
 * lets every one of them look the way its owner designed it.
 *
 * It started as a single-colour CSS mask, so every logo matched the page.
 * It didn't survive contact with real logos: a seal or a two-colour mark
 * flattened to one grey stopped looking like the company at all.
 *
 * Always decorative: the company name is the text right beside it.
 */
export function CompanyMark({
  company,
  logo,
  className,
}: {
  company: string;
  logo?: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'border-border-subtle bg-surface-2 grid size-10 shrink-0 place-items-center overflow-hidden rounded-md border',
        className,
      )}
    >
      {logo ? (
        // A plain <img>, not next/image: the URL is whatever was pasted in
        // the admin, and next/image throws at render for any host missing
        // from images.remotePatterns. At 40px there is nothing to optimise.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" width={40} height={40} className="size-full object-contain" />
      ) : (
        <span className="text-2xs text-fg-subtle font-mono tracking-wide">
          {initialsOf(company)}
        </span>
      )}
    </span>
  );
}

/**
 * "Factoryze Technologies Limited" → "FT"; "American International
 * University-Bangladesh (AIUB)" → "AIUB", since an acronym the company
 * already uses for itself beats one made up here.
 */
function initialsOf(company: string): string {
  const acronym = /\(([A-Z]{2,5})\)/.exec(company);
  if (acronym) return acronym[1];
  const words = company.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w));
  return words
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

/**
 * Tiles only appear once at least one role has a logo. Initials alone on
 * every row would add a column of boxes that says nothing the company name
 * beside it doesn't; once one real logo exists, the rest need a placeholder
 * so the rows still line up.
 */
export function hasAnyLogo(roles: { logo?: string }[]): boolean {
  return roles.some((role) => Boolean(role.logo));
}

/** "https://www.factoryze.tech/" → "factoryze.tech", for link text. */
export function displayHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

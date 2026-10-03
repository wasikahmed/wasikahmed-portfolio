import { cn } from '@/lib/cn';

/**
 * A company's logo in a small tile, or its initials when there isn't one.
 *
 * The logo is used as a CSS mask over a text-token fill rather than shown
 * as an <img>: uploaded logos arrive in every brand colour there is, and
 * drawn as-is they would turn the timeline into a row of mismatched
 * badges on a dark page (AGENTS.md §4 rule 2). As a mask, every logo is
 * the same `fg-muted` silhouette, whatever colour the file was.
 *
 * Cross-origin masks are fetched with CORS — Cloudinary sends
 * `Access-Control-Allow-Origin: *`, and root-relative files are
 * same-origin, so both work. Always decorative: the company name is the
 * text right beside it.
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
        'border-border-subtle bg-surface-2 grid size-10 shrink-0 place-items-center rounded-md border',
        className,
      )}
    >
      {logo ? (
        <span
          className="bg-fg-muted size-6 mask-contain mask-center mask-no-repeat"
          style={{ maskImage: `url(${JSON.stringify(logo)})` }}
        />
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

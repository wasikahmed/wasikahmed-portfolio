import { codeToHtml } from 'shiki';

/**
 * `<CodeCompare>` — the fourth MDX custom block. Before/after side by side
 * on desktop, stacked on mobile. Highlighted with Shiki server-side, so
 * this ships as static HTML — zero client JS for syntax colour.
 */
export async function CodeCompare({
  before,
  after,
  beforeLabel = 'Before',
  afterLabel = 'After',
  language = 'ts',
}: {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
  language?: string;
}) {
  const [beforeHtml, afterHtml] = await Promise.all([
    codeToHtml(before.trim(), { lang: language, theme: 'github-dark-dimmed' }),
    codeToHtml(after.trim(), { lang: language, theme: 'github-dark-dimmed' }),
  ]);

  return (
    <div className="not-prose my-8 grid gap-4 sm:grid-cols-2">
      {[
        { label: beforeLabel, html: beforeHtml, tone: 'text-fg-subtle' },
        { label: afterLabel, html: afterHtml, tone: 'text-accent' },
      ].map(({ label, html, tone }) => (
        <div key={label} className="border-border-subtle overflow-hidden rounded-md border">
          <p
            className={`border-border-subtle bg-surface-2 text-2xs border-b px-4 py-2 font-mono tracking-widest uppercase ${tone}`}
          >
            {label}
          </p>
          <div
            className="bg-surface-1 overflow-x-auto p-4 text-xs leading-relaxed [&_.shiki]:!bg-transparent [&_pre]:!bg-transparent"
            // Shiki's own HTML output — trusted, since it is only ever
            // produced by this component from admin-authored MDX, never
            // from raw user input rendered without going through Shiki.
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      ))}
    </div>
  );
}

// `en-GB` is a deliberate fixed choice, not a gap (PLAN.md W5, reviewed
// 2026-08-30): the site's editorial voice reads one way for every visitor —
// "15 Nov 2024" — rather than reformatting per browser locale, which would
// make screenshots, case-study dates, and the writing index inconsistent
// depending on who's looking. Locale-aware formatting is the wrong goal
// here; a fixed, deliberate format is the point.
export function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

const SMALL_NUMBER_WORDS = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
];

/**
 * Spells out 0–10, falls back to the digit above that — for copy like
 * "Four systems, still in production." that needs to read as prose, not a
 * stat. PLAN.md W5: that headline used to hardcode "Four", silently wrong
 * the moment a project count changed either direction.
 */
export function spelledOutCount(n: number): string {
  return SMALL_NUMBER_WORDS[n] ?? String(n);
}

/**
 * Fills the count tokens site-copy headings may use — `{count}` ("seven"),
 * `{Count}` ("Seven") and `{s}` (plural suffix). The headings that mention
 * how many projects are live used to compute this inline (see
 * spelledOutCount's note above); once that copy moved into the CMS, the
 * number still has to come from the data, not from whoever last edited
 * the sentence, or it drifts exactly the way the hardcoded "Four" did.
 */
export function fillCount(template: string, n: number): string {
  const word = spelledOutCount(n);
  return template
    .replaceAll('{Count}', word.charAt(0).toUpperCase() + word.slice(1))
    .replaceAll('{count}', word)
    .replaceAll('{s}', n === 1 ? '' : 's');
}

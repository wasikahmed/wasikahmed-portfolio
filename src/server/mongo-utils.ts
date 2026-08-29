/**
 * Converts a lean Mongo document's `_id` to a string `id`, drops `__v`, and
 * converts every top-level `Date` field to an ISO string.
 *
 * The last part closes a real gap (PLAN.md W5's "Zod/Mongoose drift"):
 * every timestamp field (`publishedAt`, `createdAt`, `updatedAt`) is a
 * Mongoose `Date` at rest, but every public interface in `src/lib/types.ts`
 * declares it `string`. That mismatch was invisible in practice — API
 * routes serialize through `NextResponse.json()`, which calls
 * `JSON.stringify` and auto-converts `Date` to an ISO string on the way
 * out — but Server Components on the public site call `queries.ts`
 * directly with no serialization boundary in between, so the value was
 * silently still a live `Date` object despite the type saying `string`.
 * Every current consumer tolerates a `Date` (the `Date` constructor,
 * `JSON.stringify`, and Next's own sitemap builder all accept `Date | string`
 * interchangeably), which is exactly why this went unnoticed — but it was
 * one `.slice()` or `.startsWith()` away from a type-checked call that
 * crashes at runtime. Converting here makes the runtime value actually
 * match the declared type everywhere, not just after incidental JSON
 * serialization. Only one level deep: no schema in this codebase nests a
 * `Date` inside a sub-document.
 */
export function normalizeDoc<T extends { _id?: unknown; __v?: unknown }>(
  doc: T,
): Omit<T, '_id' | '__v'> & { id: string } {
  const clone: Record<string, unknown> = { ...doc, id: String(doc._id) };
  delete clone._id;
  delete clone.__v;
  for (const key of Object.keys(clone)) {
    const value = clone[key];
    if (value instanceof Date) clone[key] = value.toISOString();
  }
  return clone as Omit<T, '_id' | '__v'> & { id: string };
}

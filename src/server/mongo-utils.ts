/** Converts a lean Mongo document's `_id` to a string `id`, drops `__v`. */
export function normalizeDoc<T extends { _id?: unknown; __v?: unknown }>(
  doc: T,
): Omit<T, '_id' | '__v'> & { id: string } {
  const clone: Record<string, unknown> = { ...doc, id: String(doc._id) };
  delete clone._id;
  delete clone.__v;
  return clone as Omit<T, '_id' | '__v'> & { id: string };
}

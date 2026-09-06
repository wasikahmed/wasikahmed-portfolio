import 'server-only';

import type { UserDocument } from './models/user';

/**
 * The one allowlist of fields ever sent to the client for a User document
 * — every admin/users route builds its response through this rather than
 * repeating the omission by hand, so `passwordHash`/`totpSecret` can never
 * leak by a future route forgetting to exclude them. Takes a plain object
 * (works for both a lean query result and a live Mongoose document) built
 * from any object with at least these fields plus `_id`.
 *
 * `status` defaults to `'active'` when the stored document doesn't have
 * one at all — every account seeded before PLAN.md W9 added the field
 * predates it, and `.lean()`/a live document both return `undefined`
 * there rather than applying the schema default (Mongoose only applies
 * `default` on document *creation*, never on read). `session.ts` already
 * treats a missing status as implicitly active (`undefined !== 'suspended'`
 * passes its check); this makes the client-visible value agree with that,
 * instead of rendering an empty status tag for every such legacy account.
 */
export function safeUserFields(
  user: Partial<UserDocument> & { _id: unknown },
): Record<string, unknown> {
  return {
    _id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status ?? 'active',
    lastLoginAt: user.lastLoginAt,
    invitedBy: user.invitedBy,
    createdAt: user.createdAt,
  };
}

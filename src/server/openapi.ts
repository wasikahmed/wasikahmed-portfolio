import 'server-only';

import { z } from 'zod';
import { createDocument, type ZodOpenApiPathsObject, type ZodOpenApiObject } from 'zod-openapi';
import {
  projectSchema,
  postSchema,
  testimonialSchema,
  roleSchema,
  techItemSchema,
  skillGroupSchema,
  settingsSchema,
  leadSchema,
  leadUpdateSchema,
  inviteSchema,
  userUpdateSchema,
  acceptInviteSchema,
  tokenRequestSchema,
  refreshTokenRequestSchema,
  passwordChangeSchema,
  totpConfirmSchema,
  totpDisableSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './schemas';
import { PERMISSIONS } from './permissions';

/**
 * Generates the OpenAPI 3.1 document served at GET /api/openapi.json and
 * rendered at /docs (PLAN.md W13) — built from the same Zod schemas every
 * route validates against, not hand-written Markdown, so the request-body
 * side of this document cannot drift from what the API actually accepts
 * (see AGENTS.md §6: schemas.ts is the write-side validation boundary).
 *
 * Response shapes are the one honest exception: this codebase has no Zod
 * schema for what a route *returns* (AGENTS.md §6 — that's `src/lib/
 * types.ts`'s job, as plain TypeScript interfaces, not runtime-validated).
 * The `*ResponseSchema`s below are hand-built to mirror those interfaces —
 * a third parallel copy of each shape, alongside the Mongoose model and the
 * write-side Zod schema. That's the same class of maintained-by-hand drift
 * risk schemas.ts's own module comment already accepts for Zod/Mongoose
 * (PLAN.md W5); accepted here for the same reason — the alternative is
 * documenting no response shape at all, which is worse.
 *
 * **Public, deliberately** (decided explicitly, not by default — PLAN.md
 * W13 flags this as a call worth making on purpose): both this route and
 * `/docs` are reachable with no session. Security here comes from
 * authentication on the actual endpoints, not from hiding their names and
 * shapes — and publishing the map is what makes the API legible to a
 * client that hasn't logged in yet. The trade-off is real: this document
 * lists every admin endpoint, its request shape, and the permission it
 * requires. It does not, and cannot, expose any actual data.
 */

const idField = z.string().meta({ description: 'MongoDB ObjectId, as a string.' });
const timestampField = z.string().datetime().meta({ description: 'ISO 8601 timestamp.' });
const scopesField = z.array(z.enum(PERMISSIONS));

/** Every `content:`/`lead:` collection response is its write schema plus these three. */
function withRecordFields<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return schema.extend({ id: idField, createdAt: timestampField, updatedAt: timestampField });
}

const projectResponseSchema = withRecordFields(projectSchema).meta({ id: 'Project' });
const postResponseSchema = withRecordFields(postSchema).meta({ id: 'Post' });
const testimonialResponseSchema = withRecordFields(testimonialSchema).meta({
  id: 'Testimonial',
});
const roleResponseSchema = withRecordFields(roleSchema).meta({ id: 'Experience' });
const techResponseSchema = withRecordFields(techItemSchema).meta({ id: 'Tech' });
const skillGroupResponseSchema = withRecordFields(skillGroupSchema).meta({ id: 'SkillGroup' });

const leadResponseSchema = leadSchema
  .omit({ turnstileToken: true })
  .extend({
    id: idField,
    notes: z.string().max(5000).optional(),
    source: z.string().optional(),
    ipHash: z.string().optional(),
    userAgent: z.string().optional(),
    createdAt: timestampField,
  })
  .meta({ id: 'Lead' });

const mediaResponseSchema = z
  .object({
    id: idField,
    key: z.string(),
    url: z.string(),
    alt: z.string(),
    width: z.number().optional(),
    height: z.number().optional(),
    size: z.number(),
    contentType: z.string(),
    createdAt: timestampField,
  })
  .meta({ id: 'Media' });

const settingsResponseSchema = settingsSchema
  .extend({ id: z.literal('settings') })
  .meta({ id: 'Settings' });

const adminUserResponseSchema = z
  .object({
    id: idField,
    email: z.string().email(),
    name: z.string().optional(),
    role: z.enum(['viewer', 'editor', 'admin', 'owner']),
    status: z.enum(['invited', 'active', 'suspended']),
    lastLoginAt: timestampField.optional(),
    invitedBy: z.string().optional(),
    createdAt: timestampField,
  })
  .meta({ id: 'AdminUser', description: 'Never includes passwordHash or totpSecret.' });

const auditLogEntrySchema = z
  .object({
    id: idField,
    userEmail: z.string().email(),
    action: z.enum(['create', 'update', 'delete']),
    entityType: z.string(),
    entityId: z.string(),
    summary: z.string(),
    createdAt: timestampField,
  })
  .meta({ id: 'AuditLogEntry' });

const apiTokenResponseSchema = z
  .object({
    id: idField,
    scopes: scopesField,
    label: z.string().optional(),
    expiresAt: timestampField,
    lastUsedAt: timestampField.optional(),
    createdAt: timestampField,
  })
  .meta({ id: 'ApiToken', description: 'Never includes the token hash.' });

const tokenPairResponseSchema = z
  .object({
    tokenType: z.literal('Bearer'),
    accessToken: z.string().meta({ description: '15-minute JWT, signed with AUTH_SECRET.' }),
    expiresIn: z.number().meta({ description: 'Access token lifetime, in seconds (900).' }),
    refreshToken: z
      .string()
      .meta({ description: 'Opaque, 30-day, single-use — rotates on every refresh.' }),
    scopes: scopesField,
  })
  .meta({ id: 'TokenPair' });

const errorSchema = z.object({ error: z.string() }).meta({ id: 'Error' });
const okSchema = z.object({ ok: z.literal(true) }).meta({ id: 'Ok' });

function jsonResponse(description: string, schema: z.ZodTypeAny) {
  return { description, content: { 'application/json': { schema } } };
}

const NOT_AUTHENTICATED = jsonResponse(
  '401 — no valid session cookie or Bearer token.',
  errorSchema,
);
const NOT_PERMITTED = jsonResponse(
  "403 — authenticated, but the caller's role/token scope lacks this permission.",
  errorSchema,
);
const VALIDATION_FAILED = jsonResponse('422 — request body failed schema validation.', errorSchema);
const NOT_FOUND = jsonResponse('404 — no record with that id.', errorSchema);

/** `security: []` on an operation overrides the document-level default to "no auth required". */
const PUBLIC: ZodOpenApiObject['security'] = [];

/**
 * The six `content:`/`lead:` collections behind admin-crud.ts's factory
 * share one shape: list/create/getOne/update/delete, reorder for the five
 * that support drag-to-reorder (leads don't). Permission strings match
 * admin-crud.ts's `READ_PERMISSION`/`WRITE_PERMISSION` maps exactly.
 */
function collectionPaths(opts: {
  path: string;
  tag: string;
  writeSchema: z.ZodTypeAny;
  responseSchema: z.ZodTypeAny;
  readPermission: string;
  writePermission: string;
  deletePermission?: string;
  reorderPermission?: string;
}): ZodOpenApiPathsObject {
  const { path, tag, writeSchema, responseSchema, readPermission, writePermission } = opts;
  const paths: ZodOpenApiPathsObject = {
    [path]: {
      get: {
        tags: [tag],
        summary: `List every ${tag.toLowerCase()}`,
        description: `**Permission:** \`${readPermission}\``,
        responses: {
          '200': jsonResponse('200 OK', z.object({ items: z.array(responseSchema) })),
          '401': NOT_AUTHENTICATED,
          '403': NOT_PERMITTED,
        },
      },
      post: {
        tags: [tag],
        summary: `Create a ${tag.toLowerCase()}`,
        description: `**Permission:** \`${writePermission}\`. Submitting \`status: 'scheduled'\` or \`'published'\` additionally requires \`content:publish\` — enforced at the schema layer (schemas.ts's \`withPublishGuard\`), not just here.`,
        requestBody: { content: { 'application/json': { schema: writeSchema } } },
        responses: {
          '201': jsonResponse('201 Created', z.object({ item: responseSchema })),
          '401': NOT_AUTHENTICATED,
          '403': NOT_PERMITTED,
          '422': VALIDATION_FAILED,
          '409': jsonResponse(
            '409 — a record with that identifying field already exists.',
            errorSchema,
          ),
        },
      },
    },
    [`${path}/{id}`]: {
      get: {
        tags: [tag],
        summary: `Get one ${tag.toLowerCase()}`,
        description: `**Permission:** \`${readPermission}\``,
        requestParams: { path: z.object({ id: idField }) },
        responses: {
          '200': jsonResponse('200 OK', z.object({ item: responseSchema })),
          '401': NOT_AUTHENTICATED,
          '403': NOT_PERMITTED,
          '404': NOT_FOUND,
        },
      },
      patch: {
        tags: [tag],
        summary: `Update a ${tag.toLowerCase()}`,
        description: `**Permission:** \`${writePermission}\`. Same publish guard as create.`,
        requestParams: { path: z.object({ id: idField }) },
        requestBody: { content: { 'application/json': { schema: writeSchema } } },
        responses: {
          '200': jsonResponse('200 OK', z.object({ item: responseSchema })),
          '401': NOT_AUTHENTICATED,
          '403': NOT_PERMITTED,
          '404': NOT_FOUND,
          '422': VALIDATION_FAILED,
        },
      },
      ...(opts.deletePermission
        ? {
            delete: {
              tags: [tag],
              summary: `Delete a ${tag.toLowerCase()}`,
              description: `**Permission:** \`${opts.deletePermission}\``,
              requestParams: { path: z.object({ id: idField }) },
              responses: {
                '204': { description: '204 — deleted.' },
                '401': NOT_AUTHENTICATED,
                '403': NOT_PERMITTED,
                '404': NOT_FOUND,
              },
            },
          }
        : {}),
    },
  };

  if (opts.reorderPermission) {
    paths[`${path}/reorder`] = {
      post: {
        tags: [tag],
        summary: `Reorder every ${tag.toLowerCase()}`,
        description: `**Permission:** \`${opts.reorderPermission}\`. Body is the full list of ids in their new order.`,
        requestBody: {
          content: { 'application/json': { schema: z.object({ ids: z.array(idField).min(1) }) } },
        },
        responses: {
          '200': jsonResponse('200 OK', okSchema),
          '401': NOT_AUTHENTICATED,
          '403': NOT_PERMITTED,
          '422': VALIDATION_FAILED,
        },
      },
    };
  }

  return paths;
}

const contentCollections: ZodOpenApiPathsObject = {
  ...collectionPaths({
    path: '/api/admin/projects',
    tag: 'Projects',
    writeSchema: projectSchema,
    responseSchema: projectResponseSchema,
    readPermission: 'content:read',
    writePermission: 'content:write',
    deletePermission: 'content:delete',
    reorderPermission: 'content:reorder',
  }),
  ...collectionPaths({
    path: '/api/admin/posts',
    tag: 'Posts',
    writeSchema: postSchema,
    responseSchema: postResponseSchema,
    readPermission: 'content:read',
    writePermission: 'content:write',
    deletePermission: 'content:delete',
    reorderPermission: 'content:reorder',
  }),
  ...collectionPaths({
    path: '/api/admin/testimonials',
    tag: 'Testimonials',
    writeSchema: testimonialSchema,
    responseSchema: testimonialResponseSchema,
    readPermission: 'content:read',
    writePermission: 'content:write',
    deletePermission: 'content:delete',
    reorderPermission: 'content:reorder',
  }),
  ...collectionPaths({
    path: '/api/admin/experience',
    tag: 'Experience',
    writeSchema: roleSchema,
    responseSchema: roleResponseSchema,
    readPermission: 'content:read',
    writePermission: 'content:write',
    deletePermission: 'content:delete',
    reorderPermission: 'content:reorder',
  }),
  ...collectionPaths({
    path: '/api/admin/tech',
    tag: 'Tech',
    writeSchema: techItemSchema,
    responseSchema: techResponseSchema,
    readPermission: 'content:read',
    writePermission: 'content:write',
    deletePermission: 'content:delete',
    reorderPermission: 'content:reorder',
  }),
  ...collectionPaths({
    path: '/api/admin/skill-groups',
    tag: 'Skill groups',
    writeSchema: skillGroupSchema,
    responseSchema: skillGroupResponseSchema,
    readPermission: 'content:read',
    writePermission: 'content:write',
    deletePermission: 'content:delete',
    reorderPermission: 'content:reorder',
  }),
};

const leadPaths: ZodOpenApiPathsObject = {
  '/api/admin/leads': {
    get: {
      tags: ['Leads'],
      summary: 'List every contact-form lead',
      description: '**Permission:** `lead:read`',
      responses: {
        '200': jsonResponse('200 OK', z.object({ items: z.array(leadResponseSchema) })),
        '401': NOT_AUTHENTICATED,
        '403': NOT_PERMITTED,
      },
    },
  },
  '/api/admin/leads/{id}': {
    get: {
      tags: ['Leads'],
      summary: 'Get one lead',
      description: '**Permission:** `lead:read`',
      requestParams: { path: z.object({ id: idField }) },
      responses: {
        '200': jsonResponse('200 OK', z.object({ item: leadResponseSchema })),
        '401': NOT_AUTHENTICATED,
        '403': NOT_PERMITTED,
        '404': NOT_FOUND,
      },
    },
    patch: {
      tags: ['Leads'],
      summary: 'Update a lead — triage status and internal notes',
      description:
        "**Permission:** `lead:write`. `status` here is a triage state (new/read/replied/archived), not a publish gate — it never requires `content:publish`, unlike the six content collections' own `status` field.",
      requestParams: { path: z.object({ id: idField }) },
      requestBody: { content: { 'application/json': { schema: leadUpdateSchema } } },
      responses: {
        '200': jsonResponse('200 OK', z.object({ item: leadResponseSchema })),
        '401': NOT_AUTHENTICATED,
        '403': NOT_PERMITTED,
        '404': NOT_FOUND,
        '422': VALIDATION_FAILED,
      },
    },
  },
};

const mediaPaths: ZodOpenApiPathsObject = {
  '/api/admin/media': {
    get: {
      tags: ['Media'],
      summary: 'List every media library item',
      description: '**Permission:** `media:read`',
      responses: {
        '200': jsonResponse('200 OK', z.object({ items: z.array(mediaResponseSchema) })),
        '401': NOT_AUTHENTICATED,
        '403': NOT_PERMITTED,
      },
    },
    post: {
      tags: ['Media'],
      summary: 'Upload an image',
      description:
        '**Permission:** `media:write`. JPEG/PNG/WebP/GIF only (never SVG — PLAN.md W2), max 8MB, verified against the actual file bytes server-side, not the claimed content-type or extension.',
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                file: { type: 'string', format: 'binary' },
                alt: { type: 'string', description: 'Required alt text, 1–300 characters.' },
              },
              required: ['file', 'alt'],
            },
          },
        },
      },
      responses: {
        '201': jsonResponse('201 Created', z.object({ item: mediaResponseSchema })),
        '401': NOT_AUTHENTICATED,
        '403': NOT_PERMITTED,
        '422': VALIDATION_FAILED,
      },
    },
  },
  '/api/admin/media/{id}': {
    delete: {
      tags: ['Media'],
      summary: 'Delete a media item',
      description:
        '**Permission:** `media:delete`. Removes both the database record and the file on disk.',
      requestParams: { path: z.object({ id: idField }) },
      responses: {
        '204': { description: '204 — deleted.' },
        '401': NOT_AUTHENTICATED,
        '403': NOT_PERMITTED,
        '404': NOT_FOUND,
      },
    },
  },
};

const settingsPaths: ZodOpenApiPathsObject = {
  '/api/admin/settings': {
    get: {
      tags: ['Settings'],
      summary: 'Get the site settings singleton',
      description: '**Permission:** `settings:read`',
      responses: {
        '200': jsonResponse('200 OK', z.object({ item: settingsResponseSchema.nullable() })),
        '401': NOT_AUTHENTICATED,
        '403': NOT_PERMITTED,
      },
    },
    patch: {
      tags: ['Settings'],
      summary: 'Update the site settings singleton',
      description:
        '**Permission:** `settings:write`. Upserts — there is exactly one settings document, keyed by a fixed id.',
      requestBody: { content: { 'application/json': { schema: settingsSchema } } },
      responses: {
        '200': jsonResponse('200 OK', z.object({ item: settingsResponseSchema })),
        '401': NOT_AUTHENTICATED,
        '403': NOT_PERMITTED,
        '422': VALIDATION_FAILED,
      },
    },
  },
};

const auditLogPaths: ZodOpenApiPathsObject = {
  '/api/admin/audit-log': {
    get: {
      tags: ['Audit log'],
      summary: 'List audit log entries, paginated',
      description: '**Permission:** `audit:read`. 50 per page.',
      requestParams: { query: z.object({ page: z.string().optional() }) },
      responses: {
        '200': jsonResponse(
          '200 OK',
          z.object({
            items: z.array(auditLogEntrySchema),
            page: z.number(),
            totalPages: z.number(),
          }),
        ),
        '401': NOT_AUTHENTICATED,
        '403': NOT_PERMITTED,
      },
    },
  },
};

const mdxPreviewPaths: ZodOpenApiPathsObject = {
  '/api/admin/mdx-preview': {
    post: {
      tags: ['Content'],
      summary: 'Render MDX source to HTML for the editor live preview',
      description:
        '**Permission:** `content:write`. No CSRF check even on the cookie path — this neither mutates anything nor writes an audit entry.',
      requestBody: {
        content: { 'application/json': { schema: z.object({ source: z.string() }) } },
      },
      responses: {
        '200': jsonResponse('200 OK', z.object({ html: z.string() })),
        '401': NOT_AUTHENTICATED,
        '403': NOT_PERMITTED,
        '422': VALIDATION_FAILED,
      },
    },
  },
};

const usersPaths: ZodOpenApiPathsObject = {
  '/api/admin/users': {
    get: {
      tags: ['Users'],
      summary: 'List every user',
      description: '**Permission:** `user:read`',
      responses: {
        '200': jsonResponse('200 OK', z.object({ items: z.array(adminUserResponseSchema) })),
        '401': NOT_AUTHENTICATED,
        '403': NOT_PERMITTED,
      },
    },
    post: {
      tags: ['Users'],
      summary: 'Invite a user',
      description:
        "**Permission:** `user:write`. Creates a `status: 'invited'` user immediately and emails a single-use, 7-day accept link. `owner` is never an invitable role.",
      requestBody: { content: { 'application/json': { schema: inviteSchema } } },
      responses: {
        '201': jsonResponse('201 Created', z.object({ item: adminUserResponseSchema })),
        '401': NOT_AUTHENTICATED,
        '403': NOT_PERMITTED,
        '422': VALIDATION_FAILED,
        '409': jsonResponse('409 — a user with that email already exists.', errorSchema),
      },
    },
  },
  '/api/admin/users/{id}': {
    patch: {
      tags: ['Users'],
      summary: "Change a user's role and/or status",
      description:
        '**Permission:** `user:write`. The owner can never be demoted, suspended, or changed here by anyone, including themselves; no one may change their own role or status through this route either.',
      requestParams: { path: z.object({ id: idField }) },
      requestBody: { content: { 'application/json': { schema: userUpdateSchema } } },
      responses: {
        '200': jsonResponse('200 OK', z.object({ item: adminUserResponseSchema })),
        '401': NOT_AUTHENTICATED,
        '403': NOT_PERMITTED,
        '404': NOT_FOUND,
        '422': VALIDATION_FAILED,
      },
    },
    delete: {
      tags: ['Users'],
      summary: 'Delete a user',
      description:
        '**Permission:** `user:delete`. Same owner/self guards as the role/status change above.',
      requestParams: { path: z.object({ id: idField }) },
      responses: {
        '204': { description: '204 — deleted.' },
        '401': NOT_AUTHENTICATED,
        '403': NOT_PERMITTED,
        '404': NOT_FOUND,
      },
    },
  },
  '/api/admin/users/{id}/transfer-ownership': {
    post: {
      tags: ['Users'],
      summary: 'Transfer ownership to another active user',
      description:
        "**Cookie session only — no Bearer token accepted.** Checked against `session.role === 'owner'` directly, not a `Permission` string (`owner` is a singleton, not a grantable permission), and deliberately requires an interactive session for the single most consequential action in the system. Promotes the target and demotes the current owner to `admin`, in one call.",
      security: [{ cookieAuth: [] }],
      requestParams: { path: z.object({ id: idField }) },
      responses: {
        '200': jsonResponse('200 OK', z.object({ item: adminUserResponseSchema })),
        '400': jsonResponse("400 — you're already the owner.", errorSchema),
        '401': NOT_AUTHENTICATED,
        '403': jsonResponse('403 — only the current owner may transfer ownership.', errorSchema),
        '404': NOT_FOUND,
        '422': jsonResponse('422 — the target is not an active user.', errorSchema),
      },
    },
  },
};

const selfServicePaths: ZodOpenApiPathsObject = {
  '/api/admin/password': {
    patch: {
      tags: ['Self-service'],
      summary: "Change the caller's own password",
      description: 'No `Permission` check beyond the session itself — acts only on `session.id`.',
      requestBody: { content: { 'application/json': { schema: passwordChangeSchema } } },
      responses: {
        '200': jsonResponse('200 OK', okSchema),
        '401': jsonResponse(
          '401 — not authenticated, or the current password is wrong.',
          errorSchema,
        ),
        '422': VALIDATION_FAILED,
      },
    },
  },
  '/api/admin/totp/enroll': {
    post: {
      tags: ['Self-service'],
      summary: 'Start TOTP enrollment',
      description:
        'No `Permission` check beyond the session itself. Returns a QR code and manual-entry key; the secret is not persisted until /confirm succeeds.',
      responses: {
        '200': jsonResponse(
          '200 OK',
          z.object({ qrDataUrl: z.string(), manualEntryKey: z.string() }),
        ),
        '401': NOT_AUTHENTICATED,
      },
    },
  },
  '/api/admin/totp/confirm': {
    post: {
      tags: ['Self-service'],
      summary: 'Confirm TOTP enrollment with a code from the authenticator app',
      description: 'No `Permission` check beyond the session itself.',
      requestBody: { content: { 'application/json': { schema: totpConfirmSchema } } },
      responses: {
        '200': jsonResponse('200 OK', okSchema),
        '400': jsonResponse('400 — enrollment expired, start over.', errorSchema),
        '401': NOT_AUTHENTICATED,
        '422': jsonResponse('422 — incorrect code.', errorSchema),
      },
    },
  },
  '/api/admin/totp/disable': {
    post: {
      tags: ['Self-service'],
      summary: "Disable the caller's own TOTP",
      description:
        'No `Permission` check beyond the session itself. Requires the current password.',
      requestBody: { content: { 'application/json': { schema: totpDisableSchema } } },
      responses: {
        '200': jsonResponse('200 OK', okSchema),
        '401': jsonResponse('401 — not authenticated, or the password is wrong.', errorSchema),
        '422': VALIDATION_FAILED,
      },
    },
  },
};

const bearerAuthPaths: ZodOpenApiPathsObject = {
  '/api/admin/auth/token': {
    post: {
      tags: ['Auth'],
      summary: 'Exchange credentials for a Bearer token pair',
      description:
        'Public, pre-auth. Same credential check and rate limiting as the cookie login (`verifyCredentials()`, shared by both entry points). `scopes`, when given, must be a subset of what the role currently grants — defaults to every permission the role has. `label` is a free-text name for the session, shown in `/admin/security`.',
      security: PUBLIC,
      requestBody: { content: { 'application/json': { schema: tokenRequestSchema } } },
      responses: {
        '200': jsonResponse('200 OK', tokenPairResponseSchema),
        '401': jsonResponse(
          '401 — wrong email/password, or TOTP required (`code: "TOTP_REQUIRED"`).',
          errorSchema,
        ),
        '422': jsonResponse('422 — a requested scope is not granted by the role.', errorSchema),
        '429': jsonResponse('429 — rate limited (same limits as the cookie login).', errorSchema),
      },
    },
  },
  '/api/admin/auth/token/refresh': {
    post: {
      tags: ['Auth'],
      summary: 'Rotate a refresh token for a new access token',
      description:
        'Public, pre-auth. The presented refresh token is spent; a new one (same family) is returned alongside a fresh access token. **Reuse detection:** presenting an already-rotated token revokes every token in its family, not just that one. Scopes are re-intersected with the current role on every rotation — a demotion or suspension takes effect on the very next refresh.',
      security: PUBLIC,
      requestBody: { content: { 'application/json': { schema: refreshTokenRequestSchema } } },
      responses: {
        '200': jsonResponse('200 OK', tokenPairResponseSchema),
        '401': jsonResponse(
          '401 — invalid, expired, or already-used (whole family revoked) refresh token.',
          errorSchema,
        ),
        '422': VALIDATION_FAILED,
      },
    },
  },
  '/api/admin/auth/tokens': {
    get: {
      tags: ['Auth'],
      summary: "List the caller's own active API sessions",
      description:
        '**Cookie session only — no Bearer token accepted.** Self-service, like password/TOTP above: acts only on `session.id`. One row per active token family.',
      security: [{ cookieAuth: [] }],
      responses: {
        '200': jsonResponse('200 OK', z.object({ items: z.array(apiTokenResponseSchema) })),
        '401': NOT_AUTHENTICATED,
      },
    },
    delete: {
      tags: ['Auth'],
      summary: 'Revoke every one of the caller’s API sessions',
      description: '**Cookie session only — no Bearer token accepted.** "Sign out everywhere."',
      security: [{ cookieAuth: [] }],
      responses: {
        '200': jsonResponse('200 OK', okSchema),
        '401': NOT_AUTHENTICATED,
      },
    },
  },
  '/api/admin/auth/tokens/{id}': {
    delete: {
      tags: ['Auth'],
      summary: "Revoke one of the caller's API sessions",
      description:
        '**Cookie session only — no Bearer token accepted.** Scoped to `userId: session.id` in the query itself — a 404, not a 403, for a valid id that belongs to someone else.',
      security: [{ cookieAuth: [] }],
      requestParams: { path: z.object({ id: idField }) },
      responses: {
        '204': { description: '204 — revoked.' },
        '401': NOT_AUTHENTICATED,
        '404': NOT_FOUND,
      },
    },
  },
};

const publicAuthPaths: ZodOpenApiPathsObject = {
  '/api/auth/forgot-password': {
    post: {
      tags: ['Public'],
      summary: 'Request a password-reset code by email',
      description:
        'Public, pre-auth. Always responds the same way whether or not the account exists, to avoid account enumeration. Rate limited by IP and by the targeted email independently.',
      security: PUBLIC,
      requestBody: { content: { 'application/json': { schema: forgotPasswordSchema } } },
      responses: {
        '200': jsonResponse('200 OK — always, regardless of whether the email exists.', okSchema),
        '422': VALIDATION_FAILED,
        '429': jsonResponse('429 — rate limited.', errorSchema),
      },
    },
  },
  '/api/auth/reset-password': {
    post: {
      tags: ['Public'],
      summary: 'Complete a password reset with the emailed code',
      description: 'Public, pre-auth. The 6-digit code is single-use and short-lived.',
      security: PUBLIC,
      requestBody: { content: { 'application/json': { schema: resetPasswordSchema } } },
      responses: {
        '200': jsonResponse('200 OK', okSchema),
        '401': jsonResponse('401 — invalid or expired code.', errorSchema),
        '422': VALIDATION_FAILED,
        '429': jsonResponse('429 — rate limited.', errorSchema),
      },
    },
  },
  '/api/auth/accept-invite/{token}': {
    get: {
      tags: ['Public'],
      summary: 'Look up a pending invite by its token',
      description:
        'Public, pre-auth. Used to render the accept-invite form before it is submitted.',
      security: PUBLIC,
      requestParams: { path: z.object({ token: z.string() }) },
      responses: {
        '200': jsonResponse('200 OK', z.object({ email: z.string().email(), role: z.string() })),
        '401': jsonResponse('401 — invalid or expired invite.', errorSchema),
      },
    },
    post: {
      tags: ['Public'],
      summary: 'Accept an invite — set a name and password',
      description:
        'Public, pre-auth, Turnstile-gated. Sets the name/password an invited user never had and activates the account.',
      security: PUBLIC,
      requestParams: { path: z.object({ token: z.string() }) },
      requestBody: { content: { 'application/json': { schema: acceptInviteSchema } } },
      responses: {
        '200': jsonResponse('200 OK', okSchema),
        '401': jsonResponse('401 — invalid or expired invite.', errorSchema),
        '422': VALIDATION_FAILED,
      },
    },
  },
  '/api/contact': {
    post: {
      tags: ['Public'],
      summary: 'Submit the public contact form',
      description:
        'Public, pre-auth, Turnstile + rate-limited. Lands in `/admin/leads`. This is the one route in this document with no session concept at all — anyone can call it.',
      security: PUBLIC,
      requestBody: { content: { 'application/json': { schema: leadSchema } } },
      responses: {
        '201': jsonResponse('201 Created', okSchema),
        '422': VALIDATION_FAILED,
        '429': jsonResponse('429 — rate limited.', errorSchema),
      },
    },
  },
  '/api/health': {
    get: {
      tags: ['Public'],
      summary: 'Liveness + database ping',
      description: 'Public. Used by the Docker `HEALTHCHECK` and CI.',
      security: PUBLIC,
      responses: {
        '200': jsonResponse(
          '200 OK',
          z.object({
            status: z.literal('ok'),
            db: z.enum(['up', 'down']),
            timestamp: timestampField,
          }),
        ),
      },
    },
  },
};

const AUTH_MODEL_DESCRIPTION = `
Every \`/api/admin/*\` route accepts **either** of two authentication mechanisms, resolved to the same permission check by \`resolveAuth()\`/\`authorized()\` (\`src/server/resolve-auth.ts\`) — a request that clears one is never treated differently from one that clears the other.

### Cookie session
The browser admin's own login (credentials or Google sign-in). An Auth.js v5 JWT cookie (\`authjs.session-token\`, or \`__Secure-authjs.session-token\` over HTTPS), database-backed — \`getAdminSession()\` re-reads the User document on every request, so a demoted, suspended, or deleted user is rejected on their very next request, not after the JWT itself expires.

**Requires CSRF on every mutation.** A second, non-\`httpOnly\` cookie (\`csrf-token\`) must be echoed back in the \`x-csrf-token\` header — the double-submit pattern that closes the gap \`SameSite=Lax\` leaves for top-level cross-site navigations. \`adminFetch\`/\`adminFetchJson\` (\`src/lib/admin-fetch.ts\`) attach this automatically for the browser admin; a script driving this API by hand needs to fetch \`/admin/login\` (or any \`/admin/*\` page) once first to receive the cookie, then read it back for every mutating request.

### Bearer token
For clients with no cookie jar. \`POST /api/admin/auth/token\` exchanges email + password (+ TOTP) for a 15-minute JWT **access token** and a 30-day opaque **refresh token**. Send the access token as \`Authorization: Bearer <token>\`.

- **No CSRF required or accepted** — a Bearer request carries no ambient cookie, so it cannot be forged cross-site the way CSRF requires.
- **Scoped.** Request a narrower \`scopes\` array at issuance than the full role grants; the token can never do more than that, and never more than the *role currently allows either* — both are checked on every request, so a permission removed from the role after issuance is enforced immediately, not just at the next token refresh.
- **Refresh tokens rotate on use.** \`POST /api/admin/auth/token/refresh\` spends the presented token and returns a new one in the same family. Presenting an already-rotated token is treated as a stolen-token signal: the entire family is revoked, not just that one token.
- **\`/admin/security\`** lists and revokes a user's own active sessions (one row per family) — cookie-session only, not itself reachable via Bearer.

**Permission errors are the same either way:** 401 for no/invalid credentials, 403 for authenticated-but-not-permitted. The one place they diverge is CSRF: a cookie request missing or mismatching \`x-csrf-token\` is also a 403, which a Bearer request can never trigger since the check does not run for it.
`.trim();

export function buildOpenApiDocument() {
  return createDocument({
    openapi: '3.1.0',
    info: {
      title: 'Wasik Ahmed — Admin API',
      version: '1.0.0',
      description: AUTH_MODEL_DESCRIPTION,
    },
    servers: [{ url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:4000' }],
    tags: [
      { name: 'Projects' },
      { name: 'Posts' },
      { name: 'Testimonials' },
      { name: 'Experience' },
      { name: 'Tech' },
      { name: 'Skill groups' },
      { name: 'Content', description: 'Cross-collection tools (MDX preview).' },
      { name: 'Leads' },
      { name: 'Media' },
      { name: 'Settings' },
      { name: 'Users' },
      { name: 'Audit log' },
      { name: 'Auth', description: 'Bearer token issuance, rotation, and session management.' },
      {
        name: 'Self-service',
        description: "Acts only on the caller's own account — no `Permission` gate.",
      },
      { name: 'Public', description: 'No authentication of any kind.' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: '15-minute access token from POST /api/admin/auth/token.',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'authjs.session-token',
          description:
            "Auth.js session cookie, set at /admin/login. Also requires the x-csrf-token header on mutations — see the auth model description above; OpenAPI's security model has no way to express that coupling directly.",
        },
      },
    },
    // Either mechanism satisfies most routes — an OR between the two
    // requirement objects, per OpenAPI's array-of-requirements semantics.
    // Individual operations override this with `security: []` (public) or
    // `security: [{ cookieAuth: [] }]` (cookie-only) where that's not true.
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    paths: {
      ...contentCollections,
      ...leadPaths,
      ...mediaPaths,
      ...settingsPaths,
      ...auditLogPaths,
      ...mdxPreviewPaths,
      ...usersPaths,
      ...selfServicePaths,
      ...bearerAuthPaths,
      ...publicAuthPaths,
    },
  });
}

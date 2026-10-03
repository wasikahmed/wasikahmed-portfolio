# AGENTS.md

Operating guide for this repository. Read this before changing anything.

---

## 1. What this is

A personal portfolio site for Wasik Ahmed with a self-hosted admin CMS behind it.
Public site and admin are one Next.js app; content lives in MongoDB and is edited
through `/admin`, not through code. It deploys as a Docker image to a VPS behind
a Cloudflare Tunnel.

**Stack**

| Layer       | Choice                                                        |
| ----------- | ------------------------------------------------------------- |
| Framework   | Next.js 16 (App Router, React 19, React Compiler enabled)     |
| Language    | TypeScript 5.9, `strict: true`                                |
| Styling     | Tailwind CSS v4 (CSS-first `@theme`, no `tailwind.config.js`) |
| Data        | MongoDB 7 + Mongoose 9                                        |
| Auth        | Auth.js v5 (`next-auth@5.0.0-beta.32`), JWT sessions          |
| Validation  | Zod 4                                                         |
| Motion      | `motion` v13 (Framer Motion's successor)                      |
| Content     | MDX via `next-mdx-remote-client`, Shiki highlighting          |
| Media       | Cloudinary (`src/server/cloudinary.ts`), one folder per app   |
| Package mgr | pnpm 11.8.0 (pinned via `packageManager`)                     |
| Runtime     | Node 22 in Docker                                             |

---

## 2. Commands

```bash
pnpm dev                # Next dev server (Turbopack)
pnpm build              # Production build
pnpm typecheck          # tsc --noEmit
pnpm lint               # eslint
pnpm test               # vitest run
pnpm e2e                # Playwright (builds + starts on :3100 first)
pnpm format             # prettier --write .
pnpm format:check       # prettier --check .

pnpm seed               # Upsert seed content into Mongo (idempotent)
pnpm seed:dry           # Validate seed data against Zod, write nothing
pnpm seed:admin         # Create/reset the single admin account, prints password once
pnpm build:scripts      # Bundle the seed scripts to dist-scripts/*.mjs (see §10)
```

**Before every push to `main`** run the full gate — CI does **not** run it:

```bash
pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build
```

`pnpm e2e` needs a seeded database (it navigates to real slugs). Run it when you
touched anything the public site renders. First time on a machine, install the
browser binary once: `pnpm exec playwright install` — `pnpm e2e` fails outright
without it and nothing else in the repo does this for you.

`e2e/admin.spec.ts` additionally needs `pnpm seed:e2e-admin` run first (with
`E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` set in `.env`) — a deterministic,
no-TOTP admin account for exercising the real login → create → publish →
delete pipeline. It `test.skip`s itself cleanly if that account was never
seeded, so skipping this step just means that one file no-ops rather than
failing the whole suite.

`e2e/invite.spec.ts` (PLAN.md W14 item 6) needs `pnpm seed:e2e-invite` run
first (with `E2E_INVITE_EMAIL`/`E2E_INVITE_TOKEN` set in `.env`) — same
`test.skip`-if-unseeded convention. It seeds a `status: 'invited'` viewer
directly rather than driving `/admin/users` (the real invite token only
ever leaves the server inside an emailed link — see
`scripts/seed-e2e-invite.ts`'s own comment), then exercises the real
accept-invite → login → permission-ceiling round trip.

If your `.env` has real Cloudflare Turnstile keys configured (rather than
the always-pass test keys `.env.example` recommends for local dev),
`e2e/invite.spec.ts` will fail locally on the accept-invite step with
"Verification failed" — Turnstile is only skipped server-side when
`TURNSTILE_SECRET_KEY` is unset (`src/server/turnstile.ts`), and a
headless Playwright run can't solve a real challenge. `e2e.yml`'s CI job
doesn't set that var, so this is a local-only wrinkle, not a real failure —
swap in the test keys, or run `TURNSTILE_SECRET_KEY= pnpm e2e` for that one
file.

**Docker dev stack** (Mongo + mongo-express + hot reload):

```bash
docker compose watch          # app on :4000, mongo-express on :8081
```

---

## 3. Directory map

```
src/
  app/
    (site)/          Public pages. force-dynamic — every page reads the DB.
    (admin)/admin/   CMS. Gated by src/proxy.ts + a re-check in the layout.
    api/admin/       CMS API. Auth + CSRF + Zod + audit log on every mutation.
    api/health/      Liveness + DB ping. Docker HEALTHCHECK and CI both use it.
    api/contact/     Public contact form: Turnstile + rate limit, then a Lead.
    api/openapi.json Generated API spec (src/server/openapi.ts); /docs renders it.
    docs/            Public API reference. force-dynamic layout — see §9.
    resume/, wasik-ahmed-resume.pdf/
                     Both stream the live résumé (server/resume-response.ts).
    layout.tsx       Root: fonts, MotionProvider.
    globals.css      The entire design token layer. Read §5 before editing.
  proxy.ts           Next 16's middleware (renamed from middleware.ts).
  server/            server-only. Never importable from a Client Component.
    models/          Mongoose schemas.
    seed-data/       Initial content for `pnpm seed`, plus site-copy defaults.
    revisions.ts     Content history registry: record + restore. See §6.
    queries.ts       The read layer. get*/getAll* split — see §6.
    admin-crud.ts    Generic CRUD route factory. Six collections share it.
    schemas.ts       Zod schemas. The write-side validation boundary.
    permissions.ts   Role→permission matrix and can(). See §7.
    session.ts       getAdminSession() — database-backed, see §7.
    auth.ts          Full Auth.js config (Node runtime only).
    auth.config.ts   Edge-safe half, for proxy.ts. Do not merge these.
  lib/               Client-safe shared code (cn, types, format, admin-fetch).
  components/
    ui/              Primitives: Section, Container, Button, Card, Tag, Field.
    motion/          Reveal, Metric, TextReveal, Magnetic, ViewTransition.
    ambient/         Decorative background layers. Budget of 2 — see §5.
    layout/          Nav, Footer, CommandPalette, SectionRail, ReadingProgress.
    home/ work/ case-study/ contact/ experience/ brand/ mdx/ admin/
e2e/                 Playwright: smoke, route/responsive sweep, motion contract,
                     admin pipeline, invitation round trip.
scripts/             seed.ts, seed-admin.ts, seed-e2e-*.ts, vps-backup.sh
docs/history/        Archived PLAN.md files. Read-only record; PLAN.md is live.
```

---

## 4. Non-negotiable rules

1. **Never import from `src/server/` in a Client Component.** Those modules carry
   `import 'server-only'`; doing so is a build error, and that is intentional.
2. **No hardcoded colors, spacing, durations, or easings in components.** Every
   value resolves from a token in `globals.css`. If you need a new value, add a
   token — do not inline a hex.
3. **Reduced motion must never remove information.** Motion may be dropped;
   content may not. Three layers enforce this and all three must keep working:
   the CSS kill switch in `globals.css`, `<MotionConfig reducedMotion="user">`,
   and `usePrefersReducedMotion()` for components that render a different tree.
   `e2e/motion-contract.spec.ts` is the test of record.
4. **At most two ambient layers per `<Section>`.** The `AmbientBudget` tuple type
   makes a third a compile error. Do not widen that type.
5. **Every admin mutation gets all four:** session check, `verifyCsrf`, Zod
   `safeParse`, `writeAuditLog`. The factory in `admin-crud.ts` does this for
   you — use it rather than hand-rolling a route. (`reorderHandler` also
   writes one audit entry per reorder, fixed under PLAN.md W5 — this rule
   used to note it as a gap; it no longer is one.)
6. **Client calls to `/api/admin/*` go through `adminFetch`/`adminFetchJson`**
   (`src/lib/admin-fetch.ts`), never bare `fetch` — that is what attaches the
   CSRF header.
7. **Draft content must never reach the public site.** `get*` functions filter to
   published/scheduled-and-due; `getAll*` do not. Public pages use `get*`. Only.
8. **No page copy in components.** Headings, intros, calls to action and meta
   descriptions come from the site-copy singleton (`getSiteCopy()`), edited at
   `/admin/site-copy`. A new one is a field in `SiteCopy` (`lib/types.ts`), its
   default in `seed-data/site-copy.ts`, the Mongoose group and Zod schema, and
   an entry in `lib/site-copy-fields.ts` — never a string literal in JSX.
   Structural labels (eyebrows, button text, empty states) may stay in code.
9. **Versioned writes keep the old state.** Every update/delete of a type
   registered in `src/server/revisions.ts` calls `recordRevision()` with the
   record as it was _before_ the change — `admin-crud.ts` does this for you;
   a hand-written route for a registered type must do it itself (see the
   settings and site-copy routes).

---

## 5. Design system

`src/app/globals.css` is the single source of truth. Dark theme only — there is
no light mode and no `dark:` variant anywhere.

- **Surfaces**: `bg`, `surface-1..4` (4-step elevation).
- **Foreground**: `fg`, `fg-muted`, `fg-subtle` — all AA at their intended sizes.
- **Accent ramp**: `accent-whisper`, `accent-soft`, `accent`, `accent-bright`,
  `accent-deep`.
- **Borders**: `border-subtle`, `border`, `border-strong`.
- **Type**: one fluid scale, `text-2xs` through `text-5xl`. Do not write `clamp()`
  in a component.
- **Density**: `density-compact | default | spacious` on `<Section>`. Varying this
  is what stops every section reading the same — pick deliberately.
- **Motion**: three durations (`fast`/`base`/`slow`), three easings. Nothing
  bespoke per component.

Fonts: Inter (`font-sans`), Space Grotesk (`font-display`), JetBrains Mono
(`font-mono`), all self-hosted via `next/font`.

---

## 6. Data layer conventions

- **Two read families, deliberately separate.** `getProjects()` returns only what
  is live; `getAllProjects()` returns everything. Conflating them is one missed
  status check away from leaking a draft.
- Every query is wrapped in React `cache()`, so calling the same one from three
  Server Components in a request hits Mongo once.
- `normalizeDoc()` converts `_id` → `id` and drops `__v`. Components see the
  interfaces in `src/lib/types.ts` and never a Mongoose document.
- **Zod and Mongoose schemas are maintained by hand, in parallel.** Change a
  field in one and you must change the other. They have already drifted in
  places (see PLAN.md W5) — check both when editing a shape.
- `Settings` is a singleton keyed by the fixed `_id` `'settings'`. `getSettings()`
  falls back to the seed shape rather than throwing when unseeded.
- `SiteCopy` is a singleton keyed by `'site-copy'`, never seeded. `getSiteCopy()`
  merges the stored document over `siteCopyDefaults` field by field, so a field
  added later shows its default on a database that predates it. Headings that
  state how many projects are live use `{count}`/`{Count}`/`{s}` tokens filled
  by `fillCount()` — the number always comes from the data.
- **Content history** (`models/revision.ts`, `src/server/revisions.ts`): up to
  50 previous states per record, for projects, posts, testimonials, roles, tech,
  skill groups, settings and site copy. Restores are re-validated against the
  current Zod schema (publish guard included), keep the record's current
  `order`, and record the state they replace, so a restore is itself undoable.
  Deleted records are restored under their original `_id` from `/admin/history`.
- **Résumé** (`models/resume.ts`): every uploaded PDF is kept in Mongo, bytes in
  a `select: false` Buffer, at most one `isCurrent` (partial unique index).
  `/resume` streams the current one with an ETag and falls back (307, never a
  permanent redirect) to `public/resume-fallback.pdf` until a version is live.
  `/wasik-ahmed-resume.pdf` serves the same live version: the old `/resume`
  sent a cached-forever 308 there (`src/server/resume-response.ts`). Old versions are only
  reachable through `/api/admin/resumes/[id]/file`. A `.lean()` read returns the
  Buffer as a BSON `Binary` — go through `storedBytes()`, never `new
Uint8Array(doc.data)`.

---

## 7. Auth architecture

Two layers, in order. A third — Cloudflare Access, edge-level JWT
verification — was removed 2026-09 (PLAN.md W8): it authorizes a fixed set
of identities at the edge, which structurally blocks the multi-user work
this phase exists to do (every invited user would also need a Cloudflare
Zero Trust seat provisioned by hand, outside this repo). The Cloudflare
Tunnel itself is unaffected and still the only ingress to the VPS.

1. **Session** — Auth.js JWT cookie, checked in `src/proxy.ts` for
   `/admin/*` and `/api/admin/*`, then re-checked in the dashboard layout and
   again in every API route via `getAdminSession()`, which is database-backed
   (PLAN.md W10) — it re-reads the User document on every call rather than
   trusting the role/status baked into the JWT, so a demoted, suspended, or
   deleted user is rejected on their very next request.
2. **Credentials** — argon2id via `@node-rs/argon2`, plus optional TOTP whose
   secret is AES-256-GCM encrypted at rest with a key derived from `AUTH_SECRET`.

**`AUTH_URL` is required in production, not optional.** Auth.js v5's
`createActionURL()` falls back to the request's `Host` header when
`AUTH_URL`/`NEXTAUTH_URL` is unset — and under this app's required
`HOSTNAME=0.0.0.0` Docker binding, that fallback leaks the container's own
bind address into absolute URLs it builds instead of the real domain
(caught live, 2026-09-20: sign-out redirecting to `http://0.0.0.0:<port>/
admin/login` in production). `deploy.yml` sets it from the existing
`NEXT_PUBLIC_SITE_URL` value rather than a second variable that could drift
from it. Not needed locally — `pnpm dev` and the dev compose stack don't hit
this, since neither binds to `0.0.0.0`.

**Two ways to authenticate, one session model.** Alongside credentials,
Google sign-in (PLAN.md W11a) is an optional second entry point — registered
only when `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` are set. It is never a signup
path: `auth.ts`'s `signIn` callback rejects any Google account whose email
has no existing User document, or whose account is suspended, before a
session is ever issued. Once past that gate it produces the exact same JWT
session shape as credentials — `getAdminSession()` doesn't know or care which
provider was used.

**A third way in for programmatic clients: Bearer tokens (PLAN.md W12).**
`POST /api/admin/auth/token` (email + password + TOTP, public route,
exempted from `proxy.ts`'s session gate) exchanges credentials for a
15-minute JWT access token plus a 30-day opaque refresh token, stored
hashed and rotated on every use — presenting an already-rotated one revokes
its whole family (reuse detection). `src/server/resolve-auth.ts`'s
`resolveAuth()` resolves either a session cookie or an `Authorization:
Bearer` header to the same shape, and `requirePermission()` is the one
shared gate every permission-checked route — `admin-crud.ts`'s factory and
every hand-written route alike — calls before doing anything the caller
might not be allowed to do. A Bearer token's scopes are always intersected
with the user's _current_ role at request time, never trusted from the
token payload alone, so a demotion or suspension shrinks or kills it on the
token's very next use, the same guarantee W10 gives the cookie session.
CSRF is required for the cookie path and skipped for Bearer — a Bearer
request carries no ambient cookie, so it cannot be forged cross-site.
`proxy.ts` verifies a Bearer token's signature/expiry itself (`jose` is
Edge-safe) before the cookie-session gate would otherwise reject it
outright; the full user/suspension/scope check still happens exactly once,
in `resolveAuth()`. `/admin/security` lists and revokes a user's own active
API sessions.

**Permissions, not roles, gate everything past the session check.**
`src/server/permissions.ts` defines the fixed `viewer`/`editor`/`admin`/`owner`
role matrix and the one `can(session, permission)` function that
`requirePermission()`/`authorized()` call internally (PLAN.md W10). `owner`
is a singleton — set only by `pnpm seed:admin` — and can only change hands
via the dedicated transfer-ownership route, never a role-change PATCH; that
route (and password/TOTP self-service, and the API-session list/revoke
routes) stay cookie-session-only on purpose — see each route's own comment
for why.

The `auth.ts` / `auth.config.ts` split exists because `proxy.ts` runs in the Edge
runtime and cannot load argon2's native bindings or Mongoose. **Do not import
`auth.ts` from `proxy.ts`** — it fails the build.

The `owner` account is created only by `pnpm seed:admin`. Every other account
comes from the invite flow (`/admin/users` → `/admin/accept-invite/[token]`,
PLAN.md W11) — there is still no public signup route, and there must not be
one; Google sign-in's email allowlist above is what keeps that true for OAuth
too.

---

## 8. Writing code here

- **Comments explain _why_, not _what_.** This codebase has an unusually high
  comment density and it is load-bearing — most comments record a decision or a
  trap someone already hit. Match that. Do not add comments that restate the
  line below them.
- Match the surrounding file's naming, structure, and idiom.
- Prefer extending `admin-crud.ts` or a `ui/` primitive over writing a new
  one-off.
- New env vars go in `.env.example` **with a comment saying what reads them**,
  and in `.github/workflows/deploy.yml`'s heredoc if production needs them.
- Do not add a dependency for something the stack already does.

---

## 9. Known traps

- `src/proxy.ts`, not `middleware.ts` — Next 16 renamed it.
- Its matcher covers `/admin/*` and `/api/admin/*` only — `/api/auth/*` gets
  no CSRF/session gate from it. That does **not** mean login is unprotected:
  `src/server/rate-limit.ts`'s database-backed fixed-window counter
  (`credentials.ts`, shared by the cookie and Bearer-token login paths) caps
  attempts per IP and per targeted email independently, 15-minute windows —
  confirmed live, not just by reading the code, by tripping it during
  testing. This line used to claim login had no rate limiting; it does.
- `next build` classifies a page static (`○`) unless something forces it
  dynamic, and a static page's HTML is generated once, at build time — which
  matters a lot for `proxy.ts`'s nonce-based CSP: the nonce it stamps into
  script tags is fresh per request, so a statically prerendered page's
  baked-in nonce can never match, and every script on it gets blocked
  outright. `/docs` hit this for real (PLAN.md, 2026-09-20) — a Client
  Component with no data dependency, silently prerendered, rendering as a
  totally blank page in production while working fine in dev (which always
  renders per request, static classification or not). Fixed with
  `src/app/docs/layout.tsx` exporting `dynamic = 'force-dynamic'` — in a
  layout, not the page itself, since the page is a Client Component and
  Next only reads route-segment config from a Server Component. Any new
  page with no per-request data need is still a candidate for this exact
  trap; force dynamic rendering explicitly rather than relying on data
  fetching to imply it.
- `next build` runs `generateStaticParams()` with no reachable database (by
  design, inside Docker). Those functions catch and return `[]`. Any new
  `generateStaticParams` must do the same.
- MDX cannot be rendered by both `mdx-content.tsx` (RSC) and a Route Handler in
  the same module graph — Next refuses to bundle `react-dom/server` alongside an
  RSC-reachable component. That is why `src/server/mdx-render.ts` exists
  separately and imports `react-dom/server` dynamically.
- The TOTP pending cookie is scoped to `/api/admin`, not `/admin`. Those are
  different prefixes to the browser.
- Auth.js v5's module augmentation does not merge reliably under this project's
  `moduleResolution: "bundler"` + pnpm layout. The cast happens once in
  `src/server/session.ts`; do not scatter `as` casts instead.
- Mongoose models are exported untyped, so `queries.ts` needs `as unknown as`
  casts. Known; see PLAN.md W5.

---

## 10. Deployment

Push to `main` → `deploy.yml`'s `verify` job runs `typecheck`/`lint`/`format:check`/
`test`/`build`, then (only if that passes) `build-and-push` builds a `linux/amd64`
image and pushes it to Docker Hub tagged `sha-<short>`, then `deploy` SSHes to the
VPS, writes `.env` from repo secrets/variables, and runs `docker compose -f
docker-compose.prod.yml pull && up -d`. E2E runs separately, in `e2e.yml`, on a
daily schedule and on PRs — not in this path, so a slow browser suite never gates
a hotfix. The local gate in §2 is still worth running before pushing; CI is a
backstop, not a substitute for running it yourself first.

Rollback on a failed healthcheck is automatic (`deploy.yml`'s `deploy` job stashes
the outgoing `IMAGE_TAG` before overwriting `.env` and restores it if the new
image never goes healthy) — the job still fails either way, since a rollback
means production is safe, not that the push was good. To roll back to some
_other_ tag manually: SSH in, set `IMAGE_TAG` in `.env`, re-run pull + up.

**Seeding production.** The runner image cannot run `pnpm seed`. It is
`next build`'s standalone output plus static assets — there is no pnpm on
PATH (the runner stage is `FROM node:22-alpine`, not the `base` stage that
enables corepack), no `tsx` (a devDependency), and no `scripts/` or `src/`.
`pnpm build:scripts` therefore bundles `seed.ts` and `seed-admin.ts` into
single-file ESM with esbuild, and the Dockerfile copies the result to
`/app/dist-scripts`. `mongoose` and `@node-rs/argon2` stay external —
both are already traced into the standalone `node_modules`, and argon2 is
a native binary that must not be bundled.

On a database that starts empty — a fresh volume — nothing else will
populate it, and without the second command there is no account to log in
with:

```bash
cd $DEPLOY_PATH
docker compose -p portfolio -f docker-compose.prod.yml exec web node dist-scripts/seed.mjs
docker compose -p portfolio -f docker-compose.prod.yml exec web node dist-scripts/seed-admin.mjs
```

`MONGODB_URI` comes from the compose environment and `ADMIN_EMAIL` from
`.env`, so neither needs arguments; pass an email to `seed-admin.mjs` to
override it. Both are idempotent, so re-running converges rather than
duplicating — but `seed-admin.mjs` resets the password and prints the new
one once, so only run it when you intend that.

Note `pnpm seed` **upserts and never deletes** (scripts/seed.ts). Against
a database that already holds superseded content, it adds the new
documents alongside the old ones rather than replacing them; the only
clean states are an empty volume or deleting the stale records yourself.

**Backups.** A cron job installed on the VPS by `deploy.yml`'s "Install the
backup cron job" step runs `scripts/vps-backup.sh` nightly — a
`mongodump`, dated and rotated locally under `$DEPLOY_PATH/backups` (default 7-day retention). Local retention
only, deliberately, decided 2026-08-30 (PLAN.md W4) — it protects against
a bad migration or an admin-CMS mistake, not against losing the VPS
itself. Media no longer needs a local-volume backup of its own (PLAN.md
W15 item 1 moved it to Cloudinary — off-box and versioned on its own, on
an account this app never has write access outside its own folder in).
Mongo is the one thing left with only a local copy; revisit shipping that off-box (e.g. rclone to an S3-compatible
bucket) as its own task if that risk becomes worth carrying.

**Analytics: Umami, hosted elsewhere.** This VPS ran its own Umami +
Postgres from 2026-09-22 until 2026-10-03, when analytics moved to an
externally hosted Umami (v3) — nothing analytics-related runs in this
compose project any more, and the nightly backup no longer has a second
database to dump. The Next app only reads
`NEXT_PUBLIC_UMAMI_SCRIPT_URL`/`NEXT_PUBLIC_UMAMI_WEBSITE_ID` (read by
`src/app/(site)/layout.tsx` — unset either one and no tracking script
renders at all). They're read at runtime, not passed as Docker build args,
so changing them is a GitHub variable edit plus a redeploy, never a
rebuild. Copy the script URL from Umami's own tracking-code dialog rather
than hand-constructing it — its served path is configurable
(`TRACKER_SCRIPT_NAME`) and isn't a fixed convention.

---

## 11. Current state — read PLAN.md

Last reviewed 2026-10-03 against the repo, CI history and the live site.

**Built and deployed:** the public site, design system, data layer and admin
CMS. The contact form is real end to end (Turnstile + rate limiting + Gmail
SMTP notifications + `/admin/leads`). The CMS is genuinely multi-user
(PLAN.md W9–W11 in `docs/history/`): fixed roles with permission checks on
every admin route, database-backed sessions, invite → accept →
suspend/reactivate → delete → transfer-ownership at `/admin/users`, and
optional Google sign-in (never a signup path, §7). Programmatic clients use
Bearer tokens (W12, §7); the API is documented at `/api/openapi.json` and
rendered at `/docs` (W13 — public on purpose). SEO is done (sitemap,
robots, per-page OG images, `/writing/feed.xml`, JSON-LD, canonicals). Media
lives on Cloudinary (§10). Page copy, résumé versions and content history
are edited in the CMS (§4 rules 8–9, §6). Real content replaced the
placeholders on 2026-09-20 (commit `7e42655`).

**Deployed as of 2026-10-02** — every push to `main` since has passed
`deploy.yml`'s `verify` gate and shipped. Locally, the full gate passes.

**Not healthy — see PLAN.md for each:**

- Production runs `next@16.3.3`, inside the range of a critical RCE in
  `next/og`'s `ImageResponse`, which this site serves on public routes.
  Fix before anything else (PLAN.md §2).
- `e2e.yml`'s daily run has been red since 2026-09-21 on stale seed slugs,
  not a site bug — but until it is fixed it catches nothing (PLAN.md §3).
- Analytics is mid-move to an externally hosted Umami (PLAN.md §1): the
  VPS's own Umami is removed from the repo, the new instance and the
  full feature set (events, replays, heatmaps, Web Vitals, ad-blocker
  proxy) are still to come.

**Lessons that still apply.** "Verified live" means checked against the
running production container, not the dev server — the two diverge on
static vs. dynamic rendering (§9's `/docs` trap) and on `HOSTNAME=0.0.0.0`
binding (§7's `AUTH_URL`), neither visible from source. The 2026-09-20
deploy found four bugs no review had caught that way: a fail-closed stale
Cloudflare Access config locking every admin out, two GitHub Actions values
in the wrong namespace (`vars.*` vs `secrets.*`) that would have silently
disabled Turnstile and lead email, the sign-out redirect leaking the bind
address, and `/docs` rendering blank (`docs/history/PLAN-2026-09.md` has
the full account). And a scheduled CI job that fails quietly is no safety
net: check `gh run list` when picking up work, not only after a push.

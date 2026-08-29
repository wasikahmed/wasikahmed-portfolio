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
```

**Before every push to `main`** run the full gate — CI does **not** run it:

```bash
pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build
```

`pnpm e2e` needs a seeded database (it navigates to real slugs). Run it when you
touched anything the public site renders. First time on a machine, install the
browser binary once: `pnpm exec playwright install` — `pnpm e2e` fails outright
without it and nothing else in the repo does this for you.

**Docker dev stack** (Mongo + mongo-express + hot reload):

```bash
docker compose watch          # app on :3300, mongo-express on :8081
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
    layout.tsx       Root: fonts, MotionProvider.
    globals.css      The entire design token layer. Read §5 before editing.
  proxy.ts           Next 16's middleware (renamed from middleware.ts).
  server/            server-only. Never importable from a Client Component.
    models/          Mongoose schemas.
    seed-data/       Initial content for `pnpm seed`.
    queries.ts       The read layer. get*/getAll* split — see §6.
    admin-crud.ts    Generic CRUD route factory. Six collections share it.
    schemas.ts       Zod schemas. The write-side validation boundary.
    auth.ts          Full Auth.js config (Node runtime only).
    auth.config.ts   Edge-safe half, for proxy.ts. Do not merge these.
  lib/               Client-safe shared code (cn, types, format, admin-fetch).
  components/
    ui/              Primitives: Section, Container, Button, Card, Tag, Field.
    motion/          Reveal, Metric, TextReveal, Magnetic, ViewTransition.
    ambient/         Decorative background layers. Budget of 2 — see §5.
    layout/          Nav, Footer, CommandPalette, SectionRail, ReadingProgress.
    home/ work/ case-study/ contact/ mdx/ admin/
e2e/                 Playwright: smoke, route/responsive sweep, motion contract.
scripts/             seed.ts, seed-admin.ts
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
   you — use it rather than hand-rolling a route. (`reorderHandler` currently
   skips the audit log; that is a known gap, not a precedent.)
6. **Client calls to `/api/admin/*` go through `adminFetch`/`adminFetchJson`**
   (`src/lib/admin-fetch.ts`), never bare `fetch` — that is what attaches the
   CSRF header.
7. **Draft content must never reach the public site.** `get*` functions filter to
   published/scheduled-and-due; `getAll*` do not. Public pages use `get*`. Only.

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

---

## 7. Auth architecture

Three layers, in order:

1. **Cloudflare Access** (`src/server/cloudflare-access.ts`) — verifies the
   `Cf-Access-Jwt-Assertion` JWT at the origin. **No-ops when `CF_ACCESS_*` is
   unset, which is currently the case in production.** See PLAN.md W2.
2. **Session** — Auth.js JWT cookie, checked in `src/proxy.ts` for
   `/admin/*` and `/api/admin/*`, then re-checked in the dashboard layout and
   again in every API route.
3. **Credentials** — argon2id via `@node-rs/argon2`, plus optional TOTP whose
   secret is AES-256-GCM encrypted at rest with a key derived from `AUTH_SECRET`.

The `auth.ts` / `auth.config.ts` split exists because `proxy.ts` runs in the Edge
runtime and cannot load argon2's native bindings or Mongoose. **Do not import
`auth.ts` from `proxy.ts`** — it fails the build.

The admin account is created only by `pnpm seed:admin`. There is no signup route
and there must not be one.

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
- Its matcher covers `/admin/*` and `/api/admin/*` only. **`/api/auth/*` is not
  covered by anything**, which is why login has no rate limiting today.
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

Push to `main` → GitHub Actions builds a `linux/amd64` image, pushes it to Docker
Hub tagged `sha-<short>`, SSHes to the VPS, writes `.env` from repo
secrets/variables, and runs `docker compose -f docker-compose.prod.yml pull && up -d`.

**CI runs no tests, lint, or typecheck.** A push to `main` is the ship signal.
The local gate in §2 is the only gate that exists.

Rollback is manual: SSH in, set `IMAGE_TAG` in `.env` to the previous `sha-` tag,
re-run pull + up.

---

## 11. Current state — read PLAN.md

The public site, design system, data layer, and admin CMS are complete and
deployed. The contact form is real end to end (Turnstile + rate limiting +
Resend + a working `/admin/leads` list/detail/status pipeline), and TOTP has
been verified working in dev. `/admin` is still protected by password + TOTP
only — Cloudflare Access is written but inactive in production — and there is
no SEO surface (no sitemap, robots, OG images, or RSS). See `PLAN.md` for what
is left and in what order.

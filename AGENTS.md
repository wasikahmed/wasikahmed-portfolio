# Wasik Ahmed — Portfolio

Next.js (App Router) + Tailwind CSS v4 + MongoDB portfolio and admin CMS,
deployed via Docker behind an existing Cloudflare Tunnel. See [PLAN.md](PLAN.md)
for the full architecture, design language, and phased delivery plan — read it
before making structural decisions.

## Status

Phases 0–4 are complete: design system, public site, data layer, and admin CMS.
Phase 5 (leads pipeline) is next. See PLAN.md §6 for the full schedule.

The Vite + React Router prototype this was migrated from lived at `_reference/`
and was deleted once the rebuild reached visual parity, per PLAN.md §5. It
remains in git history at commit `ad4c767` if it is ever needed again.

## Development server

Not auto-started. Run `pnpm dev` (Next.js on port 3000 by default, or
`pnpm dev -- -p <port>` to override). Hot reload via Turbopack.

Docker Compose runs the full stack (`web` on 3300, `mongo`, `mongo-express`):
`docker compose up -d`.

## Project structure

`src/app` is routing only — every other concern lives in a sibling folder, which
is the "store project files outside of `app`" layout from the Next.js docs.

- `src/app/layout.tsx` — root layout: HTML shell, global metadata
- `src/app/globals.css` — Tailwind v4 entrypoint and the whole token layer
  (accent ramp, elevation scale, fluid type, density + motion) — PLAN.md §2.8
- `src/app/(site)/` — public route group
- `src/app/(admin)/admin/` — CMS route group. `(dashboard)/` inside it is a
  second group holding every authenticated page, so `login/` can opt out of the
  authenticated chrome
- `src/app/api/` — route handlers: `/api/health`, `/api/auth/*`, `/api/admin/*`
- `src/components/ui/` — design-system primitives (Button, Card, Field, Section…)
- `src/components/layout/` — app shell: nav, footer, command palette, rails
- `src/components/motion/` — motion primitives; every one honours reduced motion
- `src/components/ambient/` — the two budgeted decorative layers (PLAN.md §2.10)
- `src/components/mdx/` — custom blocks available inside MDX content
- `src/components/{home,work,case-study,contact}/` — page-specific composites
- `src/components/admin/` — CMS-only components, incl. `forms/` per collection
- `src/lib/` — isomorphic helpers only; safe to import from a Client Component
- `src/server/` — server-only: Mongo connection, models, Zod schemas, queries,
  auth, and the generic admin CRUD factory. The sensitive modules here open with
  `import 'server-only'`, so importing one into a Client Component fails the
  build instead of leaking
- `src/proxy.ts` — Next 16's renamed middleware; gates `/admin` and `/api/admin`
- `scripts/` — `seed.ts` (content) and `seed-admin.ts` (bootstrap admin user)
- `PLAN.md` — governing architecture and design document

## Dependencies

- Runtime: React 19, Next.js 16 (App Router, Turbopack, React Compiler enabled)
- Styling: Tailwind CSS v4 via `@tailwindcss/postcss`
- Testing: Vitest (unit — schemas, utils, mappers) and Playwright (e2e)
- Formatting: Prettier + `prettier-plugin-tailwindcss`

## Styling

Tailwind CSS v4, token-first — **zero hardcoded hex in components**. Tokens live
in `src/app/globals.css` under `@theme`. This project is **dark only**: no light
theme, no toggle, no `dark:` variants (PLAN.md §2.8, §7).

## Design principle — signal over noise

Every animation must reveal information, confirm an interaction, or establish
spatial continuity (PLAN.md §2.2). Ambient decorative layers are capped at two
per viewport (§2.10). If you're adding motion that does none of the three, it
doesn't belong — check the ambient budget ledger before adding a new one.

## Code quality

- Use double quotes for strings containing apostrophes (`"We're here to help"`),
  or escape them in single-quoted strings.
- Ensure JSX tags are closed and braces are balanced.
- **Named exports for components**, e.g. `export function Footer()`. Default
  exports only where Next.js requires one — `page.tsx`, `layout.tsx`,
  `error.tsx`, and friends.
- Server-only modules (anything touching Mongo, secrets, or the session) open
  with `import 'server-only'`. Do not add it to `src/server/models/`,
  `password.ts`, `schemas.ts`, or `seed-data/`: the seed scripts import those
  under plain Node, where that package throws.
- Run `pnpm typecheck && pnpm lint && pnpm test` before considering a change done.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

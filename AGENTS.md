# Wasik Ahmed — Portfolio

Next.js (App Router) + Tailwind CSS v4 + MongoDB portfolio and admin CMS,
deployed via Docker behind an existing Cloudflare Tunnel. See [PLAN.md](PLAN.md)
for the full architecture, design language, and phased delivery plan — read it
before making structural decisions.

## Migration in progress

This repo was migrated from a Vite + React Router prototype (Figma Make scaffold).
That prototype is frozen, read-only, at `_reference/` — the design source of
truth until visual parity is reached, then deleted per PLAN.md §5. Do not add
new work there; it has its own now-uninstalled dependencies and is excluded from
lint/typecheck/build.

## Development server

Not auto-started. Run `pnpm dev` (Next.js on port 3000 by default, or
`pnpm dev -- -p <port>` to override). Hot reload via Turbopack.

## Project structure

- `src/app/layout.tsx` — root layout: HTML shell, global metadata
- `src/app/globals.css` — Tailwind v4 entrypoint + base tokens. Phase 1 owns the
  full token layer (accent ramp, elevation scale, fluid type, density + motion
  tokens) — see PLAN.md §2.8
- `src/app/(site)/` — public site route group (Home, Work, Writing, About,
  Contact land here through Phase 2)
- `src/app/(admin)/admin/` — CMS route group, gated by Cloudflare Access +
  Auth.js from Phase 4 onward
- `src/app/api/` — route handlers (`/api/health` exists; contact, auth, and
  admin CRUD endpoints land in later phases)
- `src/lib/` — shared utilities; Mongo connection singleton and Zod schemas
  land here in Phase 3
- `_reference/` — frozen pre-migration snapshot, read-only
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
- Export components as default exports.
- Run `pnpm typecheck && pnpm lint && pnpm test` before considering a change done.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

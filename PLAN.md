# PLAN.md

Forward plan, written 2026-10-03 from a full review of the repo, CI history
and the live site. The previous plan is archived at
[`docs/history/PLAN-2026-09-20.md`](docs/history/PLAN-2026-09-20.md);
everything it listed as left before shipping has since shipped.

**Where things stand:** the public site, design system, data layer and
multi-user admin CMS are complete and deployed. Checked against production
on 2026-10-03, not just read off source:

- Every public route answers 200: home, `/work` (seven projects, every
  cover served from Cloudinary), `/about` (portrait from `public/`),
  `/writing` and `/writing/feed.xml`, `/contact`, `/docs`, `/resume` and
  `/wasik-ahmed-resume.pdf`, `/sitemap.xml`, `/api/health`.
- The last two pushes to `main` (2026-10-02) passed `verify` and deployed.
- Locally, `typecheck`, `lint`, `format:check` and `test` (269 tests) pass.

Shipped and deployed since the last plan was written, in order:

| Date       | Commit    | What                                                                                 |
| ---------- | --------- | ------------------------------------------------------------------------------------ |
| 2026-09-20 | `7e42655` | Placeholder content replaced with the real portfolio; positioning aimed at hiring    |
| 2026-09-20 | `693dddb` | Banded section rhythm; contact form reduced to one stable form with an intent select |
| 2026-09-20 | `28426a6` | Home work grid, Experience rebuilt, every role on home (education excluded)          |
| 2026-09-20 | `e82ff45` | Seed scripts bundled to `dist-scripts/*.mjs` so they run inside the production image |
| 2026-09-22 | `06b09b6` | Self-hosted Umami + Postgres in the production stack (being removed — see 1 below)   |
| 2026-10-02 | `222fd0b` | Page copy, résumé versions and content history moved into the CMS (AGENTS.md §4, §6) |
| 2026-10-03 | `61c7572` | `/wasik-ahmed-resume.pdf` serves the live résumé, undoing the old cached-forever 308 |

---

## 1. Analytics — move to an external Umami — implemented, deploying

Decided 2026-10-03: this VPS stops hosting Umami. Analytics goes to
Wasik's self-hosted Umami 3.4 at `analytics.redelevators.com` (website
"Portfolio - Wasik Ahmed", plus "Portfolio — Dev (localhost)" for local
development). AGENTS.md §10 describes the setup as built.

1. **Teardown, in the repo — done.** `umami`/`umami-db`, the
   `umami-db-data` volume, the `pg_dump` step and every `UMAMI_*` setting
   are gone; the next deploy's `--remove-orphans` stops both containers.
2. **Teardown, by hand — still open after the deploy.** Old data is
   discarded, no final dump (Wasik, 2026-10-03). On the VPS:
   `docker volume rm portfolio_umami-db-data` and
   `rm -f "$DEPLOY_PATH"/backups/umami-*.dump`; in Cloudflare Zero Trust,
   delete the Tunnel's `analytics.wasikahmed.me` public-hostname rule.
3. **The integration — done, verified locally** against the dev website:
   first-party relay at `/x/` with the visitor IP injected, custom events,
   Web Vitals, replays and heatmaps (no CSP violations), `data-domains`,
   admin browsers excluded, a tracked in-layout 404, and every mailto
   link falling back to copying the address when no mail app opens.
4. **Production verification — after the deploy:** a pageview and an
   event arrive in Umami from `wasikahmed.me` with a real country (proves
   the IP injection through Cloudflare), a replay records, and nothing
   appears from a browser that has opened `/admin`.
5. **Dashboard** — goals, funnels, links, pixels and a board, set up in
   Umami itself against the event names in `src/lib/analytics.ts`.

## 2. Security — urgent

From `pnpm audit --prod`, 2026-10-03:

1. **`next` 16.3.3 — critical: remote code execution in `next/og`'s
   `ImageResponse`** (fixed in ≥16.3.6; 16.3.8 is current). This site
   renders `ImageResponse` on public, unauthenticated routes — the root,
   `/work/[slug]` and `/writing/[slug]` `opengraph-image.tsx`, and
   `apple-icon.tsx` — and production is on 16.3.3. The same bump clears a
   high-severity `sharp` advisory. Patch-level; do this first.
2. **`nodemailer` 9.0.6 — two high, five moderate** (address-parser
   complexity, recipient-domain validation bypasses). A direct dependency
   (`src/server/email.ts`, lead notifications) and `@auth/core`'s. Fixed
   in ≥10.0.6 — a major bump, so read its changelog and re-send a real
   lead notification before calling it done.
3. `@ai-sdk/provider-utils` (low) arrives through `@scalar`'s `/docs`
   reference; clears whenever `@scalar/api-reference-react` picks it up.

## 3. E2E — red every day since 2026-09-21

`e2e.yml`'s daily run has failed twelve days running, unnoticed, because
`e2e/site.spec.ts` still navigates to slugs `7e42655` deleted from the seed
data (`/work/docflow-ai`, `/work/autoschedule`,
`/writing/when-to-build-vs-buy-ai`). Not a site bug — but a suite that is
always red protects nothing. Point the tests at the current seed slugs
(`scorelivepro`, `advergo`, … and `live-data-should-cost-you-once`),
ideally read from `src/server/seed-data/` rather than hardcoded again, then
re-check `admin.spec.ts`/`invite.spec.ts` for the same drift.

## 4. Housekeeping

1. **Migrate production's owner** — carried forward, still needs a person:
   an interactive `cloudflared access ssh` session, then the
   `seed-admin.mjs` command in AGENTS.md §10, run in `DEPLOY_PATH`. Resets
   the password and prints it once. Nothing in the repo records whether
   this was done.
2. **Superseded seed documents in production.** `7e42655` noted that
   `pnpm seed` never deletes, so the old placeholder projects/posts
   would still be in Mongo. Their public URLs 404 (2026-10-03), so none is
   published — whether the records still exist as drafts is only visible
   in `/admin`. Delete them there if so.
3. **Force-2FA for non-owner roles** — still deferred on W11's condition (a
   second real person through the invitation flow).
4. **Off-box backups** — Mongo is the only thing left with a local-only
   copy once Umami's Postgres goes (1 above). Unchanged risk; its own task
   if it becomes worth carrying.
5. **Dependency sweep** — minor/patch updates available for `mongoose`,
   `jose`, `@node-rs/argon2`, `otpauth`, `@playwright/test`, `@types/react`.
   `next-auth` is still `5.0.0-beta.32`, the newest v5 release (re-checked
   2026-10-03).

---

## Open questions

- **Should `/api/admin` be renamed** now that it has a documented public
  spec? Still not now — touches every route file, `admin-fetch.ts`, and
  `proxy.ts`'s matcher for cosmetics alone. Revisit if real external
  consumers show up.

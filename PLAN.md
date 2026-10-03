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

## 1. Analytics — move to an external Umami — in progress

Decided 2026-10-03: this VPS stops hosting Umami. Wasik runs a self-hosted
Umami (v3) on another domain, and the portfolio becomes a website there.

Until this change, `docker-compose.prod.yml` ran `umami` + `umami-db`
(Postgres), served at `analytics.wasikahmed.me` through its own Cloudflare
Tunnel hostname rule, and `vps-backup.sh` `pg_dump`ed it nightly. The Next
app itself only reads `NEXT_PUBLIC_UMAMI_SCRIPT_URL`/
`NEXT_PUBLIC_UMAMI_WEBSITE_ID`, at runtime — neither is a Docker build arg,
so changing them is a GitHub variable edit plus a redeploy, not a rebuild.

1. **Tear down, in the repo — done, 2026-10-03 (ships with the next
   deploy):** dropped both services and the `umami-db-data`
   volume from `docker-compose.prod.yml`, the `pg_dump` step from
   `vps-backup.sh` (it would fail every night once the container is gone),
   the four `UMAMI_*` lines from `deploy.yml`'s heredoc and header, the
   block from `.env.example`, and AGENTS.md §10's section. `deploy.yml`
   already runs `up -d --remove-orphans`, so the next deploy stops and
   removes both containers by itself.
2. **Tear down, by hand** (none of this is reachable from the repo). The
   old data is discarded, no final dump (Wasik, 2026-10-03). `docker volume rm` the Postgres
   volume (`--remove-orphans` never deletes named volumes); delete the
   `analytics.wasikahmed.me` public-hostname rule in the Cloudflare Tunnel;
   delete `UMAMI_DB_USER`, `UMAMI_PORT_HOST` (vars) and `UMAMI_DB_PASSWORD`,
   `UMAMI_APP_SECRET` (secrets) from GitHub Actions.
3. **Point at the new instance:** add the site there, set the two
   `NEXT_PUBLIC_UMAMI_*` GitHub variables, redeploy, and confirm a pageview
   arrives — checked against production, not the dev server.
4. **Use what Umami v3 offers**, not just pageviews. Decided 2026-10-03:
   - custom events with properties (contact submit, résumé downloads,
     outbound links, project and post engagement), Web Vitals
     (`data-performance`), `data-domains` so dev traffic is never
     counted, and admin users' own visits excluded;
   - **replays and heatmaps on**, at Umami's 15% sample, inputs masked,
     `/admin` never recorded — `recorder.js` must be proven to work under
     `proxy.ts`'s nonce CSP in production, not assumed;
   - **tracker proxied through `wasikahmed.me`** so ad blockers don't hide
     a developer audience — visitor IP/country must still reach Umami
     correctly through Cloudflare and the proxy;
   - no analytics view inside `/admin` for now.

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

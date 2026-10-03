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

## 1. Analytics — moved to an external Umami — live

Decided 2026-10-03: this VPS stops hosting Umami. Analytics goes to
Wasik's self-hosted Umami 3.4 at `analytics.redelevators.com` (website
"Portfolio - Wasik Ahmed", plus "Portfolio — Dev (localhost)" for local
development). AGENTS.md §10 describes the setup as built.

**Verified in production, 2026-10-03** (deploy of `c651637`): `/x/a.js`,
`/x/r.js`, the recorder config and `/x/api/hit` all 200 on
`wasikahmed.me`; a real visit arrived in Umami with its pageview and
`scroll_depth` events and was placed in BD, the visitor's country rather
than the VPS's — the `payload.ip` injection working through Cloudflare.
Replays were verified at 100% sampling on the dev website; production
samples 15%. The old `analytics.wasikahmed.me` now 502s — its containers
were removed by the deploy.

Set up in Umami the same day, against the names in `src/lib/analytics.ts`
(rename an event there and the matching goal/funnel silently empties):
8 goals, 5 funnels (hiring path, contact form completion, case-study and
article read-through, home → about → résumé), 6 segments (LinkedIn,
GitHub, search, outside Bangladesh, mobile, UTM-tagged), 2 cohorts, 6
tracked links (`/q/wasik-*`, each to a UTM-tagged URL), 2 email pixels,
a "Portfolio overview" board, and an annotation marking the switch.

**Still open — by hand, not reachable from the repo:**

1. On the VPS: `docker volume rm portfolio_umami-db-data` and
   `rm -f "$DEPLOY_PATH"/backups/umami-*.dump` (old data discarded, no
   final dump — Wasik, 2026-10-03).
2. Cloudflare Zero Trust: delete the Tunnel's `analytics.wasikahmed.me`
   public-hostname rule (it now points at nothing and 502s).

## 2. Dependency advisories

`pnpm audit --prod`, re-run 2026-10-04: one low-severity advisory left.

- **Resolved:** `next` moved to 16.3.8 in `c651637` (the `next/og`
  advisory, plus `sharp`'s). `nodemailer` moved from 9.0.6 to 10.0.13 on
  2026-10-04, clearing its seven advisories. 10.x's only breaking change
  is requiring Node 20+ (the image runs 22), and it ships its own types,
  so `@types/nodemailer` went. Still to do by hand: send one real message
  through `/contact` and confirm the lead notification arrives.
- **Open (low):** `@ai-sdk/provider-utils` arrives through `@scalar`'s
  `/docs` reference; clears whenever `@scalar/api-reference-react` picks
  it up.

## 3. E2E — fixed 2026-10-04

`e2e.yml`'s daily run was red from 2026-09-21 because `e2e/site.spec.ts`
still navigated to slugs `7e42655` deleted from the seed. The seed is now
fictional demo content (ahead of making the repository public, so it
carries no claims about real work), and the spec targets its slugs. The
seed refuses to run in production (AGENTS.md §10).

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

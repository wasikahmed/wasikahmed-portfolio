# PLAN.md

Forward plan, written 2026-08-27 from a full review of the codebase as it stands.
Verified against a running system on 2026-08-30 (see below). This supersedes
the original build plan; nothing here is inherited from it.

Ordering below is a recommendation based on impact, not a contract. Reorder freely.

---

## Where the project actually is

**Done, deployed, and now verified live, not just read.** Seven public pages
rendering entirely from MongoDB; a complete design token system with an
enforced ambient budget and a tested reduced-motion contract; the typed query
layer with a published/draft split; a full admin CMS with argon2 + TOTP auth,
CSRF, Zod validation, an audit log, drag reordering, an MDX editor with live
preview, and a media library; a production Docker image and a push-to-main
deploy pipeline to the VPS. The contact form pipeline (W1) is now real and
deployed, admin password recovery (email OTP) is built and verified, and the
security hardening pass (W2) is done — see below. A real logomark, favicon,
and OG image now exist too (`metadataBase` is set), though the rest of W3's
SEO surface is still open.

**Verified healthy, both statically and by running it.** `typecheck`, `lint`,
`build`, `test`, and `format:check` all pass clean. No `any`, no `TODO`s, no
stray `console.log`, no dead dependencies. On 2026-08-30 the actual `Dockerfile`
production image was built and run against a real Mongo instance (not just
read) — health check, static generation with `dynamicParams` fallback, CSP
headers (`'unsafe-eval'` correctly absent outside dev), and every public route
all confirmed live. The admin login flow was driven through a real browser up
to the TOTP gate, confirming both the password and 2FA layers actually engage.
All 54 Playwright E2E tests pass.

**Decided 2026-08-30, next up in this order:** fold in five small findings
from that verification pass (below) — done → **W4's CI gate** (re-added, see
W4) — done → **W3 SEO** — done → the `queries.ts` visibility test from W6 →
W5 cleanup opportunistically. **Cloudflare Access activation is explicitly
deferred** — still fail-open on purpose, revisit as its own step later.

**The one thing that matters most now.**

1. **Cloudflare Access is still inactive in production — deferred, not
   forgotten.** The verification code is correct and `CF_ACCESS_TEAM_DOMAIN` /
   `CF_ACCESS_AUD` now flow through the deploy workflow's `.env` (W2 item 2),
   but nothing has set them yet — that requires creating the actual Access
   application in the Cloudflare dashboard, a manual step outside this repo,
   and outside this round of work by deliberate choice (2026-08-30). Until
   then `verifyCloudflareAccess` keeps no-opping. Everything else in W2 — auth
   rate limiting, CSP, the SVG upload hole, session `maxAge`, constant-time
   CSRF — is done and now verified live (see below).

The SEO gap that used to be listed here is closed — see W3.

---

## Verification pass — 2026-08-30

A full static re-review (does the code do what PLAN.md claims) came back
clean — see the git history around this date for the review itself. This
section covers the follow-up: actually running the system in Docker rather
than only reading it, plus five small things that only a live run surfaces.

**What was run:**

- The existing `docker compose watch` dev stack (mongo, mongo-express, web on
  :3300) — found with an **empty database** (0 documents); `pnpm seed` fixed
  that. Worth remembering: a fresh `docker compose watch` up needs an explicit
  `pnpm seed` — nothing does it automatically, and an empty DB fails silently
  as empty states, not errors.
- The real `Dockerfile` (production, standalone) image — built and run
  against the same Mongo, health-checked, and hit on every public route plus
  `/admin`, `/admin/login`, and `/api/contact`. This is what `deploy.yml`
  actually ships; it had not been exercised locally since W2 landed.
- `pnpm e2e` — all 54 tests pass, but only after `pnpm exec playwright
install` (the browser binary was missing entirely on this machine).
- A real browser driven through `/admin/login`: email + password accepted,
  correctly reveals the TOTP step. (Didn't complete TOTP — decrypting the
  stored secret to generate a live code touches `AUTH_SECRET` in a way this
  session's tooling declined to script; the two-layer gate itself is
  confirmed either way.)

**Five findings, none of them contradicting anything above — small additions:**

1. `admin-crud.ts` and `rate-limit.ts` both still pass Mongoose's deprecated
   `new: true` to `findOneAndUpdate` instead of `returnDocument: 'after'` —
   fires a deprecation warning on every request through either path. See W5.
2. `pnpm e2e`'s Playwright browser binary isn't installed by default and
   nothing in the repo documents that `pnpm exec playwright install` is a
   one-time prerequisite. See W6.
3. Playwright's `webServer` runs `pnpm exec next build && next start`, which
   Next.js itself warns is incompatible with `output: 'standalone'` — so
   `pnpm e2e` has never actually exercised the standalone server shape the
   production Docker image runs. Tests still pass because `next start` falls
   back to a normal server, but the coverage gap is real: nothing but a
   manual `docker build` (done once, this pass) proves the actual production
   artifact serves correctly. See W6.
4. The `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in `.env` is a real, domain-locked
   production key — Turnstile refuses to render on `localhost` (`error
110200`), so the contact form's Turnstile handshake has never been
   exercised end-to-end in local dev and can't be without either a
   Cloudflare-provided test sitekey or a dashboard change. Not a code bug.
   See W1/W6.
5. CSP's `'unsafe-eval'` in `script-src` is dev-only (stripped via a
   `NODE_ENV` check) and is correctly absent from the production image's
   response headers — confirmed by actually building and hitting that image,
   not just reading the code. No action needed; noting it because PLAN.md's
   original W2 write-up only documents the `style-src 'unsafe-inline'`
   trade-off, not this one.

---

## W1 — Make the contact form real — Done

Shipped across two pushes: the API route, then an admin-side pass on top of it.

- `POST /api/contact` — Zod validation, Cloudflare Turnstile verification, and
  rate limiting by IP hash. Persists to the `Lead` model, including
  `source`/`ipHash`/`userAgent`.
- Notification email via Gmail SMTP (an app password, not Resend — simpler for
  a single-admin CMS; see `src/server/email.ts` and `.env.example`).
- `ContactForm`'s `onSubmit` submits for real, with pending/success/error
  states. The "Not connected yet" panel is gone.
- `/admin/leads` is a full pipeline now, not just a status dropdown:
  - The list view (`/admin/leads`) is a compact, scannable row-per-lead list —
    name, email, intent, timestamp, one-line message preview, a status tag,
    and an inline status shortcut. Clicking a row opens the detail page.
  - `/admin/leads/[id]` shows the full submission (message, company, budget,
    notes) and auto-transitions a `new` lead to `read` the moment it's opened
    — no separate "mark as read" action to remember.
  - Status changes on both pages go through `LeadStatusControl`, a shared
    segmented control (not a `<select>`) that persists on click and
    colour-codes by status using existing design tokens (amber = new,
    accent = replied, muted = archived).
  - Added the missing `GET /api/admin/leads/[id]` route (`getOneHandler`,
    already generic — just wasn't wired up for leads).
- Replaced the bare sign-out link in the admin shell with `AdminProfile`, a
  popover (desktop sidebar + mobile bar) showing who's signed in, live 2FA
  status, a link to Security, and sign out.
- Dashboard card's "pipeline lands in Phase 5" note is gone.

**Verified:** a real submission from the public form lands in `/admin/leads`,
shows as "new," opening it marks it "read" automatically, and status/notes
changes persist. TOTP enrollment and login enforcement verified end to end
locally (see AGENTS.md §11).

**Not verifiable in local dev, 2026-08-30:** the actual Turnstile handshake.
`.env`'s `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is a real, domain-locked production
key — the widget refuses to render on `localhost` (`error 110200`). Either add
a Cloudflare-provided always-pass test sitekey to `.env.example` for local
dev, or accept this only gets exercised against the real deployed domain.

---

## Admin password recovery (email OTP) — Done, 2026-08-27

The admin account had no recovery path at all — a lost password meant a manual
`pnpm seed:admin` from the VPS. Added a self-serve "forgot password" flow.

- **Email OTP, deliberately not TOTP.** Reusing the TOTP 2FA code as the reset
  mechanism was considered and rejected: it collapses two independent factors
  (password, TOTP secret) into one, and it permanently locks the account out if
  the authenticator device itself is what's lost — the actual common case for
  needing recovery. Email is an independent recovery channel; TOTP still gates
  login afterward regardless of how the password was changed, so the account
  keeps its two factors.
- `POST /api/auth/forgot-password` — public, pre-auth (no session, no CSRF
  cookie exists yet, same reasoning as `/api/contact`). Generates a 6-digit
  code, stores only a salted SHA-256 hash of it (`PasswordReset` model,
  TTL-indexed, 10-minute expiry — same pattern as `RateLimit`), and emails it
  via a new `sendPasswordResetOtp()` in `src/server/email.ts` (same Gmail
  transporter, same no-op-if-unset guard as `sendLeadNotification`). Always
  returns `{ ok: true }` whether or not the email matches an account — no
  enumeration.
- `POST /api/auth/reset-password` — verifies the code with a constant-time
  compare, requires a 12-char-minimum new password, hashes it with the
  existing argon2id `hashPassword()`, deletes the used code (single-use), and
  writes an audit log entry. TOTP is untouched, so 2FA-enabled accounts still
  need a code to sign in after a reset.
- **Both routes are outside `proxy.ts`'s matcher** (`/api/auth/*` — the known
  gap in AGENTS.md §9), so they implement their own rate limiting by reusing
  `checkRateLimit`/`hashIp`: 5 req/hour per IP and 3 req/hour per targeted
  email on the request endpoint, 10/hour per IP and 8/hour per email on the
  verify endpoint (the real brute-force boundary, since a 6-digit code is only
  1e6 possibilities). Added a general-purpose `saltedHash()` to
  `src/server/rate-limit.ts` (alongside the existing IP-specific `hashIp()`)
  for hashing the email and the OTP itself.
- `/admin/forgot-password` — new public admin page (added to
  `PUBLIC_ADMIN_PATHS` in `proxy.ts`, which was the one non-obvious step: the
  page would otherwise 302 straight back to `/admin/login` before an
  unauthenticated visitor could ever reach it). Two-step form matching
  `LoginForm`'s progressive-disclosure pattern; `LoginForm` now links to it.

**Verified in the Docker dev stack:** requested a real OTP, confirmed the
request endpoint responds identically for an existing vs. non-existent email,
confirmed a wrong code is rejected, decoded the stored hash with the dev
`AUTH_SECRET` to complete a real reset, confirmed the same code can't be reused
(single-use), confirmed the audit log entry was written, confirmed the new
password is accepted by the credentials provider and TOTP is still required
afterward (`TOTP_REQUIRED` on the next sign-in), and confirmed both rate limits
trip after their configured thresholds. `pnpm seed:admin` was rerun afterward
to restore a real credential for local dev, since the test exercised the
actual seeded admin account rather than a disposable fixture.

**Not done as part of this:** Turnstile on these two routes (contact form has
it; forgot-password relies on rate limiting alone — revisit if abuse shows
up), and session invalidation on reset (existing JWT sessions elsewhere stay
valid until they expire — same accepted gap as the rest of W2 item 6's
`maxAge` question).

---

## W2 — Close the security gaps — Done, 2026-08-27

Ordered by exposure in the original plan; all seven items addressed.

1. **Rate-limited authentication.** `/api/auth/*` isn't in `proxy.ts`'s
   matcher (AGENTS.md §9), so — same pattern as `/api/auth/forgot-password` —
   the limit lives inside `authorize()` in `src/server/auth.ts` itself,
   checked before the DB lookup: 20 attempts/15min per IP, 8/15min per email
   hash, using the existing `checkRateLimit`/Mongo-TTL machinery. A new
   `RateLimitedError` (code `RATE_LIMITED`) surfaces a distinct message in
   `login-form.tsx`. **Deliberately a fixed window, not progressive
   backoff/lockout** — consistent with the same trade-off already accepted
   for the password-reset endpoints above, and simple enough to reason about
   for a single-admin account. Verified by scripting 9 rapid attempts against
   one email in the Docker dev stack: the first 8 return the normal
   `CredentialsSignin` error, the 9th returns `RATE_LIMITED`; a legitimate
   login with correct credentials for a fresh email still reaches
   `TOTP_REQUIRED` normally.
2. **Cloudflare Access wiring, not yet activated.** `CF_ACCESS_TEAM_DOMAIN`
   and `CF_ACCESS_AUD` now flow through `deploy.yml`'s heredoc from repo
   variables. **Left fail-open on purpose** — flipping `verifyCloudflareAccess`
   to fail closed when unset would lock `/admin` out entirely on the next
   deploy, since no Access application exists in the Cloudflare dashboard yet
   (that's a manual step, outside what this repo can do). Revisit fail-closed
   once the Access application is actually configured and `CF_ACCESS_TEAM_DOMAIN`/
   `CF_ACCESS_AUD` are set as real repo variables.
3. **SVG uploads dropped.** Removed from `ALLOWED_TYPES` in
   `/api/admin/media` and the upload input's `accept`.
4. **Security headers, CSP included.** Added in `proxy.ts` — CSP (nonce-based
   per Next's documented middleware pattern, `strict-dynamic`, `frame-ancestors
'none'`), `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`.
   Required broadening the matcher off `/admin/*`+`/api/admin/*` to
   (almost) everything — the admin-only session/CSRF/Cloudflare Access gating
   is untouched and still scoped exactly as before; every other route now
   only gets headers added. `style-src 'unsafe-inline'` is a deliberate,
   documented trade-off (Framer Motion and Shiki both write the `style`
   attribute directly, which CSP has no nonce mechanism for). Verified in the
   Docker dev stack: every `<script>` tag Next renders carries a matching
   nonce (checked programmatically, zero without one) across the homepage,
   `/admin/login`, and other pages; unauthenticated `/admin` and
   `/api/admin/*` still redirect/401 correctly; the full local gate
   (`typecheck`/`lint`/`format:check`/`test`/`build`) stayed green throughout.
   Not verified: live browser console CSP-violation checking — the Chrome
   extension wasn't connected this session, so this fell back to server-side
   HTML inspection instead. Worth a real browser pass before relying on it
   further, especially for the Turnstile widget and TOTP QR code.
5. **Uploads validated by content.** `/api/admin/media` now rejects a file
   `probe-image-size` can't read or whose detected `mime` isn't in
   `ALLOWED_TYPES`, and derives the stored extension from that detected type
   instead of the client-supplied filename — `file.type`/filename are no
   longer trusted for anything.
6. **Session `maxAge` set to 7 days,** down from Auth.js's 30-day default.
7. **`verifyCsrf` now uses a constant-time compare** (manual XOR loop — Edge
   runtime has no `node:crypto.timingSafeEqual`).

---

## W3 — SEO, sharing, and discoverability — Done, 2026-08-30

Shipped in one pass and verified three ways: the local gate green, `pnpm e2e`
54/54 (twice), and — critically, see the bug this caught below — the actual
production `Dockerfile` image built, seeded, and hit directly, not just
`next dev`.

- **`src/app/sitemap.ts`** — generated from `getProjects()`/`getPosts()` (the
  public `get*` family, so a draft can never appear), excludes
  `/design-system`. Marked `force-dynamic` deliberately: without it, Next
  statically generates the route once during `next build`, inside Docker,
  with no database reachable — production would serve an empty sitemap
  forever.
- **`src/app/robots.ts`** — allows everything except `/admin`; deliberately
  does **not** disallow `/design-system` (see below). **Caught a real
  production bug while verifying this in the actual Docker image**: without
  its own `force-dynamic`, Next fully static-generates `robots.txt` at build
  time (no DB dependency to force it dynamic otherwise) and bakes in
  whatever `NEXT_PUBLIC_SITE_URL` happened to be set to in the _build_
  stage — always empty, per the Dockerfile's design — into the `Sitemap:`
  line, permanently, regardless of the real value in the running
  container's `.env`. Fixed with the same `force-dynamic` export
  `sitemap.ts` already needed for a different reason. Confirmed fixed by
  rebuilding the production image and hitting `/robots.txt` directly.
- **`/writing/feed.xml`** — RSS 2.0, same `get*`-family safety, `force-dynamic`
  (Route Handlers already default to dynamic, so no fix needed there — only
  the two metadata-route files above had the static-generation trap).
  Linked from `/writing`'s `<head>` via `alternates.types`.
- **Per-page dynamic OG images** — `work/[slug]/opengraph-image.tsx` and
  `writing/[slug]/opengraph-image.tsx`, sharing the root's font-loading logic
  (extracted to `src/lib/og-font.ts`). Each honors a CMS-set `seo.ogImage` if
  present (the schema field existed but `publish-fields.tsx` never grew a UI
  for it — Satori composites a remote URL as an `<img>` the same way it
  already does the brand mark's data URI) and otherwise generates a card from
  the project's headline metric or the post's excerpt. Verified: fetched both
  generated PNGs directly, viewed them, confirmed the design holds.
- **JSON-LD** — `Person` on the homepage, `Article` on every post
  (`src/lib/json-ld.ts`). Verified present in the rendered HTML.
- **Canonical URLs** on every page in `(site)` via a shared `canonical()`
  helper (`src/lib/seo.ts`) — home, work, work/[slug], writing, writing/[slug],
  about, contact. Deliberately **not** on `/design-system` (see below).
- **The seven hardcoded `— Wasik Ahmed` titles replaced** with
  `settings.name` via a shared `pageTitle()` helper: `contact`, `about`,
  `work`, `writing`, `work/[slug]`, `writing/[slug]`, `design-system`.
  `work/[slug]` and `writing/[slug]` also now read the CMS's `seo.title`/
  `seo.description` overrides — the other half of "read nowhere" from the
  original write-up, alongside `ogImage` above.
- **`/design-system` decided: kept public, kept noindexed, not moved.** It's
  a real showcase linked from the public footer, not an internal tool — but
  it's also not content anyone should land on from search, and the page
  already sets `robots: { index: false }`. Deliberately **not** disallowed in
  `robots.txt` either: doing so would stop a crawler from ever fetching the
  page to see that meta tag, which is worse (an un-crawlable URL can still
  get indexed from an external link, with no snippet). `e2e/motion-contract.spec.ts`'s
  dependency on the route is now moot — nothing moved.

**Not done as part of W3:** analytics (Phase 6 also listed "analytics" —
`NEXT_PUBLIC_UMAMI_SCRIPT_URL`/`NEXT_PUBLIC_UMAMI_WEBSITE_ID` exist in
`.env.example` but are read nowhere in `src/`, confirmed 2026-08-30). Out of
scope for "SEO, sharing, and discoverability" specifically; needs its own
small task — wire the Umami script into the root layout behind those two
env vars, same no-op-if-unset pattern as email/Turnstile.

---

## W4 — Put a gate back in front of `main` — Done, 2026-08-30

Every item shipped in one pass, verified locally (`typecheck`/`lint`/
`format:check`/`test`/`build` all green, `pnpm e2e` — 54/54 — run twice
against the real standalone server shape, `deploy.yml`/`e2e.yml` both checked
with `actionlint` and a YAML parser).

- **`verify` job added to `deploy.yml`,** gating `build-and-push`:
  `typecheck`, `lint`, `format:check`, `test`, `build`. Uses
  `actions/setup-node`'s built-in pnpm-store caching rather than a hand-rolled
  cache step. A push to `main` now fails before Docker Hub ever sees an image
  if any of these fail — CI is a real backstop, not just the local gate in
  AGENTS.md §2 (which is still the one that should catch things first).
- **E2E split into its own `e2e.yml`,** deliberately out of the deploy path so
  it never gates a hotfix: runs on PRs into `main`, on a daily schedule, and
  on `workflow_dispatch`. Spins up a real `mongo:7` service container, seeds
  it (`pnpm seed`), installs the Playwright browser explicitly
  (`pnpm exec playwright install --with-deps chromium` — confirmed 2026-08-30
  this isn't present by default), and uploads the HTML report as an artifact
  on failure.
- **`playwright.config.ts`'s `webServer` now runs the actual standalone
  output,** not `next start`. Next.js itself warns `next start` is
  incompatible with `output: 'standalone'` (next.config.ts) — it "worked"
  before only because `next start` silently falls back to a normal server, so
  E2E was never exercising the artifact shape the production `Dockerfile`
  ships. The command now builds, copies `public/` and `.next/static` into
  `.next/standalone` (same as the `Dockerfile` already does — standalone
  output doesn't include either), and runs
  `node .next/standalone/server.js` directly. Verified: all 54 tests pass
  against this shape, both locally and via `e2e.yml`'s CI run.
- **Automatic rollback on a failed healthcheck.** `deploy.yml`'s "Write .env
  and deploy" step stashes the outgoing `IMAGE_TAG` into `.env.prev_tag` on
  the VPS before overwriting `.env`; "Health check" reads it back and
  redeploys that tag if the new image never goes healthy within 60s. The job
  still fails either way — a rollback means production is safe, not that the
  push was good. Manual rollback to some _other_ tag is still just editing
  `.env` and re-running pull + up.
- **Backups — local retention only,** decided 2026-08-30 after asking: an
  off-box destination (S3/R2/B2 via rclone) needs credentials this session
  can't create on the user's behalf, so that's deferred rather than guessed
  at. `scripts/vps-backup.sh` runs nightly via a cron entry `deploy.yml`'s
  "Install the backup cron job" step installs idempotently (greps out any
  prior line for the script before re-adding it, so redeploys never
  duplicate the crontab). Each run: `mongodump --archive --gzip` from inside
  the `mongo` container, a tarball of the `media-uploads` volume via a
  disposable `alpine` container, both dated under
  `$DEPLOY_PATH/backups/`, with anything older than `BACKUP_RETENTION_DAYS`
  (default 7) deleted after. This protects against a bad migration or an
  admin-CMS mistake — **not** against losing the VPS itself, since nothing
  leaves the box. Revisit off-box shipping as its own task if that risk
  becomes worth carrying.
- **Node version pinned.** Added `.nvmrc` (`22`, matching the Docker base
  image) and `"engines": { "node": "22.x" }` in `package.json`; both CI
  workflows read `.nvmrc` via `setup-node`'s `node-version-file`. Bumped
  `@types/node` from `^20` to `^22` to match — confirmed `pnpm typecheck`
  stays clean. Local dev Node (24) still works; `engines` documents intent,
  it isn't `engine-strict`.

**Also fixed while here, matching the existing `admin-crud.ts`/`rate-limit.ts`
pattern (see the verification-pass findings above):** the settings route
(`src/app/api/admin/settings/route.ts`) had the same deprecated Mongoose
`new: true` option; switched to `returnDocument: 'after'` alongside the other
two.

---

## W5 — Consistency and code health

None of this is urgent; all of it is cheap and reduces future bug surface.

- **Type the Mongoose models.** `mongoose.models.X ?? mongoose.model('X', schema)`
  loses the generic, which is why `queries.ts` carries twelve `as unknown as`
  casts. Passing the document type removes all of them.
- **Reconcile Zod and Mongoose schemas.** They are hand-maintained in parallel and
  have already drifted: `publishedAt` is `z.string().datetime()` in Zod but
  `Date` in Mongoose; the `Lead` model has `source`/`ipHash`/`userAgent` that
  `leadSchema` doesn't. Either generate one from the other or add a test that
  fails when they disagree.
- **Audit-log reorder operations.** `reorderHandler` is the only mutation that
  writes no audit entry. It also issues N sequential `findByIdAndUpdate` calls
  where one `bulkWrite` would do.
- **Settle the Role/Experience/Post/Writing naming.** `/api/admin/experience` →
  `Role` model → `entityType: 'role'`, and `/admin/posts` is labelled "Writing"
  in the nav. Pick one name per concept.
- **Fix `getAdjacentProjects`.** It wraps around, so a site with one published
  project links to itself as "Next project". `getAdjacentPosts` doesn't wrap —
  make them agree.
- **Move hardcoded copy into the CMS,** or accept it explicitly. `SelectedWork`'s
  "Four systems, still in production." is a literal above a dynamic grid and will
  be wrong the moment a fifth ships. `Process.STEPS` and About's `STORY` are
  hardcoded arrays on an otherwise fully CMS-driven site.
- `formatDate` hardcodes `en-GB`.
- **Replace deprecated Mongoose `new: true` with `returnDocument: 'after'`.**
  Confirmed 2026-08-30 firing a real deprecation warning on every request:
  `admin-crud.ts:143` and `rate-limit.ts:43` both still use the old option.
- ~~Run `pnpm format`~~ — **done.** `pnpm format:check` confirmed clean
  2026-08-30.
- Drop the stale `_reference/**` exclude from `vitest.config.ts`; that directory
  no longer exists.
- Write a `README.md`. There isn't one.

---

## W6 — Testing

Three unit tests exist and all three cover `clamp()`. The E2E suite is genuinely
good — route sweep, horizontal-overflow checks at four viewports, command
palette, and a real reduced-motion contract — but it stops at the public site.

Priority order, by what would actually catch a costly bug:

1. **`queries.ts` visibility rules.** A regression in `visibleNow()` publishes
   drafts. This is the highest-value test in the repo and does not exist.
2. **`admin-crud.ts`** — auth rejection, CSRF rejection, Zod rejection, duplicate
   key → 409, audit entry written.
3. **`totp.ts`** encrypt/decrypt round-trip and drift window; `password.ts`
   hash/verify.
4. **Zod schemas** — that each one rejects the shapes it is supposed to.
5. **An admin E2E path**: log in, create a project, publish it, confirm it
   appears on the public site, delete it.
6. Make E2E seed its own fixtures. It currently navigates to hardcoded slugs
   (`docflow-ai`, `when-to-build-vs-buy-ai`) and fails outright against a fresh
   database.

---

## Dependencies

In good shape overall. Patch-level drift only on the things that matter:
`next` and `eslint-config-next` 16.3.2 → 16.3.3, `mongoose` 9.9.3 → 9.9.4,
`@types/react-dom`. Take these routinely.

Majors available, none urgent, each its own small piece of work:
`eslint` 9 → 10, `typescript` 5 → 7, `vitest` 3 → 4, `@vitejs/plugin-react` 5 → 6,
`prettier-plugin-tailwindcss` 0.6 → 0.8. `@types/node` 20 → 22 belongs to W4.

`next-auth` is pinned at `5.0.0-beta.32` — a beta in production. Auth.js v5 has
been beta for a long time and there is no v4 path back worth taking; the risk is
real but accepted. Pin it exactly (it already is) and read the changelog before
any bump.

---

## Appendix — decoding the old phase numbers

41 comments across 37 source files reference a `PLAN.md` section or a "Phase N"
that no longer exists. They are not wrong, just unresolvable. Rather than
rewrite all of them, here is the mapping; clean the references up opportunistically
as you touch each file.

| Old reference         | What it meant                                          | Status                                                                          |
| --------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Phase 0               | Next.js foundations, tooling, TypeScript config        | Done                                                                            |
| Phase 1 / §2.8        | Design system — tokens, primitives, motion             | Done                                                                            |
| Phase 2 / §2.x        | Public site — seven pages, signature interactions      | Done                                                                            |
| Phase 3               | Data layer — MongoDB, Mongoose, seed, typed queries    | Done                                                                            |
| Phase 4 / §3          | Admin CMS — auth, TOTP, CRUD, MDX editor, media, audit | Done                                                                            |
| Phase 5               | Leads pipeline — contact API, Turnstile, notifications | **Done — W1**                                                                   |
| Phase 6               | Polish — SEO, OG, RSS, analytics                       | SEO done — W3. Analytics (Umami) not started, not in a W                        |
| Phase 7 / §4          | Production Docker image, CI/CD, VPS deploy             | Done — W2/W4 finished it                                                        |
| Phase 8               | Real photography and final content                     | Not started                                                                     |
| §2.10                 | Ambient budget (max two layers per section)            | Done, type-enforced                                                             |
| §3 "defense in depth" | The three auth layers                                  | Layers 2/3 done, layer 1 (Cloudflare Access) wired but inactive — see W2 item 2 |

The `AGENTS.md` reference in `.github/workflows/deploy.yml:8` is valid again —
the local pre-push gate lives in AGENTS.md §2.

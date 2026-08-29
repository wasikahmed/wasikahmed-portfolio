# PLAN.md

Forward plan, written 2026-08-27 from a full review of the codebase as it stands.
Verified against a running system on 2026-08-30, then advanced through W3, W4,
analytics, and the first W6 test the same day (see below). This supersedes the
original build plan; nothing here is inherited from it.

Ordering below is a recommendation based on impact, not a contract. Reorder freely.

---

## Where the project actually is

**Done, deployed, and verified live at every step — not just read, and not
just built.** Seven public pages rendering entirely from MongoDB; a complete
design token system with an enforced ambient budget and a tested
reduced-motion contract; the typed query layer with a published/draft split,
now with a real test proving that split holds (W6 item 1); a full admin CMS
with argon2 + TOTP auth, CSRF, Zod validation, an audit log, drag reordering,
an MDX editor with live preview, and a media library; a full SEO surface
(sitemap, robots, RSS, JSON-LD, per-page dynamic OG images, canonical URLs —
W3); Umami analytics wired in behind two optional env vars; a CI-gated,
auto-rollback, backed-up, Node-pinned deploy pipeline to the VPS (W4). The
contact form pipeline (W1) is real and deployed, and admin password recovery
(email OTP) is built and verified.

**Verified healthy, statically, by running it, and by breaking it on
purpose.** `typecheck`, `lint`, `build`, `test`, and `format:check` all pass
clean. No `any`, no `TODO`s, no stray `console.log`, no dead dependencies.
Every push since 2026-08-30 has gone through the real `Dockerfile` production
image — built with `--no-cache`, seeded, and hit directly, which is what
caught the `robots.ts` build-time-freeze bug below and confirmed the Umami
script clears CSP with a real headless browser. All 54 Playwright E2E tests
pass, both locally and via the real standalone server shape (W4). The
`queries.ts` visibility test (W6 item 1) was deliberately sabotaged once to
confirm it actually fails when it should, then restored.

**Decided 2026-08-30, work completed in this order:** fold in five small
findings from the verification pass (below) — done → **W4's CI gate** —
done → **W3 SEO** — done → **Umami analytics** (the rest of Phase 6) — done
→ **W6 items 1–5** (visibility test, admin-crud, totp/password, Zod
schemas, admin E2E path) — done, and **one critical production bug found
and fixed along the way** (see below) → **Cloudflare Access status
corrected** (see below — it was never actually inactive). Next up: W6 item
6 was decided rather than pursued further (see W6); W5 cleanup remains.

**A critical bug, found and fixed 2026-08-30 while writing the admin E2E
test (W6 item 5):** `/admin/login` and `/admin/forgot-password` had no
dynamic API call of their own, so Next statically prerendered both at
build time — freezing ONE nonce into their `<script>` tags forever, while
`proxy.ts`'s CSP header carries a fresh nonce on every request. Under
`strict-dynamic`, a mismatched nonce means the script doesn't run at all —
**the admin login page could not hydrate in any CSP-enforcing browser
since the CSP rollout (W2, 2026-08-27)**, meaning the login form was
non-interactive in production for a real user this whole time, unless
their browser or an extension happened to relax CSP. Fixed with
`export const dynamic = 'force-dynamic'` on both pages (same pattern
`(site)/layout.tsx` already used, different reason). Verified against a
`--no-cache` production Docker build: header and HTML nonce now match, on
two separate requests, for both pages. See W2 and W6 below for the full
writeup.

**Cloudflare Access status corrected, 2026-08-30 — it is already active,
not deferred.** Every prior version of this file (including several
versions written earlier today) claimed Cloudflare Access was inactive/
no-opping in production. That was wrong. Discovered by accident: hitting
`https://wasikahmed.me/admin/login` directly during the CSP bug
investigation above returned a `302` to
`wasikahmed.cloudflareaccess.com`'s own login page — Cloudflare's edge is
actively gating `/admin` right now. Checking further: `CF_ACCESS_TEAM_DOMAIN`
and `CF_ACCESS_AUD` have been set as real GitHub repo variables since
**2026-08-27** (`gh variable list` confirms both, predating this entire
session), and `deploy.yml` has written them into the deployed `.env` on
every push since then (W2 item 2 shipped that wiring the same day). Since
`cloudflareAccessConfigured()` in `src/server/cloudflare-access.ts` is
`Boolean(CF_ACCESS_TEAM_DOMAIN && CF_ACCESS_AUD)`, the app has **not** been
no-opping either — `verifyCloudflareAccess()` has been actively verifying
the `Cf-Access-Jwt-Assertion` JWT on every `/admin/*` and `/api/admin/*`
request reaching the origin for the same three days. Both layers of
defense-in-depth's "layer 1" have been live the entire time this session
was (incorrectly) describing it as deferred. See the **Cloudflare Access**
section below for what's actually left to verify.

Every other gap this section used to list — SEO, analytics — is closed. See
W3 and the Analytics section below.

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
2. **Cloudflare Access wiring — and, corrected 2026-08-30, actually
   activated the same day this was written.** `CF_ACCESS_TEAM_DOMAIN` and
   `CF_ACCESS_AUD` flow through `deploy.yml`'s heredoc from repo variables,
   which were set for real on 2026-08-27 (same day as this W2 entry) —
   `gh variable list` confirms both, and every deploy since has written
   them into production. This repo's own PLAN.md nonetheless kept
   describing this as "not yet activated" / "deferred" through several
   rounds of edits, discovered wrong only on 2026-08-30 while investigating
   the CSP bug in W6 below. See the **Cloudflare Access** section for the
   current, verified status and what's still open.
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

   **This gap turned out to matter, 2026-08-30:** the "every script tag
   carries a matching nonce" check above only verified a nonce was
   _present_, not that it matched the response's actual CSP header — which
   held for every page except `/admin/login` and `/admin/forgot-password`,
   both statically prerendered and therefore serving one nonce forever
   against a fresh per-request header. A real headless-browser console
   check (which this W2 pass explicitly flagged as unverified) would have
   caught it immediately. Fixed in W6 below.

5. **Uploads validated by content.** `/api/admin/media` now rejects a file
   `probe-image-size` can't read or whose detected `mime` isn't in
   `ALLOWED_TYPES`, and derives the stored extension from that detected type
   instead of the client-supplied filename — `file.type`/filename are no
   longer trusted for anything.
6. **Session `maxAge` set to 7 days,** down from Auth.js's 30-day default.
7. **`verifyCsrf` now uses a constant-time compare** (manual XOR loop — Edge
   runtime has no `node:crypto.timingSafeEqual`).

---

## Cloudflare Access — active, status corrected 2026-08-30

**Read this before touching anything Cloudflare-related — it corrects
every earlier version of this file, including several written earlier in
this same day.** The short version: it is already on. Do not "activate"
it again; do not re-wire `CF_ACCESS_TEAM_DOMAIN`/`CF_ACCESS_AUD` thinking
they're unset. Verify, don't redo.

**What's actually confirmed, and how:**

- `CF_ACCESS_TEAM_DOMAIN=wasikahmed.cloudflareaccess.com` and
  `CF_ACCESS_AUD` are set as real GitHub repo variables — `gh variable list`
  confirms both, dated 2026-08-27. Every deploy since (`deploy.yml`'s
  heredoc) has written them into the VPS's `.env`.
- `src/server/cloudflare-access.ts`'s `cloudflareAccessConfigured()` is
  `Boolean(CF_ACCESS_TEAM_DOMAIN && CF_ACCESS_AUD)` — both being set means
  `verifyCloudflareAccess()` has been actively verifying the
  `Cf-Access-Jwt-Assertion` header's JWT (signature, audience) against
  Cloudflare's own JWKS on every `/admin/*` and `/api/admin/*` request
  reaching the origin, not no-opping, since 2026-08-27.
- **The Cloudflare-side Access application exists too** — confirmed
  2026-08-30 by hitting `https://wasikahmed.me/admin/login` directly (no
  cookies, no auth) and getting a real `302` to
  `wasikahmed.cloudflareaccess.com`'s own hosted login page, with a
  `CF_AppSession` cookie set and a `WWW-Authenticate: Cloudflare-Access`
  header. That is Cloudflare's edge itself gating the route — this is not
  something the app or `deploy.yml` could produce on its own; someone
  configured an actual Access application in the Cloudflare dashboard for
  this hostname/path, outside this repo, at some point on or before
  2026-08-27.

**So both defense-in-depth layers described in AGENTS.md §7 — edge-level
Cloudflare Access, and the app's own JWT verification — have been live for
three days.** This directly contradicts every prior claim in this file
("deferred," "no-opping," "not yet activated"); those were wrong, not
this correction.

**What is NOT yet confirmed, and is the actual remaining TODO:**

- **Nobody has walked the real end-to-end flow** in this session: Cloudflare
  Access login (whatever identity provider it's configured with — Google,
  a one-time PIN, GitHub, etc.) → origin receives a valid
  `Cf-Access-Jwt-Assertion` → the app's own password + TOTP layer still
  applies on top. This needs the actual site owner, since it requires a
  real Access-authorized identity — nothing this session can script or
  fake. **Action: log in through `https://wasikahmed.me/admin/login`
  yourself once, end to end, and confirm it reaches the password form
  after Access clears you.**
- **Whether fail-open is still the right default is now a live question,
  not a hypothetical one.** `verifyCloudflareAccess()` returns `true` when
  the env vars are unset (fail-open) — reasonable when nothing was
  configured, but the vars _are_ configured now, in production, meaning a
  future accidental unset (a botched `.env` rewrite, a variable deleted in
  the GitHub UI) would silently fall back to open rather than failing
  closed. Worth deciding deliberately: alert if `NODE_ENV=production` and
  these vars are missing, at minimum.
- **Which identity provider Access is configured with, and who besides the
  site owner has access** — not visible from this repo or from the outside
  and not addressed here.
- Update AGENTS.md §7 if it still describes this as inactive (check before
  the next edit there — this correction was made directly to PLAN.md,
  worth propagating).

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

Analytics (Phase 6's other half) was deliberately left out of this pass as
out of scope for "SEO, sharing, and discoverability" specifically — see
below, done the same day.

---

## Analytics — Done, 2026-08-30

Umami, self-hosted or cloud, behind two optional env vars — the last piece
of the old Phase 6 "polish" bucket.

- **`src/app/(site)/layout.tsx`** injects the tracking script via
  `next/script` (`strategy="afterInteractive"`), only when both
  `NEXT_PUBLIC_UMAMI_SCRIPT_URL` and `NEXT_PUBLIC_UMAMI_WEBSITE_ID` are
  set — same no-op-if-unset pattern as email/Turnstile elsewhere. Lives in
  the `(site)` layout specifically, not the root one, so admin usage is
  never counted alongside real visitor traffic.
- **`src/proxy.ts`'s CSP** allow-lists the script's origin (parsed once from
  `NEXT_PUBLIC_UMAMI_SCRIPT_URL` at module load) in `connect-src` — the
  nonce'd `<script>` tag itself loads fine under `strict-dynamic` regardless
  of host, but the tracking beacon it fires is a same-origin `fetch`/`XHR`
  by default, which `connect-src` has to separately allow.
- Added to `.env.example` (with a comment saying what reads it) and
  `deploy.yml`'s variable-docs comment and `.env` heredoc, per AGENTS.md §8.
- **Verified in the actual production Docker image with a real headless
  browser** (not just `curl` — a `<script>` tag with `strategy=
"afterInteractive"` is injected client-side after hydration, so it never
  appears in the raw SSR HTML): the script renders with the correct
  `src`/`data-website-id` attributes, fires a request to the configured
  origin, produces zero CSP-violation console errors, and is confirmed
  absent from `/admin`. Also confirmed the script is absent entirely from
  the homepage when both env vars are unset (today's actual production
  state — nobody has set these yet).

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
Four items closed 2026-08-30 in a pass alongside W6 — the rest remain open.

- ~~**Fix `getAdjacentProjects`.**~~ — **done, 2026-08-30.** Dropped the
  wrap-around (a site with one published project no longer links to itself
  as "Next project"), matching `getAdjacentPosts`'s existing behavior. Two
  new tests in `queries.test.ts` cover it: first/last-of-N have no
  prev/next respectively, and a single project has neither.
- ~~**Audit-log reorder operations.**~~ — **done, 2026-08-30.**
  `reorderHandler` now takes an `entityType` (all six call sites updated)
  and writes one audit entry per reorder — not per item, since it's one
  logical change — plus switched the N sequential `findByIdAndUpdate`
  calls to a single `bulkWrite`. Three new tests in `admin-crud.test.ts`
  (401, 422 on empty `ids`, and that array-position ordering + the single
  audit entry are both correct).
- ~~Write a `README.md`.~~ — **done, 2026-08-30.** Quick-start, stack
  summary, and pointers to AGENTS.md/PLAN.md for everything else.
- ~~**Replace deprecated Mongoose `new: true` with `returnDocument: 'after'`.**~~
  — **done, 2026-08-30.** Fixed in `admin-crud.ts`, `rate-limit.ts`, and (not
  in the original finding, same issue) the settings route.
- ~~Run `pnpm format`~~ — **done.** `pnpm format:check` confirmed clean
  2026-08-30.
- ~~Drop the stale `_reference/**` exclude from `vitest.config.ts`~~ — **done,
  2026-08-30,** in passing while adding the `server-only` alias next to it
  (W6 item 1).

**Still open:**

- **Type the Mongoose models.** `mongoose.models.X ?? mongoose.model('X', schema)`
  loses the generic, which is why `queries.ts` carries twelve `as unknown as`
  casts. Passing the document type removes all of them.
- **Reconcile Zod and Mongoose schemas.** They are hand-maintained in parallel and
  have already drifted: `publishedAt` is `z.string().datetime()` in Zod but
  `Date` in Mongoose; the `Lead` model has `source`/`ipHash`/`userAgent` that
  `leadSchema` doesn't. Either generate one from the other or add a test that
  fails when they disagree.
- **Settle the Role/Experience/Post/Writing naming.** `/api/admin/experience` →
  `Role` model → `entityType: 'role'`, and `/admin/posts` is labelled "Writing"
  in the nav. Pick one name per concept. Deliberately not touched in this pass —
  a rename across routes/models/nav is exactly the kind of change that wants
  its own review, not a drive-by alongside a security fix and five test files.
- **Move hardcoded copy into the CMS,** or accept it explicitly. `SelectedWork`'s
  "Four systems, still in production." is a literal above a dynamic grid and will
  be wrong the moment a fifth ships. `Process.STEPS` and About's `STORY` are
  hardcoded arrays on an otherwise fully CMS-driven site.
- `formatDate` hardcodes `en-GB`.

---

## W6 — Testing

Items 1–5 done, 2026-08-30 — item 6 decided rather than pursued (see below).
Before this pass, three unit tests existed and all three covered `clamp()`;
now 85 do, across six files, plus a fifth E2E spec covering the real admin
path. The E2E suite is genuinely good — route sweep, horizontal-overflow
checks at four viewports, command palette, a real reduced-motion contract,
and now a full admin login → create → publish → delete round trip — and no
longer stops at the public site.

Priority order, by what would actually catch a costly bug:

1. ~~**`queries.ts` visibility rules.**~~ — **Done, 2026-08-30.**
   `src/server/__tests__/queries.test.ts`, against a real ephemeral
   MongoDB (`mongodb-memory-server`) rather than a mock — covers
   `getProjects`/`getPosts`/`getAllProjects`/`getAllPosts`/`getProject`/
   `getPost`/`getProjectSlugs`/`getPostSlugs` across draft,
   scheduled-future, scheduled-past-due, and published status combinations,
   plus (added same day, folded in alongside the W5 fix) `getAdjacentProjects`'s
   wrap-around removal. Deliberately sabotaged `visibleNow()` once
   mid-implementation to confirm 6/10 tests actually fail when the filter
   is broken, then restored it — a green test suite that can't go red on
   its own regression isn't worth having. Required two small infra
   additions: `vitest.config.ts` now aliases `server-only` to its own empty
   `react-server` export (every `import 'server-only'` module — `db.ts`,
   `queries.ts` — threw immediately on import in Vitest otherwise, since
   Vite doesn't resolve that package's export condition the way Next's
   bundler does), and `mongodb-memory-server`'s postinstall is disabled in
   `pnpm-workspace.yaml`'s `allowBuilds` (confirmed it would otherwise
   download a ~75MB mongod binary on every `pnpm install`, including inside
   the Docker build, which never runs a test) — the binary instead
   downloads on demand the first time a real test run needs it, confirmed
   both ways.
2. ~~**`admin-crud.ts`**~~ — **Done, 2026-08-30.**
   `src/server/__tests__/admin-crud.test.ts` — the four things AGENTS.md §4
   rule 5 requires (session check, CSRF, Zod, audit log) proven against the
   real generic factory, plus 409 on a duplicate key and (added alongside
   the W5 reorder fix) the reorder handler's own 401/422/bulk-write/
   single-audit-entry behavior. `getAdminSession` is mocked (its own
   integration surface, not what this file tests); CSRF and the database
   side are real, via the same `mongodb-memory-server` pattern as item 1.
3. ~~**`totp.ts`** encrypt/decrypt round-trip and drift window;
   **`password.ts`** hash/verify.~~ — **Done, 2026-08-30.**
   `totp.test.ts`: AES-256-GCM round-trip, a fresh IV each call, GCM
   auth-tag tamper detection, drift window (accepts one period back,
   rejects three), whitespace trimming. `password.test.ts`: argon2id
   round-trip, wrong-password rejection, per-call salt, and
   `generatePassword`'s excluded-character set.
4. ~~**Zod schemas**~~ — **Done, 2026-08-30.** `schemas.test.ts`, 40 tests —
   every exported schema, a happy path plus a representative rejection per
   constraint (enum, regex, min/max length, required field).
5. ~~**An admin E2E path**~~ — **Done, 2026-08-30.** `e2e/admin.spec.ts`:
   log in with a deterministic no-TOTP account
   (`scripts/seed-e2e-admin.ts` / `pnpm seed:e2e-admin`), create a project
   through the real form, publish it, confirm it's live on `/work`, delete
   it, confirm 404 on both the admin list and the public route. **This is
   what surfaced the critical CSP bug** documented at the top of this
   file and in W2 — the test could not get past the login page at all
   until `admin/login/page.tsx` and `admin/forgot-password/page.tsx` were
   fixed with `force-dynamic`.
6. **Decided, not pursued further, 2026-08-30:** making E2E seed its own
   fixtures independent of the real seed-data. `site.spec.ts`'s specific
   content assertions (exact headline metrics, filter counts, command-palette
   results) are deliberately coupled to the actual seed-data — correct for a
   single-tenant site with fixed, versioned content, since decoupling them
   would trade real content-regression coverage for marginal robustness
   benefit. `pnpm seed` is already a required, documented step everywhere
   E2E actually runs (both locally, per AGENTS.md §2, and in `e2e.yml`), so
   the practical form of "fails outright against a fresh database" is
   already handled — a fresh database is never what any real run uses.

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
| Phase 6               | Polish — SEO, OG, RSS, analytics                       | Done — W3 (SEO/OG/RSS) and the Analytics section                                |
| Phase 7 / §4          | Production Docker image, CI/CD, VPS deploy             | Done — W2/W4 finished it                                                        |
| Phase 8               | Real photography and final content                     | Not started                                                                     |
| §2.10                 | Ambient budget (max two layers per section)            | Done, type-enforced                                                             |
| §3 "defense in depth" | The three auth layers                                  | Layers 2/3 done, layer 1 (Cloudflare Access) wired but inactive — see W2 item 2 |

The `AGENTS.md` reference in `.github/workflows/deploy.yml:8` is valid again —
the local pre-push gate lives in AGENTS.md §2.

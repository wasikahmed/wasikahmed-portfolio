# PLAN.md

Forward plan, written 2026-08-27 from a full review of the codebase as it stands.
This supersedes the original build plan; nothing here is inherited from it.

Ordering below is a recommendation based on impact, not a contract. Reorder freely.

---

## Where the project actually is

**Done and deployed.** Seven public pages rendering entirely from MongoDB; a
complete design token system with an enforced ambient budget and a tested
reduced-motion contract; the typed query layer with a published/draft split; a
full admin CMS with argon2 + TOTP auth, CSRF, Zod validation, an audit log, drag
reordering, an MDX editor with live preview, and a media library; a production
Docker image and a push-to-main deploy pipeline to the VPS. The contact form
pipeline (W1) is now real and deployed, admin password recovery (email OTP) is
built and verified, and the security hardening pass (W2) is done — see below.
A real logomark, favicon, and OG image now exist too (`metadataBase` is set),
though the rest of W3's SEO surface is still open.

**Verified healthy.** `typecheck`, `lint`, `build`, and `test` all pass clean.
No `any`, no `TODO`s, no stray `console.log`, no dead dependencies.

**The two things that matter most, in order.**

1. **Cloudflare Access is still inactive in production.** The verification
   code is correct and `CF_ACCESS_TEAM_DOMAIN` / `CF_ACCESS_AUD` now flow
   through the deploy workflow's `.env` (W2 item 2), but nothing has set them
   yet — that requires creating the actual Access application in the
   Cloudflare dashboard, a manual step outside this repo. Until then
   `verifyCloudflareAccess` keeps no-opping, deliberately (see W2 below for
   why fail-closed wasn't flipped on yet). Everything else in W2 — auth rate
   limiting, CSP, the SVG upload hole, session `maxAge`, constant-time CSRF —
   is done.
2. **The site has no SEO surface.** No sitemap, robots, RSS, or JSON-LD.
   `NEXT_PUBLIC_SITE_URL` is written into production `.env` by CI and now
   read by exactly one thing (`metadataBase`) — everything else in W3 is
   still open.

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

## W3 — SEO, sharing, and discoverability

Currently absent in full. Everything here is standard App Router surface area.

- `metadataBase` in the root layout, sourced from `NEXT_PUBLIC_SITE_URL` — which
  means actually reading that variable for the first time.
- `app/sitemap.ts` and `app/robots.ts`, both generated from the query layer so
  drafts stay out. **Exclude `/design-system`.**
- `opengraph-image.tsx` — a static one for the site, dynamic per case study and
  per post. The `seo` field (`title`, `description`, `ogImage`) already exists on
  Project and Post and is edited in the CMS but is read nowhere.
- RSS feed for `/writing`.
- JSON-LD: `Person` on the homepage, `Article` on posts.
- Canonical URLs on every page.
- Replace the four pages that hardcode `— Wasik Ahmed` in their title with
  `settings.name`, matching what the homepage already does.
- Decide what `/design-system` is. It is linked from the public footer and
  crawlable today. Either move it behind `/admin`, or keep it public as a
  deliberate showcase — but not by default. Note `e2e/motion-contract.spec.ts`
  depends on the route, so a move means updating those tests.

---

## W4 — Put a gate back in front of `main`

Today a push to `main` deploys unverified. That the working tree currently fails
`pnpm format:check` on two files is the evidence that local-discipline-only does
not hold.

- Add a `verify` job to `deploy.yml` — `typecheck`, `lint`, `format:check`,
  `test`, `build` — and make `build-and-push` depend on it. The original job was
  removed because it added ~3 minutes; that cost is worth it, and most of it can
  be recovered with a pnpm store cache.
- Run E2E on a schedule or on PRs rather than in the deploy path, so it doesn't
  gate a hotfix.
- Automate rollback on a failed healthcheck: capture the previous `IMAGE_TAG`
  before writing the new `.env`, and restore it if the health loop times out.
- **Back up the data.** Neither the `mongo-data` nor the `media-uploads` volume
  is backed up anywhere. A `mongodump` + uploads tarball on a cron, shipped off
  the box, is the whole task — and right now a volume loss is total content loss.
- Pin the Node version: add `.nvmrc` / `engines` and bump `@types/node` from `^20`
  to `^22`. Local Node is 24, Docker is 22, and the types say 20.

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
- Run `pnpm format` — `docker-compose.prod.yml` and `src/server/csrf.ts` are
  currently unformatted.
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
| Phase 6               | Polish — SEO, OG, RSS, analytics                       | **Not started → W3**                                                            |
| Phase 7 / §4          | Production Docker image, CI/CD, VPS deploy             | Partial — W2/W4 finish it                                                       |
| Phase 8               | Real photography and final content                     | Not started                                                                     |
| §2.10                 | Ambient budget (max two layers per section)            | Done, type-enforced                                                             |
| §3 "defense in depth" | The three auth layers                                  | Layers 2/3 done, layer 1 (Cloudflare Access) wired but inactive — see W2 item 2 |

The `AGENTS.md` reference in `.github/workflows/deploy.yml:8` is valid again —
the local pre-push gate lives in AGENTS.md §2.

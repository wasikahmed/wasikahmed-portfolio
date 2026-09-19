# PLAN.md

Forward plan, written 2026-09-04 from a full re-read of the codebase against
the previous plan (now archived at
[`docs/history/PLAN-2026-08.md`](docs/history/PLAN-2026-08.md), closed
2026-08-30).

**This phase has one theme: turn a single-admin CMS into a real multi-user
system.** Fixed roles with permission-based checks, a user-management surface
that can actually invite and remove people, a Bearer-token API for
non-browser clients, and generated API documentation. Cloudflare Access comes
out along the way — not as a side quest, but because it structurally blocks
multi-user (see W8).

Everything below is ordered by dependency, not by preference. W7 and W8 are
prerequisites; W9 → W14 build on each other.

---

## Progress — 2026-09-20

**Everything below was written and verified 2026-09-06, then sat on local
`main` for two weeks, never pushed.** Today was the actual deploy day, and it
surfaced three real bugs that no amount of re-reading the diff would have
caught — all three needed the running app, not the code, to find.

**Before deploying:** a full functional pass against the Docker dev stack,
driving the app directly rather than reading the tests — login (password +
TOTP, full round trip), content CRUD with draft/publish visibility and the
audit log, media upload (PNG accepted, SVG rejected, a fake-PNG-containing-a-
script rejected on sniffed content, not claimed MIME type), settings, and the
entire W9–W12 user-management lifecycle end to end using two genuinely
independent sessions (same browser, different origins — `localhost` vs.
`127.0.0.1` — to get real parallel cookies): invite → accept-invite → editor
logs in → permission ceiling enforced at the API (403) and the publish
boundary enforced at the schema (422) → promoted to admin with the _same
already-open session_ going from 403 to 200 with no re-login → suspended with
that same session going 200 to 401 on its very next request → self-guards and
owner-guards confirmed via direct API calls → ownership transfer confirmed
atomic, and confirmed instant on the demoted former owner's still-open
session. Bearer tokens: issued, used with zero cookie/CSRF, refreshed,
rotated, and reuse-detection confirmed to revoke the entire token family
including a still-valid newer token. All of this passed. **Correction to the
"W14 (tests) not started" line below:** most of W14 is actually covered by
the unit tests W9–W13 already added — see W14's own section for the
one real gap.

**What deploying today actually found, in order:**

1. **`main` was 15 commits ahead of `origin/main`.** Everything from W7
   onward — including the Cloudflare Access removal (W8) — existed only
   locally. `deploy.yml` hadn't run since 2026-08-29 not because CI was
   broken, but because nothing had been pushed.
2. **Production was already broken because of that gap**, not despite it:
   the deployed `.env` still had `CF_ACCESS_TEAM_DOMAIN`/`CF_ACCESS_AUD` set
   from before Access was torn down at the Cloudflare dashboard level.
   `proxy.ts`'s old layer-1 check requires a `Cf-Access-Jwt-Assertion` header
   that no longer arrives, and fails _closed_ — so `/admin` redirected to `/`
   and `/api/admin/*` 403'd unconditionally, for everyone, including the
   real owner. Confirmed live with `curl` before touching anything. Pushing
   W8 (which deletes the whole check and stops writing those two vars into
   `.env`) fixed this outright — verified after deploy: `/admin` now
   redirects to `/admin/login`, `/api/admin/*` now 401s instead of 403ing.
3. **Two of four new GitHub Actions secrets landed in the wrong namespace.**
   `GMAIL_USER` and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` were added as
   _secrets_; `deploy.yml` reads them as `vars.*`. `${{ vars.X }}` and a
   secret named `X` don't fall back to each other — both would have
   rendered empty in production's `.env`, silently disabling Turnstile
   verification and lead-notification email in production while `.env.example`
   confidently claims both are wired up. Fixed by moving both to repo
   variables (neither is sensitive — one's a public site key, the other's
   an email address already visible in this file's own comments).
4. **Sign-out redirected to `http://0.0.0.0:<port>/admin/login`** — the
   container's own bind address, not the real domain. Root-caused by
   actually building and running the standalone production server locally
   (`node server.js`, `HOSTNAME=0.0.0.0`, identical to
   `docker-compose.prod.yml`) rather than trusting that a dev-mode check was
   representative: Auth.js v5's `createActionURL()` falls back to the
   request's `Host` header when `AUTH_URL`/`NEXTAUTH_URL` is unset, and that
   resolution leaks the bind address instead under this app's required
   `HOSTNAME=0.0.0.0`. The session was destroyed correctly either way — this
   was a broken redirect, not an auth hole. Fixed by setting `AUTH_URL` from
   the existing `NEXT_PUBLIC_SITE_URL` value in `deploy.yml`, rather than a
   second variable that could drift from it.
5. **`/docs` rendered as a completely blank page in production** — every
   script blocked by CSP, including Next.js's own hydration bundle. Found
   _after_ the first deploy, checking the live site in a real browser rather
   than trusting the W13 section's own "verified live in a real browser"
   claim below, which was true only against the dev server. Root cause:
   `next build` classified `/docs` as static (`○`) because its page is a
   Client Component with no data dependency, so it prerenders once at build
   time — but `proxy.ts`'s nonce-based CSP is generated fresh on every
   request, and a nonce baked into build-time HTML can never match a
   per-request header. The dev server never surfaces this because it always
   renders per request, static or not. Fixed with a new `src/app/docs/
layout.tsx` exporting `dynamic = 'force-dynamic'` — has to live in a
   layout rather than `page.tsx` itself, since Next only reads route-segment
   config from a Server Component and the page is a Client Component.
   Verified by rebuilding, confirming `next build` now lists `/docs` as `ƒ`
   (dynamic), and loading it against the standalone production server with
   zero console errors before shipping the fix.

**Deployed and verified live against `wasikahmed.me`** after both pushes:
health check green, `/admin` → `/admin/login`, `/api/admin/*` → 401,
`/docs` and `/api/openapi.json` serving correctly with no console errors,
public pages and the SEO surface (`/sitemap.xml`, `/robots.txt`,
`/writing/feed.xml`) all 200, security headers present.

**Still outstanding, not blocking anything:** production's admin user is
still `role: 'admin'` from before this phase, not `owner` — run
`pnpm seed:admin` against production once to migrate it (PLAN.md W9's own
migration note). That script also resets the password as a side effect and
prints the new one once; save it when it does. `admin` already has every
functional permission `owner` has, so this is a consistency fix, not an
access problem.

---

## Progress — 2026-09-06

**W7 (truth-up), W8 (Cloudflare Access removed), W9 (permissions core), W10
(database-backed sessions + enforcement), W11 (user management), W12 (Bearer
tokens), and W13 (API documentation) are done, tested, and verified live
against the Docker dev stack.** The remaining items of W14 (tests) are not
started. One addition not in the original plan, done alongside W11:

**W11a — Google sign-in**, added mid-session at the user's request. A second
login path for `/admin`, registered only when `AUTH_GOOGLE_ID`/
`AUTH_GOOGLE_SECRET` are set (Google Cloud Console OAuth client, not yet
provided — the button simply doesn't render until then). Deliberately never
a signup path: `auth.ts`'s `signIn` callback rejects any Google account whose
email has no existing, non-suspended User document, before a session is ever
issued — the same "no signup route" invariant AGENTS.md §7 has always
stated, extended to cover the new entry point. Once past that gate it
produces the identical JWT session shape credentials does; `getAdminSession()`
doesn't distinguish which provider was used.

**What actually shipped, by workstream:**

- **W9 — permissions core.** `src/server/permissions.ts`: the
  `viewer`/`editor`/`admin`/`owner` matrix and `can()`. Found and fixed a
  real self-contradiction in this file's own original W9 role table while
  writing W14's publish-boundary test: `editor` was listed with
  `content:publish`, which would have made the permission a no-op (every
  role that could write could also publish). Moved to `admin`, matching the
  stated rationale and the acceptance test — the test caught this before it
  shipped. `User` model gained `name`/`status`/`lastLoginAt`/`invitedBy`,
  widened `role`, and `passwordHash` is now optional (for an invited user
  with no password yet).
- **W10 — enforcement.** `session.ts`'s `getAdminSession()` is now wrapped
  in `cache()` and re-reads the User document on every call instead of
  trusting the JWT's role claim — a demoted, suspended, or deleted user is
  rejected on their very next request. `admin-crud.ts`'s `requireSession()`
  became `requirePermission()`; every hand-written admin route
  (audit-log, leads, media, settings, mdx-preview) got an explicit check or
  an explicit comment recording why it deliberately has none
  (password/TOTP routes — self-service, not permission-gated).
  `content:publish` is enforced at the Zod layer (`withPublishGuard()` in
  schemas.ts), not just the route.
- **W11 — user management.** `/admin/users`: list, invite (creates a
  `status: 'invited'` user immediately, emails a single-use 7-day token via
  the existing Gmail-SMTP path), inline role change, suspend/reactivate,
  delete, and owner-only ownership transfer. `/admin/accept-invite/[token]`
  (public, Turnstile-gated, added to `proxy.ts`'s `PUBLIC_ADMIN_PATHS`) sets
  the name/password an invited user never had. Every owner/self guard from
  the original plan is implemented and tested: the owner can never be
  demoted/suspended/deleted by anyone including themselves, and no one may
  change their own role or status through the users route.
- **Tests added:** `permissions.test.ts` (exhaustive matrix, sabotage-tested),
  `session.test.ts` (the stale-role problem, proven against a mocked JWT +
  real database), `users-routes.test.ts` and `accept-invite-route.test.ts`
  (every guard above, plus the publish boundary in `admin-crud.test.ts`).
  173 pre-existing tests still pass unmodified; ~110 new ones added.
- **Also fixed in passing:** five files still had `localhost:3000` as their
  `NEXT_PUBLIC_SITE_URL` fallback after W7's port move to 4000
  (`sitemap.ts`, `robots.ts`, root `layout.tsx`, `writing/feed.xml/route.ts`,
  `lib/json-ld.ts`) — never hit in practice since the env var is always set,
  but wrong all the same.
- **W12 — Bearer tokens.** `POST /api/admin/auth/token` (email + password +
  TOTP, reusing `verifyCredentials` — extracted out of `auth.ts`'s
  `authorize()` into `credentials.ts` so both entry points share the same
  rate limiting and checks) issues a 15-minute JWT access token
  (`access-token.ts`, `jose`/`AUTH_SECRET`) and a 30-day opaque refresh
  token, stored hashed. `POST /api/admin/auth/token/refresh` rotates on
  every use; presenting an already-rotated token revokes its whole family
  (reuse detection), and a demotion or suspension shrinks or kills the
  token's scopes on its very next refresh, not just at issuance.
  `resolveAuth()`/`authorized()` (`resolve-auth.ts`) resolve a cookie or a
  Bearer header to the same shape, intersecting a token's captured scopes
  with the user's _current_ role every time. `/admin/security` grew an API
  sessions panel (list, revoke one, revoke all).

  **Found and fixed live, not by the unit suite:** the first live check
  (`curl` with a real Bearer token against `/api/admin/projects`) 401'd —
  Vitest calls route handlers directly and never exercises `proxy.ts`, so
  nothing had caught that the Edge middleware's cookie-session gate ran
  _before_ any route got a chance to check `Authorization: Bearer` at all.
  Fixed by verifying the access token's signature/expiry in `proxy.ts`
  itself (`jose` is Edge-safe; the full user/suspension/scope check still
  happens once, in `resolveAuth()`) and letting a request that clears it
  skip the cookie check. A second live pass then found every _hand-written_
  admin route (`audit-log`, `leads`, `media`, `settings`, `mdx-preview`,
  `users`) still calling `getAdminSession()`/`can()` directly — only the six
  `content:`/`lead:` collections behind `admin-crud.ts`'s factory had ever
  been wired to `resolveAuth()`. Fixed by lifting that factory's private
  `requirePermission()` helper into `resolve-auth.ts` as the one shared
  gate and switching every one of those routes onto it. `transfer-ownership`
  stays cookie-only, deliberately — it's a role comparison, not a
  `Permission` string, and the single most consequential action in the
  system is a reasonable place to require an interactive session. This is
  exactly the class of gap W14 item 7 ("Bearer parity") exists to catch;
  it surfaced from running the thing, not from reading the diff.

- **W13 — API documentation.** `zod-openapi` builds `GET /api/openapi.json`
  from the same Zod schemas every route validates against (`schemas.ts`,
  which grew a few module-local schemas — password change, TOTP confirm/
  disable, forgot/reset-password, reorder — that used to live inline in
  their route files, moved here so `openapi.ts` could reuse them instead of
  re-describing their shape by hand). 41 paths across 15 tags — every
  `content:`/`lead:` collection, media, settings, users, audit log, both
  Bearer-token routes, and every self-service/public route. Response
  shapes are hand-built to mirror `src/lib/types.ts` (there's no Zod schema
  for what a route _returns_ — see `openapi.ts`'s module comment for why
  that's an accepted, documented gap rather than an oversight). `/docs`
  renders it with `@scalar/api-reference-react` — the npm package, not
  Scalar's documented CDN `<script>` embed, so there's nothing for
  `strict-dynamic` to block. **Public**, decided explicitly by the user
  when asked directly (PLAN.md's own "decide explicitly" instruction,
  taken literally) rather than defaulted into.

  **Three more gaps live verification found, none of them visible from
  reading the code:** (1) Scalar's own hosted fonts and its "Agent Scalar"
  AI-chat feature both reach `*.scalar.com` by default — the CSP correctly
  blocked the fonts outright, but the agent's registry-search calls kept
  firing even after the obvious `hideClientButton` toggle, because Agent
  Scalar defaults to _enabled specifically on `localhost`_ (an internal
  `agent.disabled` flag not yet in the published `@scalar/types` package,
  found by reading `@scalar/api-reference`'s actual source, not its type
  declarations) — exactly the kind of default that a real browser catches
  and a production-only check would have missed entirely. (2) The
  package's own `.d.ts` declares `import './style.css'`, but its compiled
  `.js` never actually does — verified by reading the compiled output
  directly — so the reference's real grid/layout CSS silently never loaded
  and the page rendered as an unstyled single column at every viewport
  width, sidebar and content stacked, until that import was added by hand
  in `docs/page.tsx`. Fixed once dev tooling (`docker compose watch`, and
  its rebuild trigger for `package.json`/`pnpm-lock.yaml` changes) was
  confirmed actually working — the first sync attempt silently didn't
  rebuild the container at all, caught only by checking the container's
  own creation timestamp against the wall clock, not by any error.

**Verified:** full local gate, unit suite, and the full 55-test e2e suite all
green; the real invite → accept-invite → role-change → suspend flow driven
live against the Docker dev stack (screenshots taken at each step); Google
sign-in's env-gated button correctly absent with no client ID configured.
Bearer tokens verified live too: issue → use on a real permission-gated
route → refresh/rotate → reuse-detection revokes the family → demotion
shrinks scopes on next refresh, exercised with `curl` against every
permission-gated `/api/admin/*` route (not just the ones covered by
`admin-crud.ts`) after the gap above was found and fixed. `/docs` and
`/api/openapi.json` verified live in a real browser (Chromium): zero CSP
console errors, the full three-column reference layout rendering correctly,
every collection's request/response schema expanding with real generated
`curl` examples, and `GET /api/openapi.json` returning valid JSON with no
authentication of any kind.

**Correction, 2026-09-20 — this verification was against the dev server
only, and it missed a real production-only bug.** "Live" here meant
`docker compose watch`, which always server-renders per request. In an
actual production build, `next build` prerenders `/docs` statically (its
page has no data dependency), which bakes in whatever CSP nonce existed at
build time — permanently mismatched against the fresh nonce `proxy.ts`
generates on every real request. The result was a completely blank `/docs`
in production, every script rejected by CSP, found only by loading the live
site in a browser after deploying. See the 2026-09-20 progress note above
and W14's own note: "verified live" from here on should mean the actual
production runtime, not just the dev stack — the two diverge exactly where
static-vs-dynamic rendering matters, which is invisible from source alone.

---

## Where the project actually is — 2026-09-04

The public site, design system, data layer, admin CMS, SEO surface, contact
pipeline, analytics, and deploy pipeline are all complete and deployed. That
part of the archived plan holds up: I re-read it against the code and found no
feature it claims that doesn't exist.

**Four things it gets wrong, all found today:**

### 1. The gate is red. `pnpm test` fails 4 of 93.

All four are in `src/server/__tests__/queries.test.ts` — the draft-leak guard,
which the archived plan correctly calls the highest-value test in the repo.

**It is a time bomb in the test, not a leak in production.** The fixture
hardcodes `FIXED_NOW = 2026-08-30` and derives `FUTURE` as one day later
(2026-08-31), but `visibleNow()` compares `publishedAt` against the real
`new Date()`. Once wall-clock time passed 2026-08-31, the "scheduled-future"
fixture became genuinely due, and `getProjects()` started — correctly —
returning it. The assertion, not the filter, is what's wrong.

**The part that matters more than the fix:** `deploy.yml`'s `verify` job runs
`pnpm test` and gates `build-and-push`. So every push to `main` has failed at
the gate since 2026-08-31. Either nothing has shipped in four days, or the
gate isn't behaving the way AGENTS.md §10 describes. Confirm which before
trusting the pipeline again.

`typecheck`, `lint`, `format:check`, and `build` are all clean.

**A second red suite the plan did not mention:** `e2e/admin.spec.ts` also
fails — the login → create → publish → delete round trip. It fails on a clean
tree with no working-tree changes applied, and it does not `test.skip` itself,
because `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` _are_ set in `.env` and
`e2e-admin@example.com` _does_ exist in Mongo; the credentials simply no longer
match. The remaining 54 e2e tests pass. This runs in `e2e.yml` on PRs and
nightly rather than in the deploy gate, so it is not blocking shipping — but it
means the one test that exercises the real admin pipeline has been dark for an
unknown period. Re-run `pnpm seed:e2e-admin` and confirm before trusting it.

### 2. There is uncommitted work on `main` that no commit describes.

| File                                                                  | What it is                                                                                | Documented?                                                          |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `package.json` / `pnpm-lock.yaml`                                     | next 16.3.2→16.3.3, mongoose 9.9.3→9.9.4, zod 4.4.3→4.5.2, nodemailer, `@types/react-dom` | Archived plan claims these were "taken 2026-08-30" — never committed |
| `src/app/globals.css`                                                 | `--color-fg-subtle` raised to clear WCAG AA (W15)                                         | W15, below                                                           |
| `src/components/work/project-card.tsx`                                | Feature tile fills; `headingLevel` prop; headline/metric de-dupe (W15)                    | W15, below                                                           |
| `src/components/case-study/architecture.tsx`                          | Diagram opacity floor 0.35 → 0.80 (W15)                                                   | W15, below                                                           |
| `src/components/work/work-index.tsx` / `src/app/(site)/work/page.tsx` | `h2` cards; hardcoded "Four projects" removed (W15)                                       | W15, below                                                           |
| `src/lib/brand.ts` / `logo.tsx` / `icon.svg` / `apple-icon.tsx`       | New bracket-W mark + tile favicon (W15)                                                   | W15, below                                                           |
| `e2e/motion-contract.spec.ts`                                         | Accent token assertion updated to teal (W15)                                              | W15, below                                                           |
| `src/server/cloudflare-access.ts`                                     | fail-open → fail-closed in production                                                     | Only in the uncommitted edit to the archived plan                    |

**Correction, 2026-09-04.** An earlier draft of this section listed
`src/components/motion/text-reveal.tsx` as an undocumented bug fix, and
described the hero `<h1>` as invisible in production — every word parked at
`y: 105%` behind its own `overflow-hidden` mask. **That was wrong, and the
file is clean against `HEAD`.**

What actually happened: a design review running in parallel made a temporary
diagnostic edit to that file while chasing a hero that _appeared_ blank, and
this section was written from that edit sitting on disk. The blank hero was an
artifact of the review tool's browser, which freezes the animation clock —
`getAnimations()` reported `playState: "running"` with `currentTime` stuck at
`0`, so every mount animation sat at its initial state. The diagnostic edit was
reverted.

The committed code is correct, and the repo already proves it:
`e2e/motion-contract.spec.ts`'s "Variant propagation" block — committed since
Phase 1 — asserts the words settle at `translateY(0)`. Run against the
committed file it **passes**. Do not "fix" this.

### 3. Documentation that is now factually wrong.

- `src/proxy.ts:137` — `"No-ops until CF_ACCESS_* is configured (Phase 7)"`.
  Wrong twice: it is configured, and it now fails _closed_.
- `src/server/models/user.ts:4` — `"Phase 4 — admin auth. Schema only for now"`.
- `.env.example:8` — references `pnpm verify:env`. **That script does not exist.**
- `.env.example:31` — points at `/admin/settings/security`. The real route is
  `/admin/security`, and it has no email-change UI at all.
- The archived plan's own appendix concedes 41 comments across 37 files cite
  phase numbers that no longer resolve.

### 4. The plan was a closed historical record, not a plan.

It said so itself. Hence this file, and the archive.

---

## Decisions taken, 2026-09-04

Recorded here because everything below depends on them and the reasoning is
not recoverable from the code.

**Auth: keep Auth.js, add Bearer tokens alongside it.** The app already has
JWT auth — Auth.js v5 with `strategy: 'jwt'`, a signed token in an httpOnly
cookie, no session collection. Replacing it with a hand-rolled implementation
would mean rewriting login, TOTP, CSRF, password reset, and `proxy.ts`, and
discarding tested security code to arrive at roughly the same place. Instead:
Auth.js keeps serving the browser admin UI, and a Bearer-token layer is added
for programmatic clients (W12).

**Cloudflare: remove Access, keep Tunnel and Turnstile.**

- **Access has to go.** It authorizes a fixed set of identities at the _edge_,
  which means every user invited through the new system would also need a
  Cloudflare Zero Trust seat provisioned by hand, outside this repo. It
  directly contradicts the point of W11.
- **Tunnel stays.** `docker-compose.prod.yml` binds `web` to `127.0.0.1` and
  the VPS has no inbound ports open at all — `cloudflared` is the only
  ingress. Removing it is an ops project (open 443, provision TLS, redo DNS,
  add a firewall), not a code change, and it isn't what this phase is about.
- **Turnstile stays.** Independent of the above, working, and the natural bot
  gate for the invitation-acceptance page W11 introduces.

**RBAC: fixed roles, permission-based checks.** Roles are constants in code,
not a database collection. Call sites check `can(session, 'content:publish')`
and never a role name. Two consequences worth stating: there is no naming
collision with the existing `Role` model (job history / Experience), and the
role→permission matrix is a pure function, so it is exhaustively testable
without a database.

**Driver: a real multi-user need.** Other people will actually log in. That
biases every trade-off below toward operational safety — invitations,
deactivation, immediate revocation, lockout guards — over architectural
elegance.

---

## W7 — Truth-up

**Done, 2026-09-05.** Test fixed and sabotage-tested, dependency bumps and
the design pass committed as separate real commits, ~20 stale "Phase N"
comments swept, two wrong `.env.example` lines fixed, local dev moved to
port 4000 (5000 was squatted by macOS AirPlay Receiver).

Housekeeping. Cheap, and everything after it is easier once the tree is
honest. No feature work.

1. **Fix the time-bombed test.** Derive `PAST`/`FUTURE` from `Date.now()` at
   run time, or freeze the clock with `vi.setSystemTime(FIXED_NOW)` so
   `visibleNow()` and the fixtures share one notion of "now". The second is
   better: it makes the test deterministic rather than merely un-expired.
   Then confirm the suite still goes red when `visibleNow()` is sabotaged —
   the archived plan's own standard, and the reason this test exists.
2. **Establish why CI has been green-lighting nothing for four days.** Check
   `deploy.yml` run history. If pushes have been failing, that is the finding;
   if they've been passing with a red suite, the gate is broken and that is a
   bigger one.
3. **Commit the pending work** as three separate commits with real messages —
   dependency bumps, the `TextReveal` fix, the fail-closed change — rather
   than one lump. The `TextReveal` commit should carry the explanation above;
   it's the only record that bug ever existed.
4. **Fix the four wrong doc references** listed in §3 above. Either add
   `verify:env` or delete the reference to it; decide, don't leave it dangling.
5. **Retire the phase numbers.** The archived plan's appendix maps them. Sweep
   the 41 comments in one pass rather than "opportunistically as you touch each
   file" — that instruction has been in place since 2026-08-27 and has
   demonstrably not happened.

---

## W8 — Remove Cloudflare Access

**Done, 2026-09-05, with explicit user confirmation before the commit** (it
removes a live security layer). Still outstanding, outside this repo: tear
down the Cloudflare-side Access application in the dashboard — the GitHub
repo variables have been deleted, but the dashboard app itself needs doing
by hand or real visitors hit a Cloudflare login they can no longer pass.

Mechanical, but touches security-relevant code, so it gets its own workstream
and its own verification.

- Delete `src/server/cloudflare-access.ts`.
- Remove layer 1 from `src/proxy.ts` (the `verifyCloudflareAccess` call and its
  redirect/403 branch). The session gate below it is untouched.
- Remove `CF_ACCESS_TEAM_DOMAIN` / `CF_ACCESS_AUD` from `.env.example` and from
  `.github/workflows/deploy.yml` (both the docs comment and the `.env`
  heredoc). Delete the GitHub repo variables afterward — otherwise they sit
  there looking meaningful.
- **Tear down the Cloudflare-side Access application in the dashboard.** This
  is the step that is easy to forget and the only one that actually stops the
  edge from gating `/admin`. Leaving the app live while removing the origin
  check means users get redirected to a Cloudflare login they can't pass.
  This is outside the repo and needs doing by hand.
- Rewrite AGENTS.md §7. It currently describes three layers; there are now two
  (session, credentials). Say that plainly rather than leaving a gap where
  layer 1 was.
- `jose` becomes unused — **keep it.** W12 needs it to sign and verify access
  tokens. Note this in the commit so nobody prunes it as a dead dependency.

**Verify by breaking it:** with Access removed, an unauthenticated request to
`/admin` must still redirect to `/admin/login`, and to `/api/admin/*` must
still 401. The session layer was always doing that work; confirm it still is
on its own.

---

## W9 — Permissions core and the user model

**Done, 2026-09-06 — see "Progress" above for what shipped and the role-table
correction found along the way.**

The foundation. No behaviour changes for the existing admin until W10 wires it
up — this workstream is pure addition, which makes it safe to land early.

### `src/server/permissions.ts`

Permission strings shaped `<resource>:<action>`, exported as a `const`
tuple so the type is a union of literals rather than `string`.

Proposed resources: `content`, `lead`, `media`, `settings`, `user`, `audit`,
`apikey`.

**One `content:` bucket rather than per-collection permissions.** Projects,
posts, testimonials, experience, tech, and skill groups all go through the
same factory and the same forms; nobody realistically needs "can edit projects
but not posts." Six collections × five actions would be a 30-entry matrix
maintained to express a distinction no one wants. If that need appears later,
splitting `content:` is a mechanical change; collapsing 30 permissions back
into 5 is not.

**`content:publish` is separate from `content:write`.** This is the
distinction that earns its keep in a CMS — draft freely, but pushing to the
live site is a different act — and it maps exactly onto the existing
`get*` / `getAll*` split (AGENTS.md §6). It also leaves room for a
contributor-style role later without another schema change.

### Role matrix

| Role     | Grants                                                                                                    |
| -------- | --------------------------------------------------------------------------------------------------------- |
| `viewer` | `content:read`, `lead:read`, `media:read`                                                                 |
| `editor` | viewer + `content:write`, `content:publish`, `content:reorder`, `media:write`                             |
| `admin`  | editor + `content:delete`, `lead:write`, `media:delete`, `settings:*`, `user:*`, `audit:read`, `apikey:*` |
| `owner`  | admin + ownership transfer; cannot be demoted or deleted                                                  |

`owner` is a singleton, is set by `pnpm seed:admin`, and is the one role the
UI must never offer as a choice — it moves only through an explicit transfer
action (W11).

Export one function, `can(session, permission)`. Nothing else reads the
matrix directly.

### `User` model changes

Additive; existing documents stay valid.

- `name` — a user list showing only email addresses is unusable.
- `role` — widen the enum from `['admin']`. **Migration note:** every existing
  document has `role: 'admin'`; the seeded account must become `owner`. Write
  this as a real migration step in `seed-admin.ts`, not an assumption.
- `status` — `'invited' | 'active' | 'suspended'`. Deactivation must not be a
  delete: audit-log entries reference the user, and losing the account loses
  the trail.
- `passwordHash` — becomes **optional**. An invited user has no password until
  they accept. `authorize()` must reject a passwordless account explicitly
  rather than falling through to `verifyPassword` with `undefined`.
- `lastLoginAt`, `invitedBy`, `createdAt` (already present via `timestamps`).

Zod and Mongoose schemas are maintained by hand and in parallel (AGENTS.md §6)
— change both.

### Audit log

`writeAuditLog` currently records `userEmail` only. Add `userId`, keeping the
email as a denormalised snapshot: emails change, and an audit entry should
say who acted at the time it happened, not who owns that address now.

---

## W10 — Make the session authoritative, then enforce

**Done, 2026-09-06 — see "Progress" above.**

The hard part, and the one with a real design decision in it.

### The stale-role problem

A JWT is a bearer of claims frozen at issue time. Demote a user, suspend
them, or delete their account, and their existing token still says
`role: 'admin'` for up to seven days. The archived plan already flags the
sibling case — a password reset doesn't invalidate live sessions — as an
accepted gap. For a single-admin CMS that was defensible. For a system whose
whole point is managing other people's access, it is not: "remove this
person's access" must mean _now_, not _within a week_.

### The decision: `getAdminSession()` becomes database-backed

The JWT stays the transport — it proves _which_ user is calling. The database
becomes the authority on _what that user may do_: `getAdminSession()` reads
the user document and returns the current role and status, ignoring the role
claim baked into the token.

That is one indexed `findById` per admin request. Wrap it in React `cache()`
— the same pattern `queries.ts` already uses — so multiple calls within a
single render or route hit Mongo once. For a system with a handful of users
this cost is invisible, and it buys instant revocation of role changes,
suspension, and deletion, with no token-versioning scheme, no refresh-cycle
latency, and no separate invalidation path to get wrong.

`proxy.ts` stays cookie-only and coarse — it runs in the Edge runtime and
cannot reach Mongoose (AGENTS.md §7). It answers "is anyone logged in?"; the
route handlers answer "may _this_ user do _this_?"

A suspended or deleted user must be rejected here, not merely
permission-denied — status is checked before permissions.

### Enforcement

- `admin-crud.ts`'s `requireSession()` becomes `requirePermission(perm)`. The
  factory already funnels six collections through one place; extend
  `CrudConfig` with the permission each handler needs, and every collection
  is covered at once. This is the single highest-leverage edit in the whole
  phase.
- Hand-written routes — `leads`, `media`, `settings`, `password`, `totp/*`,
  `audit-log`, `mdx-preview` — each get an explicit check. **Enumerate them
  and check them off; a route silently left on a bare session check is
  exactly the bug this workstream exists to prevent.**
- `content:publish` is enforced at the _schema_ boundary, not just the route:
  a user without it may submit a document, but `status` may not move to
  `published` or `scheduled`. Doing this in the Zod layer means it holds for
  create, update, and any future path that writes a status.
- The sidebar and dashboard filter by permission — **presentation only.**
  Hiding a link is not access control and must never be the only thing
  standing between a viewer and a delete endpoint.

---

## W11 — User management

**Done, 2026-09-06 — see "Progress" above. Google sign-in (W11a) landed
alongside it, not originally part of this workstream.**

The visible deliverable. `/admin/users`, gated on `user:read`.

- **List** — name, email, role, status, last login. Roles editable inline for
  anyone with `user:write`.
- **Invite** — email + role. Creates a `status: 'invited'` user with no
  password and emails a single-use, TTL-indexed, salted-hash token. This is
  exactly the `PasswordReset` pattern already in the repo (`src/server/models/
password-reset.ts`); reuse the shape rather than inventing a second one.
- **Accept** — `/admin/accept-invite/[token]`: set a name and a password
  (12-char minimum, matching the existing reset flow), then land on `/admin`.
  Must be added to `PUBLIC_ADMIN_PATHS` in `proxy.ts` — the archived plan
  records this as the one non-obvious step when `/admin/forgot-password` was
  added, and the same trap applies here. Turnstile-gated, since it is a
  public, unauthenticated, account-creating endpoint.
- **Suspend / reactivate** — a status flip, not a delete. Takes effect on the
  suspended user's very next request, courtesy of W10.
- **Delete** — hard delete of the user document, audit entries preserved.

**Guards, all of which need tests:**

- The `owner` cannot be demoted, suspended, or deleted — by anyone, including
  themselves. Ownership moves only by explicit transfer, which promotes the
  target and demotes the current owner to `admin` in one atomic operation.
- No user may change their own role. Otherwise `user:write` is just a slow
  path to `owner`.
- Deleting or suspending yourself is refused with a clear message rather than
  silently signing you out.
- **Force 2FA is deferred, deliberately.** The `totp-nag` component already
  exists and prompts. Making TOTP mandatory before the invitation flow is
  proven end to end risks locking a real person out of a real account on
  their first login. Revisit once W11 has actually been used.

Every mutation here writes an audit entry — `user:invite`, `user:role-change`,
`user:suspend`, `user:delete`. This is the log that matters most; content
edits are recoverable, access changes are not.

---

## W12 — Bearer tokens

**Done, 2026-09-06 — see "Progress" above, including the two gaps live
verification found and fixed (the Edge middleware gate, and hand-written
routes never wired to `resolveAuth()`).**

Programmatic access, for clients that have no cookie jar.

**One API surface, two ways to authenticate.** `/api/admin/*` stays where it
is and learns to accept either a session cookie or a Bearer token. Standing up
a parallel `/api/v1/*` would double the routes and guarantee the two drift.

The path name is a little odd for a documented public API. Renaming it would
touch every route file, `admin-fetch.ts`, and `proxy.ts`'s matcher, for
cosmetics — not worth the churn now. Revisit if the API ever gets consumers
who aren't us.

- **`resolveAuth(request)`** — one function, ahead of every permission check.
  Cookie → existing Auth.js path, CSRF required. Bearer → verify the access
  token, CSRF **not** required and must not be, since a request with no
  ambient cookie cannot be forged cross-site. Write that reasoning into the
  code; a future reader will otherwise "fix" the missing CSRF check.
- **`POST /api/admin/auth/token`** — email + password (+ TOTP when enabled) →
  a 15-minute access token (JWT, signed with `AUTH_SECRET` via `jose`) and an
  opaque refresh token. Reuses `authorize()`'s existing rate limiting; the
  same brute-force surface deserves the same protection.
- **Refresh tokens are stored hashed and rotate on use.** A reused refresh
  token revokes the whole chain — the standard detection for a stolen token,
  and cheap to implement given the hashing helpers already exist.
- **Scopes are permission strings**, and are always intersected with the
  user's current role at request time. A token issued while its owner was an
  admin must not survive their demotion — same principle as W10, applied to
  the token layer.
- **`/admin/security` grows a token section** — list active tokens with
  last-used timestamps, revoke individually or all at once.

---

## W13 — API documentation

**Done, 2026-09-06 — see "Progress" above, including the public-vs-gated
decision (made explicitly, by the user, not defaulted into) and the
CSP/layout gaps live verification found and fixed.**

**Generated from the Zod schemas, not written by hand.** AGENTS.md §6 already
makes Zod the write-side validation boundary, so a generated spec cannot drift
from what the API actually accepts. Hand-written Markdown would be wrong
within a month — the archived plan is a 755-line demonstration of exactly
that.

- `zod-openapi` (or `@asteasolutions/zod-to-openapi`) to build the document
  from the existing schemas plus a small per-route metadata registry: method,
  path, permission, response shape. AGENTS.md §8 says don't add a dependency
  for something the stack already does — the stack does not do this, so the
  addition is justified. Record that reasoning in the commit.
- `GET /api/openapi.json` — the spec.
- `/docs` — Scalar or Stoplight Elements. **Self-host the bundle.** Both
  default to a CDN `<script>`, which `proxy.ts`'s CSP will block outright
  under `strict-dynamic`, and loosening the CSP to accommodate a docs page is
  the wrong trade. Expect to need a `worker-src` or `blob:` allowance; verify
  in a real browser console, not by reading headers — the archived plan
  records a three-day production outage caused by exactly that shortcut.
- Document the auth model prominently: both mechanisms, when CSRF applies,
  the permission each endpoint requires, and the refresh-rotation behaviour.

**Open question, worth a deliberate answer before building:** public docs or
admin-gated? Public is the honest default — security here comes from
authentication, not from concealing endpoint names — and it makes the work
legible from outside. But it does publish a complete map of the admin surface.
Decide explicitly; don't drift into one.

---

## W14 — Tests

Not an afterthought: this phase changes who can do what, and every bug in it
is a security bug.

**Correction, 2026-09-20 — most of this was already done.** The "Progress"
note above this section (written 2026-09-06, same day as W9–W13) claimed
"the remaining items of W14 (tests) are not started" in the same breath as
listing `permissions.test.ts`, `session.test.ts`, `users-routes.test.ts`,
and the publish-boundary case in `admin-crud.test.ts` as shipped — a direct
contradiction that stood uncorrected for two weeks. Verified against the
actual suite: items 1–5 and 7 below are done. Only item 6 is a real gap.

1. ~~**The permission matrix, exhaustively.**~~ **Done** —
   `permissions.test.ts`, 80 assertions.
2. ~~**Enforcement, per route.**~~ **Done** — `admin-crud.test.ts` and
   `users-routes.test.ts` cover this per handler.
3. ~~**The publish boundary.**~~ **Done** — asserted in `admin-crud.test.ts`,
   and re-verified live today: an `editor` submitting `status: 'published'`
   gets a 422 from `withPublishGuard`, through the real API.
4. ~~**Revocation is immediate.**~~ **Done** — `session.test.ts` (the
   "stale-role problem"), and re-verified live today: a suspended user's
   already-open session went from 200 to 401 on its very next request, no
   re-login.
5. ~~**The owner guards.**~~ **Done** — covered in `users-routes.test.ts`,
   and re-verified live today via direct API calls: self-role-change,
   self-suspend, self-delete, and every guard against acting on the owner
   all correctly refused.
6. **E2E: the invitation round trip.** Still open. Invite → accept → log in
   → hit a permission ceiling → get refused. `e2e/admin.spec.ts` already
   establishes the pattern (deterministic no-TOTP account via
   `seed:e2e-admin`) but only covers the project CRUD pipeline; extend it
   with a second seeded account at a lower role. The manual pass today
   covered this exact path by hand (invite → accept → permission ceiling →
   promote → suspend → ownership transfer) but that isn't a substitute for
   a repeatable e2e test.
7. ~~**Bearer parity.**~~ **Done** — `bearer-token.test.ts`, and re-verified
   live today: issue, use with zero cookie/CSRF, refresh, rotate, and reuse
   detection revoking the whole token family, all exercised with real
   `curl` calls against the running app.

Sabotage-test the important ones — break the check, confirm the test goes red,
restore. The archived plan set that standard and it caught real bugs.

---

## W15 — Design pass

Independent of W7–W14. Nothing here touches auth, permissions, or the data
layer, so it can land in any order relative to them — including first, since
none of it is blocked.

Source: a full visual review of the seven public routes on 2026-09-04, run
against the Docker stack with a seeded database and measured in real Chromium
(Playwright, 1440×900 and 390×844) rather than read off the source. Contrast
was computed per text node against its true composited background, including
inherited opacity.

**What the review found working, and should not be traded away:** the token
layer is genuinely enforced (no stray hex found in components); `density` is
used as a real design tool rather than uniform padding; the
metric-with-baseline pattern is the strongest idea on the site; no horizontal
overflow at 390px or 1440px on any route; exactly one `h1` per page; form
labels correctly associated; focus states never removed.

### Landed 2026-09-04 — uncommitted, in the working tree

Five defects. All measured in the running app, all small diffs.
`typecheck`, `lint`, `format:check`, and `build` are clean with them applied.

1. **`--color-fg-subtle` missed WCAG AA on every surface.** `#6b7a73` measured
   4.31:1 on `bg` and fell to 3.26:1 by `surface-4` — never reaching 4.5:1
   anywhere, while carrying real copy (the project card's problem line, the
   constellation hint, every footer meta label). Raised to `#82928a`: 5.95:1
   on `bg` → 4.51:1 on `surface-4`, still visibly a step below `fg-muted`
   (7.12:1). The home page went from 41 sub-AA text nodes to zero.

   Note that AGENTS.md §5 and `globals.css` both claimed all three foregrounds
   were AA. That was true of two of them. W7's truth-up should not re-assert
   the claim without re-measuring.

2. **The featured project tile was ~600px of empty card.** The lead tile is
   `lg:row-span-2`, stretched to the height of the three cards beside it, with
   content only at its top and bottom — it read as a failed image load. It now
   shows its `problem` outright (progressive disclosure still governs the small
   tiles, where hiding it is what keeps them scannable) plus two supporting
   metrics. Two smaller bugs fell out of the same work: `justify-between` across
   three children opened _two_ gaps rather than one (now `mt-auto`), and
   `metrics[0]` duplicates `headline`, which printed `$140k` twice.

3. **The case-study architecture diagram never lit up on a tall display.**
   The scroll range `['start 0.85', 'center 0.4']` does not complete on a
   1440×1800 viewport — measured min 0.35, max 0.67, so on a large monitor the
   dim state was permanent. At 0.35 the detail line is 1.9:1. The floor is now
   0.80 (≈5:1); the sequence still visibly lights up and the gradient rule
   still draws. Fixing the offset instead would be the more principled repair
   and is still open — the floor guarantees legibility either way.

4. **`/work` skipped a heading level.** Cards render `h3`, correct on the home
   page where they sit under a section `h2`; `/work` has no `h2` between its
   `h1` and the cards. `ProjectCard` now takes a `headingLevel` prop.

5. **`"Four projects"` was hardcoded on `/work`.** The same content drift the
   archived plan's W5 fixed on the home page and missed here — wrong the moment
   a fifth project ships or one is unpublished. Now `spelledOutCount()`.

### Open — in priority order

1. **There is not a single image on the site.** Across all six public routes:
   zero `<img>` elements. Everything is type and inline SVG. It is a coherent
   choice and part of why the site reads as disciplined — but it also means a
   personal portfolio with no face on it, and four case studies about systems
   nobody can see. The InventoryPulse case study is 4,022px of unbroken prose.

   Highest leverage on this entire list: one portrait on `/about`, then one
   visual per project (a screenshot, a real dashboard, a schema). Note this
   lands on infrastructure that already exists — `media` upload, `probe-image-size`,
   and the admin media library are all built and currently hold zero records.

2. **`/work` is thinner than the site it belongs to.** 1,604px tall on a 900px
   viewport — four uniform tiles, then ~200px of dead space before the footer.
   For a portfolio this page has to do the most persuading and currently says
   less per project than the home page does. The card already knows `year`,
   `role`, `timeline`, and `categories` and shows none of them.

3. **The contact form is hidden behind a click.** `/contact` shows a heading,
   a line of copy, and two intent cards; the form only appears after choosing
   one. The form underneath is well built (labels associated, 41–48px controls,
   honest helper text) — but this is the page whose entire job is to receive a
   message, and it asks for a click before showing the thing it wants.
   Consider rendering it immediately with intent as its first field: same
   qualifying signal, one fewer step.

4. **11px type is doing too much work.** 126 text nodes on the home page render
   below 12px. `text-2xs` is right for mono eyebrows and stack chips, where it
   reads as instrumentation; it is also carrying metric baselines, footer meta,
   and the constellation hint — lines you actually want read. Promoting those
   to `text-xs` costs almost no vertical space.

5. **Tall sections leave stranded columns.** The same pattern that produced the
   featured-card void, in three more places: `/about`'s right column empties
   below the fact card (~350px), Process holds a heading and one sentence
   against four steps, and `/contact`'s right column ends at the availability
   card. None is broken; each would read as composed rather than left over with
   either a deliberate filler or a narrower container.

6. **The home page is a 7,534px scroll on mobile.** Nine screens on a 390×844
   device, and Experience is repeated in full on `/about` as a timeline. Decide
   which page owns that content and trim the other.

7. **Brand: favicon and navbar logo — done 2026-09-04.** The old mark failed
   for three measurable reasons, not taste: five nodes at `r=3` on a 32-unit
   grid (6px each, ~20% of the canvas) against a 1.8px stroke, so it read as
   beads rather than a letter; a centre apex at `y=14` against outer tips at
   `y=9`, too shallow for a W; and one `accent-bright` node that read as a
   status light at logo scale.

   Replaced with a bracketed W for the nav, footer, and OG cards, plus a solid
   accent tile for the favicon and iOS icon — a mark and its small-size
   variant, which the `MARK_DEFAULT` / `MARK_SMALL` split already assumed.
   Verified as rendered at 16 / 24 / 32px on both light and dark browser
   chrome, and on the generated 180px iOS icon.

   Structural notes for whoever touches it next: `markSvg()` still drives all
   four `next/og` routes, so those followed automatically; `tileSvg()` is new
   and is what `icon.svg` mirrors by hand (a static asset cannot read a
   `@theme` token — keep the literal in sync); the iOS route renders the tile
   full-bleed at `radius: 0` because iOS applies its own corner mask and a tile
   carrying its own radius inside that mask leaves a dead ring at the corners;
   and the mark is now entirely `currentColor`, so the `accent-bright`
   exception that used to be documented in `logo.tsx` is gone rather than
   re-homed.

8. **Accent moved to teal `#14b8a6` — done 2026-09-04.** Previously spring
   green `#0fbf7a`. Eight candidates were measured against `bg` and
   `surface-4`; all eight cleared 4.5:1, so contrast did not decide it. Teal
   keeps the terminal lineage, steps off the near-black-plus-acid-green palette
   this genre has converged on, and stops 11px mono eyebrows and chips
   competing with the primary CTA.

   The full ramp was re-derived, not just the base value: `accent-bright`
   `#7ce86a` → `#5eead4` (13.13:1 on `bg`, matching the old 12.59:1),
   `accent-deep` `#0b5c4e` → `#115e59` (2.56:1 — a shadow tone, never text, and
   it must stay that way), plus all three `border-*` tokens, both
   `--shadow-glow` layers, and `BRAND_COLORS` in `src/lib/brand.ts`.

   **Amber `#f5a524` was ruled out** and should stay ruled out: it is
   byte-identical to `--color-signal-amber`, so the brand colour and the
   warning colour would be the same value.

   The contrast sweep was re-run across seven routes at both breakpoints after
   the change, with no regressions. `e2e/motion-contract.spec.ts` asserts
   `--color-accent` exactly, which is what stops the accent drifting silently —
   that assertion was updated deliberately, and all 9 tests in the file pass.

### Not worth doing

- **Chasing the remaining gap in the featured tile.** It is still ~430px, and
  that is fine: the numbers are anchored at the foot and the composition now
  reads as deliberate. Closing it entirely means not stretching the card, which
  is the asymmetric grid the design deliberately wants.
- **A light theme.** Out of scope and contradicted by AGENTS.md §5. Every
  contrast figure above is against the dark surfaces and would need redoing.

---

## Open questions

Answer these as they come up; don't let them block earlier workstreams.

- **Are public API docs the right call?** (W13.) Recommendation: yes.
- **Should `/api/admin` be renamed** once it has non-browser consumers? (W12.)
  Recommendation: not now.
- **Force-2FA for non-owner roles** — deferred from W11 until the invitation
  flow has been used by a real person at least once.
- **Off-box backups.** Still local-retention only (AGENTS.md §10). Unchanged by
  this phase, but the risk grows with every additional user whose work lives
  on that one VPS.
- **Who owns the Experience/timeline content?** (W15 open item 6.) It renders
  in full on both `/` and `/about`. Recommendation: `/about` owns it, the home
  page keeps a three-role summary.
- **`next-auth` is pinned at `5.0.0-beta.32`** — a beta, in production, now
  carrying multi-user auth rather than single-admin auth. The risk was accepted
  when one person used it. Re-examine that acceptance before W12, and read the
  changelog before any bump.

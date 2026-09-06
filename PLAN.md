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

1. **The permission matrix, exhaustively.** `can()` is a pure function — assert
   every role against every permission. Roughly 4 × 25 assertions, generated
   from the tuples, and the cheapest security test in the repo.
2. **Enforcement, per route.** Extend `admin-crud.test.ts`: for each handler,
   a role that may and a role that may not. The existing file already proves
   session/CSRF/Zod/audit; permission becomes the fifth thing it proves.
3. **The publish boundary.** An `editor` without `content:publish` submitting
   `status: 'published'` must be rejected — through the API, not just in the
   UI. This is the one that protects the public site.
4. **Revocation is immediate.** Suspend a user mid-session; their next request
   must 401. This is the whole justification for W10's design, and it is
   worthless unproven.
5. **The owner guards.** Owner cannot be demoted, suspended, deleted, or
   self-role-changed. One test each.
6. **E2E: the invitation round trip.** Invite → accept → log in → hit a
   permission ceiling → get refused. `e2e/admin.spec.ts` already establishes
   the pattern (deterministic no-TOTP account via `seed:e2e-admin`); extend it
   with a second seeded account at a lower role.
7. **Bearer parity.** The same permission checks hold whether the caller
   presents a cookie or a token. Two auth paths into one permission layer is
   precisely where a gap hides.

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

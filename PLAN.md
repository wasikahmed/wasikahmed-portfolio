# PLAN.md

Forward plan, written 2026-09-20 the day the multi-user CMS phase (W7–W15)
finished deploying — the previous plan is archived at
[`docs/history/PLAN-2026-09.md`](docs/history/PLAN-2026-09.md), which has the
full story: what shipped, and three production-only bugs that two weeks of
sitting unpushed didn't cause but one real deploy found and fixed in an
afternoon (a stale Cloudflare Access lockout, two GitHub secrets in the wrong
namespace, and a sign-out redirect leaking the container's bind address —
plus a fourth, `/docs` rendering blank in production, found in the smoke test
right after).

**Update, same day:** everything below — the one remaining test, the whole
design pass, and the media library's move to Cloudinary — is now
implemented and passing the full local gate (see AGENTS.md §11). It is
**not deployed yet** — see "What's left before this ships" at the bottom of
this file for the two things that need a person, not more code, first.

**Where things stand:** the public site, design system, data layer, and admin
CMS are complete, genuinely multi-user, and deployed — verified live against
`wasikahmed.me`, not just committed. Fixed roles with real permission
enforcement, database-backed sessions, a full invite → accept →
suspend/reactivate → delete → transfer-ownership surface, Bearer tokens for
programmatic clients, and a public generated API reference at `/docs`. See
AGENTS.md §7 and §11 for the architecture as it stands; this file only tracks
what's left.

---

## Housekeeping

1. **Migrate production's owner.** Still open — needs a person at the
   keyboard, not something to run unattended: the VPS has no open inbound
   port (docker-compose.prod.yml's own comment), so reaching it means an
   interactive `cloudflared access ssh` session authenticated as you, and
   the command itself prints a fresh admin password once, which should
   land in front of the person running it, not sit in a saved transcript.
   Once connected:

   ```bash
   cd <DEPLOY_PATH> && docker compose -p portfolio -f docker-compose.prod.yml exec web pnpm seed:admin
   ```

   Idempotent by email, doubles as the migration PLAN.md W9 always said it
   would be. **Side effect:** resets the password and prints the new one
   once — save it when it does. Not urgent: `admin` already has every
   functional permission `owner` has, so nothing is broken today,
   ownership transfer just has no one to transfer from.

2. **Re-examine the `next-auth` beta pin.** Resolved, 2026-09-20 —
   checked live against the npm registry: `5.0.0-beta.32` (published
   2026-07-20) is still the newest version published, two months on and
   with nothing newer in between. Nothing to bump to. Worth having asked
   anyway: beta.32 itself picked up real `@auth/core` security fixes —
   malformed Bearer token handling in `getToken`, provider-bound OAuth
   check cookies, NFKC email normalization, and auth checks failing
   _closed_ rather than open on a provider config error — all of which
   this app's Bearer-token surface (§7, W12) actually exercises. Re-run
   this same check (`npm view next-auth versions`) next time a dependency
   sweep is due; nothing here is pinned out of neglect.
3. **Force-2FA for non-owner roles** — still deferred, same condition
   W11 set it under ("until the invitation flow has been used by a real
   person at least once"). Today's session added automated coverage for
   the whole invite → accept → login → permission-ceiling path (W14 item
   6, below) and re-drove it by hand — both prove the _mechanics_ work,
   neither is the second real person the original condition asked for.
   Leaving this open rather than reinterpreting the condition to call it
   satisfied.
4. **Off-box backups** — partially resolved. Media no longer needs this:
   W15 item 1 (below) moved the media library to Cloudinary, which is
   off-box and versioned on its own — that was the harder of the two
   assets to protect this way, since it was binary files on a volume, not
   a `mongodump`. Mongo is the one thing now left with only a local copy
   (AGENTS.md §10). Revisit shipping that off-box too (e.g. rclone to an
   S3-compatible bucket) as its own task if that risk becomes worth
   carrying — unchanged risk profile, just a smaller surface than before.

---

## Cloudinary setup — working in dev, one step left before production

W15 item 1 (below) swapped the media library's storage from local disk to
Cloudinary (`src/server/cloudinary.ts`) — the code is in, the full gate and
`pnpm e2e` pass, and the upload route fails clearly (502, not silently) if
it's unconfigured.

1. **Cloudinary credentials — set and verified, 2026-09-20.** Live in
   local `.env`. Proven end to end against the real account, not just
   assumed from the code: a real image uploaded through `/admin/media`,
   confirmed it actually landed on Cloudinary (fetched the returned
   `res.cloudinary.com` URL directly), confirmed the thumbnail renders in
   the admin UI (CSP `img-src` allowance working), then deleted it through
   the same UI and confirmed via Cloudinary's Admin API that the asset was
   actually gone there too (404), not just removed from Mongo. One hiccup
   caught and fixed along the way: the first API key provided was
   permission-scoped without upload rights ("Request forbidden due to
   missing permissions (actions=[\"create\"])") — a Cloudinary console
   setting, not a code bug; fixed on the account side, then re-verified.
   **Still needed before the next deploy:** the same three values in this
   repo's GitHub Actions `vars`/`secrets` (see `deploy.yml`'s header
   comment for the exact names — cloud name and folder are plain `vars`,
   the two credentials are `secrets`) — production has none of this yet.
2. **A dedicated folder — done.** The same Cloudinary account holds other
   projects' media — `CLOUDINARY_FOLDER` (`portfolio/admin/media`, set
   2026-09-20, and the actual folder the verification upload above landed
   in) scopes every upload and delete this app ever makes to that one
   folder, so it can never read or touch another project's assets.
3. **Real content — still open.** Nothing uploads itself — `/admin/settings`'s new
   "Portrait" field and `/admin/projects`'s new "Cover image" field both
   expect a URL copied from `/admin/media` after uploading there. Until
   that happens, every page that would show one degrades exactly as it
   did before this existed (About's facts-only panel, cards/case studies
   with no image block) — nothing is broken by leaving them empty, but
   the actual point of W15 item 1 (a face and real project visuals) isn't
   realized until someone uploads them.

---

## W14 item 6 — the one remaining test — done

**E2E: the invitation round trip**, implemented — `e2e/invite.spec.ts` +
`scripts/seed-e2e-invite.ts` (`pnpm seed:e2e-invite`). Invite → accept →
log in → hit a permission ceiling → get refused, against the real routes
throughout. The invited user and its Invite document are seeded directly
(same reasoning as `seed-e2e-admin.ts`: the real invite token only ever
leaves the server inside an emailed link, so there's no API response to
recover it from) — everything downstream of that is real: the actual
accept-invite form and route, a real credentials login, and a real
`content:write` 403 from `requirePermission()` against a live session,
asserted directly rather than inferred from UI state. `e2e.yml` seeds it in
CI the same way it already seeds the admin fixture. Sabotage-tested by
hand during implementation (temporarily widened the viewer role's
permission set — the ceiling assertion went red as expected, then back to
green once reverted).

---

## W15 continued — design pass — done

Independent of everything else; landed in any order. Source: a full visual
review of the seven public routes on 2026-09-04, measured in real Chromium
(1440×900 and 390×844) against the seeded Docker stack, not read off source.
The WCAG fixes, brand mark, and accent rework from that same review already
shipped (archive has the measurements). All six open items below are now
implemented; `pnpm e2e` (the full suite, including the "no horizontal
overflow" sweep across mobile/tablet/desktop/ultrawide on every route) passes
against the result.

1. **Images** — done, infrastructure and wiring both. `Project.cover` and
   `Settings.portrait` (both `{ url, alt }`, optional, same shallow
   reference pattern `seo.ogImage` already used) render on `/work`'s cards,
   the case-study hero, and `/about`'s right column when present, and
   change nothing when absent. Admin forms for both are in
   (`project-form.tsx`'s "Cover image", `/admin/settings`'s "Portrait" —
   paste a URL copied from `/admin/media`). See "Cloudinary setup" above
   for what's still needed before either has real content in it.
2. **`/work` card density** — done. Cards now show `categories`, `role`,
   and `timeline` in one quiet meta line (`project-card.tsx`); `year` was
   deliberately left out where `timeline` already reads as a date range,
   to avoid printing the same information twice.
3. **Contact form gated behind a click** — done. `intent` now defaults to
   `'project'` instead of starting unset, so the full form renders on
   arrival; the two intent cards are still there and still switch which
   fields show (company/budget vs. not), just no longer gating anything.
   `e2e/site.spec.ts`'s contact-form test was rewritten to match (it
   asserted the old gated behavior — caught by the suite going red until
   fixed, not by reading the change).
4. **Sub-12px type doing real work** — done. Every `text-2xs` node that
   carried genuine content (metric baselines, footer/CTA/contact meta
   lines, testimonial attribution, the constellation's filter hint) is now
   `text-xs`. Left alone, deliberately: mono section eyebrows, filter
   pills, and stack/category chips — `text-2xs` there is doing real
   visual-hierarchy work, not shortchanging something meant to be read.
5. **Stranded columns** — addressed on About and Contact; Process
   deliberately left as-is. About's right column now holds the portrait
   (when one exists) above the facts panel, which is what actually fixes
   the height mismatch — with no portrait it's still a legitimately
   shorter, self-contained block, not a gap. Contact's aside is now
   `lg:sticky lg:top-28 lg:self-start` (the same pattern Process's left
   column already used), which matters more than it used to now that
   intent no longer gates the form's height. Process's own left column
   uses that identical sticky pattern already — on inspection its "empty
   space" only exists in a snapshot at rest, not while scrolling (it stays
   in view the whole time), so it's a content-density question (would need
   new copy) rather than a genuine stranded-content bug, and was left
   alone rather than padded with filler.
6. **Home page length / duplicated Experience** — done, as decided.
   `/about` now owns the full role history with the shipped-work detail
   (`RoleAccordion`, extracted out of the old home component unchanged);
   the home page's `Experience` section shows a three-role summary (the
   first three by `order` — the current/most recent ones) with a "Full
   experience" link to `/about#experience`.

**Not worth doing:** chasing the remaining ~430px gap in the featured
project tile (the asymmetric grid wants it) or a light theme (contradicts
AGENTS.md §5, and every contrast figure from the review is against dark
surfaces).

---

## Open questions

- **Should `/api/admin` be renamed** now that it has a documented public
  spec and (eventually) non-browser consumers? Recommendation: still not
  now — touches every route file, `admin-fetch.ts`, and `proxy.ts`'s
  matcher for cosmetics alone. Revisit if real external consumers show up.

---

## What's left before this ships

Everything above is implemented and, as of 2026-09-20, passing locally —
Cloudinary included, verified with a real upload/delete round trip against
the live account, not just a config check. Two things still need a person
before any of it is live in production:

1. **Cloudinary credentials in GitHub Actions** — see "Cloudinary setup"
   above. Dev has them; production doesn't yet. Without them, `/admin/media`
   uploads 502 in production (clearly, not silently) and every image field
   on the public site just stays empty, exactly as it does today.
2. **A normal push to `main`** once the above is in place — `deploy.yml`'s
   `verify` job re-runs the same gate this session already ran locally, so
   it should be a clean pass, but AGENTS.md §11's own lesson from the last
   deploy stands: "verified live" only means what it says once it's been
   checked against the actual running production container, not before.

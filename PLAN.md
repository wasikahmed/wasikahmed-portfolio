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

**Where things stand:** the public site, design system, data layer, and admin
CMS are complete, genuinely multi-user, and deployed — verified live against
`wasikahmed.me`, not just committed. Fixed roles with real permission
enforcement, database-backed sessions, a full invite → accept →
suspend/reactivate → delete → transfer-ownership surface, Bearer tokens for
programmatic clients, and a public generated API reference at `/docs`. See
AGENTS.md §7 and §11 for the architecture as it stands; this file only tracks
what's left.

There is no single theme below — the big one just closed. What remains is
one test gap, one operational task, a design pass that was never finished,
and a handful of decisions that keep getting carried forward. Do the
housekeeping first; it's cheap and unblocks nothing else.

---

## Housekeeping

1. **Migrate production's owner.** The admin account is still `role: 'admin'`
   from before this phase, not `owner` — `owner` is meant to be a singleton
   and right now nothing holds that role in production. Run `pnpm seed:admin`
   against production once (SSH in, run it against the deployed container).
   It's idempotent by email and doubles as the migration PLAN.md W9 always
   said it would be. **Side effect:** it also resets the password and prints
   the new one once — save it when it does. Not urgent: `admin` already has
   every functional permission `owner` has, so nothing is broken today,
   ownership transfer just has no one to transfer from.
2. **Re-examine the `next-auth` beta pin.** `next-auth@5.0.0-beta.32` is now
   actually carrying multi-user auth in production, not single-admin auth
   committed-but-undeployed. That risk was accepted before either of those
   were true. Read the changelog for what's changed since, and decide
   whether to bump or explicitly re-accept staying on it.
3. **Revisit force-2FA for non-owner roles**, deferred from W11 "until the
   invitation flow has been used by a real person at least once." Today's
   session drove the full invite → accept → promote → suspend →
   ownership-transfer path by hand, live, in production's dev stack — but
   that was one person testing, not a second real user's first login.
   Decide whether that counts or whether it's still waiting on an actual
   second person.
4. **Off-box backups** — still local-retention only (AGENTS.md §10).
   Unchanged since it was last raised; the risk keeps growing with every
   additional user whose work lives on that one VPS.

---

## W14 item 6 — the one remaining test

Everything else in the old W14 list (permission matrix, per-route
enforcement, the publish boundary, immediate revocation, owner guards,
Bearer parity) is done and was re-verified live today — see the archive for
specifics. This is the one gap:

**E2E: the invitation round trip.** Invite → accept → log in → hit a
permission ceiling → get refused, as a repeatable Playwright test.
`e2e/admin.spec.ts` already establishes the pattern (a deterministic,
no-TOTP account via `seed:e2e-admin`) but only covers the project CRUD
pipeline. Extend it with a second seeded account at a lower role, or add a
sibling spec. Today's manual pass covered this exact path against the dev
stack by hand and it held up — that's evidence it's worth locking in, not a
substitute for the test itself.

Sabotage-test it once written: break a guard, confirm the test goes red,
restore. That standard has caught real bugs in this phase already (see the
archive's W9 role-table correction).

---

## W15 continued — design pass, open items

Independent of everything else; can land in any order. Source: a full visual
review of the seven public routes on 2026-09-04, measured in real Chromium
(1440×900 and 390×844) against the seeded Docker stack, not read off source.
The WCAG fixes, brand mark, and accent rework from that same review already
shipped (archive has the measurements); these did not.

1. **There is not a single image on the site.** Zero `<img>` elements across
   all six public routes — everything is type and inline SVG. Coherent as a
   choice, but it also means a personal portfolio with no face on it, and
   four case studies about systems nobody can see. Highest leverage on this
   list: one portrait on `/about`, then one visual per project (a
   screenshot, a real dashboard, a schema). The infrastructure already
   exists and is unused — `media` upload, `probe-image-size`, and the admin
   media library are all built and currently hold zero real records.
2. **`/work` is thinner than the site it belongs to.** ~1,600px tall on a
   900px viewport — four uniform tiles, then dead space before the footer.
   The card already knows `year`, `role`, `timeline`, and `categories` and
   shows none of them.
3. **The contact form is hidden behind a click.** Two intent cards, then the
   form. Consider rendering it immediately with intent as its first field —
   same qualifying signal, one fewer step, and it's the one page whose whole
   job is receiving a message.
4. **11px type is doing too much work.** 126 text nodes on the home page
   render below 12px, including metric baselines and footer meta that you
   actually want read, not just mono eyebrows and stack chips. Promoting
   those to `text-xs` costs almost no vertical space.
5. **Tall sections leave stranded columns.** `/about`'s right column empties
   below the fact card (~350px), Process holds one sentence against four
   steps, `/contact`'s right column ends early. Each would read as composed
   with either a deliberate filler or a narrower container.
6. **The home page is a ~7,500px scroll on mobile**, and Experience repeats
   in full on `/about` as a timeline. Decide which page owns that content —
   recommendation below — and trim the other.

**Decided:** `/about` owns the full Experience timeline; the home page keeps
a three-role summary. Not yet implemented.

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

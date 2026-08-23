# Portfolio Rebuild — Master Plan

**Owner:** Wasik Ahmed
**Date:** 2026-08-23
**Goal:** Rebuild the Figma Make / Vite prototype into a production-grade Next.js
portfolio with a MongoDB-backed admin CMS, Dockerized, served through Cloudflare
Tunnel on a self-hosted VPS.

**Design thesis:** *Signal over noise.* Creative and interactive, but every effect
must earn its place by carrying information.

---

## 1. Current State Assessment

### Stack today
Vite 8 + React 19 + react-router 8, Tailwind v4, TypeScript, wrapped in Figma Make
tooling (`.figma/make/*`, custom Vite plugins). Not a git repository.
`node_modules` not installed.

### Blocking defect
`src/routes.tsx:10` imports `./pages/DesignSystem` — file does not exist. Build fails.
Irrelevant after migration; recorded as a known pre-existing defect.

### What we keep — the design DNA
| Element | Value |
|---|---|
| Base | `#0A0E0C` near-black; `#0F1410` / `#111916` / `#162019` surfaces |
| Accent | `#0FBF7A` emerald → `#7CE86A` lime |
| Support | `#0B5C4E` teal, `#F5A524` amber |
| Text | `#EAF2ED` primary, `#7C8B84` muted |
| Display | Space Grotesk, tight tracking (−0.02 / −0.03em) |
| Body | Inter · **Mono** JetBrains Mono (eyebrows, tags, metadata) |
| IA | Home / Work / Case Study / Writing / Article / About / Contact |

### What we fix
1. **Tokens bypassed** — `@theme` declares color vars; ~400 inline `style={{ color: '#0FBF7A' }}` ignore them.
2. **No content layer** — case-study and article bodies are hardcoded in components; every `:slug` renders identical text.
3. **Placeholder content** — fictional companies, testimonials, metrics; Unsplash stock imagery.
4. **Contact form is inert** — sets local state, submits nowhere.
5. **No SEO** — CSR-only, no per-route metadata, `robots.index: false`, no sitemap / OG / structured data.
6. **Accessibility** — zero `prefers-reduced-motion` handling; bypass links off; mobile menu lacks focus trap and `aria-expanded`.
7. **Performance** — 12+ runtime icon fetches to a third-party CDN, 3 render-blocking font imports, unoptimized images, full-viewport `mix-blend-mode` noise layer.
8. **Missing infrastructure** — no tests, lint, CI, Docker, backend.
9. **Visual noise** — quantified in §2 below. This is the primary UX problem.

---

## 2. Design Language — "Quiet Confidence"

### 2.1 The noise problem, measured

The current Home hero runs **nine** simultaneous ambient effects before a single
word of content is read:

1. Film noise overlay (fixed, full-viewport, `mix-blend-mode: overlay`)
2. Grid texture at 40% opacity
3. Gradient blob #1 (drifting, 14s loop)
4. Gradient blob #2 (drifting, 20s reverse)
5. Gradient blob #3 (drifting, offset)
6. Cursor-following radial glow
7. Twelve tech tiles, each floating on an independent 2.7–4.1s loop
8. Pulsing availability dot
9. Bouncing scroll hint — with a marquee scrolling directly below

Nothing here is badly built. The problem is that it is all running *at once, forever,
carrying no information*. The eye has no resting place and no focal point.

### 2.2 The three rules

**Rule 1 — Motion must earn its place.**
Every animation must do one of three things:
- **(a) Reveal information** — a diagram drawing itself in the order the system executes
- **(b) Confirm an interaction** — a button responding to your press
- **(c) Establish spatial continuity** — a card becoming the page it opens

Motion that does none of the three is decoration, and gets cut.

**Rule 2 — Ambient effects are a budget, not a palette.**
Maximum **two** ambient layers visible in any viewport. Currently: nine.

**Rule 3 — Motion on demand, not motion forever.**
Things respond when engaged; they do not loop perpetually in the periphery. The one
exception is state that is genuinely live (the availability dot), slowed down.

### 2.3 Applying the rules

| Current | Change | Rationale |
|---|---|---|
| Film noise, fixed full-viewport, blended | Hero + CTA band only; static; no blend mode | Was a full-screen repaint layer for a texture nobody consciously sees |
| Grid texture 40%, most sections | Two sections only, 15%, as a spatial anchor | Texture that is everywhere reads as flat, not textured |
| 3 drifting blobs + cursor glow together | 1 blob; cursor glow in hero only | Four soft-light sources cancel each other into grey wash |
| 12 perpetually floating tech tiles | Constellation at rest; responds to cursor only | Rule 3 — the biggest single noise reduction on the page |
| Marquee always scrolling | Cut from Home; kept on `/about` as a static wrap | Duplicated the tech grid directly above it |
| Bouncing scroll hint | Cut | Redundant with the scroll rail; users know how to scroll |
| Pulsing availability dot | Keep — slowed 2s → 3.5s | Carries live information. Rule 1(a) |
| Every card is glass | Glass reserved for interactive/elevated; flat surfaces for content | Uniform treatment destroys hierarchy |
| Uniform `rgba(15,191,122,0.11)` border | 4-step elevation scale with matched borders and shadows | Everything currently sits on the same visual plane |
| Uniform `py-28` on every section | Density tokens: `compact` / `default` / `spacious` / `full-bleed` | Even rhythm is monotonous rhythm |
| Unlimited tag chips | Max 3 visible, then `+2` | Chip walls are the classic portfolio noise-maker |

**Net result:** hero ambient layers go from **nine to two** — one blob and the
constellation — while the page becomes *more* interactive, not less.

### 2.4 Progressive disclosure — how to show more with less

This is the mechanism that resolves "show information / reduce noise". Density
becomes available on demand rather than dumped on arrival.

| Surface | Default state | On demand |
|---|---|---|
| Work card | Title, one outcome metric, 3 stack chips | Hover reveals the problem statement; click opens the full case study |
| Case study | Prose with sticky TOC | "At a glance" metric bar pins on scroll; architecture diagram expands to full-bleed |
| Experience | All roles collapsed (one line each) | Click expands shipped-work bullets. Already the right pattern — kept |
| Tech constellation | Nodes at rest, unlabelled | Hover → tool name + "used in 3 projects"; click → filters `/work` |
| Article | Body + reading progress | Footnotes and code blocks expand inline |
| Whole site | Nothing on screen | **⌘K** — full navigation, project and article search, copy email, download resume |

The ⌘K palette is the purest expression of the thesis: complete information access
occupying zero pixels until requested.

### 2.5 The signature interactions — six, each justified

Deliberately few. Each one is listed with the information it carries; if that column
were empty, it would not be on this list.

| # | Interaction | Information carried |
|---|---|---|
| 1 | **Tech constellation** (hero) — nodes at rest, faint proximity edges; the cursor acts as a gentle gravitational lens. Hover a node for the tool and its project count; click to filter `/work` | What I use, *and proof of where I used it* — replaces a decorative float grid with a navigable index |
| 2 | **Shared-element transition** — work card image and title morph into the case-study hero via View Transitions | Spatial continuity: you always know where you came from |
| 3 | **Self-drawing architecture diagram** — SVG `stroke-dashoffset` bound to scroll; each stage labels itself as it enters | The system explanation *is* the animation — sequenced so it is legible instead of dumped at once |
| 4 | **Metrics that show their work** — "92%" counts up, then a sub-caption reveals the baseline: "3.1 hrs/day → 14 min/day" | A percentage without a baseline is marketing. With one, it is evidence |
| 5 | **⌘K command palette** | The entire site map, at zero screen cost |
| 6 | **Section rail** — the existing left progress bar becomes a section index; labels appear on hover, click to jump | Upgrades a decorative element into a functional one — where am I, and how do I get elsewhere |

### 2.6 What I recommend cutting — and why

Applying the thesis honestly means cutting things that would otherwise be on a
"cool effects" list:

- **Custom cursor** — replaces a native, perfectly-tuned OS affordance with a
  laggy imitation. Hurts usability, adds a permanent moving element, carries zero
  information. **Cut.** Subtle magnetic pull on the two primary CTAs only, which
  qualifies under Rule 1(b).
- **Scroll-jacking / Lenis smooth scroll** — fights the user's input device and
  breaks trackpad momentum expectations. **Cut.** Native scroll, tuned CSS.
- **Preloader / intro animation** — a delay tax on every visit, and recruiters
  bounce. **Cut.**
- **Parallax on more than one section** — the third instance stops reading as
  depth and starts reading as jitter. **One section only.**
- **Animated gradient text on every heading** — reserved for the hero headline.

Interactivity should feel like *responsiveness*, not like *performance*.

### 2.7 Page-by-page direction

**Home** — Currently nine ambient layers and one CTA. Becomes the hero specified in
§2.9, then a genuinely varied rhythm —
selected work in an *asymmetric offset grid* rather than a uniform card grid, a
full-bleed impact statement, the experience accordion, an editorial two-column
process section, and a calm CTA band. Testimonials fold into the work cards as
inline quotes rather than occupying their own carousel.

**Work** — Filter chips drive a `layout`-animated reflow (motion's `layout` prop),
so cards move to their new positions rather than popping. Relationships are
preserved through the change — Rule 1(a).

**Case study** — The strongest page and the one that converts. Pinned "at a glance"
metric bar, sticky TOC, self-drawing architecture diagram, before/after code
comparison, and an honest "what broke" section (already present — it is the most
credible thing on the site).

**Writing** — Editorial layout, not cards. Article list with generous type,
hover-reveal excerpts, TIL notes in a denser secondary column.

**About** — The one place a marquee and a portrait belong. Keep the timeline;
replace stock imagery.

**Contact** — Two clear paths (project enquiry / role enquiry) instead of one long
form. Progressive form: three fields visible, the rest appear on intent.

### 2.8 Foundations

- **Accent ramp** — `#0FBF7A` becomes five steps: `subtle → default → strong → glow → gradient`
- **Elevation scale** — four surfaces with matched border and shadow tokens
- **Fluid type scale** — one token ramp replacing 20+ per-element `clamp()` calls
- **Density tokens** — `compact` / `default` / `spacious` / `full-bleed`
- **Motion tokens** — three durations, three easings; nothing bespoke per component
- **Dark only** — no light mode, no toggle, no `dark:` variants. `color-scheme: dark` global. The token layer earns its place through maintainability, not theming.

### 2.9 Hero specification — locked

```
SOFTWARE ENGINEER · AI & AUTOMATION          ← eyebrow, mono, accent

I build systems that do                      ← Space Grotesk, clamp(52-96px)
the work for you.                              gradient on line 1 only

Document pipelines, schedulers, and internal ← NEW. Inter, fg-muted, max 52ch
tools — shipped to production, not demos.      concrete proof, not a slogan

[ View work → ]   [ Get in touch ]           ← NEW second CTA

     ○───○        ○
    ╱ ╲   ╲      ╱ ╲                         ← constellation AT REST
   ○   ○───○───○   ○                           cursor bends locally
    ╲ ╱     ╲   ╱ ╱                            hover → name + project count
     ○───────○───○                             click → filters /work
```

**Constellation behaviour**
- **Rest state.** Nodes are static. No float loops, no idle animation. This single
  change removes twelve perpetual animations from the page.
- **Cursor lens.** Nodes within ~160px displace along the cursor vector, magnitude
  falling off with distance. Local, subtle, and it stops the instant the cursor leaves.
- **Edges.** Drawn between nodes under a proximity threshold, opacity scaled by
  distance. Recomputed only on cursor move, not on a RAF loop.
- **Hover.** Node scales, brand color resolves from monochrome, tooltip shows the
  tool name and *"used in 3 projects"*.
- **Click.** Navigates to `/work?tech=<slug>` with the filter pre-applied.
- **Layout.** Force-relaxed once at mount, then frozen and cached — deterministic
  across reloads, no layout thrash.
- **Reduced motion.** Renders as a static labelled grid. Still hoverable, still
  clickable — the *information* survives; only the movement is dropped.
- **Mobile.** No pointer, so no lens. Falls back to a static two-row icon grid,
  tap-to-filter.
- **Cost.** Single SVG, no canvas, no physics library, bundled icons. Under 8KB.

**Why this hero.** It answers "what do you use" and "where did you use it" in the
same element, and turns the site's most decorative region into its most navigable
one — Rule 1(a), on the most valuable pixels on the site.

### 2.10 Ambient budget ledger — locked at 2

Enforced per viewport, audited section by section in Phase 2.

| Section | Layer 1 | Layer 2 | Cut from today |
|---|---|---|---|
| Hero | Single blob | Cursor glow | 2 blobs, grid texture, 12 float loops, scroll hint, noise blend |
| Selected work | Grid texture @15% | — | Blobs, noise |
| Impact | Noise (static) | — | Grid, blobs |
| Experience | — | — | Everything — pure content |
| Process | Grid texture @15% | — | Blobs |
| Writing | — | — | Everything |
| CTA band | Single blob | Noise (static) | Grid |
| Footer | — | — | Everything |

Four of eight sections carry **zero** ambient layers. That contrast is what makes
the two that do land.

Site-wide constants that do not count against the budget, because each carries
information: the availability dot (live state, slowed 2s → 3.5s) and the section
rail (position + navigation).

---

## 3. Target Architecture

```
                    ┌─────────────────────────┐
   Internet ───────▶│   Cloudflare Edge       │  TLS · WAF · Turnstile
                    │   Access · Rate limits  │  Cache rules · Bot mgmt
                    └───────────┬─────────────┘
                                │  outbound-only QUIC tunnel
                    ═══════════ ▼ ═══════════════════════════
                     VPS — no inbound ports open (ufw deny all)
                    ┌─────────────────────────┐
                    │  cloudflared  (existing)│
                    └───────────┬─────────────┘
                                │ 127.0.0.1 loopback only
              ┌─────────────────┼──────────────────┐
              ▼                 ▼                  ▼
      ┌───────────────┐  ┌─────────────┐   ┌──────────────┐
      │ Next.js       │  │ Umami       │   │ (future svc) │
      │ standalone    │  │ analytics   │   └──────────────┘
      │ :3000         │  │ :3001       │
      └───────┬───────┘  └──────┬──────┘
              │                 │
      ┌───────▼─────────────────▼───────┐    ┌──────────────────┐
      │ MongoDB — auth on, no host port │───▶│ mongodump backup │
      │ named volume                    │    │ cron → R2/S3     │
      └─────────────────────────────────┘    └──────────────────┘
```

### Framework
Next.js (latest stable, App Router). RSC by default; Client Components only where
interaction demands. Route groups: `app/(site)`, `app/(admin)`, `app/api`.
`next/font` self-hosts all three families — removes three render-blocking requests
and eliminates layout shift. `next/image` for AVIF/WebP. Metadata API for SEO,
`next/og` for social cards. ISR + on-demand revalidation so CMS edits publish
without a rebuild.

### Styling
Tailwind v4, token-first. Every color, radius, shadow, spacing step, duration and
easing lives in `@theme`. **Zero hardcoded hex in components.** Semantic layer:
`--color-bg`, `--color-surface-{1..4}`, `--color-border-{subtle,default,strong}`,
`--color-accent-{subtle,default,strong,glow}`, `--color-fg`, `--color-fg-muted`.
`cva` + `tailwind-merge` for variants.

### Motion
`motion` (Framer Motion successor) for orchestration; View Transitions API for page
continuity; CSS keyframes for the few cheap always-on loops. A `<MotionProvider>`
reads `prefers-reduced-motion` once and collapses every animation to an instant
state change — **non-negotiable, and tested in the E2E suite.**

### Data layer
MongoDB + Mongoose; Zod at every boundary; hot-reload-safe connection singleton.

| Collection | Purpose |
|---|---|
| `projects` | Case studies — metadata + MDX body, gallery, metrics with baselines, stack |
| `posts` | Articles and TIL — MDX body, tags, reading time |
| `testimonials` | Quote, author, role, company, featured, order |
| `experience` | Role, company, period, type, shipped bullets, order |
| `skills` | Grouped entries with category — drives the constellation |
| `leads` | Contact submissions: payload, status, notes, source, hashed IP, UA |
| `settings` | Singleton: availability, contact email, socials, resume URL, hero copy |
| `media` | Asset metadata: key, url, alt, dimensions, blurhash |
| `users` | Admin accounts — argon2id hash, TOTP secret, role |
| `auditLog` | Who changed what, when, before/after diff |
| `pageViews` | First-party view counts per slug |

Every content collection carries `slug`, `status` (`draft|scheduled|published`),
`publishedAt`, `seo`, `order`, `createdAt`, `updatedAt`.

### Admin CMS (`/admin`)
Dashboard (leads inbox, view counts, publish queue) · content CRUD · **MDX editor
with live side-by-side preview rendering in the real site components**, with custom
blocks `<Callout>` `<Metric>` `<Architecture>` `<CodeCompare>` · media library with
enforced alt text and automatic blurhash · leads workflow (new → read → replied →
archived) with CSV export · settings (availability toggle drives the live site
pill) · drag-to-reorder · full audit log.

### Auth — defense in depth (three layers, locked)
1. **Cloudflare Access** at the edge — `/admin` never reaches the origin unauthenticated.
   The app additionally verifies the `CF-Access-Jwt-Assertion` header against
   Cloudflare's JWKS, so the origin trusts the edge cryptographically rather than
   by assumption
2. **Auth.js (NextAuth v5)** — Credentials, argon2id, single CLI-seeded admin, no signup route
3. **TOTP 2FA** required
4. `middleware.ts` guards `/admin/*` and `/api/admin/*`; httpOnly `SameSite=Lax` `Secure` cookies; login rate-limited with lockout

### Contact pipeline
Zod → honeypot → **Cloudflare Turnstile** → rate limit (IP + email) → persist →
**Resend** owner notification → auto-reply → optional webhook ping.

### Security
Strict CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
via `next.config` headers. CSRF on admin mutations. MDX sanitized on render.
Secrets server-only. Mongo bound to the compose network with auth, never published.
Dependabot + `pnpm audit` in CI.

> **Cloudflare-specific:** cloudflared connects over loopback, so `request.ip` is
> always `127.0.0.1`. **Real client IP must be read from `CF-Connecting-IP`** — this
> is mandatory, not optional, and it gates rate limiting and lead IP hashing. A
> single `getClientIp()` helper owns this, with the header trusted only because
> nothing but cloudflared can reach the origin.

### SEO
Per-route `generateMetadata` + canonicals · JSON-LD (`Person`, `WebSite`,
`BlogPosting`, `CreativeWork`, `BreadcrumbList`) · dynamic OG images ·
`sitemap.ts` / `robots.ts` with **indexing enabled** (currently disabled) · RSS +
JSON Feed.

### Accessibility — WCAG 2.2 AA
Skip link on · semantic landmarks · visible focus rings · mobile menu focus trap,
`aria-expanded`, Escape, scroll lock · full reduced-motion support · contrast audit
(`#7C8B84` on `#0A0E0C` is marginal at the 11–12px sizes it is currently used at —
the muted token gets lightened) · axe assertions in E2E.

### Performance budget
| Metric | Budget |
|---|---|
| LCP | < 2.0s |
| CLS | < 0.05 |
| INP | < 200ms |
| First-load JS per route | < 130KB gzip |
| Lighthouse, all categories | ≥ 95 |

Tactics: RSC-first · self-hosted subset fonts · **bundled SVG tech icons** (removes
12 third-party CDN requests) · `next/image` · route-level splitting · noise overlay
demoted to a cheap non-blending pseudo-element on two sections.

### Testing
**Vitest** — schemas, utils, mappers, API handler logic.
**Playwright** — nav, contact submit, admin login + CRUD round-trip,
reduced-motion rendering, axe scans.
**Lighthouse CI** — budget above enforced in the pipeline.

---

## 4. Docker & Deployment — Cloudflare Tunnel

### Why this topology
`cloudflared` already runs on the VPS and dials *outbound* to Cloudflare. That means:

- **No inbound ports.** `ufw default deny incoming` — including 80 and 443. The
  origin is unreachable from the public internet by design.
- **No reverse proxy container.** Caddy/nginx are unnecessary — Cloudflare terminates
  TLS at the edge and the tunnel handles origin routing.
- **Origin IP never exposed.** No DNS record points at the VPS.
- **WAF, rate limiting, bot management and Turnstile** are available at the edge,
  in front of the app's own protections.

### Image
Multi-stage `Dockerfile` on `node:22-alpine`: `deps → builder → runner`, Next
`output: 'standalone'`, non-root `nextjs` user, `tini` as PID 1, `HEALTHCHECK`
hitting `/api/health`.

### Compose
- **`docker-compose.yml`** — dev: `web` (hot reload, bind mount), `mongo`, `mongo-express`
- **`docker-compose.prod.yml`** — `web`, `mongo` (auth, named volume, **no host port**),
  `umami`, `backup` (mongodump cron → R2/S3 with retention)

Production services bind **loopback only**:
```yaml
web:
  ports: ["127.0.0.1:3000:3000"]   # reachable by cloudflared, by nothing else
```

### Tunnel ingress
Added to the existing `cloudflared` config — no new tunnel required. `${DOMAIN}` is
an env-substituted placeholder throughout; it is supplied once at deploy time and
never hardcoded in the repo.

```yaml
ingress:
  - hostname: ${DOMAIN}
    service: http://localhost:3000
  - hostname: www.${DOMAIN}
    service: http://localhost:3000
  - hostname: analytics.${DOMAIN}
    service: http://localhost:3001
  - service: http_status:404
```

**Placeholder convention.** `DOMAIN` lives in `.env` and flows into
`NEXT_PUBLIC_SITE_URL` (canonicals, sitemap, OG image URLs, RSS), the Access policy,
the CSP `report-uri`, and Resend's from-address. A single `pnpm verify:env` script
fails loudly if it is still unset at build time, so a placeholder can never reach
production silently.

### Cloudflare edge configuration
| Setting | Value |
|---|---|
| Cache rules | Aggressive on `/_next/static/*` and `/fonts/*`; **bypass** on `/admin/*` and `/api/*` |
| Access | **Locked on** — self-hosted app policy on `/admin*`, email OTP or Google SSO |
| WAF rate limits | `/api/contact` and `/api/auth/*` |
| Turnstile | Contact form widget |
| Polish / Mirage | **Off** — `next/image` already emits AVIF/WebP; double compression degrades quality |
| Always Use HTTPS | On · **Min TLS** 1.2 · **HSTS** on |

### CI/CD — GitHub Actions
```
lint → typecheck → unit → build → e2e → Lighthouse CI
  → build image once, push to BOTH registries
  → SSH to VPS → docker compose pull && up -d --wait
  → healthcheck → auto-rollback to previous tag on failure
```

**Dual registry publish** — one build, two destinations via `docker/metadata-action`:
```yaml
images:
  - ghcr.io/${{ github.repository }}
  - docker.io/${{ secrets.DOCKERHUB_USERNAME }}/portfolio
tags:
  - type=raw,value=latest,enable={{is_default_branch}}
  - type=sha,format=short          # immutable deploy target
  - type=ref,event=branch
  - type=semver,pattern={{version}}
```
Secrets required: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` (access token, not password),
`GHCR` uses the built-in `GITHUB_TOKEN`.

> **Practical note:** the VPS pulls from **GHCR** — unlimited for public images and
> already authenticated by the deploy workflow. Docker Hub is the *public showcase
> mirror*; its free tier rate-limits pulls (200 per 6h authenticated) and is a poor
> choice for the deploy hot path. Both stay in sync automatically since it is one
> build with two tag sets.

Deploys pin the **`sha-` tag**, never `latest`, so a rollback is a one-line tag change.

### Operations
Nightly `mongodump` with retention and a **documented, rehearsed restore drill** ·
uptime monitoring · Sentry (self-hostable) · structured JSON logging ·
Cloudflare Tunnel health visible in the Zero Trust dashboard.

> **Known limitation — deploy gap.** A single `web` container means `compose up -d`
> causes a ~5–10s outage while the container restarts. Acceptable for a portfolio.
> If it is not, the mitigation is two replicas behind a tiny internal proxy, which
> adds a container and real complexity for a few seconds of uptime. Flagging rather
> than silently choosing.

---

## 5. Migration Strategy

The current repo is a Figma Make scaffold with bespoke Vite plugins. Converting in
place would fight that tooling the whole way.

1. **`git init` + initial commit first** — there is currently no version control and no safety net
2. Move `src/` → `_reference/`, read-only design source of truth
3. Scaffold Next.js fresh at the repo root
4. Port section by section, converting inline styles to tokens as each lands
5. Delete `_reference/`, `.figma/`, and the Vite config once parity is reached

---

## 6. Phased Delivery

| Phase | Scope | Exit criteria |
|---|---|---|
| **0. Foundations** | `git init`, Next.js scaffold, TS strict, ESLint + Prettier, Vitest + Playwright, folder architecture | `build` and `test` green |
| **1. Design system** | Token layer, accent ramp, elevation scale, fluid type, density + motion tokens, primitives, `/design-system` route | Every primitive documented; zero hardcoded hex |
| **2. Public site** | All seven pages rebuilt as RSC, §2 noise reductions applied, signature interactions 1–6 | Ambient budget ≤ 2 per viewport; responsive 320→2560px; reduced-motion verified |
| **3. Data layer** | Mongo, Mongoose models, Zod schemas, seed from existing `src/data`, typed query layer | Site renders entirely from the database |
| **4. Admin CMS** | Auth.js + TOTP, middleware, dashboard, CRUD, MDX editor + live preview, media library, audit log | Full content round-trip through the UI |
| **5. Leads pipeline** | Contact API, Turnstile, rate limiting, `CF-Connecting-IP` handling, Resend, admin inbox | Submission lands in inbox and email; abuse paths blocked |
| **6. Polish** | SEO, OG, RSS, sitemap, JSON-LD, Umami, a11y pass, perf pass | Lighthouse ≥ 95 all categories; axe clean |
| **7. Ship** | Dockerfile, both compose files, tunnel ingress, Cloudflare Access + WAF, Actions → GHCR + Docker Hub, backups, restore drill | One-command deploy; verified restore |
| **8. Content** | Real copy, screenshots, diagrams, metrics with baselines, resume, testimonials | Zero placeholder text or stock imagery |

---

## 7. Locked Decisions

| # | Decision | Choice |
|---|---|---|
| 1 | Deployment | Self-hosted VPS, **Cloudflare Tunnel** (existing `cloudflared`), no inbound ports, no reverse-proxy container |
| 2 | Registries | **Both** — GHCR (deploy path) and Docker Hub (public mirror), one build, dual push |
| 3 | Content | CMS first — seed placeholders, populate through admin later |
| 4 | Editor | MDX + live side-by-side preview, custom blocks |
| 5 | Visual | Elevate the emerald/dark identity |
| 6 | Theme | **Dark only** — no light mode, no toggle |
| 7 | Design thesis | **Signal over noise** — ambient budget of 2; motion must reveal, confirm, or connect |
| 8 | Cut list | Custom cursor, scroll-jacking, preloader, multi-section parallax |
| 9 | Hero | **Constellation as the proof** — headline + proof line + two CTAs + interactive tech constellation (§2.9) |
| 10 | Ambient budget | **2 per viewport**, ledger fixed in §2.10; four of eight sections carry zero |
| 11 | Admin auth | **Cloudflare Access + Auth.js + TOTP** — three layers, JWT assertion verified at origin |
| 12 | Domain | `${DOMAIN}` placeholder throughout; `verify:env` gate blocks an unset value at build |

---

## 8. Status — Plan Complete

All architectural and design decisions are resolved. Nothing blocks Phase 0.

### Inputs needed from you later (none block the build)

| When | What | Why it can wait |
|---|---|---|
| Phase 7 (deploy) | Your domain, `DOCKERHUB_USERNAME` + `DOCKERHUB_TOKEN`, VPS SSH deploy key, `RESEND_API_KEY`, Turnstile site/secret keys | Everything is written against placeholders and gated by `verify:env` |
| Phase 8 (content) | Real project write-ups, metrics **with baselines**, screenshots/diagrams, employment history, testimonials, resume PDF, social links | The CMS ships seeded with the current placeholders; you populate through the admin UI |

### Two content notes worth acting on early

1. **Metrics need baselines.** Signature interaction #4 renders "92%" alongside
   "3.1 hrs/day → 14 min/day". The baseline is what makes it evidence rather than
   marketing — so capture the *before* number for each project, not just the gain.
2. **Stock imagery is the single largest credibility leak on the site.** Real
   screenshots, or abstract renders of the actual architecture, beat Unsplash by a
   wide margin. Worth queuing before Phase 8 arrives.

### Next step

**Phase 0 — Foundations.** `git init` + initial commit, move `src/` → `_reference/`,
scaffold Next.js at the root with TS strict / ESLint / Prettier / Vitest /
Playwright, establish the folder architecture. Exit criteria: `build` and `test`
green. Nothing from the current design is deleted until Phase 2 reaches parity.

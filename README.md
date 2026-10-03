# wasikahmed.me

My portfolio site and the CMS behind it. One Next.js app serves the public
site and an admin area where all content is edited: projects, writing,
experience, page copy and the résumé.

Live: [wasikahmed.me](https://wasikahmed.me/?utm_source=github&utm_medium=readme&utm_campaign=portfolio&utm_content=wasikahmed-portfolio) · API reference: [wasikahmed.me/docs](https://wasikahmed.me/docs?utm_source=github&utm_medium=readme&utm_campaign=portfolio&utm_content=wasikahmed-portfolio)

## What's in it

- **Site:** case studies, writing with an RSS feed, a contact form with
  Turnstile and rate limiting, and generated social images and sitemap
- **CMS:** MDX editor with live preview, Cloudinary media library,
  drag-and-drop ordering, version history with restore, résumé versions
- **Security:** role-based access (4 roles, 19 permissions), argon2id
  passwords, optional TOTP 2FA, rotating refresh tokens with reuse
  detection, CSRF protection, per-request CSP, audit log
- **API:** Zod-validated REST endpoints with an OpenAPI spec generated from
  the same schemas
- **Delivery:** Vitest and Playwright tests; each push to `main` runs
  typecheck, lint, tests and build, then deploys a Docker image to a VPS,
  with automatic rollback if the health check fails

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · MongoDB · Auth.js ·
Zod · Vitest · Playwright · Docker · GitHub Actions

## Run locally

```bash
pnpm install
cp .env.example .env      # fill in MONGODB_URI at minimum
pnpm seed                 # loads fictional demo content
pnpm seed:admin           # creates the owner account, prints a password once
pnpm dev
```

Or run the full Docker dev stack (Mongo + mongo-express + hot reload) instead
of a host-side Mongo:

```bash
docker compose watch
```

Then visit `http://localhost:4000` and `/admin/login` for the CMS. The seed
is placeholder content; the live site's content is edited in the CMS and is
not part of this repository.

Commands, architecture, conventions and deployment are documented in
[`AGENTS.md`](./AGENTS.md); the current plan is in [`PLAN.md`](./PLAN.md).

---

© Wasik Ahmed Apon. The code is public for reference; the site's content is not licensed for reuse.

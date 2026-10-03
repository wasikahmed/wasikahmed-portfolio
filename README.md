# Wasik Ahmed — Portfolio

A personal portfolio site with a self-hosted admin CMS behind it. The public
site and the admin are one Next.js app; content lives in MongoDB and is
edited through `/admin`, not through code.

Full operating details — commands, directory map, non-negotiable rules,
design system, auth architecture, deployment, and known traps — live in
[`AGENTS.md`](./AGENTS.md). Current status and the forward plan live in
[`PLAN.md`](./PLAN.md). This file is just enough to get a checkout running.

## Stack

Next.js 16 (App Router, React 19) · TypeScript, strict · Tailwind CSS v4 ·
MongoDB + Mongoose · Auth.js v5 · Zod · `motion` · MDX

## Quick start

```bash
pnpm install
cp .env.example .env      # fill in MONGODB_URI at minimum
pnpm seed                 # idempotent — seeds initial content
pnpm seed:admin           # creates the owner account, prints a password once
pnpm dev
```

Or run the full Docker dev stack (Mongo + mongo-express + hot reload) instead
of a host-side Mongo:

```bash
docker compose watch
```

Then visit `http://localhost:4000` (both the Docker stack and a host-side
`pnpm dev` use the same port) and `/admin/login` for the CMS.

## Commands

See [`AGENTS.md` §2](./AGENTS.md#2-commands) for the full list and the
pre-push gate. The short version:

```bash
pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build
```

## Deployment

Push to `main` builds a Docker image, runs it through CI
(`typecheck`/`lint`/`format:check`/`test`/`build`), and deploys it to a VPS
behind a Cloudflare Tunnel with automatic rollback on a failed healthcheck.
See [`AGENTS.md` §10](./AGENTS.md#10-deployment).

# Production image — multi-stage, `next build`'s standalone output.
# Dev image is Dockerfile.dev (hot reload, bind mounts); this one is what
# CI builds and the VPS runs. See PLAN.md §4.

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.8.0 --activate

# ---- deps: install once, reused by the builder layer -----------------------
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# @node-rs/argon2's prebuilt binary is resolved for this exact platform —
# linux-x64-musl on this base image — so the build must run on the same
# architecture the image ships as. See the workflow's `platforms:` input.
RUN pnpm install --frozen-lockfile

# ---- builder: full source, produces .next/standalone ------------------------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Deliberately no MONGODB_URI here. `next build` does call the database —
# generateStaticParams() in the [slug] routes pre-renders known project/post
# pages — but there is no database reachable from inside a Docker build, by
# design, so those routes catch the connection failure and pre-render zero
# pages instead. `dynamicParams` defaults to true, so every slug still
# renders correctly on its first real request and is cached from there;
# leaving MONGODB_URI unset makes that failure an instant, synchronous throw
# (db.ts checks for the var before dialing) rather than a real TCP attempt
# timing out after 30s.
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# The seed scripts, bundled to single-file ESM so they can run in the
# runner image. That image has no pnpm, no tsx and no src/ — it is
# `next build`'s standalone output plus static assets — so `pnpm seed`
# cannot work there, which matters because a fresh deploy against an
# empty database has no content and, more importantly, no way to create
# the owner account and log in. mongoose and @node-rs/argon2 stay
# external: both are traced into the standalone node_modules already, and
# argon2 is a native binary that must not be bundled.
RUN pnpm build:scripts

# ---- runner: the actual production image ------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Standalone output does not include `public/` or `.next/static` — Next
# expects those served by a CDN in front of it. There isn't one here, so
# they're copied in by hand, same as the framework's own documented recipe.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/dist-scripts ./dist-scripts

USER nextjs
EXPOSE 3000

# busybox wget ships in alpine already — no extra package for a healthcheck.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

# PID 1 in this image is bare `node`, which doesn't reap zombies or forward
# signals correctly on its own. Rather than install tini into the image,
# docker-compose.prod.yml sets `init: true` on this service, which uses the
# tini binary Docker Engine already ships — one fewer package, same effect.
CMD ["node", "server.js"]

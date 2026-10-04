import { MongoBinary } from 'mongodb-memory-server';

/**
 * Downloads the mongod binary once, before any test file starts.
 *
 * pnpm-workspace.yaml keeps mongodb-memory-server's postinstall off, so the
 * binary is fetched on demand by the first MongoMemoryServer.create() — and
 * vitest runs test files in parallel workers, so on a cold cache (every
 * fresh CI runner) several files hit that first create() at once and race
 * on the download lock. That failed `deploy.yml`'s verify job on 2026-10-04
 * (run 37212732014) with "Cannot unlock file .../8.2.6.lock, because it is
 * not locked by this process". Called here with no options, getPath()
 * resolves the same default version and download directory create() does,
 * so every worker afterwards finds the binary already on disk.
 *
 * mongodb-memory-server re-exports MongoBinary from -core, which pnpm
 * doesn't hoist — importing -core directly would need a new dependency.
 */
export default async function setup() {
  await MongoBinary.getPath();
}

// Importing this from a Client Component is a build error, not a silent
// leak — see https://nextjs.org/docs/app/getting-started/server-and-client-components#preventing-environment-poisoning
import 'server-only';

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

/*
 * Hot-reload-safe connection singleton.
 *
 * Next's dev server (and Turbopack's module graph) can re-evaluate this
 * module on every file change. Without caching the connection promise on
 * `global`, each reload would open a fresh connection to Mongo and never
 * close the old one — a real connection leak within a few minutes of
 * editing. Caching on `global` survives module re-evaluation because the
 * Node process itself does not restart.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // `var` is required here: TS ambient global declarations only support `var`.
  var __mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global.__mongooseCache ?? { conn: null, promise: null };
global.__mongooseCache = cache;

export async function connectToDatabase() {
  if (cache.conn) return cache.conn;

  if (!MONGODB_URI) {
    throw new Error(
      'MONGODB_URI is not set. Copy .env.example to .env and point it at your Mongo instance.',
    );
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null;
    throw err;
  }

  return cache.conn;
}

/** For the health check — reports connectivity without holding the route up. */
export async function pingDatabase(): Promise<boolean> {
  try {
    const conn = await connectToDatabase();
    const admin = conn.connection.db?.admin();
    if (!admin) return false;
    await admin.ping();
    return true;
  } catch {
    return false;
  }
}

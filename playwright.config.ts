import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.PORT ?? '3100';
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // `next start` is what Next.js itself warns is incompatible with
    // `output: 'standalone'` (next.config.ts) — it works today only because
    // `next start` silently falls back to a normal server, which means this
    // suite was never actually exercising the artifact shape the production
    // Dockerfile ships. Build, assemble the standalone output the same way
    // the Dockerfile does (public/ and .next/static aren't included in it —
    // see the Dockerfile's comment), and run that instead.
    command: `pnpm exec next build && cp -r public .next/standalone/public && cp -r .next/static .next/standalone/.next/static && PORT=${PORT} node .next/standalone/server.js`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,

  /*
   * Next 16 blocks cross-origin requests for dev-only resources (chunks, HMR
   * socket) by default. The dev server treats `localhost` as canonical, so
   * loading the app over `127.0.0.1` — which tooling, Playwright, and preview
   * panes commonly do — gets its client chunks 403'd. The page still renders
   * from SSR, so the failure looks like "animations silently don't run"
   * rather than an obvious network error.
   *
   * Dev-only setting; it has no effect on production builds.
   */
  allowedDevOrigins: ['127.0.0.1'],
};

export default nextConfig;

'use client';

import { ApiReferenceReact, type AnyApiReferenceConfiguration } from '@scalar/api-reference-react';
// Not imported by the package itself at runtime — confirmed by reading its
// compiled `ApiReferenceReact.js` directly, which never references a CSS
// file despite the shipped `.d.ts` declaring `import './style.css'`. Without
// this, the real layout/grid rules never load and the reference silently
// falls back to its unstyled stacked-mobile layout at every viewport width
// (caught only by inspecting computed styles in a real browser, not by
// anything a screenshot alone would have made obvious).
import '@scalar/api-reference-react/style.css';

/**
 * `agent` isn't in this package version's published types yet — a real
 * version lag between `@scalar/api-reference` (which reads it) and
 * `@scalar/types` (which doesn't declare it), confirmed by reading the
 * former's source directly. Narrow, local extension rather than casting
 * the whole configuration object to `any`.
 */
type ConfigurationWithAgent = AnyApiReferenceConfiguration & {
  agent?: { disabled?: boolean };
};

/**
 * Self-hosted API reference (PLAN.md W13) — the npm package, not Scalar's
 * documented CDN `<script>` embed. That default would load an external
 * script proxy.ts's `strict-dynamic` CSP blocks outright, and loosening
 * the CSP to accommodate a docs page is the wrong trade (the archived plan
 * records a three-day production outage caused by exactly that shortcut).
 * Bundled through Next's own build instead: no CDN request, nothing for
 * the CSP to block.
 *
 * Public — no session, no layout chrome from `(site)`'s nav/footer. See
 * openapi.ts's module comment for why this and /api/openapi.json are
 * deliberately unauthenticated.
 *
 * Four settings exist only because a real browser console (not the CSP
 * headers themselves) showed Scalar reaching off-origin by default —
 * exactly the failure mode this file's own comment above warns about:
 * - `withDefaultFonts: false` — Scalar's own font files load from
 *   `fonts.scalar.com`, which `font-src 'self'` correctly blocks. Falls
 *   back to the system font stack rather than an external request.
 * - `hideClientButton: true` — the embedded "API Client" popout's own
 *   telemetry/registry integrations, unrelated to viewing this API's own
 *   docs. Per-operation "Test Request" (the actually useful part — firing
 *   a real call at this API) is a separate feature and stays on.
 * - `agent: { disabled: true }` — "Agent Scalar" (the sparkle "Ask AI"
 *   button) defaults to *enabled* on `localhost` specifically — which is
 *   exactly where this got caught in dev, and would NOT have shown up
 *   testing only against a deployed origin. It eagerly calls
 *   `api.scalar.com/vector/registry/*` on mount to suggest other public
 *   APIs, which has nothing to do with this one. Not exposed on
 *   `AnyApiReferenceConfiguration`'s published types yet (a real version
 *   lag between `@scalar/api-reference` and `@scalar/types` — verified by
 *   reading the former's source directly — see `ConfigurationWithAgent`
 *   above).
 * - `telemetry: false` — no anonymous usage reporting to Scalar, matching
 *   this app's self-hosted-only analytics stance (Umami, opt-in via env).
 */
export default function DocsPage() {
  const configuration: ConfigurationWithAgent = {
    url: '/api/openapi.json',
    theme: 'deepSpace',
    withDefaultFonts: false,
    hideClientButton: true,
    telemetry: false,
    agent: { disabled: true },
  };

  return <ApiReferenceReact configuration={configuration} />;
}

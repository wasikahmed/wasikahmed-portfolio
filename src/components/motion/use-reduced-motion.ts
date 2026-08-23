'use client';

import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

/** Server and first client render agree on `false`, so hydration matches. */
function getServerSnapshot() {
  return false;
}

/**
 * Reads the user's motion preference.
 *
 * `useSyncExternalStore` is the right primitive here: matchMedia is an
 * external store, and subscribing this way avoids the cascading re-render
 * that a `useEffect` + `setState` pair would cause on every mount.
 *
 * Components use this to render a genuinely *different* tree — a static
 * grid instead of an animated constellation — rather than merely animating
 * faster. The information survives; only the movement is dropped. PLAN.md §2.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

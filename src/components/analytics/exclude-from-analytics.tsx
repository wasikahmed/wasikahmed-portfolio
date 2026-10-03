'use client';

import { useEffect } from 'react';

/**
 * Anyone who opens /admin is the site's owner or someone they invited, and
 * their own visits to the public site would otherwise be counted — most
 * often while checking the very change they just published. Umami's
 * tracker skips every event while `localStorage['umami.disabled']` is set
 * (its documented opt-out), so setting it here excludes this browser from
 * then on, for every page on this origin.
 *
 * Per browser, not per account: it survives sign-out, and a new browser
 * starts counted until it visits /admin once. Clear it by hand
 * (`localStorage.removeItem('umami.disabled')`) to be counted again.
 */
export function ExcludeFromAnalytics() {
  useEffect(() => {
    try {
      localStorage.setItem('umami.disabled', '1');
    } catch {
      // Storage blocked (private mode, a strict browser setting) — nothing
      // to persist, and nothing else on the page depends on it.
    }
  }, []);
  return null;
}

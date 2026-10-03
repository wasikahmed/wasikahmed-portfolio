'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { EVENTS, track } from '@/lib/analytics';

/**
 * Reports a 404 with the address that missed and where the visitor came
 * from — the referrer's host is what says whether a broken link is ours
 * (an old internal link) or someone else's (a stale external one).
 */
export function TrackNotFound() {
  const pathname = usePathname();
  useEffect(() => {
    let from = 'direct';
    try {
      if (document.referrer) from = new URL(document.referrer).hostname || 'direct';
    } catch {
      from = 'unknown';
    }
    track(EVENTS.notFound, { path: pathname.slice(0, 500), from });
  }, [pathname]);
  return null;
}

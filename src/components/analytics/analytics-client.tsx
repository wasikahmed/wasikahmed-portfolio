'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import {
  EVENTS,
  dataFromAttributes,
  flushQueuedEvents,
  labelOf,
  locationOf,
  track,
  type AnalyticsEvent,
} from '@/lib/analytics';

const RESUME_PATHS = new Set(['/resume', '/wasik-ahmed-resume.pdf']);
const SCROLL_THRESHOLDS = [25, 50, 75, 100];

/**
 * Classifies a click into one event, or none. Runs for every click on the
 * page in the capture phase and never calls preventDefault — unlike
 * Umami's own `data-umami-event` attribute, which cancels a same-tab link,
 * waits for the beacon and then sets `location.href`, turning every
 * Next.js client-side navigation it touches into a full page reload.
 * The beacon is sent with `keepalive`, so it survives the navigation the
 * click goes on to cause.
 */
function onDocumentClick(event: MouseEvent) {
  // Primary and middle clicks; the context menu isn't a visit.
  if (event.button !== 0 && event.button !== 1) return;
  const target = event.target as Element | null;
  const element = target?.closest<HTMLElement>('[data-track], a[href]');
  if (!element) return;

  const location = locationOf(element);

  // Explicitly marked elements win: the marking says what the click means.
  if (element.dataset.track) {
    track(element.dataset.track as AnalyticsEvent, {
      ...dataFromAttributes(element),
      location,
    });
    return;
  }

  if (!(element instanceof HTMLAnchorElement)) return;
  const href = element.getAttribute('href') ?? '';
  // EmailLink tracks its own clicks, with what happened after them.
  if (href.startsWith('mailto:')) return;

  let url: URL;
  try {
    url = new URL(element.href, window.location.href);
  } catch {
    return;
  }

  if (url.origin !== window.location.origin) {
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
    track(EVENTS.outboundClick, {
      host: url.hostname.replace(/^www\./, ''),
      url: `${url.origin}${url.pathname}`.slice(0, 500),
      label: labelOf(element),
      location,
    });
    return;
  }

  if (RESUME_PATHS.has(url.pathname)) {
    track(EVENTS.resumeDownload, { label: labelOf(element), location });
    return;
  }

  if (url.hash && url.pathname === window.location.pathname) {
    track(EVENTS.sectionJump, { target: url.hash.slice(1), location });
    return;
  }

  const project = /^\/work\/([^/]+)\/?$/.exec(url.pathname);
  if (project) {
    track(EVENTS.projectOpen, { slug: project[1], location });
    return;
  }

  const post = /^\/writing\/([^/]+)\/?$/.exec(url.pathname);
  if (post) {
    track(EVENTS.postOpen, { slug: post[1], location });
    return;
  }

  if (location === 'header' || location === 'mobile_menu' || location === 'footer') {
    track(EVENTS.navClick, { label: labelOf(element), to: url.pathname, location });
  }
}

/**
 * Scroll depth per page view, each threshold once. Only measured on
 * scroll: a page shorter than the viewport never reports, rather than
 * reporting 100% for something nobody did.
 */
function useScrollDepth(pathname: string) {
  useEffect(() => {
    const reached = new Set<number>();
    let frame = 0;

    const measure = () => {
      frame = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const percent = (window.scrollY / scrollable) * 100;
      for (const threshold of SCROLL_THRESHOLDS) {
        // 1% slack: sub-pixel rounding can leave the very bottom at 99.8%.
        if (percent >= threshold - 1 && !reached.has(threshold)) {
          reached.add(threshold);
          track(EVENTS.scrollDepth, { depth: threshold });
        }
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pathname]);
}

export function AnalyticsClient({
  websiteId,
  domain,
  trackerSrc,
  recorderSrc,
}: {
  websiteId: string;
  domain: string | undefined;
  trackerSrc: string;
  recorderSrc: string;
}) {
  const pathname = usePathname();

  useEffect(() => {
    document.addEventListener('click', onDocumentClick, true);
    document.addEventListener('auxclick', onDocumentClick, true);
    return () => {
      document.removeEventListener('click', onDocumentClick, true);
      document.removeEventListener('auxclick', onDocumentClick, true);
    };
  }, []);

  useScrollDepth(pathname);

  return (
    <>
      {/*
       * data-domains: only this site's own hostname reports, so a preview
       * build or a local `pnpm start` pointed at production config never
       * pollutes the numbers. data-exclude-hash: in-page anchors are
       * tracked as section_jump events, not as separate page URLs.
       * data-performance: Core Web Vitals (LCP, INP, CLS, FCP, TTFB) per
       * page, reported by real visitors rather than a lab run.
       */}
      <Script
        src={trackerSrc}
        data-website-id={websiteId}
        data-domains={domain}
        data-exclude-hash="true"
        data-performance="true"
        strategy="afterInteractive"
        onReady={flushQueuedEvents}
      />
      {/*
       * Session replays and heatmaps. Sampling, masking and the on/off
       * switch all live in the website's settings in Umami (the recorder
       * fetches them on load), so tuning them needs no deploy. Inputs are
       * masked there ("moderate"); lazyOnload because it is ~190 KB and
       * nothing on the page waits for it.
       */}
      <Script src={recorderSrc} data-website-id={websiteId} strategy="lazyOnload" />
    </>
  );
}

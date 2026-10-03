/**
 * Every custom event the public site sends to Umami (AGENTS.md §10).
 *
 * One registry so names never drift between the components that send them
 * and the goals/funnels built on them in the Umami dashboard — those match
 * on the exact string, and a renamed event silently empties a report
 * rather than failing anything. Rename here only alongside the dashboard.
 *
 * snake_case, verb last, because that is how they read in Umami's event
 * list sorted alphabetically: everything about contact sits together.
 */
export const EVENTS = {
  /** First interaction with the contact form. */
  contactStart: 'contact_start',
  /** Contact form accepted by /api/contact. */
  contactSubmit: 'contact_submit',
  /** Contact form rejected (validation, Turnstile, rate limit, network). */
  contactError: 'contact_error',
  /** Any mailto link clicked. */
  emailClick: 'email_click',
  /** Address copied — the mailto fallback, or the palette's copy action. */
  emailCopy: 'email_copy',
  /** /resume or /wasik-ahmed-resume.pdf opened. */
  resumeDownload: 'resume_download',
  /** /whatsapp opened — the redirect to wa.me. */
  whatsappClick: 'whatsapp_click',
  /** A link that leaves the site. */
  outboundClick: 'outbound_click',
  /** A primary call to action (anything marked `data-track="cta_click"`). */
  ctaClick: 'cta_click',
  /** Header, mobile menu or footer navigation. */
  navClick: 'nav_click',
  /** A link into a case study, from wherever it was clicked. */
  projectOpen: 'project_open',
  /** A link into an article, from wherever it was clicked. */
  postOpen: 'post_open',
  /** An in-page anchor: table of contents, section rail, back to top. */
  sectionJump: 'section_jump',
  /** /work category chip. */
  workFilter: 'work_filter',
  /** /about role expanded. */
  roleExpand: 'role_expand',
  /** Command palette opened. */
  paletteOpen: 'palette_open',
  /** Command palette entry chosen. */
  paletteSelect: 'palette_select',
  /** 25/50/75/100% of a page scrolled. */
  scrollDepth: 'scroll_depth',
  /** A 404 rendered. */
  notFound: 'not_found',
} as const;

export type AnalyticsEvent = (typeof EVENTS)[keyof typeof EVENTS];
export type EventData = Record<string, string | number | boolean>;

interface UmamiTracker {
  track: (event: string, data?: EventData) => Promise<unknown>;
}

declare global {
  interface Window {
    umami?: UmamiTracker;
  }
}

/*
 * Events raised before the tracker script has loaded (it loads
 * afterInteractive, so a fast click on first paint can beat it) wait here
 * and are flushed by `flushQueuedEvents`, called from the script's onLoad.
 * Bounded so a blocked or disabled tracker can't grow it without limit.
 */
const queue: [AnalyticsEvent, EventData | undefined][] = [];
const MAX_QUEUE = 50;

/**
 * Fire-and-forget. A no-op on the server, with analytics unconfigured, or
 * when this browser has opted out — the tracker itself honours
 * `umami.disabled` and `data-domains`, so nothing here re-implements them.
 */
export function track(event: AnalyticsEvent, data?: EventData): void {
  if (typeof window === 'undefined') return;
  if (window.umami) {
    void window.umami.track(event, data).catch(() => {});
    return;
  }
  if (queue.length < MAX_QUEUE) queue.push([event, data]);
}

export function flushQueuedEvents(): void {
  if (typeof window === 'undefined' || !window.umami) return;
  for (const [event, data] of queue.splice(0)) {
    void window.umami.track(event, data).catch(() => {});
  }
}

/**
 * Where on the page an element sits, for the `location` property most
 * events carry: an explicit `data-track-location`, else the landmark or
 * section it lives in. Section ids are the same ones the section rail and
 * TOC link to, so they read as the page's own vocabulary.
 */
export function locationOf(element: Element): string {
  const explicit = element.closest<HTMLElement>('[data-track-location]');
  if (explicit?.dataset.trackLocation) return explicit.dataset.trackLocation;
  if (element.closest('[role="dialog"]')) return 'palette';
  if (element.closest('header')) return 'header';
  if (element.closest('footer')) return 'footer';
  const section = element.closest('section[id]');
  if (section?.id) return section.id;
  if (element.closest('aside')) return 'aside';
  return 'page';
}

/** Visible text of a link or button, trimmed to what a report can show. */
export function labelOf(element: Element): string {
  const aria = element.getAttribute('aria-label');
  const text = (aria ?? element.textContent ?? '').replace(/[↗→↑]/g, '').replace(/\s+/g, ' ');
  return text.trim().slice(0, 100);
}

/**
 * Event data from `data-track-*` attributes on a clicked element — the
 * declarative path for Server Components, which can't attach handlers.
 * `data-track-location` is left to `locationOf`.
 */
export function dataFromAttributes(element: HTMLElement): EventData {
  const data: EventData = {};
  for (const [key, value] of Object.entries(element.dataset)) {
    if (!key.startsWith('track') || key === 'track' || key === 'trackLocation') continue;
    if (value === undefined) continue;
    const name = key.slice('track'.length);
    data[name.charAt(0).toLowerCase() + name.slice(1)] = value;
  }
  return data;
}

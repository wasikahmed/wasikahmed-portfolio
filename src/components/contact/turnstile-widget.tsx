'use client';

import { useEffect, useId, useRef } from 'react';

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          theme?: string;
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
  if (existing) {
    return new Promise((resolve) => existing.addEventListener('load', () => resolve()));
  }
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

/**
 * Renders nothing (and the form skips verification) when no site key is
 * configured. `siteKey` comes from the server — see turnstileSiteKey() in
 * src/server/turnstile.ts for why it is never read from the client env.
 *
 * `onToken` receives `undefined` whenever the current token stops being
 * usable — expired, or the widget errored — so a parent never submits one
 * siteverify will refuse.
 *
 * A token is single-use: siteverify rejects it the second time, even if
 * the first submission failed for an unrelated reason (rate limit,
 * validation, a dropped connection). Bump `resetSignal` after every
 * submission that didn't end the form, and the widget issues a fresh one.
 */
export function TurnstileWidget({
  siteKey,
  onToken,
  resetSignal = 0,
}: {
  siteKey: string | undefined;
  onToken: (token: string | undefined) => void;
  resetSignal?: number;
}) {
  const containerId = useId();
  const widgetIdRef = useRef<string | null>(null);
  // The widget is rendered once and keeps whatever callback it was given,
  // so it calls through a ref that always holds the latest one.
  const onTokenRef = useRef(onToken);
  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false;

    loadScript().then(() => {
      if (cancelled || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(`#${CSS.escape(containerId)}`, {
        sitekey: siteKey,
        theme: 'dark',
        callback: (token) => onTokenRef.current(token),
        'expired-callback': () => onTokenRef.current(undefined),
        'error-callback': () => onTokenRef.current(undefined),
      });
    });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [siteKey, containerId]);

  useEffect(() => {
    if (resetSignal === 0 || !widgetIdRef.current || !window.turnstile) return;
    onTokenRef.current(undefined);
    window.turnstile.reset(widgetIdRef.current);
  }, [resetSignal]);

  if (!siteKey) return null;

  return <div id={containerId} />;
}

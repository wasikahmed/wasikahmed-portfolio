// Importing this from a Client Component is a build error, not a silent
// leak — see https://nextjs.org/docs/app/getting-started/server-and-client-components#preventing-environment-poisoning
import 'server-only';

import { after } from 'next/server';

import { EVENTS } from '@/lib/analytics';
import {
  SHORT_LINK_CAMPAIGN,
  SHORT_LINK_NAME_MAX,
  SHORT_LINK_NAME_PATTERN,
  UNSAVED_SHORT_LINK_SOURCE,
} from '@/lib/short-links';
import { connectToDatabase } from './db';
import { ShortLink } from './models/short-link';
import { buildServerEvent, getUmamiConfig, isCountableOpen, sendServerEvent } from './umami-proxy';

/**
 * `/go/<slug>` — a short, readable link for places that show the URL
 * itself (an application form's "portfolio link" field, a bio, a printed
 * CV), where a full UTM string would look like tracking clutter.
 *
 * The redirect carries the UTMs, so the landing pageview is attributed
 * exactly like any other tagged link (AGENTS.md §10) — Umami's UTM report
 * needs nothing new. On top of that, every open is counted here, on the
 * server, because the browser tracker can be blocked:
 *
 *   - `short_link_open` in Umami, in the visitor's own session (same IP and
 *     user agent, see buildServerEvent);
 *   - `clicks`/`lastClickedAt` on the saved link, shown in /admin/short-links
 *     without opening Umami.
 *
 * A name nobody has saved yet still works: it lands on the home page
 * tagged `utm_source=short-link`, `utm_content=<name>`. Writing a link
 * into a form before creating it in the admin loses nothing.
 */

interface LinkTarget {
  source: string;
  medium: string;
  destination: string;
}

/** Relative, always: `request.url` carries the container's bind address (AGENTS.md §7). */
export function shortLinkLocation(slug: string, link: LinkTarget | null): string {
  const params = new URLSearchParams({
    utm_source: link?.source ?? UNSAVED_SHORT_LINK_SOURCE,
    utm_medium: link?.medium ?? 'link',
    utm_campaign: SHORT_LINK_CAMPAIGN,
    utm_content: slug,
  });
  return `${link?.destination ?? '/'}?${params}`;
}

/*
 * Link previewers fetch a URL the moment it's pasted into a chat or a
 * post. Umami drops them from the event itself (it runs `isbot`), but the
 * stored count is ours to keep clean. Not `linkedin`: LinkedIn's in-app
 * browser ("LinkedInApp") is a person; its previewer says "LinkedInBot".
 */
const NON_HUMAN_AGENT =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|whatsapp|headless|curl|wget|python-|go-http-client|okhttp|axios|node-fetch|undici/i;

function recordOpen(request: Request, slug: string, link: LinkTarget | null) {
  // Same rules as résumé opens: no prefetches, no signed-in admin testing
  // their own links (umami-proxy.ts).
  if (!isCountableOpen(request)) return;
  if (NON_HUMAN_AGENT.test(request.headers.get('user-agent') ?? '')) return;

  const config = getUmamiConfig();
  const event = config
    ? buildServerEvent(request, config, EVENTS.shortLinkOpen, {
        source: link?.source ?? UNSAVED_SHORT_LINK_SOURCE,
        link: slug,
        saved: link ? 'yes' : 'no',
      })
    : null;

  after(async () => {
    if (link) {
      await ShortLink.updateOne(
        { slug },
        { $inc: { clicks: 1 }, $set: { lastClickedAt: new Date() } },
      ).catch((err: unknown) => console.warn('[short-links] click not counted', slug, err));
    }
    if (config && event) await sendServerEvent(config, event);
  });
}

function redirect(location: string): Response {
  return new Response(null, {
    // Temporary, deliberately: editing a link's destination has to take
    // effect on the next click, and a cached permanent redirect never asks
    // again (the /resume 308 lesson, resume-response.ts).
    status: 307,
    headers: { Location: location, 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  });
}

export async function shortLinkResponse(request: Request, rawSlug: string): Promise<Response> {
  const slug = rawSlug.toLowerCase();
  // Not a name the admin could ever save — a typo or a probe. Home, untagged.
  if (slug.length > SHORT_LINK_NAME_MAX || !SHORT_LINK_NAME_PATTERN.test(slug)) {
    return redirect('/');
  }

  let link: LinkTarget | null = null;
  try {
    await connectToDatabase();
    link = await ShortLink.findOne({ slug }).select('source medium destination').lean<LinkTarget>();
  } catch (err) {
    // A link already pasted somewhere must never become an error page —
    // it degrades to the unsaved-name redirect, which still lands and tags.
    console.warn('[short-links] lookup failed', slug, err);
  }

  recordOpen(request, slug, link);
  return redirect(shortLinkLocation(slug, link));
}

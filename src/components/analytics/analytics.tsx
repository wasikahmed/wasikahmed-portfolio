import { getUmamiConfig, RECORDER_PATH, TRACKER_PATH } from '@/server/umami-proxy';
import { AnalyticsClient } from './analytics-client';

/*
 * Umami, through the first-party relay at /x/ (src/server/umami-proxy.ts).
 * Rendered by the public site's layout and /docs' — never by /admin, so
 * admin usage is never counted alongside real visitor traffic, and
 * ExcludeFromAnalytics stops an admin's own browsing of the public site
 * being counted either.
 *
 * Renders nothing when UMAMI_URL/UMAMI_WEBSITE_ID are unset. Both are read
 * at request time — every layout that renders this is force-dynamic — so
 * pointing at a different Umami is an env change, never a rebuild.
 */
export function Analytics() {
  const config = getUmamiConfig();
  if (!config) return null;

  let domain: string | undefined;
  try {
    domain = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? '').hostname;
  } catch {
    // No site URL configured: report from any hostname rather than none.
    domain = undefined;
  }

  return (
    <AnalyticsClient
      websiteId={config.websiteId}
      domain={domain}
      trackerSrc={TRACKER_PATH}
      recorderSrc={RECORDER_PATH}
    />
  );
}

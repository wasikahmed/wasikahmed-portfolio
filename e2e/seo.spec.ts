import { expect, test, type Page } from '@playwright/test';

/*
 * The search-facing contract: what a crawler gets from each page, rather
 * than what a visitor sees. Every one of these regressed silently at some
 * point — a page inheriting the root's generic title, a sitemap with no
 * dates, structured data that wasn't valid JSON — because nothing on
 * screen changes when they break.
 *
 * Slugs come from the fictional demo seed in src/server/seed-data/ —
 * change them together with site.spec.ts.
 */

const INDEXABLE = [
  '/',
  '/work',
  '/work/ledger-sync',
  '/writing',
  '/writing/demo-post',
  '/about',
  '/contact',
  '/docs',
];

/** Every JSON-LD node on the page, `@graph`s flattened. */
async function jsonLdNodes(page: Page): Promise<Record<string, unknown>[]> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.flatMap((text) => {
    const data = JSON.parse(text) as Record<string, unknown>;
    return (data['@graph'] as Record<string, unknown>[] | undefined) ?? [data];
  });
}

test.describe('Per-page metadata', () => {
  for (const route of INDEXABLE) {
    test(`${route} has its own title, a fitted description and a canonical`, async ({ page }) => {
      await page.goto(route);
      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);
      expect(title.length).toBeLessThanOrEqual(70);

      const description = await page.locator('meta[name="description"]').getAttribute('content');
      expect(description?.length ?? 0).toBeGreaterThan(0);
      expect(description!.length).toBeLessThanOrEqual(160);

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(new URL(canonical!).pathname).toBe(route);
    });
  }

  // Fetched rather than navigated: only the <title> matters, and seven
  // full page loads in one test would share one timeout.
  test('no two pages share a title', async ({ request }) => {
    const titles = await Promise.all(
      INDEXABLE.map(async (route) => {
        const html = await (await request.get(route)).text();
        return /<title>([^<]*)<\/title>/.exec(html)?.[1];
      }),
    );
    expect(titles.every(Boolean)).toBe(true);
    expect(new Set(titles).size).toBe(titles.length);
  });
});

test.describe('Structured data', () => {
  test('home describes the site and its owner', async ({ page }) => {
    await page.goto('/');
    const nodes = await jsonLdNodes(page);
    const person = nodes.find((n) => n['@type'] === 'Person');
    expect(person?.['@id']).toMatch(/\/#person$/);
    expect(person?.name).toBeTruthy();
    expect(nodes.some((n) => n['@type'] === 'WebSite')).toBe(true);
  });

  test('/about is a profile page about that same person', async ({ page }) => {
    await page.goto('/about');
    const profile = (await jsonLdNodes(page)).find((n) => n['@type'] === 'ProfilePage');
    expect((profile?.mainEntity as Record<string, unknown>)['@id']).toMatch(/\/#person$/);
  });

  for (const [route, type] of [
    ['/work/ledger-sync', 'Article'],
    ['/writing/demo-post', 'BlogPosting'],
  ] as const) {
    test(`${route} is an ${type} with breadcrumbs, credited to the person`, async ({ page }) => {
      await page.goto(route);
      const nodes = await jsonLdNodes(page);
      const article = nodes.find((n) => n['@type'] === type);
      expect((article?.author as Record<string, unknown>)['@id']).toMatch(/\/#person$/);
      expect(nodes.some((n) => n['@type'] === 'BreadcrumbList')).toBe(true);
      await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
    });
  }
});

test.describe('Crawl files', () => {
  test('robots.txt keeps crawlers out of the admin, API and relay, and names the sitemap', async ({
    request,
  }) => {
    const body = await (await request.get('/robots.txt')).text();
    for (const path of ['/admin', '/api/', '/x/']) expect(body).toContain(`Disallow: ${path}`);
    // /docs renders from this; blocked, crawlers see an empty page.
    expect(body).toContain('Allow: /api/openapi.json');
    expect(body).toMatch(/Sitemap: https?:\/\/\S+\/sitemap\.xml/);
  });

  test('the sitemap lists published content, each item with a last-modified date', async ({
    request,
  }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    const xml = await res.text();
    const entries = xml.split('<url>').slice(1);
    const detail = entries.filter((e) => /\/(work|writing)\/[^<]+<\/loc>/.test(e));
    expect(detail.length).toBeGreaterThan(0);
    for (const entry of detail) expect(entry).toContain('<lastmod>');
  });

  test('an unknown URL is a real 404, not a soft one', async ({ request }) => {
    expect((await request.get('/this-page-does-not-exist')).status()).toBe(404);
  });
});

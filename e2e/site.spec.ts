import { expect, test } from '@playwright/test';

// Slugs, titles and counts below come from the fictional demo seed in
// src/server/seed-data/ — change them together.
const ROUTES = [
  '/',
  '/work',
  '/work/ledger-sync',
  '/writing',
  '/writing/demo-post',
  '/about',
  '/contact',
];

test.describe('Routes', () => {
  for (const route of ROUTES) {
    test(`${route} renders with a single h1`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
    });
  }
});

test.describe('Responsive', () => {
  /*
   * One test per (viewport, route) pair rather than looping routes inside
   * a single test. Every page does a live query at request time, so a
   * 7-route loop was sharing one 30s budget across seven
   * separate page loads — a single slow one failed the whole batch and
   * pointed at the wrong route. Splitting gives each navigation its own
   * timeout and names the actual failing route directly, instead of
   * reporting only whichever route the loop happened to be on.
   */
  for (const [name, width] of [
    ['mobile', 375],
    ['tablet', 768],
    ['desktop', 1440],
    ['ultrawide', 2560],
  ] as const) {
    for (const route of ROUTES) {
      test(`no horizontal overflow at ${name} — ${route}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
      });
    }
  }
});

test.describe('Command palette', () => {
  test('opens with the keyboard, filters, and navigates', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('ControlOrMeta+k');

    const dialog = page.getByRole('dialog', { name: 'Search the site' });
    await expect(dialog).toBeVisible();

    await page.getByLabel('Search', { exact: true }).fill('fieldnotes');
    await expect(dialog.getByRole('option')).toHaveCount(1);

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/work\/fieldnotes$/);
  });

  test('closes on Escape', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('ControlOrMeta+k');
    await expect(page.getByRole('dialog', { name: 'Search the site' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Search the site' })).toBeHidden();
  });
});

test.describe('Mobile navigation', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('toggles with correct aria-expanded and closes on Escape', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Open menu' });

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();

    const menu = page.getByRole('navigation', { name: 'Mobile' });
    await expect(menu).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
  });

  test('locks background scroll while open', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
  });
});

test.describe('Work filtering', () => {
  test('filter chips narrow the list', async ({ page }) => {
    await page.goto('/work');
    await expect(page.getByRole('status')).toHaveText('4 of 4');

    await page.getByRole('button', { name: 'AI', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText('1 of 4');
    await expect(page.getByRole('heading', { name: 'Mail Sorter' })).toBeVisible();
  });

  test('constellation node deep-links into a filtered list', async ({ page }) => {
    await page.goto('/work?tech=Electron');
    await expect(page.getByRole('status')).toHaveText('1 of 4');
    await expect(page.getByRole('heading', { name: 'Fieldnotes' })).toBeVisible();
  });
});

test.describe('Case study', () => {
  test('contents highlights the first section at the top of the page', async ({ page }) => {
    await page.goto('/work/ledger-sync');
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
    });

    // Scroll to the end and back — the indicator must recover, not go stale.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(200);
    await page.evaluate(() => window.scrollTo(0, 0));

    const active = page.locator('nav[aria-label="Case study contents"] a[aria-current="true"]');
    await expect(active).toHaveText('The problem');
  });

  test('metric bar shows headline value with its baseline', async ({ page }) => {
    await page.goto('/work/ledger-sync');
    await expect(page.getByText('down from a weekly manual export')).toBeVisible();
  });
});

test.describe('Contact form', () => {
  // Every field is present on arrival, with nothing to answer first — the
  // "role or project?" select is gone (contact-form.tsx has why).
  test('renders immediately, with no qualifying question', async ({ page }) => {
    await page.goto('/contact');

    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Message')).toBeVisible();
    await expect(
      page.getByText("What you're working on, and where you think I'd fit in."),
    ).toBeVisible();
    await expect(page.getByLabel('What is this about?')).toHaveCount(0);
  });

  // The seed sets no WhatsApp number, and the link must not render without one.
  test('shows no WhatsApp link when none is configured', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.getByRole('link', { name: 'WhatsApp' })).toHaveCount(0);
  });
});

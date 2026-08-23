import { expect, test } from '@playwright/test';

const ROUTES = [
  '/',
  '/work',
  '/work/docflow-ai',
  '/writing',
  '/writing/when-to-build-vs-buy-ai',
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
  for (const [name, width] of [
    ['mobile', 375],
    ['tablet', 768],
    ['desktop', 1440],
    ['ultrawide', 2560],
  ] as const) {
    test(`no horizontal overflow at ${name}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ROUTES) {
        await page.goto(route);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow, `${route} at ${width}px`).toBeLessThanOrEqual(0);
      }
    });
  }
});

test.describe('Command palette', () => {
  test('opens with the keyboard, filters, and navigates', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('ControlOrMeta+k');

    const dialog = page.getByRole('dialog', { name: 'Search the site' });
    await expect(dialog).toBeVisible();

    await page.getByLabel('Search', { exact: true }).fill('autoschedule');
    await expect(dialog.getByRole('option')).toHaveCount(1);

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/work\/autoschedule$/);
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
    await expect(page.getByRole('heading', { name: 'DocFlow AI' })).toBeVisible();
  });

  test('constellation node deep-links into a filtered list', async ({ page }) => {
    await page.goto('/work?tech=OR-Tools');
    await expect(page.getByRole('status')).toHaveText('1 of 4');
    await expect(page.getByRole('heading', { name: 'AutoSchedule' })).toBeVisible();
  });
});

test.describe('Case study', () => {
  test('contents highlights the first section at the top of the page', async ({ page }) => {
    await page.goto('/work/docflow-ai');
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
    await page.goto('/work/docflow-ai');
    await expect(page.getByText('3.1 hrs/day → 14 min/day')).toBeVisible();
  });
});

test.describe('Contact form', () => {
  test('reveals the rest of the form only after intent is chosen', async ({ page }) => {
    await page.goto('/contact');

    await expect(page.getByLabel('Email')).toBeHidden();
    await page.getByRole('button', { name: /A project/ }).click();

    await expect(page.getByLabel('Email')).toBeVisible();
    // Budget is project-specific.
    await expect(page.getByLabel('Rough budget')).toBeVisible();

    await page.getByRole('button', { name: /A role/ }).click();
    await expect(page.getByLabel('Rough budget')).toBeHidden();
  });
});

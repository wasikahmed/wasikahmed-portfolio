import { expect, test } from '@playwright/test';

/**
 * The reduced-motion contract, PLAN.md §2.
 *
 * The guarantee is not "animations run faster" — it is that a reader who
 * asks for less motion loses *no information*. These tests assert both
 * halves: the animation genuinely runs by default, and the same content is
 * fully present without it.
 */

const METRIC = { value: '92%', baseline: '3.1 hrs/day → 14 min/day' };

test.describe('Metric — count-up with baseline', () => {
  test('counts up and reveals the baseline when scrolled into view', async ({ page }) => {
    await page.goto('/design-system');

    const metric = page.getByText(METRIC.baseline).locator('..');
    const number = metric.locator('span.tabular-nums span').first();

    // Before it enters the viewport the counter sits at its zero state.
    await expect(number).toHaveText('0%');

    await metric.scrollIntoViewIfNeeded();

    // It lands on the authored string, not a rounded approximation.
    await expect(number).toHaveText(METRIC.value, { timeout: 5000 });

    // The baseline is what turns the number into evidence — it must appear.
    await expect(page.getByText(METRIC.baseline)).toBeVisible();
    await expect(page.getByText(METRIC.baseline)).toHaveCSS('opacity', '1');
  });

  test('renders the final value and baseline immediately under reduced motion', async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/design-system');

    const metric = page.getByText(METRIC.baseline).locator('..');
    await metric.scrollIntoViewIfNeeded();

    const number = metric.locator('span.tabular-nums span').first();

    // No interpolation: the value is correct as soon as it is observed.
    await expect(number).toHaveText(METRIC.value, { timeout: 2000 });
    await expect(page.getByText(METRIC.baseline)).toHaveCSS('opacity', '1');

    await context.close();
  });
});

test.describe('Layout integrity', () => {
  for (const [name, width] of [
    ['mobile', 375],
    ['tablet', 768],
    ['desktop', 1440],
    ['wide', 2560],
  ] as const) {
    test(`no horizontal overflow at ${name} (${width}px)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/design-system');

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

test.describe('Design tokens', () => {
  test('resolve on the document and drive the rendered page', async ({ page }) => {
    await page.goto('/design-system');

    const tokens = await page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      return {
        accent: cs.getPropertyValue('--color-accent').trim(),
        surface2: cs.getPropertyValue('--color-surface-2').trim(),
        bodyBg: getComputedStyle(document.body).backgroundColor,
        display: getComputedStyle(document.querySelector('h1')!).fontFamily,
      };
    });

    // Teal since 2026-09-04, was #0fbf7a. This assertion is the reason the
    // accent cannot drift silently — update it deliberately or not at all.
    expect(tokens.accent).toBe('#14b8a6');
    expect(tokens.surface2).toBe('#131c17');
    expect(tokens.bodyBg).toBe('rgb(10, 14, 12)');
    // Self-hosted via next/font, not a system fallback.
    expect(tokens.display).toContain('Space Grotesk');
  });
});

test.describe('Variant propagation', () => {
  /**
   * Regression guard. Variants in Motion propagate only through `motion`
   * components — a plain wrapper element silently breaks the chain and
   * strands children in their hidden state. That failure is invisible to
   * typecheck, lint, and the build: the page renders, the text is just
   * never seen. Assert the words actually arrive at their resting position.
   */
  test('TextReveal words settle at translateY(0)', async ({ page }) => {
    await page.goto('/design-system');
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
    });

    const host = page.locator('[aria-label="I build systems that do the work for you."]');
    await host.scrollIntoViewIfNeeded();

    const word = host.locator('span[aria-hidden] > span').first();
    await expect(word).toBeVisible();

    await expect
      .poll(
        () =>
          word.evaluate((el) => {
            const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
            return Math.abs(m.m42); // translateY in px
          }),
        { timeout: 5000 },
      )
      .toBeLessThan(1);
  });

  test('Stagger children become visible', async ({ page }) => {
    await page.goto('/design-system');
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
    });

    const understand = page.getByText('Understand', { exact: true });
    await understand.scrollIntoViewIfNeeded();

    await expect(understand).toBeVisible();
    await expect
      .poll(
        () => understand.evaluate((el) => Number(getComputedStyle(el.closest('div')!).opacity)),
        {
          timeout: 5000,
        },
      )
      .toBe(1);
  });
});

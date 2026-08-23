import { expect, test } from '@playwright/test';

test('home page responds and renders the document shell', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

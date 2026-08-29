import { expect, test } from '@playwright/test';

/**
 * PLAN.md W6 item 5 — an admin path exercising the real CMS→public-site
 * pipeline: log in, create a project, publish it, confirm it appears on
 * the public site, delete it, confirm it's gone from both.
 *
 * Logs in with a deterministic, no-TOTP account seeded by
 * `scripts/seed-e2e-admin.ts` (`pnpm seed:e2e-admin`) — real credentials
 * flowing through the real Auth.js Credentials provider, argon2 hash and
 * all, just without a 2FA step this suite has no way to satisfy live.
 * Skips entirely if that account wasn't seeded (E2E_ADMIN_PASSWORD unset)
 * rather than failing with a confusing login error.
 */

const EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'e2e-admin@example.com';
const PASSWORD = process.env.E2E_ADMIN_PASSWORD;

test.skip(!PASSWORD, 'E2E_ADMIN_PASSWORD not set — run `pnpm seed:e2e-admin` first.');

// Unique per run so re-running locally against a non-reset database never
// collides with a project this suite already created (and failed to clean
// up) on a prior run.
const SLUG = `e2e-admin-test-${Date.now()}`;
const TITLE = `E2E Admin Test ${Date.now()}`;

test('log in, create a project, publish, verify publicly, delete', async ({ page }) => {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByLabel('Password').fill(PASSWORD!);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto('/admin/projects/new');
  // id-based rather than getByLabel: "Title"/"Slug" collide with
  // sections-editor's and publish-fields' own "Title override" /
  // section-title inputs, which share the same visible label text.
  await page.locator('#title').fill(TITLE);
  // Slug auto-derives from the title (project-form.tsx's slugify) — SLUG
  // is deliberately already in that exact shape, so no re-derivation here.
  await expect(page.locator('#slug')).toHaveValue(SLUG);

  await page.locator('#tagline').fill('A throwaway case study created by e2e/admin.spec.ts.');
  await page.locator('#problem').fill('E2E needed a real record to publish and delete.');
  await page.getByRole('checkbox', { name: 'AI' }).check();
  await page.locator('#role').fill('E2E Suite');
  await page.locator('#timeline').fill('N/A');

  // Stack (TagInput) also has no id on its actual <input> — type + Enter
  // commits a chip. projectSchema requires at least one.
  await page.getByPlaceholder('Type and press Enter').fill('Next.js');
  await page.getByPlaceholder('Type and press Enter').press('Enter');

  // Headline metric's three inputs share one Field with no per-input id
  // (see project-form.tsx), so they're matched by their distinct
  // placeholders rather than by label.
  await page.getByPlaceholder('Value — e.g. 92%').fill('100%');
  await page.getByPlaceholder('Label — e.g. faster processing').fill('automated');

  await page.getByRole('button', { name: 'Add stage' }).click();
  // `exact: true` — getByPlaceholder substring-matches by default, and
  // "Label" would otherwise also match the headline metric's "Label —
  // e.g. faster processing" placeholder above.
  await page.getByPlaceholder('Id', { exact: true }).fill('run');
  await page.getByPlaceholder('Label', { exact: true }).fill('Run');
  await page.getByPlaceholder('Detail', { exact: true }).fill('The one and only stage.');

  // The default section ("The problem") ships with an empty MDX body,
  // which projectSchema's sections[].bodyMdx requires non-empty.
  await page.getByLabel('Body — The problem').fill('# Body\n\nJust enough to pass validation.');

  await page.locator('#status').selectOption('published');
  await page.getByRole('button', { name: 'Save' }).click();

  // ProjectForm redirects to the list on success — this also proves the
  // create request didn't 4xx/5xx.
  await expect(page).toHaveURL(/\/admin\/projects$/);
  await expect(page.getByText(TITLE)).toBeVisible();

  // The actual point of the test: a project published through the real
  // admin form is immediately live on the public site.
  await page.goto(`/work/${SLUG}`);
  await expect(page.getByRole('heading', { name: TITLE })).toBeVisible();

  // Clean up: delete it, and confirm it's gone from both the admin list
  // and the public site (a soft-fail here would otherwise silently pile
  // up throwaway projects on every local re-run).
  await page.goto('/admin/projects');
  await page.getByText(TITLE).click();
  await expect(page).toHaveURL(/\/admin\/projects\/[a-f0-9]{24}$/);
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page).toHaveURL(/\/admin\/projects$/);
  await expect(page.getByText(TITLE)).toHaveCount(0);

  const publicResponse = await page.goto(`/work/${SLUG}`);
  expect(publicResponse?.status()).toBe(404);
});

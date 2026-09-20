import { expect, test } from '@playwright/test';

/**
 * PLAN.md W14 item 6 — the invitation round trip: invite → accept → log
 * in → hit a permission ceiling → get refused.
 *
 * The invited user and its Invite document are seeded directly by
 * `pnpm seed:e2e-invite` (scripts/seed-e2e-invite.ts) rather than created
 * by driving /admin/users through this suite — see that script's own
 * comment for why (the real invite token only ever leaves the server
 * inside an emailed link). Everything downstream of that — the accept
 * form, the real login, and the real permission check — runs against the
 * actual routes, same as e2e/admin.spec.ts.
 *
 * Skips entirely if the fixture env vars aren't set, same convention as
 * admin.spec.ts.
 */

const EMAIL = process.env.E2E_INVITE_EMAIL ?? 'e2e-invite@example.com';
const TOKEN = process.env.E2E_INVITE_TOKEN;
const PASSWORD = 'a-perfectly-fine-password-1234';

test.skip(!TOKEN, 'E2E_INVITE_TOKEN not set — run `pnpm seed:e2e-invite` first.');

test('invite → accept → log in → hit a permission ceiling → refused', async ({ page }) => {
  // ── Accept ───────────────────────────────────────────────────────────
  await page.goto(`/admin/accept-invite/${TOKEN}`);
  await expect(page.getByText(EMAIL)).toBeVisible();
  await expect(page.getByText('invited as')).toBeVisible();

  await page.getByLabel('Name').fill('E2E Invited Viewer');
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page.getByText('Your account is ready.')).toBeVisible();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);

  // ── Log in ───────────────────────────────────────────────────────────
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/admin$/);

  // A viewer has no `user:read`, so the Users nav link — the one
  // conditionally rendered item in the sidebar — must not appear (see
  // src/app/(admin)/admin/(dashboard)/layout.tsx and sidebar.tsx).
  await expect(page.getByRole('link', { name: 'Users' })).toHaveCount(0);

  // ── Hit a permission ceiling ─────────────────────────────────────────
  // A viewer's role grants content:read/lead:read/media:read only — no
  // content:write. `createHandler` (src/server/admin-crud.ts) checks that
  // permission before it ever parses the request body, so this 403s on
  // the same real enforcement path every admin mutation goes through
  // (src/server/resolve-auth.ts's requirePermission), independent of
  // payload shape. `page.request` shares this browsing context's session
  // cookie, so this is the just-logged-in viewer's own request.
  const response = await page.request.post('/api/admin/projects', { data: {} });
  expect(response.status()).toBe(403);
  expect(await response.json()).toEqual({ error: 'Not permitted.' });
});

import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => {
    // A WebSocket closed by the test (offline/revoke) is expected noise.
    if (m.type() === 'error' && !/WebSocket|ERR_INTERNET_DISCONNECTED|Failed to fetch|net::/i.test(m.text())) errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

async function noHorizontalOverflow(page: Page) {
  const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  expect(sw, `scrollWidth ${sw} > innerWidth ${iw}`).toBeLessThanOrEqual(iw);
}

/** Plans a week and opens its grocery list with the new button. */
async function openList(page: Page, lang: 'en' | 'pt-BR' = 'en') {
  await page.goto('/planner');
  await page.getByRole('button', { name: lang === 'en' ? 'Generate a week' : 'Gerar uma semana' }).click();
  await page.getByRole('button', { name: lang === 'en' ? 'Generate grocery list' : 'Gerar lista de compras' }).click();
  await expect(page).toHaveURL(/tab=grocery/);
  await expect(page.locator('.shop li[data-item]').first()).toBeVisible();
}

const progressText = (page: Page) => page.locator('.shop-progress strong');

test('grocery list: consolidated items, checklist, progress and persistence', async ({ page }) => {
  const errors = trackErrors(page);
  await openList(page);
  const total = await page.locator('.shop li[data-item]').count();
  await expect(progressText(page)).toHaveText(`0 of ${total} items bought`);
  // One entry per product.
  const ids = await page.locator('.shop li[data-item]').evaluateAll((els) => els.map((e) => e.getAttribute('data-item')));
  expect(new Set(ids).size).toBe(ids.length);

  const first = page.locator('.shop li[data-item] input[type=checkbox]').first();
  await first.check();
  await expect(progressText(page)).toHaveText(`1 of ${total} items bought`);
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
  await page.waitForTimeout(400);
  await page.reload();
  await expect(page.locator('.shop li[data-item] input[type=checkbox]').first()).toBeChecked();
  await expect(progressText(page)).toHaveText(`1 of ${total} items bought`);

  // Bought items can move to their own section.
  await page.getByRole('button', { name: 'Move bought items to the end' }).click();
  await expect(page.getByRole('button', { name: 'Bought (1)' })).toBeVisible();
  await page.getByRole('button', { name: 'Move bought items to the end' }).click();

  await noHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test('grocery list: add, edit, delete, people and collapsible categories', async ({ page }) => {
  await openList(page);
  const items = page.locator('.shop li[data-item]');
  const before = await items.count();

  // Add a product the guide does not know.
  await page.locator('.shop > .no-print').getByRole('button', { name: 'Add item' }).click();
  await page.getByLabel('Product').fill('Paper towels');
  await page.getByLabel('Quantity').fill('2 rolls');
  await page.locator('.global-add').getByRole('button', { name: 'Add item' }).click();
  await expect(items).toHaveCount(before + 1);
  const added = page.locator('li[data-item="c:paper-towels"]');
  await expect(added).toContainText('Paper towels');
  await expect(added).toContainText('2 rolls');

  // Adding the same product again does not duplicate it.
  await page.getByLabel('Product').fill('paper towels');
  await page.locator('.global-add').getByRole('button', { name: 'Add item' }).click();
  await expect(page.getByText('Paper towels is already on the list.')).toBeVisible();
  await expect(items).toHaveCount(before + 1);

  // Edit.
  await added.getByRole('button', { name: /Edit Paper towels/ }).click();
  await page.locator('.edit-form').getByLabel('Quantity').fill('4 rolls');
  await page.locator('.edit-form').getByRole('button', { name: 'Save' }).click();
  await expect(added).toContainText('4 rolls');

  // Delete.
  await added.getByRole('button', { name: 'Delete Paper towels' }).click();
  await expect(added).toHaveCount(0);
  await expect(items).toHaveCount(before);

  // People.
  await page.getByRole('button', { name: 'More people' }).click();
  await expect(page.locator('.stepper output')).toHaveText(/3 people/);

  // Collapse a category; it stays collapsed after reopening the app.
  const head = page.locator('.shop-cat[data-cat="produce"] .cat-head');
  await head.click();
  await expect(head).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.shop-cat[data-cat="produce"] li[data-item]')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.shop-cat[data-cat="produce"] .cat-head')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.stepper output')).toHaveText(/3 people/);
});

test('grocery list: PDF download, copy and share', async ({ page, context, browserName }) => {
  void browserName;
  await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => undefined);
  await page.addInitScript(() => {
    const w = window as unknown as { __shared: unknown[] };
    w.__shared = [];
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (data: ShareData) => {
        w.__shared.push({ title: data.title, text: data.text, files: (data.files ?? []).map((f) => ({ name: f.name, type: f.type, size: f.size })) });
      },
    });
  });
  await openList(page);

  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download PDF' }).click()]);
  expect(download.suggestedFilename()).toMatch(/^grocery-list.*\.pdf$/);
  const bytes = await readFile((await download.path())!);
  expect(bytes.subarray(0, 5).toString('latin1')).toBe('%PDF-');

  await page.getByRole('button', { name: 'Copy list' }).click();
  await expect(page.getByText('Copied!')).toBeVisible();

  await page.getByRole('button', { name: 'Share', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __shared: unknown[] }).__shared.length)).toBe(1);
  const shared = await page.evaluate(() => (window as unknown as { __shared: { text: string; files: { name: string; type: string; size: number }[] }[] }).__shared[0]);
  expect(shared.text).toContain('Grocery list');
  expect(shared.files[0]).toMatchObject({ type: 'application/pdf' });
  expect(shared.files[0].size).toBeGreaterThan(1000);
});

test('grocery list: without native sharing, WhatsApp and e-mail links are offered', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
  });
  await openList(page);
  await expect(page.getByRole('button', { name: 'Share', exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', /^https:\/\/wa\.me\/\?text=Grocery%20list/);
  await expect(page.getByRole('link', { name: 'E-mail' })).toHaveAttribute('href', /^mailto:\?subject=/);
});

test('grocery list in Portuguese', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('fodmap-kitchen:lang', 'pt-BR'));
  await openList(page, 'pt-BR');
  await expect(page.getByRole('heading', { name: 'Lista de compras' })).toBeVisible();
  await expect(progressText(page)).toHaveText(/^0 de \d+ itens comprados$/);
  await expect(page.locator('.shop-cat[data-cat="produce"] .cat-name')).toHaveText('Hortifruti');
  await expect(page.getByRole('button', { name: 'Baixar PDF' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copiar lista' })).toBeVisible();
  await page.locator('.shop li[data-item] input[type=checkbox]').first().check();
  await expect(progressText(page)).toHaveText(/^1 de \d+ itens comprados$/);
});

test('grocery list works offline', async ({ page, context }) => {
  await openList(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await expect
    .poll(async () => page.evaluate(async () => (await Promise.all((await caches.keys()).map(async (k) => (await (await caches.open(k)).keys()).length))).reduce((a, b) => a + b, 0)), { timeout: 30_000 })
    .toBeGreaterThan(60);
  await context.setOffline(true);
  await page.goto('/planner?tab=grocery');
  const first = page.locator('.shop li[data-item] input[type=checkbox]').first();
  await first.check();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download PDF' }).click()]);
  expect(download.suggestedFilename()).toMatch(/.pdf$/);
  await page.goto('/planner?tab=grocery');
  await expect(page.locator('.shop li[data-item] input[type=checkbox]').first()).toBeChecked();
  await context.setOffline(false);
});

/**
 * Real synchronisation between two independent browser sessions (separate
 * storage, as two different phones), through the Worker and Durable Object.
 */
test('shared list syncs between two independent sessions', async ({ page, browser }) => {
  test.setTimeout(120_000);
  const errors = trackErrors(page);
  await openList(page);
  await page.getByRole('button', { name: 'Share this list with others' }).click();
  const link = await page.getByLabel('Invite link').inputValue();
  expect(link).toMatch(/\/join#[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{16,}$/);
  await expect(page.locator('.sync-badge')).toHaveAttribute('data-sync', 'synced');

  const guestCtx = await browser.newContext();
  const guest = await guestCtx.newPage();
  const guestErrors = trackErrors(guest);
  try {
    await guest.goto(link);
    await guest.getByRole('button', { name: 'Join list' }).click();
    await expect(guest).toHaveURL(/\/lists\/[A-Za-z0-9_-]{22}$/);
    // The secret is no longer in the address.
    expect(new URL(guest.url()).hash).toBe('');
    const ownerItems = page.locator('.shop li[data-item]');
    const guestItems = guest.locator('.shop li[data-item]');
    await expect(guestItems).toHaveCount(await ownerItems.count());
    await expect(page.locator('.members li')).toHaveCount(2);

    // Guest ticks → owner sees it.
    const id = await guestItems.first().getAttribute('data-item');
    await guest.locator(`li[data-item="${id}"] input[type=checkbox]`).check();
    await expect(page.locator(`li[data-item="${id}"] input[type=checkbox]`)).toBeChecked({ timeout: 15_000 });

    // Owner adds → guest sees it.
    await page.locator('.shop > .no-print').getByRole('button', { name: 'Add item' }).click();
    await page.getByLabel('Product').fill('Sparkling water');
    await page.locator('.global-add').getByRole('button', { name: 'Add item' }).click();
    await expect(guest.locator('li[data-item="c:sparkling-water"]')).toBeVisible({ timeout: 15_000 });

    // Both tick at the same moment → both changes kept, no duplicates.
    const [a, b] = await guestItems.evaluateAll((els) => els.slice(1, 3).map((e) => e.getAttribute('data-item')));
    await Promise.all([page.locator(`li[data-item="${a}"] input[type=checkbox]`).check(), guest.locator(`li[data-item="${b}"] input[type=checkbox]`).check()]);
    for (const p of [page, guest]) {
      await expect(p.locator(`li[data-item="${a}"] input[type=checkbox]`)).toBeChecked({ timeout: 15_000 });
      await expect(p.locator(`li[data-item="${b}"] input[type=checkbox]`)).toBeChecked({ timeout: 15_000 });
    }
    await expect(guest.locator('li[data-item="c:sparkling-water"]')).toHaveCount(1);

    // Guest edits offline → synced after reconnecting.
    await guestCtx.setOffline(true);
    await guest.locator('li[data-item="c:sparkling-water"] input[type=checkbox]').check();
    await expect(guest.locator('.sync-badge')).toHaveAttribute('data-sync', /offline|syncing|error/);
    await guestCtx.setOffline(false);
    await expect(page.locator('li[data-item="c:sparkling-water"] input[type=checkbox]')).toBeChecked({ timeout: 30_000 });

    // Progress matches on both devices.
    const text = await page.locator('.shop-progress strong').textContent();
    await expect(guest.locator('.shop-progress strong')).toHaveText(text!);

    // Owner revokes the guest → guest loses access.
    page.once('dialog', (d) => d.accept());
    await page.locator('.members li', { hasText: 'Participant' }).getByRole('button', { name: 'Remove' }).click();
    await expect(page.locator('.members li')).toHaveCount(1);
    await expect(guest.getByText('You no longer have access to this list.')).toBeVisible({ timeout: 30_000 });

    // Turning off the invite link stops new people joining.
    await page.getByRole('button', { name: 'Turn off invite link' }).click();
    await expect(page.getByText('The invite link is off.', { exact: false })).toBeVisible();
    const third = await browser.newContext();
    const p3 = await third.newPage();
    await p3.goto(link);
    await p3.getByRole('button', { name: 'Join list' }).click();
    await expect(p3.getByText('This invite link is not valid any more.', { exact: false })).toBeVisible();
    await third.close();

    // Stop sharing: the list is deleted on the server and the owner keeps a copy.
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Stop sharing' }).click();
    await expect(page.getByRole('button', { name: 'Share this list with others' })).toBeVisible();
    await expect(page.locator(`li[data-item="${id}"] input[type=checkbox]`)).toBeChecked();
  } finally {
    await guestCtx.close();
  }
  expect(errors).toEqual([]);
  expect(guestErrors.filter((e) => !/403|404/.test(e))).toEqual([]);
});

test('the API rejects requests without a valid token', async ({ request }) => {
  const created = await request.post('/api/lists', { data: { doc: { title: 'x', weekOf: '', people: 1, items: [], generatedAt: 0 } } });
  expect(created.status()).toBe(201);
  const { listId, token } = await created.json();
  expect((await request.get(`/api/lists/${listId}`)).status()).toBe(403);
  expect((await request.get(`/api/lists/${listId}`, { headers: { authorization: 'Bearer nope' } })).status()).toBe(403);
  expect((await request.post(`/api/lists/${listId}/join`, { data: { invite: 'guess-guess-guess-guess' } })).status()).toBe(403);
  expect((await request.get('/api/lists/not-a-real-id')).status()).toBe(404);
  // Clean up.
  expect((await request.delete(`/api/lists/${listId}`, { headers: { authorization: `Bearer ${token}` } })).status()).toBe(200);
  expect((await request.get(`/api/lists/${listId}`, { headers: { authorization: `Bearer ${token}` } })).status()).toBe(404);
});

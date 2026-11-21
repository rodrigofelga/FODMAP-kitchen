import { expect, test, type Page } from '@playwright/test';
import images from '../../src/data/images.json' with { type: 'json' };

const PAGES = ['/', '/guide', '/recipes', '/recipes/galinhada-acafrao', '/recipes/pudim-de-leite-sem-lactose', '/matcher', '/planner', '/settings', '/does-not-exist'];

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

async function noHorizontalOverflow(page: Page) {
  const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  expect(sw, `scrollWidth ${sw} > innerWidth ${iw}`).toBeLessThanOrEqual(iw);
}

test('every page renders without console errors or horizontal overflow', async ({ page }) => {
  const errors = trackErrors(page);
  for (const path of PAGES) {
    await page.goto(path);
    await expect(page.locator('main h1').first()).toBeVisible();
    await page.waitForLoadState('networkidle');
    await noHorizontalOverflow(page);
  }
  expect(errors).toEqual([]);
});

test('main navigation works', async ({ page }) => {
  await page.goto('/');
  for (const [label, heading] of [
    ['Food Guide', 'Food Guide'],
    ['Recipes', 'Recipes'],
    ['Meal Planner', 'Meal Planner'],
    ['Settings', 'Settings'],
    ['Home', 'What’s cooking today?'],
  ]) {
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: label }).click();
    await expect(page.locator('main h1').first()).toContainText(heading);
  }
});

test('food guide shows all 251 foods and searches Portuguese aliases', async ({ page }) => {
  await page.goto('/guide');
  await expect(page.getByText('Showing 251 of 251 foods')).toBeVisible();
  await expect(page.locator('li[data-food]')).toHaveCount(251);
  await page.getByPlaceholder(/Search in English or Portuguese/).fill('alho');
  await expect(page.locator('li[data-food="garlic"]')).toBeVisible();
  await expect(page.locator('.food-col.avoid li[data-food="garlic"]')).toBeVisible();
  await page.getByPlaceholder(/Search in English or Portuguese/).fill('café');
  await expect(page.locator('.food-col.eat li[data-food="black-coffee"]')).toBeVisible();
});

test('every recipe photo resolves', async ({ page, request }) => {
  await page.goto('/');
  for (const [id, m] of Object.entries(images as Record<string, { match: string; src480?: string; src960?: string }>)) {
    if (m.match === 'placeholder') continue;
    for (const src of [m.src480!, m.src960!]) {
      const res = await request.get(src);
      expect(res.status(), `${id} ${src}`).toBe(200);
      expect(res.headers()['content-type']).toContain('image/webp');
    }
  }
});

test('recipe page shows suitability, portions and photo credit', async ({ page }) => {
  await page.goto('/recipes/arroz-com-lentilha');
  await expect(page.getByRole('heading', { name: 'Dietary suitability' })).toBeVisible();
  await expect(page.getByText('Canned lentils (rinsed, small portions) — LIMIT / CHECK: 40 g per serving.')).toBeVisible();
  await page.goto('/recipes/salmao-batata-verdes');
  await expect(page.getByText('Photo of this dish')).toBeVisible();
  const img = page.locator('.detail-hero img');
  await expect(img).toHaveAttribute('alt', /salmon/i);
  await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0), { timeout: 15_000 }).toBe(true);
});

test('favourites and settings survive reloads and a cache/service-worker reset', async ({ page }) => {
  await page.goto('/recipes/quindim');
  await page.getByRole('button', { name: /Add Coconut egg custards to favourites/ }).click();
  await page.goto('/settings');
  await page.getByRole('button', { name: 'Hide recipes using them' }).click();
  await page.waitForTimeout(400);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Hide recipes using them' })).toHaveAttribute('aria-pressed', 'true');
  // Simulate an app update: drop all caches and the service worker, then reload.
  await page.evaluate(async () => {
    for (const k of await caches.keys()) await caches.delete(k);
    for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
  });
  await page.goto('/recipes?fav=1&all=1');
  await expect(page.getByRole('heading', { name: 'Coconut egg custards' })).toBeVisible();
  await page.goto('/settings');
  await expect(page.getByRole('button', { name: 'Hide recipes using them' })).toHaveAttribute('aria-pressed', 'true');
});

test('meal planner generates a week and a grocery list', async ({ page }) => {
  await page.goto('/planner');
  await page.getByRole('button', { name: 'Generate a week' }).click();
  await expect(page.getByText('28 of 28 meals planned')).toBeVisible();
  await page.getByRole('button', { name: 'Grocery list' }).click();
  await expect(page.getByRole('heading', { name: 'Grocery list' })).toBeVisible();
  const first = page.locator('.grocery input[type=checkbox]').first();
  await first.check();
  await page.waitForTimeout(400);
  await page.reload();
  await expect(page.locator('.grocery input[type=checkbox]').first()).toBeChecked();
});

test('ingredient matcher recommends from selected ingredients', async ({ page }) => {
  await page.goto('/matcher');
  for (const name of ['Eggs', 'Butter', 'Spinach', 'Tomatoes']) await page.locator('.pick', { hasText: new RegExp(`^${name}$`) }).click();
  await expect(page.getByRole('heading', { name: /Ready to cook/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Scrambled eggs with spinach and tomatoes' })).toBeVisible();
});

test('PWA manifest and icons are valid', async ({ request }) => {
  const res = await request.get('/manifest.webmanifest');
  expect(res.status()).toBe(200);
  const m = await res.json();
  expect(m.name).toBe('My FODMAP Kitchen');
  expect(m.display).toBe('standalone');
  expect(m.start_url).toBe('/');
  const sizes = m.icons.map((i: { sizes: string }) => i.sizes);
  expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']));
  expect(m.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true);
  for (const i of m.icons) expect((await request.get(i.src)).status()).toBe(200);
  expect((await request.get('/icons/apple-touch-icon.png')).status()).toBe(200);
  expect((await request.get('/sw.js')).status()).toBe(200);
});

test('works offline after the first visit', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  // Let precaching finish.
  await expect
    .poll(async () => page.evaluate(async () => (await Promise.all((await caches.keys()).map(async (k) => (await (await caches.open(k)).keys()).length))).reduce((a, b) => a + b, 0)), { timeout: 30_000 })
    .toBeGreaterThan(60);
  await context.setOffline(true);
  await page.goto('/guide');
  await expect(page.getByText('Showing 251 of 251 foods')).toBeVisible();
  await page.goto('/recipes/omelete-tomate-folhas');
  await expect(page.locator('main h1')).toHaveText('Tomato and greens omelette');
  await page.goto('/recipes');
  const card = page.locator('.rcard img').first();
  await card.scrollIntoViewIfNeeded();
  await expect.poll(() => card.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  await context.setOffline(false);
});

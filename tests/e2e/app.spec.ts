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
  await page.getByRole('button', { name: 'Grocery list', exact: true }).click();
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

// ---------- Brazilian Portuguese (pt-BR) ----------

const PT_NAV = ['Início', 'Guia de Alimentos', 'Receitas', 'Planejador', 'Ajustes'];

/** Opens the app with Portuguese already chosen on this device. */
async function usePortuguese(page: Page) {
  await page.addInitScript(() => localStorage.setItem('fodmap-kitchen:lang', 'pt-BR'));
}

test('language switch is immediate, saved per device, and English stays the default', async ({ page }) => {
  await page.goto('/settings');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');
  const navigations: string[] = [];
  page.on('framenavigated', (f) => {
    if (f === page.mainFrame()) navigations.push(f.url());
  });
  await page.getByRole('button', { name: 'Português (Brasil)' }).click();
  await expect(page.locator('main h1').first()).toHaveText('Ajustes');
  // No reload: the page switched in place.
  expect(navigations).toEqual([]);
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  const nav = page.getByRole('navigation', { name: 'Principal' });
  for (const label of PT_NAV) await expect(nav.getByRole('link', { name: label })).toBeVisible();
  await page.reload();
  await expect(page.locator('main h1').first()).toHaveText('Ajustes');
  await expect(page.getByRole('button', { name: 'Português (Brasil)' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.locator('main h1').first()).toHaveText('Settings');
  await page.reload();
  await expect(page.locator('main h1').first()).toHaveText('Settings');
});

test('switching language keeps favourites, plans and dietary settings', async ({ page }) => {
  await page.goto('/recipes/quindim');
  await page.getByRole('button', { name: /Add Coconut egg custards to favourites/ }).click();
  await page.goto('/planner');
  await page.getByRole('button', { name: 'Generate a week' }).click();
  await expect(page.getByText('28 of 28 meals planned')).toBeVisible();
  await page.goto('/settings');
  await page.getByRole('button', { name: 'Hide recipes using them' }).click();
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Português (Brasil)' }).click();
  await expect(page.getByRole('button', { name: 'Ocultar receitas que os usam' })).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/recipes?fav=1&all=1');
  await expect(page.getByRole('heading', { name: 'Quindim' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Remover Quindim dos favoritos/ })).toBeVisible();
  await page.goto('/planner');
  await expect(page.getByText('28 de 28 refeições planejadas')).toBeVisible();
  await page.goto('/settings');
  await page.getByRole('button', { name: 'English' }).click();
  await page.goto('/recipes?fav=1&all=1');
  await expect(page.getByRole('heading', { name: 'Coconut egg custards' })).toBeVisible();
  await page.goto('/settings');
  await expect(page.getByRole('button', { name: 'Hide recipes using them' })).toHaveAttribute('aria-pressed', 'true');
});

test('every page renders in Portuguese without errors, English leftovers or horizontal overflow', async ({ page }) => {
  await usePortuguese(page);
  const errors = trackErrors(page);
  const englishUi =
    /\b(Home|Food Guide|Meal Planner|Settings|Ingredients|Method|Substitutions|Grocery list|Breakfast|Lunch|Dinner|Snack|servings?|minutes|AVOID FOR NOW|LIMIT \/ CHECK|EAT|Representative photo|Not in guide)\b/;
  for (const path of PAGES) {
    await page.goto(path);
    await expect(page.locator('main h1').first()).toBeVisible();
    await page.waitForLoadState('networkidle');
    await noHorizontalOverflow(page);
    // The brand name and the photo source are the only English allowed.
    const text = (await page.locator('body').innerText()).replaceAll('My FODMAP Kitchen', '').replaceAll('Foodiesfeed', '');
    expect(text, path).not.toMatch(englishUi);
  }
  expect(errors).toEqual([]);
});

test('Portuguese food guide, recipe page, planner and matcher', async ({ page }) => {
  await usePortuguese(page);
  await page.goto('/guide');
  await expect(page.getByText('Mostrando 251 de 251 alimentos')).toBeVisible();
  await expect(page.locator('.food-col.avoid li[data-food="garlic"]')).toContainText('Alho');
  await expect(page.locator('.food-col.avoid header').first()).toHaveText('EVITAR POR ENQUANTO');
  await expect(page.locator('.food-col.eat header').first()).toHaveText('PODE COMER');
  await expect(page.locator('.food-col.limit header').first()).toHaveText('LIMITAR / VERIFICAR');

  await page.goto('/recipes/arroz-com-lentilha');
  await expect(page.locator('main h1')).toHaveText('Arroz com lentilha');
  await expect(page.getByText('Adequação à dieta')).toBeVisible();
  await expect(page.getByText(/LIMITAR \/ VERIFICAR: 40 g por porção/)).toBeVisible();

  await page.goto('/planner');
  await page.getByRole('button', { name: 'Gerar uma semana' }).click();
  await expect(page.getByText('28 de 28 refeições planejadas')).toBeVisible();
  await page.getByRole('button', { name: 'Lista de compras', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Lista de compras' })).toBeVisible();

  await page.goto('/matcher');
  for (const name of ['Ovos', 'Manteiga', 'Espinafre', 'Tomate']) await page.locator('.pick', { hasText: new RegExp(`^${name}$`) }).click();
  await expect(page.getByRole('heading', { name: /Prontas para cozinhar/ })).toBeVisible();
});

test('Portuguese search works with and without accents', async ({ page }) => {
  await usePortuguese(page);
  await page.goto('/guide');
  const search = page.getByPlaceholder(/Busque em português ou inglês/);
  await search.fill('feijão');
  const accented = await page.locator('li[data-food]').count();
  expect(accented).toBeGreaterThan(0);
  await search.fill('feijao');
  await expect(page.locator('li[data-food]')).toHaveCount(accented);
  await search.fill('berinjela');
  await expect(page.locator('li[data-food="eggplant"]')).toBeVisible();

  await page.goto('/recipes?q=salm%C3%A3o');
  await expect(page.locator('.rcard').first()).toBeVisible();
  const withAccent = await page.locator('.rcard').count();
  await page.goto('/recipes?q=salmao');
  await expect(page.locator('.rcard')).toHaveCount(withAccent);
  await expect(page.getByRole('heading', { name: 'Sushi caseiro de salmão' })).toBeVisible();
});

test('Portuguese works offline', async ({ page, context }) => {
  await usePortuguese(page);
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await expect
    .poll(async () => page.evaluate(async () => (await Promise.all((await caches.keys()).map(async (k) => (await (await caches.open(k)).keys()).length))).reduce((a, b) => a + b, 0)), { timeout: 30_000 })
    .toBeGreaterThan(60);
  await context.setOffline(true);
  await page.goto('/guide');
  await expect(page.getByText('Mostrando 251 de 251 alimentos')).toBeVisible();
  await page.goto('/recipes/omelete-tomate-folhas');
  await expect(page.locator('main h1')).toHaveText('Omelete de tomate e espinafre');
  await context.setOffline(false);
});

test('recipes can be filtered to elimination-friendly only', async ({ page }) => {
  await page.goto('/recipes');
  const cards = page.locator('.grid > *');
  await expect(page.getByText('81 recipes')).toBeVisible();
  const all = await cards.count();
  const chip = page.getByRole('button', { name: 'Elimination-friendly only' });
  await chip.click();
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
  await expect(page).toHaveURL(/elim=1/);
  const n = await cards.count();
  expect(n).toBeGreaterThan(0);
  expect(n).toBeLessThan(all);
  await expect(page.locator('.grid').getByText('Portion check')).toHaveCount(0);
  await expect(page.locator('main p.small.muted').first()).toHaveText(`${n} ${n === 1 ? 'recipe' : 'recipes'}`);
  // Works together with the meal filter, and in Portuguese.
  await page.getByRole('button', { name: 'Lunch' }).click();
  expect(await cards.count()).toBeLessThanOrEqual(n);
  await page.evaluate(() => localStorage.setItem('fodmap-kitchen:lang', 'pt-BR'));
  await page.reload();
  await expect(page.getByRole('button', { name: 'Só adequadas à eliminação' })).toHaveAttribute('aria-pressed', 'true');
  await page.evaluate(() => localStorage.removeItem('fodmap-kitchen:lang'));
});

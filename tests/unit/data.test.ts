import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FOODS, FOOD_BY_ID } from '../../src/data/foods';
import { PANTRY } from '../../src/data/pantry';
import { RECIPES } from '../../src/data/recipes';
import { MEALS } from '../../src/data/types';
import { IMAGES } from '../../src/lib/images';
import { analyzeRecipe } from '../../src/lib/analysis';
import { resolveIngredient } from '../../src/lib/ingredients';

const root = join(__dirname, '..', '..');

describe('food guide import', () => {
  it('imports every bullet from the 5-page PDF (251 entries)', () => {
    expect(FOODS).toHaveLength(251);
  });

  it('has the expected split per classification', () => {
    const by = (s: string) => FOODS.filter((f) => f.status === s).length;
    // Hand-counted from the PDF, section by section:
    // EAT   8+9+7+14+2+1+14+4+1+2+1 = 63; AVOID 11+9+9+4+5+9+3+4+8+6+3 = 71; LIMIT = 251 − 134 = 117.
    expect({ eat: by('eat'), limit: by('limit'), avoid: by('avoid') }).toEqual({ eat: 63, limit: 117, avoid: 71 });
  });

  it('has unique ids that do not collide with pantry ids', () => {
    expect(new Set(FOODS.map((f) => f.id)).size).toBe(FOODS.length);
    for (const p of PANTRY) expect(FOOD_BY_ID.has(p.id)).toBe(false);
  });

  it('preserves Brazilian names and key entries exactly', () => {
    const names = FOODS.map((f) => f.name);
    for (const n of [
      'Pimenta biquinho',
      'Jabuticaba (portion data uncertain)',
      'Broa de fubá (recipe check)',
      'Farinha de mandioca',
      'Farofa pronta Yoki (ingredient check)',
      'Pão de queijo (recipe check)',
      'Coxinha (traditional wheat/onion recipe)',
      'Linguiça (ingredient check)',
      'Portuguese chouriço (ingredient check)',
      'Mozzarella / mussarela cheese',
      'Paçoca (ingredient/portion check)',
      'Malagueta pepper',
      'Molho inglês / Worcestershire (label check)',
      'Doce de goiabada (small portion; sugar tolerance)',
      'Cachaça (after elimination)',
      'Suco de caju (recipe/portion check)',
    ])
      expect(names).toContain(n);
  });

  it('lists regular black coffee as EAT', () => {
    expect(FOOD_BY_ID.get('black-coffee')).toMatchObject({ status: 'eat', name: 'Black coffee (regular, if tolerated)' });
  });

  it('classifies garlic and onions as AVOID', () => {
    for (const id of ['garlic', 'onions-red', 'onions-yellow', 'garlic-powder', 'onion-powder']) expect(FOOD_BY_ID.get(id)?.status).toBe('avoid');
  });
});

describe('recipe library', () => {
  it('has at least 80 recipes with at least 20 per meal', () => {
    expect(RECIPES.length).toBeGreaterThanOrEqual(80);
    for (const m of MEALS) expect(RECIPES.filter((r) => r.meal === m).length, m).toBeGreaterThanOrEqual(20);
  });

  it('has no duplicate ids or titles', () => {
    expect(new Set(RECIPES.map((r) => r.id)).size).toBe(RECIPES.length);
    expect(new Set(RECIPES.map((r) => r.title.toLowerCase())).size).toBe(RECIPES.length);
    expect(new Set(RECIPES.filter((r) => r.titlePt).map((r) => r.titlePt!.toLowerCase())).size).toBe(RECIPES.filter((r) => r.titlePt).length);
  });

  it.each(RECIPES.map((r) => [r.id, r] as const))('%s is complete', (_id, r) => {
    expect(r.title.length).toBeGreaterThan(5);
    expect(r.description.length).toBeGreaterThan(20);
    expect(r.servings).toBeGreaterThan(0);
    expect(r.prepMinutes + r.cookMinutes).toBeGreaterThan(0);
    expect(r.ingredients.length).toBeGreaterThanOrEqual(2);
    expect(r.steps.length).toBeGreaterThanOrEqual(2);
    expect(r.substitutions.length).toBeGreaterThanOrEqual(1);
    for (const s of [...r.steps, ...r.substitutions, r.description]) expect(s).not.toMatch(/\b(TODO|TBD|lorem|placeholder)\b/i);
    for (const i of r.ingredients) {
      expect(resolveIngredient(i.id), `${r.id}: ${i.id}`).toBeDefined();
      expect(i.qty, `${r.id}: ${i.id}`).toBeGreaterThan(0);
    }
  });

  it('never uses an AVOID FOR NOW food', () => {
    const offenders = RECIPES.flatMap((r) => analyzeRecipe(r).avoid.map((a) => `${r.id}:${a.ing.id}`));
    expect(offenders).toEqual([]);
  });

  it('prioritises Brazilian-style recipes', () => {
    expect(RECIPES.filter((r) => r.brazilian).length).toBeGreaterThan(RECIPES.length / 2);
  });

  // Editorial guardrails (not source data): LIMIT foods whose guide entry says
  // "small" must stay small per serving in our recipes.
  const SMALL_CAPS: Record<string, { unit: string; max: number }[]> = {
    'lentils-canned': [{ unit: 'g', max: 46 }],
    'chickpeas-canned': [{ unit: 'g', max: 46 }],
    'almonds-small': [{ unit: 'g', max: 15 }],
    'soy-sauce': [{ unit: 'tbsp', max: 1 }],
    ketchup: [{ unit: 'tbsp', max: 0.5 }],
    'tomato-paste': [{ unit: 'tbsp', max: 0.5 }],
    'dark-chocolate-small': [{ unit: 'g', max: 20 }],
    'goiabada': [{ unit: 'g', max: 20 }],
    'oats-rolled': [{ unit: 'g', max: 40 }],
    'sweet-potatoes': [{ unit: 'g', max: 75 }],
    'coconut': [{ unit: 'ml', max: 30 }, { unit: 'tbsp', max: 1 }, { unit: 'g', max: 10 }],
    'mozzarella': [{ unit: 'g', max: 40 }],
    'blueberries': [{ unit: 'g', max: 30 }],
  };
  it('keeps portion-limited LIMIT foods within small per-serving amounts', () => {
    const over: string[] = [];
    for (const r of RECIPES)
      for (const i of r.ingredients) {
        const caps = SMALL_CAPS[i.id];
        const cap = caps?.find((c) => c.unit === i.unit);
        if (cap && i.qty / r.servings > cap.max + 1e-9) over.push(`${r.id}:${i.id}=${(i.qty / r.servings).toFixed(1)}${i.unit}`);
      }
    expect(over).toEqual([]);
  });
});

describe('recipe images', () => {
  it('has an image entry for every recipe and no orphans', () => {
    expect(Object.keys(IMAGES).sort()).toEqual(RECIPES.map((r) => r.id).sort());
  });

  it('every photo file exists, is WebP, and carries licence + source metadata', () => {
    for (const [id, m] of Object.entries(IMAGES)) {
      if (m.match === 'placeholder') {
        expect(m.reason.length).toBeGreaterThan(10);
        continue;
      }
      for (const src of [m.src480, m.src960]) {
        const p = join(root, 'public', src);
        expect(existsSync(p), p).toBe(true);
        expect(readFileSync(p).subarray(8, 12).toString()).toBe('WEBP');
      }
      expect(m.alt.length, id).toBeGreaterThan(10);
      expect(['exact', 'representative']).toContain(m.match);
      if (m.source === 'Owner-supplied') {
        expect(existsSync(join(root, 'assets', 'owner-photos', `${id}.png`)), id).toBe(true);
        continue;
      }
      expect(m.source).toBe('Foodiesfeed');
      expect(m.photoPage).toMatch(/^https:\/\/www\.foodiesfeed\.com\/free-food-photo\//);
      expect(m.assetUrl).toMatch(/^https:\/\/pub-[a-z0-9]+\.r2\.dev\//);
      expect(m.license).toMatch(/Foodiesfeed/);
      expect(['exact', 'representative']).toContain(m.match);
    }
  });

  it('every recipe has a photo (no placeholders left)', () => {
    const missing = Object.entries(IMAGES).filter(([, m]) => m.match === 'placeholder').map(([id]) => id);
    expect(missing).toEqual([]);
  });

  it('uses each Foodiesfeed photo for only one recipe', () => {
    const pages = Object.values(IMAGES).flatMap((m) => (m.match === 'placeholder' || m.source !== 'Foodiesfeed' ? [] : [m.photoPage]));
    expect(new Set(pages).size).toBe(pages.length);
  });
});

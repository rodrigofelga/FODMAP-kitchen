import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { FOODS, FOOD_BY_ID, LEGACY_IDS, type FoodCategory } from '../../src/data/foods';
import { SOURCE_BY_ID } from '../../src/data/sources';
import { RECIPES, RECIPE_BY_ID } from '../../src/data/recipes';
import { IMAGES } from '../../src/lib/images';
import { DEFAULT_PREFERENCES, evaluateRecipe, serveFit, serveText } from '../../src/lib/analysis';
import { foodMatches } from '../../src/lib/search';
import { resolveIngredient } from '../../src/lib/ingredients';
import { setLang } from '../../src/i18n/core';
import { FOOD_NAMES_PT } from '../../src/i18n/data/foods.pt-BR';

/** Regression tests for the Nov 2026 Food Guide expansion and serve evidence. */

const root = join(__dirname, '..', '..');
const prefs = structuredClone(DEFAULT_PREFERENCES);
const status = (id: string) => FOOD_BY_ID.get(id)?.status;
const searchIds = (q: string) => FOODS.filter((f) => foodMatches(f, q)).map((f) => f.id);

afterEach(() => setLang('en'));

describe('database integrity', () => {
  it('has at least 750 distinct records and meets every category planning target', () => {
    expect(FOODS.length).toBeGreaterThanOrEqual(750);
    const n = (c: FoodCategory[]) => FOODS.filter((f) => c.includes(f.category)).length;
    expect(n(['meat'])).toBeGreaterThanOrEqual(100);
    expect(n(['seafood'])).toBeGreaterThanOrEqual(60);
    expect(n(['dairy', 'protein'])).toBeGreaterThanOrEqual(70);
    expect(n(['vegetables'])).toBeGreaterThanOrEqual(90);
    expect(n(['fruit'])).toBeGreaterThanOrEqual(70);
    expect(n(['starches'])).toBeGreaterThanOrEqual(75);
    expect(n(['legumes'])).toBeGreaterThanOrEqual(45);
    expect(n(['seasonings'])).toBeGreaterThanOrEqual(60);
    expect(n(['sauces'])).toBeGreaterThanOrEqual(50);
    expect(n(['drinks'])).toBeGreaterThanOrEqual(80);
    expect(n(['snacks'])).toBeGreaterThanOrEqual(50);
  });

  it('does not inflate the count with duplicate ids or names in either language', () => {
    const lower = (s: string) => s.toLowerCase().trim();
    expect(new Set(FOODS.map((f) => f.id)).size).toBe(FOODS.length);
    expect(new Set(FOODS.map((f) => lower(f.name))).size).toBe(FOODS.length);
    expect(new Set(FOODS.map((f) => lower(FOOD_NAMES_PT[f.id]))).size).toBe(FOODS.length);
  });

  it('gives every record a verification level, and every cited source exists', () => {
    for (const f of FOODS) {
      expect(['serve', 'listed', 'clinical', 'secondary', 'group', 'unverified', 'guide'], f.id).toContain(f.verification);
      for (const s of f.sources ?? []) expect(SOURCE_BY_ID.has(s), `${f.id}: ${s}`).toBe(true);
      if (f.serve) {
        expect(SOURCE_BY_ID.has(f.serve.src), f.id).toBe(true);
        expect(f.serve.amount, f.id).toBeGreaterThan(0);
      }
      if (f.verification === 'serve') expect(f.serve, f.id).toBeDefined();
    }
  });

  it('never rates a record with no FODMAP data as EAT', () => {
    expect(FOODS.filter((f) => f.verification === 'unverified' && f.status === 'eat').map((f) => f.id)).toEqual([]);
  });

  it('keeps every source dated and URLs on primary sources', () => {
    for (const s of SOURCE_BY_ID.values()) {
      expect(s.date, s.id).toBeTruthy();
      expect(s.org, s.id).toBeTruthy();
    }
  });
});

describe('beverages', () => {
  it('does not call regular beer high-FODMAP only because of alcohol or carbonation', () => {
    for (const id of ['beer', 'lager']) {
      expect(status(id), id).toBe('limit');
      expect(FOOD_BY_ID.get(id)!.name, id).not.toMatch(/high/i);
    }
    expect(FOOD_BY_ID.get('lager')!.triggers).toEqual(expect.arrayContaining(['alcohol', 'carbonation']));
  });

  it('rates rum, sticky wine and chamomile tea AVOID (tested high)', () => {
    for (const id of ['rum', 'sticky-wine', 'chamomile-tea']) expect(status(id), id).toBe('avoid');
  });

  it('attributes wine and spirit serves to a secondary source, not to a primary one', () => {
    const red = FOOD_BY_ID.get('red-wine')!;
    expect(red.serve).toMatchObject({ amount: 150, unit: 'ml', src: 'ALBY' });
    expect(red.verification).toBe('secondary');
    expect(SOURCE_BY_ID.get('ALBY')!.kind).toBe('secondary');
  });

  it('never rates an alcoholic drink EAT', () => {
    const alcoholic = FOODS.filter((f) => f.triggers?.includes('alcohol'));
    expect(alcoholic.length).toBeGreaterThan(15);
    for (const f of alcoholic) expect(f.status, f.id).not.toBe('eat');
  });

  it('keeps UHT coconut beverage and canned coconut milk as separate records', () => {
    const uht = FOOD_BY_ID.get('coconut-milk-uht')!;
    const canned = FOOD_BY_ID.get('coconut-milk-canned')!;
    expect(uht.serve).toMatchObject({ amount: 0.75, unit: 'cup', src: 'DA24' });
    expect(canned.serve).toBeUndefined();
    expect(canned.verification).toBe('unverified');
  });
});

describe('vinegar consolidation', () => {
  it('resolves the legacy vinegar-plain id to the single vinegar record without changing classification', () => {
    expect(FOODS.find((f) => f.id === 'vinegar-plain')).toBeUndefined();
    expect(LEGACY_IDS['vinegar-plain']).toBe('vinegar');
    expect(FOOD_BY_ID.get('vinegar-plain')!.status).toBe(status('vinegar'));
    expect(resolveIngredient('vinegar-plain')?.status).toBe('eat');
    const users = RECIPES.filter((r) => r.ingredients.some((i) => i.id === 'vinegar-plain' || i.id === 'vinegar'));
    expect(users.length).toBeGreaterThanOrEqual(4);
    for (const r of users) for (const i of r.ingredients) expect(resolveIngredient(i.id), `${r.id}/${i.id}`).toBeDefined();
  });
});

describe('bilingual search and regional aliases', () => {
  it.each([
    ['picanha', 'beef-picanha'], ['contrafilé', 'beef-sirloin'],
    ['camomila', 'chamomile-tea'],
    ['maracujá', 'passion-fruit'],
    ['leite de coco de caixinha', 'coconut-milk-uht'],
    ['pilsen', 'lager'],
  ])('finds %s', (q, id) => {
    expect(searchIds(q)).toContain(id);
  });

  it('finds new records by their Portuguese name', () => {
    setLang('pt-BR');
    expect(searchIds('Bebida de coco UHT')).toContain('coconut-milk-uht');
  });
});

describe('serves and stacking', () => {
  it('compares a serving with a published serve only in the same unit', () => {
    const oats = FOOD_BY_ID.get('oats-rolled')!;
    expect(serveFit(oats, { id: 'oats-rolled', qty: 40, unit: 'g' }, 1)).toBe('within');
    expect(serveFit(oats, { id: 'oats-rolled', qty: 80, unit: 'g' }, 1)).toBe('above');
    expect(serveFit(oats, { id: 'oats-rolled', qty: 3, unit: 'tbsp' }, 1)).toBe('unknown');
    expect(serveFit(FOOD_BY_ID.get('cinnamon'), { id: 'cinnamon', qty: 1, unit: 'pinch' }, 1)).toBe('unknown');
  });

  it('describes a reference serve with its source and readable household unit', () => {
    expect(serveText(FOOD_BY_ID.get('peanuts')!)).toMatch(/^28 g \(32 pieces\) — Monash University/);
  });

  it('keeps multi-fruit recipes LIMIT even when every fruit is within its own serve', () => {
    for (const id of ['smoothie-verde-kiwi', 'picole-morango-banana', 'smoothie-morango']) {
      const e = evaluateRecipe(RECIPE_BY_ID.get(id)!, prefs);
      expect(e.verdict, id).toBe('check');
    }
    expect(evaluateRecipe(RECIPE_BY_ID.get('smoothie-verde-kiwi')!, prefs).checks.join(' ')).toMatch(/Several fruits/);
  });

  it('lets optional ingredients add conditional warnings without changing the verdict', () => {
    const e = evaluateRecipe(RECIPE_BY_ID.get('omelete-tomate-folhas')!, prefs);
    expect(e.verdict).toBe('suitable');
    expect(e.conditional.join(' ')).toMatch(/Optional Mozzarella/);
    expect(evaluateRecipe(RECIPE_BY_ID.get('omelete-tomate-folhas')!, { ...prefs, excluded: ['mozzarella'] }).conditional).toEqual([]);
  });

  it('notes EAT ingredients that rest only on the original guide', () => {
    const e = evaluateRecipe(RECIPE_BY_ID.get('omelete-tomate-folhas')!, prefs);
    expect(e.qualifies.join(' ')).toMatch(/original guide only/);
  });
});

describe('terminology and photography', () => {
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((f) => {
      const p = join(dir, f);
      return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(f) ? [p] : [];
    });

  it('uses only EAT / LIMIT / AVOID and COMER / LIMITAR / EVITAR across the source', () => {
    for (const f of files(join(root, 'src')))
      expect(readFileSync(f, 'utf8'), f).not.toMatch(/LIMIT \/ CHECK|AVOID FOR NOW|PODE COMER|LIMITAR \/ VERIFICAR|EVITAR POR ENQUANTO/);
  });

  it('shows no photographs in the Food Guide; photos stay on the 81 recipes', () => {
    const guide = readFileSync(join(root, 'src/pages/FoodGuidePage.tsx'), 'utf8');
    expect(guide).not.toMatch(/<img|RecipeImage|IMAGES/);
    expect(Object.keys(IMAGES).filter((id) => !RECIPE_BY_ID.has(id))).toEqual([]);
    expect(RECIPES).toHaveLength(81);
  });
});

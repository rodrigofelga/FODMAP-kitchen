import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { RECIPES, RECIPE_BY_ID } from '../../src/data/recipes';
import { MEALS, type Recipe } from '../../src/data/types';
import { DEFAULT_PREFERENCES, evaluateRecipe, type Preferences } from '../../src/lib/analysis';
import { matchRecipes } from '../../src/lib/matcher';
import { buildGroceryList, generateWeek, newPlan } from '../../src/lib/planner';
import { defaultData, normalizeData } from '../../src/lib/appData';
import { idbGet, idbSet, _resetDbForTests } from '../../src/lib/db';
import { formatAmount, formatQty, resolveIngredient } from '../../src/lib/ingredients';
import { FOOD_BY_ID } from '../../src/data/foods';
import { UNVERIFIED_SERVINGS } from '../../src/data/recipeReviews';

const prefs = (over: Partial<Preferences> = {}): Preferences => ({ ...structuredClone(DEFAULT_PREFERENCES), ...over });

const fakeAvoidRecipe: Recipe = {
  id: 'test-garlic',
  title: 'Garlic test',
  meal: 'dinner',
  description: 'A test recipe that contains garlic.',
  servings: 2,
  prepMinutes: 1,
  cookMinutes: 1,
  brazilian: false,
  ingredients: [
    { id: 'rice-white', qty: 100, unit: 'g' },
    { id: 'garlic', qty: 2, unit: 'unit' },
  ],
  steps: ['a', 'b'],
  substitutions: ['c'],
};

describe('evaluateRecipe', () => {
  it('excludes recipes with AVOID foods during elimination', () => {
    const e = evaluateRecipe(fakeAvoidRecipe, prefs());
    expect(e.verdict).toBe('excluded');
    expect(e.reasons.join(' ')).toMatch(/Garlic.*AVOID FOR NOW/);
  });

  it("never marks a recipe that uses LIMIT foods or unverified ingredients as plainly suitable", () => {
    for (const r of RECIPES) {
      const usesLimit = r.ingredients.some((i) => resolveIngredient(i.id)?.status === "limit");
      const unlisted = r.ingredients.some((i) => !i.optional && resolveIngredient(i.id)?.status === "unlisted");
      const fruits = r.ingredients.filter((i) => !i.optional && FOOD_BY_ID.get(i.id)?.category === "fruit").length;
      const e = evaluateRecipe(r, prefs());
      if (usesLimit || unlisted || fruits >= 2 || UNVERIFIED_SERVINGS[r.id]) expect(e.verdict, r.id).toBe("check");
      else expect(e.verdict, r.id).toBe("suitable");
    }
  });

  it('explains each LIMIT food with its per-serving amount', () => {
    const r = RECIPE_BY_ID.get('arroz-com-lentilha')!;
    const e = evaluateRecipe(r, prefs());
    expect(e.checks.find((c) => c.startsWith('Canned lentils'))).toMatch(/40 g per serving/);
  });

  it('hides LIMIT recipes in strict mode but drops only optional LIMIT items', () => {
    const strict = prefs({ limitHandling: 'exclude' });
    expect(evaluateRecipe(RECIPE_BY_ID.get('arroz-com-lentilha')!, strict).verdict).toBe('excluded');
    const omelette = evaluateRecipe(RECIPE_BY_ID.get('omelete-tomate-folhas')!, strict);
    expect(omelette.verdict).toBe('suitable');
    expect(omelette.omit.join()).toMatch(/Mozzarella/);
  });

  it('treats tolerated LIMIT foods as suitable while still stating the portion', () => {
    const r: Recipe = { ...fakeAvoidRecipe, id: 'test-oats', ingredients: [{ id: 'lactose-free-milk', qty: 400, unit: 'ml' }, { id: 'oats-rolled', qty: 80, unit: 'g' }] };
    const e = evaluateRecipe(r, prefs({ tolerated: ['oats-rolled'] }));
    expect(e.verdict).toBe('suitable');
    expect(e.checks[0]).toMatch(/tolerated.*40 g per serving/);
    // A tolerated LIMIT food does not clear an unclassified pantry item (cinnamon).
    const mingau = evaluateRecipe(RECIPE_BY_ID.get('mingau-de-aveia-morango')!, prefs({ tolerated: ['oats-rolled'] }));
    expect(mingau.verdict).toBe('check');
    expect(mingau.checks.join(' ')).toMatch(/Cinnamon — not classified in the guide/);
  });

  it('respects excluded ingredients and diets', () => {
    expect(evaluateRecipe(RECIPE_BY_ID.get('ovos-mexidos-espinafre-tomate')!, prefs({ excluded: ['eggs'] })).verdict).toBe('excluded');
    const veg = prefs({ diet: { ...DEFAULT_PREFERENCES.diet, vegetarian: true } });
    expect(evaluateRecipe(RECIPE_BY_ID.get('espetinho-de-frango')!, veg).verdict).toBe('excluded');
    expect(evaluateRecipe(RECIPE_BY_ID.get('smoothie-morango')!, veg).verdict).not.toBe('excluded');
  });
});


describe('ingredient matcher', () => {
  it('ranks complete matches first and lists missing ingredients', () => {
    const have = new Set(['eggs', 'butter', 'spinach', 'tomatoes']);
    const { recommended } = matchRecipes(RECIPES, have, prefs());
    expect(recommended[0].recipe.id).toBe('ovos-mexidos-espinafre-tomate');
    expect(recommended[0].missing).toEqual([]);
    const partial = recommended.find((m) => m.missing.length > 0)!;
    expect(partial.missing.length).toBeGreaterThan(0);
  });

  it('never recommends excluded recipes and explains why they are excluded', () => {
    const have = new Set(['eggs', 'butter', 'spinach', 'tomatoes', 'bacon', 'mozzarella']);
    const p = prefs({ excluded: ['eggs'] });
    const { recommended, excluded } = matchRecipes(RECIPES, have, p);
    expect(recommended.every((m) => !m.recipe.ingredients.some((i) => i.id === 'eggs' && !i.optional))).toBe(true);
    expect(excluded.length).toBeGreaterThan(0);
    expect(excluded[0].evaluation.reasons[0]).toMatch(/excluded/);
  });

  it('never recommends a recipe containing an AVOID food during elimination', () => {
    const { recommended, excluded } = matchRecipes([...RECIPES, fakeAvoidRecipe], new Set(['rice-white', 'garlic']), prefs());
    expect(recommended.map((m) => m.recipe.id)).not.toContain('test-garlic');
    expect(excluded.map((m) => m.recipe.id)).toContain('test-garlic');
  });
});

describe('planner and grocery list', () => {
  it('fills all 28 slots with eligible, non-repeating recipes', () => {
    const days = generateWeek(RECIPES, prefs(), [], 42);
    for (const m of MEALS) {
      const ids = days.map((d) => d[m]);
      expect(ids.every(Boolean)).toBe(true);
      expect(new Set(ids).size).toBe(7);
      for (const id of ids) expect(RECIPE_BY_ID.get(id!)!.meal).toBe(m);
    }
  });

  it('never schedules excluded recipes', () => {
    const p = prefs({ limitHandling: 'exclude' });
    const days = generateWeek(RECIPES, p, [], 7);
    for (const d of days) for (const m of MEALS) if (d[m]) expect(evaluateRecipe(RECIPE_BY_ID.get(d[m]!)!, p).verdict).not.toBe('excluded');
  });

  it('keeps already chosen meals when filling empty slots', () => {
    const plan = newPlan('t');
    plan.days[0].lunch = 'arroz-carreteiro';
    const days = generateWeek(RECIPES, prefs(), [], 1, plan.days);
    expect(days[0].lunch).toBe('arroz-carreteiro');
  });

  it('aggregates and scales grocery quantities', () => {
    const plan = newPlan('t');
    plan.days[0].breakfast = 'ovos-mexidos-espinafre-tomate'; // 2 eggs, serves 1
    plan.days[1].breakfast = 'ovos-mexidos-espinafre-tomate';
    const list = buildGroceryList(plan, 2);
    expect(list.find((l) => l.id === 'eggs')!.amounts).toBe('8');
    expect(list.find((l) => l.id === 'spinach')!.amounts).toBe('120 g');
  });
});

describe('persistence', () => {
  it('normalises old or partial data without losing user content', () => {
    const d = defaultData();
    const raw = JSON.parse(JSON.stringify(d));
    raw.profiles[0].favourites = ['smoothie-morango', 'removed-recipe'];
    delete raw.profiles[0].prefs.diet;
    raw.profiles[0].plans = [{ id: 'x', name: 'W', days: [{ lunch: 'arroz-carreteiro' }] }];
    const n = normalizeData(raw);
    expect(n.profiles[0].favourites).toEqual(['smoothie-morango']);
    expect(n.profiles[0].prefs.diet.vegetarian).toBe(false);
    expect(n.profiles[0].plans[0].days).toHaveLength(7);
    expect(n.profiles[0].plans[0].days[0].lunch).toBe('arroz-carreteiro');
    expect(n.profiles[0].activePlanId).toBe('x');
  });

  it('falls back to defaults for garbage input', () => {
    expect(normalizeData('nope').profiles).toHaveLength(1);
    expect(normalizeData({ profiles: [{}] }).profiles).toHaveLength(1);
  });

  it('round-trips data through IndexedDB', async () => {
    _resetDbForTests();
    const d = defaultData();
    d.profiles[0].favourites = ['quindim'];
    await idbSet('app-data', d);
    expect(await idbGet('app-data')).toEqual(d);
  });
});

describe('formatting', () => {
  it('formats quantities as friendly fractions', () => {
    expect(formatQty(0.5)).toBe('½');
    expect(formatQty(1.25)).toBe('1¼');
    expect(formatQty(2)).toBe('2');
    expect(formatAmount(1, 'tbsp')).toBe('1 tbsp');
    expect(formatAmount(3, 'leaf')).toBe('3 leaves');
    expect(formatAmount(150, 'g')).toBe('150 g');
  });
});

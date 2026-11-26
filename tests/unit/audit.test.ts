import { afterEach, describe, expect, it } from 'vitest';
import { FOODS, FOOD_BY_ID, type FoodStatus } from '../../src/data/foods';
import { PANTRY_BY_ID } from '../../src/data/pantry';
import { RECIPES, RECIPE_BY_ID } from '../../src/data/recipes';
import { UNVERIFIED_SERVINGS } from '../../src/data/recipeReviews';
import { DEFAULT_PREFERENCES, evaluateRecipe } from '../../src/lib/analysis';
import { recogniseIngredient, shopCategory } from '../../src/lib/grocery';
import { foodMatches } from '../../src/lib/search';
import { setLang } from '../../src/i18n/core';
import { FOOD_NAMES_PT } from '../../src/i18n/data/foods.pt-BR';
import { EXPANSION } from '../../src/data/expansion';
import { serveFit } from '../../src/lib/analysis';

const EXPANDED = new Set(EXPANSION.map((f) => f.id));

/**
 * Regression tests for the Nov 2026 dietary accuracy audit (Monash University
 * FODMAP publications + UpToDate graphic 90186).
 */

const status = (id: string) => FOOD_BY_ID.get(id)?.status;
const searchIds = (q: string) => FOODS.filter((f) => foodMatches(f, q)).map((f) => f.id);

afterEach(() => setLang('en'));

describe('audit corrections', () => {
  it('rates homemade white-flour bread like commercial white wheat bread; only true sourdough is a portion check', () => {
    expect(status('homemade-bread-white')).toBe('avoid');
    expect(status('homemade-bread-white')).toBe(status('wheat-bread-white'));
    expect(FOOD_BY_ID.get('homemade-bread-white')!.name).toMatch(/not long-fermented/);
    expect(status('sourdough')).toBe('limit');
  });

  it('separates moyashi (bean sprouts, EAT) from mature mung beans (AVOID)', () => {
    expect(FOOD_BY_ID.get('mung-beans-regular')!.aliases).not.toContain('moyashi');
    expect(status('mung-beans-regular')).toBe('avoid');
    expect(status('bean-sprouts')).toBe('eat');
    expect(searchIds('moyashi')).toEqual(['bean-sprouts']);
    expect(recogniseIngredient('moyashi')).toBe('bean-sprouts');
  });

  it('separates colorau (annatto blend, label check) from paprika', () => {
    expect(FOOD_BY_ID.get('paprika')!.aliases).not.toContain('colorau');
    expect(status('paprika')).toBe('eat');
    expect(status('colorau')).toBe('limit');
    expect(searchIds('colorau')).toEqual(['colorau']);
  });

  it('names kale specifically in Portuguese instead of generic couve (couve-manteiga)', () => {
    expect(FOOD_NAMES_PT.kale).not.toBe('Couve');
    expect(FOOD_NAMES_PT.kale).toMatch(/kale/i);
    expect(FOOD_BY_ID.get('kale')!.aliases).not.toContain('couve');
    expect(status('kale')).toBe('eat');
  });

  it('completes the four truncated descriptions in both languages', () => {
    const ids = ['silk-protein-choc-milk', 'franks-hot-sauce', 'grilled-chicken-rice', 'sushi-onion-garlic'];
    expect(FOODS.filter((f) => f.sourceTruncated)).toHaveLength(0);
    for (const id of ids) {
      const f = FOOD_BY_ID.get(id)!;
      expect(f.audit, id).toBe('corrected');
      for (const name of [f.name, FOOD_NAMES_PT[id]]) {
        expect((name.match(/\(/g) ?? []).length, name).toBe((name.match(/\)/g) ?? []).length);
        expect(name, name).not.toMatch(/\b(Use durante|Use during|the initial|a fase inicial)\b/);
      }
    }
    expect(['limit', 'limit', 'eat', 'avoid']).toEqual(ids.map(status));
  });

  it('classifies table sugar as EAT (a guide food, no longer an unclassified pantry item); sugar cane stays LIMIT', () => {
    expect(PANTRY_BY_ID.has('sugar')).toBe(false);
    expect(status('sugar')).toBe('eat');
    expect(FOOD_BY_ID.get('sugar')!.name).toMatch(/large amounts/);
    expect(status('sugar-cane-small')).toBe('limit');
    expect(recogniseIngredient('açúcar')).toBe('sugar');
    expect(shopCategory('sugar')).toBe('other');
  });

  it('adds the verified alternative search names', () => {
    const cases: [string, string][] = [
      ['cebola branca', 'onions-yellow'],
      ['nashi', 'pears'],
      ['rye crispbread', 'rye-bread'],
      ['quinoa pasta', 'gluten-free-pasta'],
      ['chiclete sem açúcar', 'candy-polyols'],
    ];
    for (const [q, id] of cases) expect(searchIds(q), q).toContain(id);
  });
});

describe('audit additions', () => {
  const expected: Record<string, FoodStatus> = {
    // High priority
    honey: 'avoid',
    hfcs: 'avoid',
    'prebiotic-fibres': 'avoid',
    'polyol-sweeteners': 'avoid',
    'green-peas': 'avoid',
    'spring-onion-white': 'avoid',
    'condensed-milk': 'avoid',
    'wheat-flour': 'avoid',
    'apple-pear-juice': 'avoid',
    'soy-milk': 'limit',
    'green-bell-pepper': 'eat',
    'bean-sprouts': 'eat',
    'hard-cheeses': 'eat',
    'almond-milk': 'eat',
    sugar: 'eat',
    // Remaining supported foods
    custard: 'avoid',
    'evaporated-milk': 'avoid',
    'wheat-cereals': 'avoid',
    'legume-flours': 'avoid',
    'figs-fresh': 'avoid',
    falafel: 'avoid',
    'vegetarian-mince': 'avoid',
    'jerusalem-artichoke': 'avoid',
    'bbq-sauce': 'limit',
    chutney: 'limit',
    'rice-milk': 'eat',
    feta: 'eat',
    'brie-camembert': 'eat',
    'bok-choy': 'eat',
    tempeh: 'eat',
    macadamias: 'eat',
    'quinoa-flakes': 'eat',
    'gf-corn-flakes': 'eat',
    'spelt-sourdough': 'eat',
    'rice-malt-syrup': 'eat',
    'cranberry-juice': 'eat',
    // FODMAP sources with no published threshold (UpToDate) and colorau
    fennel: 'limit',
    'sugar-snap-peas': 'limit',
    colorau: 'limit',
  };

  it('adds exactly the 39 audited foods with the expected classifications', () => {
    // The first audit's additions; the Nov 2026 expansion records are tested in expansion.test.ts.
    const added = FOODS.filter((f) => f.audit === 'added' && !EXPANDED.has(f.id));
    expect(added.map((f) => f.id).sort()).toEqual(Object.keys(expected).sort());
    for (const f of added) expect(f.status, f.id).toBe(expected[f.id]);
  });

  it('gives every added or corrected food an equivalent Brazilian Portuguese name', () => {
    for (const f of FOODS.filter((x) => x.audit)) {
      expect(FOOD_NAMES_PT[f.id], f.id).toBeTruthy();
      expect(FOOD_NAMES_PT[f.id].length, f.id).toBeGreaterThan(2);
    }
  });

  it('does not duplicate an existing food name in either language', () => {
    const lower = (s: string) => s.toLowerCase();
    expect(new Set(FOODS.map((f) => lower(f.name))).size).toBe(FOODS.length);
    expect(new Set(FOODS.map((f) => lower(FOOD_NAMES_PT[f.id]))).size).toBe(FOODS.length);
  });

  it('never rates a food UpToDate graphic 90186 lists as a FODMAP source as EAT', () => {
    const sources = [
      'wheat-bread-white', 'wheat-flour', 'barley-small', 'barley-large', 'rye-bread', 'onions-yellow', 'onions-red', 'leeks-white',
      'spring-onion-white', 'garlic', 'shallots', 'artichokes', 'beets', 'fennel', 'green-peas', 'prebiotic-fibres', 'pistachios',
      'cashews-regular', 'lentils-canned', 'chickpeas-canned', 'milk-regular', 'custard', 'ice-cream-regular', 'yogurt-regular',
      'apples-gala', 'pears', 'mango', 'cherries', 'watermelon', 'asparagus', 'sugar-snap-peas', 'honey', 'hfcs', 'apricots',
      'nectarines', 'peaches', 'plums-small', 'plums-large', 'mushrooms', 'cauliflower', 'candy-polyols', 'polyol-sweeteners',
    ];
    for (const id of sources) expect(['limit', 'avoid'], id).toContain(status(id));
  });

  it('keeps the existing portion-dependent LIMIT records', () => {
    for (const id of ['bell-peppers-red', 'celery-stalks', 'plums-small', 'barley-small', 'pistachios', 'greek-yogurt', 'zucchini', 'beets', 'apricots'])
      expect(status(id), id).toBe('limit');
  });
});

describe('recipe suitability after the audit', () => {
  const prefs = structuredClone(DEFAULT_PREFERENCES);

  it('shows the strawberry smoothie as a portion check until its serving is verified', () => {
    expect(UNVERIFIED_SERVINGS['smoothie-morango']).toBe('strawberries');
    const e = evaluateRecipe(RECIPE_BY_ID.get('smoothie-morango')!, prefs);
    expect(e.verdict).toBe('check');
    expect(e.checks.join(' ')).toMatch(/Strawberries: 140 g per serving — this amount has not been verified/);
  });

  it('does not let unclassified pantry ingredients qualify a recipe as EAT', () => {
    for (const id of ['sushi-caseiro-salmao', 'bolo-de-fuba', 'pudim-de-leite-sem-lactose', 'panquecas-aveia-banana', 'muffin-mirtilo-sem-gluten']) {
      const e = evaluateRecipe(RECIPE_BY_ID.get(id)!, prefs);
      expect(e.verdict, id).toBe('check');
      expect(e.checks.join(' '), id).toMatch(/not classified in the guide/);
    }
  });

  it('flags combined fruit servings as unverified', () => {
    for (const id of ['smoothie-verde-kiwi', 'salada-de-frutas-tropical', 'kiwi-laranja', 'picole-morango-banana']) {
      const e = evaluateRecipe(RECIPE_BY_ID.get(id)!, prefs);
      expect(e.verdict, id).toBe('check');
      expect(e.checks.join(' '), id).toMatch(/Several fruits in one serving/);
    }
  });

  it('ignores optional and user-excluded pantry items', () => {
    const r = RECIPE_BY_ID.get('cuscuz-nordestino-ovo')!;
    expect(evaluateRecipe(r, { ...prefs, excluded: ['flocao-milho'] }).verdict).toBe('excluded');
    // Flocão is now a LIMIT food record (no FODMAP data found), so cuscuz stays LIMIT.
    expect(evaluateRecipe(r, prefs).verdict).toBe('check');
    expect(evaluateRecipe(r, prefs).checks.join(' ')).toMatch(/Flocão de milho.*LIMIT/);
    // Mint is optional in the green smoothie, so it adds no pantry check.
    expect(evaluateRecipe(RECIPE_BY_ID.get('smoothie-verde-kiwi')!, prefs).checks.join(' ')).not.toMatch(/Mint/);
  });

  it('rates exactly 26 recipes EAT: every required ingredient is EAT or within its published reference serve', () => {
    const suitable = RECIPES.filter((r) => evaluateRecipe(r, prefs).verdict === 'suitable').map((r) => r.id);
    expect(suitable.sort()).toEqual(
      [
        'ovos-mexidos-espinafre-tomate', 'prato-feito-frango-grelhado', 'arroz-carreteiro', 'salada-quinoa-frango', 'tilapia-grelhada-vinagrete',
        'peixe-grelhado-batata-salada', 'bife-grelhado-arroz-salada', 'espetinho-de-carne', 'costelinha-assada-batatas', 'frango-assado-limao-alecrim',
        'salmao-quinoa-legumes',
        // Nov 2026: optional ingredients no longer set the verdict, reclassified herbs, and published serves.
        'omelete-tomate-folhas', 'parfait-chia-framboesa', 'aveia-dormida-kiwi', 'batata-rosti-ovo', 'salada-bife-batata-doce', 'chips-batata-doce',
        'arroz-ovo-couve', 'bowl-carne-moida-arroz', 'macarrao-arroz-camarao', 'bisteca-porco-legumes', 'hamburguer-caseiro-batata',
        'tofu-salteado-legumes', 'arroz-frito-ovo', 'pipoca-de-panela', 'pacoca-caseira',
      ].sort(),
    );
    for (const id of suitable) {
      const r = RECIPE_BY_ID.get(id)!;
      for (const i of r.ingredients.filter((x) => !x.optional)) {
        const s = status(i.id);
        if (s === 'eat') continue;
        expect(s, `${id}/${i.id}`).toBe('limit');
        expect(serveFit(FOOD_BY_ID.get(i.id), i, r.servings), `${id}/${i.id}`).toBe('within');
      }
    }
    // No recipe became excluded: nothing in the audit introduced an AVOID ingredient.
    expect(RECIPES.filter((r) => evaluateRecipe(r, prefs).verdict === 'excluded')).toHaveLength(0);
  });

  it('gives the same verdicts in Portuguese, with translated check messages', () => {
    const en = RECIPES.map((r) => evaluateRecipe(r, prefs).verdict);
    setLang('pt-BR');
    expect(RECIPES.map((r) => evaluateRecipe(r, prefs).verdict)).toEqual(en);
    const checks = evaluateRecipe(RECIPE_BY_ID.get('sushi-caseiro-salmao')!, prefs).checks.join(' ');
    expect(checks).toMatch(/não é classificado pelo guia/);
    expect(evaluateRecipe(RECIPE_BY_ID.get('smoothie-morango')!, prefs).checks.join(' ')).toMatch(/140 g por porção/);
  });
});

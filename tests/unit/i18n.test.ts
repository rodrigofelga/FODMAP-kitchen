import { afterEach, describe, expect, it } from 'vitest';
import { FOODS, CATEGORY_ORDER } from '../../src/data/foods';
import { PANTRY } from '../../src/data/pantry';
import { RECIPES, RECIPE_BY_ID } from '../../src/data/recipes';
import { MEALS } from '../../src/data/types';
import { DEFAULT_PREFERENCES, analyzeRecipe, dietLabels, evaluateRecipe, type Preferences } from '../../src/lib/analysis';
import { formatAmount, formatQty, resolveIngredient } from '../../src/lib/ingredients';
import { matchRecipes } from '../../src/lib/matcher';
import { buildGroceryList, newPlan } from '../../src/lib/planner';
import { foodMatches, searchRecipes } from '../../src/lib/search';
import { defaultData } from '../../src/lib/appData';
import { IMAGES } from '../../src/lib/images';
import { compareText, getLang, isLang, loadSavedLang, plural, setLang, DEFAULT_LANG } from '../../src/i18n/core';
import { en } from '../../src/i18n/en';
import { ptBR } from '../../src/i18n/pt-BR';
import { CATEGORY_LABELS_PT, FOOD_NAMES_PT, PANTRY_PT } from '../../src/i18n/data/foods.pt-BR';
import {
  RECIPE_TEXT_PT,
  categoryLabel,
  ingredientName,
  ingredientNote,
  messages,
  photoAlt,
  recipeDescription,
  recipeSteps,
  recipeSubstitutions,
  recipeTips,
  recipeTitle,
} from '../../src/i18n/content';

const prefs = (over: Partial<Preferences> = {}): Preferences => ({ ...structuredClone(DEFAULT_PREFERENCES), ...over });

afterEach(() => setLang('en'));

/** Every string leaf of a messages object, calling functions with sample arguments. */
function leaves(o: unknown, path = ''): [string, string][] {
  if (typeof o === 'string') return [[path, o]];
  if (typeof o === 'function') {
    const fn = o as (...a: unknown[]) => unknown;
    // Numbers first; functions that take a meal get a meal id.
    let out: unknown;
    try {
      out = fn(...Array.from({ length: fn.length }, (_, i) => (i === 0 ? 2 : 'X')));
    } catch {
      out = fn(...Array.from({ length: fn.length }, () => 'lunch'));
    }
    return typeof out === 'string' ? [[path, out]] : [];
  }
  if (Array.isArray(o)) return o.flatMap((v, i) => leaves(v, `${path}[${i}]`));
  if (o && typeof o === 'object') return Object.entries(o).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  return [];
}

function shape(o: unknown): unknown {
  if (typeof o === 'function') return `fn${(o as () => unknown).length}`;
  if (Array.isArray(o)) return o.map(shape);
  if (o && typeof o === 'object') return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, shape(v)]));
  return typeof o;
}

describe('language core', () => {
  it('defaults to English and rejects unknown languages', () => {
    expect(DEFAULT_LANG).toBe('en');
    expect(getLang()).toBe('en');
    expect(isLang('pt-BR')).toBe(true);
    expect(isLang('pt')).toBe(false);
    // No localStorage in this environment: falls back to English without throwing.
    expect(loadSavedLang()).toBe('en');
  });

  it('pluralizes and compares text per language', () => {
    expect(plural(1, 'receita', 'receitas')).toBe('receita');
    expect(plural(0, 'receita', 'receitas')).toBe('receitas');
    setLang('pt-BR');
    expect(['Óleo', 'Ovo', 'Abacate'].sort(compareText)).toEqual(['Abacate', 'Óleo', 'Ovo']);
  });
});

describe('interface strings', () => {
  it('pt-BR provides exactly the same keys, parameters and list lengths as English', () => {
    expect(shape(ptBR)).toEqual(shape(en));
  });

  it('every pt-BR string is non-empty and none is left in English', () => {
    const enLeaves = new Map(leaves(en));
    // Identical by design: the brand name, "min" and metric units (the same in both languages), and the internal diet keys.
    const sameAllowed = /^(shopping\.(whatsapp|email)|common\.appName|common\.minutes|units\.|settings\.diets\[\d\]\[0\])/;
    expect(ptBR.settings.diets.map((d) => d[0])).toEqual(en.settings.diets.map((d) => d[0]));
    let compared = 0;
    for (const [path, value] of leaves(ptBR)) {
      if (path.startsWith('units.unit')) continue;
      expect(value.trim().length, path).toBeGreaterThan(0);
      if (!sameAllowed.test(path) && /[a-z]{3}/i.test(value)) {
        expect(value, `${path} is identical to English`).not.toBe(enLeaves.get(path));
      }
      expect(value, path).not.toMatch(/\b(EAT|LIMIT|AVOID)\b/);
      compared++;
    }
    expect(compared).toBeGreaterThan(300);
  });

  it('uses the required Brazilian status labels', () => {
    expect(ptBR.status).toMatchObject({ eat: 'PODE COMER', limit: 'LIMITAR / VERIFICAR', avoid: 'EVITAR POR ENQUANTO' });
    expect(ptBR.langName).toBe('Português (Brasil)');
    expect(en.langName).toBe('English');
  });
});

describe('food and pantry translations', () => {
  it('names all 290 foods, every pantry item and every category', () => {
    expect(FOODS).toHaveLength(290);
    for (const f of FOODS) expect(FOOD_NAMES_PT[f.id], f.id).toBeTruthy();
    expect(Object.keys(FOOD_NAMES_PT).sort()).toEqual(FOODS.map((f) => f.id).sort());
    for (const p of PANTRY) expect(PANTRY_PT[p.id]?.name, p.id).toBeTruthy();
    for (const c of CATEGORY_ORDER) expect(CATEGORY_LABELS_PT[c]).toBeTruthy();
  });

  it('switching language changes names only — never classification, category or tags', () => {
    const before = FOODS.map((f) => resolveIngredient(f.id)!);
    setLang('pt-BR');
    for (const [i, f] of FOODS.entries()) {
      const r = resolveIngredient(f.id)!;
      expect(r.status).toBe(before[i].status);
      expect(r.tags).toEqual(before[i].tags);
      expect(r.kind).toBe(before[i].kind);
      expect(r.name).toBe(FOOD_NAMES_PT[f.id]);
      expect(r.group).toBe(categoryLabel(f.category));
    }
    expect(ingredientName('garlic')).toBe(FOOD_NAMES_PT.garlic);
    expect(ingredientName('garlic', 'en')).toBe(FOODS.find((f) => f.id === 'garlic')!.name);
  });
});

describe('recipe translations', () => {
  it('cover all 81 recipes and nothing else', () => {
    expect(RECIPES).toHaveLength(81);
    expect(Object.keys(RECIPE_TEXT_PT).sort()).toEqual(RECIPES.map((r) => r.id).sort());
  });

  it.each(RECIPES.map((r) => [r.id, r] as const))('%s has complete, equivalent pt-BR text', (_id, r) => {
    const t = RECIPE_TEXT_PT[r.id];
    expect(t.title.trim()).not.toBe('');
    expect(t.description.trim()).not.toBe('');
    expect(t.alt.trim()).not.toBe('');
    expect(t.steps).toHaveLength(r.steps.length);
    expect(t.substitutions).toHaveLength(r.substitutions.length);
    expect(t.tips?.length ?? 0).toBe(r.tips?.length ?? 0);
    // Brazilian dishes keep their traditional Portuguese name.
    if (r.titlePt) expect(t.title).toBe(r.titlePt);
    const noted = r.ingredients.filter((i) => i.note).map((i) => i.id).sort();
    expect(Object.keys(t.notes ?? {}).sort()).toEqual([...new Set(noted)]);
    const all = [t.title, t.description, t.alt, ...t.steps, ...t.substitutions, ...(t.tips ?? []), ...Object.values(t.notes ?? {})];
    for (const s of all) {
      expect(s.trim()).not.toBe('');
      expect(s).not.toMatch(/\b(EAT|LIMIT|AVOID|tbsp|tsp|minutes)\b/);
    }
    // Any temperature in the English steps appears in the Portuguese steps too.
    const temps = (xs: string[]) => xs.join(' ').match(/\d+ °C/g) ?? [];
    expect(temps(t.steps)).toEqual(temps(r.steps));
  });

  it('keeps the representative caveat in translated photo alt text', () => {
    // English alts that explain how the photo differs keep that explanation.
    const r = RECIPE_BY_ID.get('hamburguer-caseiro-batata')!;
    expect(photoAlt(r, 'x', 'pt-BR')).toMatch(/esta receita usa/);
    expect(photoAlt(RECIPE_BY_ID.get('espetinho-de-frango')!, 'x', 'pt-BR')).toMatch(/gerada por IA/);
    for (const id of Object.keys(IMAGES)) expect(RECIPE_TEXT_PT[id]?.alt, id).toBeTruthy();
  });

  it('content accessors fall back to the shared English record in English', () => {
    const r = RECIPE_BY_ID.get('galinhada-acafrao')!;
    expect(recipeTitle(r)).toBe(r.title);
    expect(recipeDescription(r)).toBe(r.description);
    expect(recipeSteps(r)).toBe(r.steps);
    expect(recipeSubstitutions(r)).toBe(r.substitutions);
    expect(recipeTips(r)).toBe(r.tips);
    expect(ingredientNote(r, r.ingredients.find((i) => i.note)!)).toBe(r.ingredients.find((i) => i.note)!.note);
    setLang('pt-BR');
    expect(recipeTitle(r)).toBe('Galinhada');
    expect(recipeSteps(r)).toBe(RECIPE_TEXT_PT[r.id].steps);
  });
});

describe('logic is identical in both languages', () => {
  const settings: Preferences[] = [
    prefs(),
    prefs({ phase: 'reintroduction' }),
    prefs({ limitHandling: 'exclude' }),
    prefs({ tolerated: ['lentils-canned', 'zucchini'], excluded: ['mozzarella'] }),
    prefs({ diet: { ...DEFAULT_PREFERENCES.diet, vegetarian: true, dairyFree: true } }),
  ];

  it('verdicts, counts and analysis levels never change with the language', () => {
    const snapshot = () =>
      settings.map((p) =>
        RECIPES.map((r) => {
          const e = evaluateRecipe(r, p);
          const a = analyzeRecipe(r);
          return [r.id, e.verdict, e.reasons.length, e.checks.length, e.qualifies.length, e.omit.length, a.level, a.avoid.length, a.limit.length, dietLabels(r).length];
        }),
      );
    const english = snapshot();
    setLang('pt-BR');
    expect(snapshot()).toEqual(english);
  });

  it('Portuguese evaluation text uses Portuguese names and labels', () => {
    setLang('pt-BR');
    const r = RECIPE_BY_ID.get('arroz-com-lentilha')!;
    const e = evaluateRecipe(r, prefs());
    expect(e.verdict).toBe('check');
    expect(e.checks.join(' ')).toMatch(/LIMITAR \/ VERIFICAR: 40 g por porção/);
    const tolerated = evaluateRecipe(r, prefs({ tolerated: ['lentils-canned'] }));
    expect(tolerated.checks.find((c) => c.includes('tolerado'))).toMatch(/40 g por porção/);
    // A tolerated-food reminder alone does not require a portion check in either language.
    setLang('en');
    expect(evaluateRecipe(r, prefs({ tolerated: ['lentils-canned'] })).verdict).toBe(tolerated.verdict);
  });

  it('the matcher returns the same recipes in both languages', () => {
    const sel = new Set(['eggs', 'butter', 'spinach', 'tomatoes']);
    const ids = () => {
      const m = matchRecipes(RECIPES, sel, prefs());
      return [m.recommended.map((x) => x.recipe.id).sort(), m.excluded.map((x) => x.recipe.id).sort()];
    };
    const english = ids();
    setLang('pt-BR');
    expect(ids()).toEqual(english);
  });

  it('grocery lists keep the same items and amounts, with Portuguese names', () => {
    const plan = newPlan('t');
    plan.days[0] = { breakfast: 'ovos-mexidos-espinafre-tomate', lunch: 'galinhada-acafrao', dinner: 'canja-de-galinha', snack: 'quindim' };
    const english = buildGroceryList(plan, 2);
    setLang('pt-BR');
    const pt = buildGroceryList(plan, 2);
    expect(pt.map((l) => l.key).sort()).toEqual(english.map((l) => l.key).sort());
    const enByKey = new Map(english.map((l) => [l.key, l]));
    for (const l of pt) {
      expect(l.status).toBe(enByKey.get(l.key)!.status);
      expect(l.name.replace(' (opcional)', '')).toBe(ingredientName(l.id));
      expect(l.recipes.every((t) => Object.values(RECIPE_TEXT_PT).some((x) => x.title === t))).toBe(true);
    }
  });

  it('defaults for new data follow the current language without touching existing data', () => {
    expect(defaultData().profiles[0].name).toBe('Me');
    setLang('pt-BR');
    expect(defaultData().profiles[0].name).toBe('Eu');
  });
});

describe('formatting', () => {
  it('English amounts are unchanged', () => {
    expect(formatAmount(1, 'tbsp')).toBe('1 tbsp');
    expect(formatAmount(3, 'leaf')).toBe('3 leaves');
    expect(formatAmount(150, 'g')).toBe('150 g');
    expect(formatAmount(1, 'to taste')).toBe('to taste');
    expect(formatQty(0.4)).toBe('0.4');
  });

  it('Portuguese amounts use Brazilian units and a decimal comma', () => {
    setLang('pt-BR');
    expect(formatAmount(1, 'tbsp')).toBe('1 colher (sopa)');
    expect(formatAmount(2, 'tsp')).toBe('2 colheres (chá)');
    expect(formatAmount(0.5, 'tsp')).toBe('½ colher (chá)');
    expect(formatAmount(3, 'leaf')).toBe('3 folhas');
    expect(formatAmount(1, 'to taste')).toBe('a gosto');
    expect(formatQty(0.4)).toBe('0,4');
    expect(formatAmount(12.5, 'g')).toBe('13 g');
  });

  it('meal and day names exist for every meal and day', () => {
    for (const l of ['en', 'pt-BR'] as const) {
      for (const m of MEALS) expect(messages(l).meals[m]).toBeTruthy();
      expect(messages(l).days).toHaveLength(7);
    }
    expect(messages('pt-BR').days[0]).toBe('Segunda-feira');
  });
});

describe('search in the displayed language', () => {
  it('finds recipes by Portuguese words, with or without accents', () => {
    setLang('pt-BR');
    for (const q of ['salmão', 'salmao', 'feijão', 'mandioca', 'abobrinha', 'berinjela', 'mussarela', 'galinhada']) {
      // feijão is only an ingredient in the guide; recipes may not use it.
      if (q === 'feijão') continue;
      expect(searchRecipes(RECIPES, q).length, q).toBeGreaterThan(0);
    }
    expect(searchRecipes(RECIPES, 'salmão').map((r) => r.id)).toEqual(searchRecipes(RECIPES, 'salmao').map((r) => r.id));
    // English words still work in Portuguese mode.
    expect(searchRecipes(RECIPES, 'salmon').length).toBeGreaterThan(0);
  });

  it('finds foods by Portuguese name with or without accents', () => {
    setLang('pt-BR');
    const hits = (q: string) => FOODS.filter((f) => foodMatches(f, q)).map((f) => f.id);
    expect(hits('feijão').length).toBeGreaterThan(0);
    expect(hits('feijao')).toEqual(hits('feijão'));
    expect(hits('berinjela')).toContain('eggplant');
  });

  it('English search results are unaffected', () => {
    const q = ['frango', 'tapioca', 'salmon', 'rice'];
    for (const x of q) expect(searchRecipes(RECIPES, x).length, x).toBeGreaterThan(0);
  });
});

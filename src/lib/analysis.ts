import type { Recipe, RecipeIngredient } from '../data/types';
import { getLang } from '../i18n/core';
import { messages } from '../i18n/content';
import { mustResolve, perServing, type ResolvedIngredient } from './ingredients';

export interface DietPrefs {
  vegetarian: boolean;
  pescatarian: boolean;
  noPork: boolean;
  dairyFree: boolean;
  eggFree: boolean;
  nutFree: boolean;
  noSpicy: boolean;
}

export interface Preferences {
  /** During elimination, AVOID foods are always excluded. */
  phase: 'elimination' | 'reintroduction';
  /** 'warn' shows LIMIT foods with portion checks; 'exclude' hides recipes that need them. */
  limitHandling: 'warn' | 'exclude';
  /** LIMIT foods the user has personally reintroduced and tolerates. */
  tolerated: string[];
  /** Any food or pantry ids the user never wants. */
  excluded: string[];
  diet: DietPrefs;
  householdSize: number;
}

export const DEFAULT_PREFERENCES: Preferences = {
  phase: 'elimination',
  limitHandling: 'warn',
  tolerated: [],
  excluded: [],
  diet: { vegetarian: false, pescatarian: false, noPork: false, dairyFree: false, eggFree: false, nutFree: false, noSpicy: false },
  householdSize: 2,
};

export interface AnalyzedIngredient {
  ing: RecipeIngredient;
  food: ResolvedIngredient;
  perServing: string;
}

export interface RecipeAnalysis {
  items: AnalyzedIngredient[];
  avoid: AnalyzedIngredient[];
  limit: AnalyzedIngredient[];
  unlisted: AnalyzedIngredient[];
  diets: { vegetarian: boolean; pescatarian: boolean; porkFree: boolean; dairyFree: boolean; eggFree: boolean; nutFree: boolean; spicy: boolean };
  /** Worst guide status among required ingredients. */
  level: 'eat' | 'limit' | 'avoid';
}

/** Keyed by language + recipe id: ingredient names and amounts are display text. */
const cache = new Map<string, RecipeAnalysis>();

export function analyzeRecipe(r: Recipe): RecipeAnalysis {
  const key = `${getLang()}|${r.id}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const items = r.ingredients.map((ing) => ({ ing, food: mustResolve(ing.id), perServing: perServing(ing, r.servings) }));
  const required = items.filter((i) => !i.ing.optional);
  const has = (t: string) => required.some((i) => i.food.tags.includes(t as never));
  const avoid = items.filter((i) => i.food.status === 'avoid');
  const limit = items.filter((i) => i.food.status === 'limit');
  const unlisted = items.filter((i) => i.food.status === 'unlisted');
  const meat = has('meat') || has('poultry') || has('pork');
  const a: RecipeAnalysis = {
    items,
    avoid,
    limit,
    unlisted,
    diets: {
      vegetarian: !meat && !has('fish') && !has('seafood'),
      pescatarian: !meat,
      porkFree: !has('pork'),
      dairyFree: !has('dairy'),
      eggFree: !has('egg'),
      nutFree: !has('nuts') && !has('peanut'),
      spicy: has('spicy'),
    },
    level: required.some((i) => i.food.status === 'avoid') ? 'avoid' : required.some((i) => i.food.status === 'limit') ? 'limit' : 'eat',
  };
  cache.set(key, a);
  return a;
}

export type Verdict = 'suitable' | 'check' | 'excluded';

export interface Evaluation {
  verdict: Verdict;
  /** Why the recipe is excluded (non-empty only when excluded). */
  reasons: string[];
  /** Portion / label checks the user must respect. */
  checks: string[];
  /** Positive explanation of why it qualifies. */
  qualifies: string[];
  /** Optional ingredients to leave out for this user. */
  omit: string[];
}

export function evaluateRecipe(r: Recipe, prefs: Preferences): Evaluation {
  const a = analyzeRecipe(r);
  const reasons: string[] = [];
  const checks: string[] = [];
  const qualifies: string[] = [];
  const omit: string[] = [];
  const excluded = new Set(prefs.excluded);
  const tolerated = new Set(prefs.tolerated);
  const t = messages().analysis;
  // True when a check still needs the user's attention (anything other than a tolerated-food reminder).
  let pendingChecks = false;

  for (const it of a.items) {
    const { ing, food } = it;
    if (excluded.has(ing.id)) {
      if (ing.optional) omit.push(t.excludedOptional(food.name));
      else reasons.push(t.excludedRequired(food.name));
      continue;
    }
    if (food.status === 'avoid') {
      if (prefs.phase === 'elimination') {
        if (ing.optional) omit.push(t.avoidOptional(food.name));
        else reasons.push(t.avoidRequired(food.name));
      } else {
        checks.push(t.avoidReintro(food.name));
        pendingChecks = true;
      }
      continue;
    }
    if (food.status === 'limit') {
      if (tolerated.has(ing.id)) {
        checks.push(t.tolerated(food.name, it.perServing));
      } else if (prefs.limitHandling === 'exclude') {
        if (ing.optional) omit.push(t.limitOptionalHidden(food.name));
        else reasons.push(t.limitHidden(food.name));
      } else {
        checks.push(t.limitCheck(food.name, it.perServing, !!ing.optional));
        pendingChecks = true;
      }
    }
  }

  const d = prefs.diet;
  if (d.vegetarian && !a.diets.vegetarian) reasons.push(t.dietVegetarian);
  else if (d.pescatarian && !a.diets.pescatarian) reasons.push(t.dietPescatarian);
  if (d.noPork && !a.diets.porkFree) reasons.push(t.dietNoPork);
  if (d.dairyFree && !a.diets.dairyFree) reasons.push(t.dietDairy);
  if (d.eggFree && !a.diets.eggFree) reasons.push(t.dietEgg);
  if (d.nutFree && !a.diets.nutFree) reasons.push(t.dietNut);
  if (d.noSpicy && a.diets.spicy) reasons.push(t.dietSpicy);

  if (reasons.length) return { verdict: 'excluded', reasons, checks, qualifies, omit };

  const guideItems = a.items.filter((i) => i.food.kind === 'food' && !i.ing.optional);
  const eatCount = guideItems.filter((i) => i.food.status === 'eat').length;
  qualifies.push(t.noAvoid(prefs.phase === 'elimination'));
  if (eatCount === guideItems.length) qualifies.push(t.allEat(guideItems.length));
  else qualifies.push(t.someEat(eatCount, guideItems.length));
  if (a.unlisted.length) qualifies.push(t.unlisted(a.unlisted.length));

  return { verdict: pendingChecks ? 'check' : 'suitable', reasons, checks, qualifies, omit };
}

export function dietLabels(r: Recipe): string[] {
  const d = analyzeRecipe(r).diets;
  const l = messages().diet;
  const out: string[] = [];
  if (d.vegetarian) out.push(l.vegetarian);
  else if (d.pescatarian) out.push(l.pescatarian);
  if (d.dairyFree) out.push(l.dairyFree);
  if (d.eggFree) out.push(l.eggFree);
  if (d.nutFree) out.push(l.nutFree);
  return out;
}

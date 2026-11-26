import { FOOD_BY_ID, type Food } from '../data/foods';
import { SOURCE_BY_ID } from '../data/sources';
import { UNVERIFIED_SERVINGS } from '../data/recipeReviews';
import type { Recipe, RecipeIngredient, Unit } from '../data/types';
import { getLang } from '../i18n/core';
import { messages } from '../i18n/content';
import { formatAmount, mustResolve, perServing, type ResolvedIngredient } from './ingredients';

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
  /** Optional ingredients the user excluded in Settings — leave them out. */
  omit: string[];
  /**
   * Optional ingredients that would change the classification if included.
   * The verdict itself reflects required ingredients only.
   */
  conditional: string[];
}

export type ServeFit = 'within' | 'above' | 'unknown';

/**
 * Compares one serving of an ingredient with the food's published low-FODMAP
 * reference serve. Only the same unit (or the household unit the source
 * printed) is compared — no unit conversions are invented.
 */
export function serveFit(food: Food | undefined, ing: RecipeIngredient, servings: number): ServeFit {
  const s = food?.serve;
  if (!s) return 'unknown';
  const q = ing.qty / servings;
  if (ing.unit === s.unit) return q <= s.amount + 1e-9 ? 'within' : 'above';
  if (s.alt && ing.unit === s.alt.unit) return q <= s.alt.qty + 1e-9 ? 'within' : 'above';
  return 'unknown';
}

/** "52 g — Monash University, 14 Jan 2021" */
export function serveText(food: Food): string {
  const s = food.serve!;
  const src = SOURCE_BY_ID.get(s.src);
  const pieces = messages().analysis.pieces;
  const fmt = (q: number, u: Unit) => (u === 'unit' ? `${formatAmount(q, u)} ${pieces(q)}` : formatAmount(q, u));
  const amount = fmt(s.amount, s.unit);
  const alt = s.alt ? ` (${fmt(s.alt.qty, s.alt.unit)})` : '';
  return `${amount}${alt} — ${src ? `${src.org}, ${src.date}` : s.src}`;
}

export function evaluateRecipe(r: Recipe, prefs: Preferences): Evaluation {
  const a = analyzeRecipe(r);
  const reasons: string[] = [];
  const checks: string[] = [];
  const qualifies: string[] = [];
  const omit: string[] = [];
  const conditional: string[] = [];
  const excluded = new Set(prefs.excluded);
  const tolerated = new Set(prefs.tolerated);
  const t = messages().analysis;
  const status = messages().status;
  // True when a check still needs the user's attention (anything other than a tolerated-food reminder).
  let pendingChecks = false;

  for (const it of a.items) {
    const { ing, food } = it;
    const record = FOOD_BY_ID.get(ing.id);
    if (excluded.has(ing.id)) {
      if (ing.optional) omit.push(t.excludedOptional(food.name));
      else reasons.push(t.excludedRequired(food.name));
      continue;
    }
    const fit = serveFit(record, ing, r.servings);
    // Optional ingredients never change the verdict; a concern becomes a conditional warning.
    if (ing.optional) {
      if (food.status === 'avoid') conditional.push(t.optionalAvoid(food.name, status.avoid));
      else if (food.status === 'limit' && !tolerated.has(ing.id) && fit !== 'within') conditional.push(t.optionalLimit(food.name, it.perServing, status.limit));
      else if (food.status === 'unlisted') conditional.push(t.optionalUnlisted(food.name));
      continue;
    }
    if (food.status === 'avoid') {
      if (prefs.phase === 'elimination') reasons.push(t.avoidRequired(food.name));
      else {
        checks.push(t.avoidReintro(food.name));
        pendingChecks = true;
      }
      continue;
    }
    if (food.status === 'limit') {
      if (tolerated.has(ing.id)) {
        checks.push(t.tolerated(food.name, it.perServing));
      } else if (fit === 'within') {
        qualifies.push(t.withinServe(food.name, it.perServing, serveText(record!)));
      } else if (prefs.limitHandling === 'exclude') {
        reasons.push(t.limitHidden(food.name));
      } else {
        checks.push(fit === 'above' ? t.aboveServe(food.name, it.perServing, serveText(record!)) : t.limitCheck(food.name, it.perServing, false));
        pendingChecks = true;
      }
    }
  }

  // Evidence gaps never count as EAT: they become checks.
  // 1. Required pantry items have no classification.
  for (const it of a.unlisted) {
    if (it.ing.optional || excluded.has(it.ing.id)) continue;
    checks.push(t.unlistedCheck(it.food.name));
    pendingChecks = true;
  }
  // 2. Two or more different fruits in one serving. Each fruit is compared with its
  // own published serve, but published data do not establish the cumulative
  // exposure of several fruits eaten together, so the recipe stays LIMIT.
  const fruits = a.items.filter((i) => !i.ing.optional && !excluded.has(i.ing.id) && i.food.status !== 'avoid' && FOOD_BY_ID.get(i.ing.id)?.category === 'fruit');
  if (fruits.length >= 2) {
    checks.push(t.combinedFruit(fruits.map((i) => i.food.name).join(', ')));
    for (const i of fruits) {
      const rec = FOOD_BY_ID.get(i.ing.id)!;
      const fit = serveFit(rec, i.ing, r.servings);
      checks.push(fit === 'unknown' ? t.fruitNoServe(i.food.name, i.perServing) : t.fruitServe(i.food.name, i.perServing, serveText(rec), fit === 'within'));
    }
    pendingChecks = true;
  }
  // 3. A serving the audit could not compare with a published low-FODMAP serve.
  const unverified = a.items.find((i) => i.ing.id === UNVERIFIED_SERVINGS[r.id]);
  if (unverified && !excluded.has(unverified.ing.id)) {
    checks.push(t.servingUnverified(unverified.food.name, unverified.perServing));
    pendingChecks = true;
  }

  const d = prefs.diet;
  if (d.vegetarian && !a.diets.vegetarian) reasons.push(t.dietVegetarian);
  else if (d.pescatarian && !a.diets.pescatarian) reasons.push(t.dietPescatarian);
  if (d.noPork && !a.diets.porkFree) reasons.push(t.dietNoPork);
  if (d.dairyFree && !a.diets.dairyFree) reasons.push(t.dietDairy);
  if (d.eggFree && !a.diets.eggFree) reasons.push(t.dietEgg);
  if (d.nutFree && !a.diets.nutFree) reasons.push(t.dietNut);
  if (d.noSpicy && a.diets.spicy) reasons.push(t.dietSpicy);

  if (reasons.length) return { verdict: 'excluded', reasons, checks, qualifies, omit, conditional };

  const guideItems = a.items.filter((i) => i.food.kind === 'food' && !i.ing.optional);
  const eatCount = guideItems.filter((i) => i.food.status === 'eat').length;
  qualifies.unshift(t.noAvoid(prefs.phase === 'elimination'));
  if (eatCount === guideItems.length) qualifies.splice(1, 0, t.allEat(guideItems.length));
  else qualifies.splice(1, 0, t.someEat(eatCount, guideItems.length));
  // Reflect uncertainty: EAT records that rest only on the original guide.
  const guideOnly = guideItems.filter((i) => i.food.status === 'eat' && FOOD_BY_ID.get(i.ing.id)?.verification === 'guide');
  if (guideOnly.length) qualifies.push(t.guideOnly(guideOnly.map((i) => i.food.name).join(', ')));

  return { verdict: pendingChecks ? 'check' : 'suitable', reasons, checks, qualifies, omit, conditional };
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

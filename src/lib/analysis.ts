import type { Recipe, RecipeIngredient } from '../data/types';
import { STATUS_LABELS } from '../data/foods';
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

const cache = new Map<string, RecipeAnalysis>();

export function analyzeRecipe(r: Recipe): RecipeAnalysis {
  const hit = cache.get(r.id);
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
  cache.set(r.id, a);
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

  for (const it of a.items) {
    const { ing, food } = it;
    if (excluded.has(ing.id)) {
      if (ing.optional) omit.push(`${food.name} (you excluded it)`);
      else reasons.push(`Contains ${food.name}, which you excluded in Settings.`);
      continue;
    }
    if (food.status === 'avoid') {
      if (prefs.phase === 'elimination') {
        if (ing.optional) omit.push(`${food.name} (AVOID FOR NOW)`);
        else reasons.push(`Contains ${food.name} — AVOID FOR NOW during elimination.`);
      } else {
        checks.push(`${food.name} is AVOID FOR NOW in the guide — reintroduce only as part of a planned challenge.`);
      }
      continue;
    }
    if (food.status === 'limit') {
      if (tolerated.has(ing.id)) {
        checks.push(`${food.name}: you marked it as tolerated — still keep to ${it.perServing} per serving.`);
      } else if (prefs.limitHandling === 'exclude') {
        if (ing.optional) omit.push(`${food.name} (LIMIT / CHECK)`);
        else reasons.push(`Uses ${food.name} (LIMIT / CHECK) — hidden because Settings exclude LIMIT foods.`);
      } else {
        checks.push(`${food.name} — ${STATUS_LABELS.limit}: ${it.perServing} per serving${ing.optional ? ' (optional)' : ''}.`);
      }
    }
  }

  const d = prefs.diet;
  if (d.vegetarian && !a.diets.vegetarian) reasons.push('Contains meat or fish (vegetarian preference).');
  else if (d.pescatarian && !a.diets.pescatarian) reasons.push('Contains meat (pescatarian preference).');
  if (d.noPork && !a.diets.porkFree) reasons.push('Contains pork (no-pork preference).');
  if (d.dairyFree && !a.diets.dairyFree) reasons.push('Contains dairy (dairy-free preference).');
  if (d.eggFree && !a.diets.eggFree) reasons.push('Contains egg (egg-free preference).');
  if (d.nutFree && !a.diets.nutFree) reasons.push('Contains nuts or peanuts (nut-free preference).');
  if (d.noSpicy && a.diets.spicy) reasons.push('Contains chili / hot pepper (no-spicy preference).');

  if (reasons.length) return { verdict: 'excluded', reasons, checks, qualifies, omit };

  const guideItems = a.items.filter((i) => i.food.kind === 'food' && !i.ing.optional);
  const eatCount = guideItems.filter((i) => i.food.status === 'eat').length;
  qualifies.push(`No AVOID FOR NOW foods${prefs.phase === 'elimination' ? ' (elimination phase)' : ''}.`);
  if (eatCount === guideItems.length) qualifies.push(`All ${guideItems.length} guide ingredients are EAT.`);
  else qualifies.push(`${eatCount} of ${guideItems.length} guide ingredients are EAT; the rest are LIMIT / CHECK at the per-serving amounts shown.`);
  if (a.unlisted.length) qualifies.push(`${a.unlisted.length} pantry item(s) are not classified in the guide.`);

  const pendingChecks = checks.some((c) => !c.includes('marked it as tolerated'));
  return { verdict: pendingChecks ? 'check' : 'suitable', reasons, checks, qualifies, omit };
}

export function dietLabels(r: Recipe): string[] {
  const d = analyzeRecipe(r).diets;
  const out: string[] = [];
  if (d.vegetarian) out.push('Vegetarian');
  else if (d.pescatarian) out.push('Pescatarian');
  if (d.dairyFree) out.push('Dairy-free');
  if (d.eggFree) out.push('Egg-free');
  if (d.nutFree) out.push('Nut-free');
  return out;
}

import type { Recipe } from '../data/types';
import { evaluateRecipe, type Evaluation, type Preferences } from './analysis';
import { mustResolve } from './ingredients';

/** Basics most kitchens have; can be assumed by the matcher. */
export const PANTRY_BASICS = ['salt', 'black-pepper', 'still-water', 'olive-oil', 'evoo', 'canola-oil'];

/** Interchangeable ids for matching purposes only (same food, duplicate PDF lines). */
const EQUIVALENT: Record<string, string[]> = {
  'potatoes-white': ['potatoes', 'air-fried-fries'],
  potatoes: ['potatoes-white'],
  'air-fried-fries': ['potatoes-white', 'potatoes', 'french-fries-air-fried'],
  'olive-oil': ['evoo', 'canola-oil'],
  evoo: ['olive-oil'],
  'canola-oil': ['olive-oil', 'evoo'],
  vinegar: ['vinegar-plain'],
  'vinegar-plain': ['vinegar'],
  'corn-tortilla-wraps': ['tortilla-wraps-corn'],
  'tortilla-wraps-corn': ['corn-tortilla-wraps'],
  'plain-rice-cakes': ['plain-crackers-rice-corn', 'crackers-plain'],
  'mayonnaise-plain': ['hellmanns-mayo'],
};

export interface MatchResult {
  recipe: Recipe;
  evaluation: Evaluation;
  have: string[];
  missing: string[];
  /** 0..1 share of required ingredients available. */
  coverage: number;
}

export function hasIngredient(id: string, selected: Set<string>): boolean {
  if (selected.has(id)) return true;
  return (EQUIVALENT[id] ?? []).some((e) => selected.has(e));
}

export function matchRecipe(recipe: Recipe, selected: Set<string>, prefs: Preferences, assumeBasics: boolean): MatchResult {
  const evaluation = evaluateRecipe(recipe, prefs);
  const required = recipe.ingredients.filter((i) => !i.optional && !(assumeBasics && PANTRY_BASICS.includes(i.id)));
  const have: string[] = [];
  const missing: string[] = [];
  for (const i of required) (hasIngredient(i.id, selected) ? have : missing).push(mustResolve(i.id).name);
  return { recipe, evaluation, have, missing, coverage: required.length ? have.length / required.length : 1 };
}

/**
 * Ranks recipes for the selected ingredients. Recipes excluded by the user's
 * settings (AVOID foods during elimination, excluded ingredients, diet) are
 * returned separately and never mixed into recommendations.
 */
export function matchRecipes(recipes: Recipe[], selected: Set<string>, prefs: Preferences, assumeBasics = true) {
  const all = recipes.map((r) => matchRecipe(r, selected, prefs, assumeBasics)).filter((m) => m.have.length > 0);
  const byScore = (a: MatchResult, b: MatchResult) =>
    a.missing.length - b.missing.length || b.coverage - a.coverage || a.recipe.title.localeCompare(b.recipe.title);
  const recommended = all.filter((m) => m.evaluation.verdict !== 'excluded').sort(byScore);
  const excluded = all.filter((m) => m.evaluation.verdict === 'excluded' && m.coverage >= 0.5).sort(byScore);
  return { recommended, excluded };
}

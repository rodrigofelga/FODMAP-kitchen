/**
 * Language-aware accessors for app content. Shared records (foods, pantry,
 * recipes) are never copied or modified: translations are looked up by id and
 * fall back to the English record when the language is English.
 */
import { CATEGORY_LABELS, FOOD_BY_ID, type FoodCategory, type FoodStatus } from '../data/foods';
import { PANTRY_BY_ID } from '../data/pantry';
import type { Meal, Recipe, RecipeIngredient } from '../data/types';
import { getLang, type Lang } from './core';
import { en, type Messages } from './en';
import { ptBR } from './pt-BR';
import { CATEGORY_LABELS_PT, FOOD_NAMES_PT, PANTRY_PT } from './data/foods.pt-BR';
import { BREAKFAST_PT } from './data/breakfast.pt-BR';
import { LUNCH_PT } from './data/lunch.pt-BR';
import { DINNER_PT } from './data/dinner.pt-BR';
import { SNACK_PT } from './data/snack.pt-BR';
import type { RecipeText } from './data/types';

export const RECIPE_TEXT_PT: Record<string, RecipeText> = { ...BREAKFAST_PT, ...LUNCH_PT, ...DINNER_PT, ...SNACK_PT };

const MESSAGES: Record<Lang, Messages> = { en, 'pt-BR': ptBR };

/** Interface strings for the current (or given) language. */
export function messages(l: Lang = getLang()): Messages {
  return MESSAGES[l];
}

const isPt = (l: Lang) => l === 'pt-BR';

/** Name of a food-guide or pantry item. */
export function ingredientName(id: string, l: Lang = getLang()): string {
  const food = FOOD_BY_ID.get(id);
  const pantry = food ? undefined : PANTRY_BY_ID.get(id);
  const english = food?.name ?? pantry?.name ?? id;
  if (!isPt(l)) return english;
  return (food ? FOOD_NAMES_PT[id] : PANTRY_PT[id]?.name) ?? english;
}

export function categoryLabel(c: FoodCategory, l: Lang = getLang()): string {
  return isPt(l) ? CATEGORY_LABELS_PT[c] : CATEGORY_LABELS[c];
}

export function statusLabel(s: FoodStatus | 'unlisted', l: Lang = getLang()): string {
  return messages(l).status[s === 'unlisted' ? 'unlisted' : s];
}

export function mealLabel(m: Meal, l: Lang = getLang()): string {
  return messages(l).meals[m];
}

export function dayName(i: number, l: Lang = getLang()): string {
  return messages(l).days[i] ?? '';
}

function ptText(r: Recipe, l: Lang): RecipeText | undefined {
  return isPt(l) ? RECIPE_TEXT_PT[r.id] : undefined;
}

/** Display title. */
export function recipeTitle(r: Recipe, l: Lang = getLang()): string {
  return ptText(r, l)?.title ?? r.title;
}

export function recipeDescription(r: Recipe, l: Lang = getLang()): string {
  return ptText(r, l)?.description ?? r.description;
}

export function recipeSteps(r: Recipe, l: Lang = getLang()): string[] {
  return ptText(r, l)?.steps ?? r.steps;
}

export function recipeSubstitutions(r: Recipe, l: Lang = getLang()): string[] {
  return ptText(r, l)?.substitutions ?? r.substitutions;
}

export function recipeTips(r: Recipe, l: Lang = getLang()): string[] | undefined {
  const t = ptText(r, l);
  return t ? (t.tips ?? r.tips) : r.tips;
}

export function ingredientNote(r: Recipe, ing: RecipeIngredient, l: Lang = getLang()): string | undefined {
  if (!ing.note) return undefined;
  return ptText(r, l)?.notes?.[ing.id] ?? ing.note;
}

/** Photo alt text; `english` is the alt stored with the image metadata. */
export function photoAlt(r: Recipe, english: string, l: Lang = getLang()): string {
  return ptText(r, l)?.alt ?? english;
}

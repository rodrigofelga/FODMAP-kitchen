import type { Recipe } from '../data/types';
import type { Food } from '../data/foods';
import { getLang } from '../i18n/core';
import { ingredientName, recipeDescription, recipeTitle } from '../i18n/content';

/** Lowercase and strip accents so "pao" matches "Pão". */
export function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function terms(q: string): string[] {
  return norm(q).split(/\s+/).filter(Boolean);
}

/** English text always; in Portuguese the translated title, description and ingredient names are added. */
const recipeIndex = new Map<string, string>();
function recipeText(r: Recipe): string {
  const lang = getLang();
  const key = `${lang}|${r.id}`;
  let t = recipeIndex.get(key);
  if (!t) {
    const parts = [r.title, r.titlePt ?? '', r.description, ...r.ingredients.map((i) => ingredientName(i.id, 'en'))];
    if (lang !== 'en') parts.push(recipeTitle(r, lang), recipeDescription(r, lang), ...r.ingredients.map((i) => ingredientName(i.id, lang)));
    t = norm(parts.join(' '));
    recipeIndex.set(key, t);
  }
  return t;
}

export function searchRecipes(recipes: Recipe[], q: string): Recipe[] {
  const ts = terms(q);
  if (!ts.length) return recipes;
  return recipes.filter((r) => ts.every((t) => recipeText(r).includes(t)));
}

export function foodMatches(f: Food, q: string): boolean {
  const ts = terms(q);
  if (!ts.length) return true;
  const lang = getLang();
  const text = norm([f.name, ...(f.aliases ?? []), lang === 'en' ? '' : ingredientName(f.id, lang)].join(' '));
  return ts.every((t) => text.includes(t));
}

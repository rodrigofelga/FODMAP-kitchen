import type { Recipe } from '../data/types';
import type { Food } from '../data/foods';
import { mustResolve } from './ingredients';

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

const recipeIndex = new Map<string, string>();
function recipeText(r: Recipe): string {
  let t = recipeIndex.get(r.id);
  if (!t) {
    t = norm([r.title, r.titlePt ?? '', r.description, ...r.ingredients.map((i) => mustResolve(i.id).name)].join(' '));
    recipeIndex.set(r.id, t);
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
  const text = norm([f.name, ...(f.aliases ?? [])].join(' '));
  return ts.every((t) => text.includes(t));
}

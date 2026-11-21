import { FOOD_BY_ID, type FoodStatus, type FoodTag } from '../data/foods';
import { PANTRY_BY_ID } from '../data/pantry';
import type { RecipeIngredient, Unit } from '../data/types';
import { getLang } from '../i18n/core';
import { categoryLabel, ingredientName, messages } from '../i18n/content';

export type IngredientStatus = FoodStatus | 'unlisted';

export interface ResolvedIngredient {
  id: string;
  name: string;
  kind: 'food' | 'pantry';
  status: IngredientStatus;
  tags: FoodTag[];
  group: string;
}

/** Resolves an id to its shared record; `name` and `group` are in the current language. */
export function resolveIngredient(id: string): ResolvedIngredient | undefined {
  const food = FOOD_BY_ID.get(id);
  if (food) {
    return { id, name: ingredientName(id), kind: 'food', status: food.status, tags: food.tags ?? [], group: categoryLabel(food.category) };
  }
  const p = PANTRY_BY_ID.get(id);
  if (p) return { id, name: ingredientName(id), kind: 'pantry', status: 'unlisted', tags: p.tags ?? [], group: messages().pantryGroup };
  return undefined;
}

export function mustResolve(id: string): ResolvedIngredient {
  const r = resolveIngredient(id);
  if (!r) throw new Error(`Unknown ingredient id: ${id}`);
  return r;
}

/** Plain decimals use a decimal comma in Portuguese ("0,3"); fractions read the same in both languages. */
function num(x: number): string {
  const s = String(x);
  return getLang() === 'pt-BR' ? s.replace('.', ',') : s;
}

/** Formats numbers as friendly fractions: 0.5 → ½, 1.25 → 1¼. */
export function formatQty(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '';
  const whole = Math.floor(n + 1e-9);
  const frac = n - whole;
  const fracs: [number, string][] = [
    [0.125, '⅛'],
    [0.25, '¼'],
    [1 / 3, '⅓'],
    [0.5, '½'],
    [2 / 3, '⅔'],
    [0.75, '¾'],
  ];
  if (frac < 0.06) return num(whole || (n >= 10 ? Math.round(n) : Number(n.toFixed(2))));
  if (frac > 0.94) return num(whole + 1);
  if (n >= 10) return num(Math.round(n));
  const best = fracs.reduce((a, b) => (Math.abs(b[0] - frac) < Math.abs(a[0] - frac) ? b : a));
  if (Math.abs(best[0] - frac) < 0.06) return `${whole ? whole : ''}${best[1]}`;
  return num(Number(n.toFixed(1)));
}

export function formatAmount(qty: number, unit: Unit): string {
  const units = messages().units;
  if (unit === 'to taste') return units['to taste'][0];
  const q = formatQty(unit === 'g' || unit === 'ml' ? Math.round(qty * 10) / 10 : qty);
  const [one, many] = units[unit];
  const label = qty > 1 ? many : one;
  return label ? `${q} ${label}` : q;
}

export function perServing(ing: RecipeIngredient, servings: number): string {
  return formatAmount(ing.qty / servings, ing.unit);
}

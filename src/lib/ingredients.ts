import { FOOD_BY_ID, CATEGORY_LABELS, type FoodStatus, type FoodTag } from '../data/foods';
import { PANTRY_BY_ID } from '../data/pantry';
import type { RecipeIngredient, Unit } from '../data/types';

export type IngredientStatus = FoodStatus | 'unlisted';

export interface ResolvedIngredient {
  id: string;
  name: string;
  kind: 'food' | 'pantry';
  status: IngredientStatus;
  tags: FoodTag[];
  group: string;
}

export function resolveIngredient(id: string): ResolvedIngredient | undefined {
  const food = FOOD_BY_ID.get(id);
  if (food) {
    return { id, name: food.name, kind: 'food', status: food.status, tags: food.tags ?? [], group: CATEGORY_LABELS[food.category] };
  }
  const p = PANTRY_BY_ID.get(id);
  if (p) return { id, name: p.name, kind: 'pantry', status: 'unlisted', tags: p.tags ?? [], group: 'Pantry (not in guide)' };
  return undefined;
}

export function mustResolve(id: string): ResolvedIngredient {
  const r = resolveIngredient(id);
  if (!r) throw new Error(`Unknown ingredient id: ${id}`);
  return r;
}

const UNIT_LABEL: Record<Unit, [string, string]> = {
  g: ['g', 'g'],
  ml: ['ml', 'ml'],
  unit: ['', ''],
  tbsp: ['tbsp', 'tbsp'],
  tsp: ['tsp', 'tsp'],
  cup: ['cup', 'cups'],
  pinch: ['pinch', 'pinches'],
  slice: ['slice', 'slices'],
  sprig: ['sprig', 'sprigs'],
  leaf: ['leaf', 'leaves'],
  sheet: ['sheet', 'sheets'],
  'to taste': ['to taste', 'to taste'],
};

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
  if (frac < 0.06) return String(whole || (n >= 10 ? Math.round(n) : Number(n.toFixed(2))));
  if (frac > 0.94) return String(whole + 1);
  if (n >= 10) return String(Math.round(n));
  const best = fracs.reduce((a, b) => (Math.abs(b[0] - frac) < Math.abs(a[0] - frac) ? b : a));
  if (Math.abs(best[0] - frac) < 0.06) return `${whole ? whole : ''}${best[1]}`;
  return Number(n.toFixed(1)).toString();
}

export function formatAmount(qty: number, unit: Unit): string {
  if (unit === 'to taste') return 'to taste';
  const q = formatQty(unit === 'g' || unit === 'ml' ? Math.round(qty * 10) / 10 : qty);
  const [one, many] = UNIT_LABEL[unit];
  const label = qty > 1 ? many : one;
  return label ? `${q} ${label}` : q;
}

export function perServing(ing: RecipeIngredient, servings: number): string {
  return formatAmount(ing.qty / servings, ing.unit);
}

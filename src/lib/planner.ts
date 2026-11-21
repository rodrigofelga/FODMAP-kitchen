import { MEALS, type Meal, type Recipe, type Unit } from '../data/types';
import { RECIPE_BY_ID } from '../data/recipes';
import { evaluateRecipe, type Preferences } from './analysis';
import { formatAmount, mustResolve } from './ingredients';

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export type DayPlan = Record<Meal, string | null>;

export interface MealPlan {
  id: string;
  name: string;
  createdAt: string;
  days: DayPlan[];
  /** Grocery item keys already ticked off. */
  checked: string[];
}

export function emptyDay(): DayPlan {
  return { breakfast: null, lunch: null, dinner: null, snack: null };
}

export function newPlan(name: string): MealPlan {
  return { id: `plan-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, name, createdAt: new Date().toISOString(), days: DAY_NAMES.map(emptyDay), checked: [] };
}

/** Small deterministic PRNG so tests can reproduce plans. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fills a week with eligible recipes. Excluded recipes are never chosen;
 * favourites are preferred and repeats are avoided until the pool is exhausted.
 */
export function generateWeek(recipes: Recipe[], prefs: Preferences, favourites: string[], seed = Date.now(), keep?: DayPlan[]): DayPlan[] {
  const rand = mulberry32(seed);
  const favs = new Set(favourites);
  const days = DAY_NAMES.map((_, i) => ({ ...(keep?.[i] ?? emptyDay()) }));
  for (const meal of MEALS) {
    const pool = recipes.filter((r) => r.meal === meal && evaluateRecipe(r, prefs).verdict !== 'excluded');
    if (!pool.length) continue;
    const shuffled = [...pool]
      .map((r) => ({ r, k: rand() - (favs.has(r.id) ? 0.6 : 0) - (evaluateRecipe(r, prefs).verdict === 'suitable' ? 0.15 : 0) }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.r.id);
    const used = new Set(days.map((d) => d[meal]).filter(Boolean) as string[]);
    let idx = 0;
    for (const d of days) {
      if (d[meal] && RECIPE_BY_ID.has(d[meal]!)) continue;
      let pick = shuffled.find((id, j) => j >= idx && !used.has(id));
      if (!pick) pick = shuffled[idx % shuffled.length];
      idx = shuffled.indexOf(pick) + 1;
      used.add(pick);
      d[meal] = pick;
    }
  }
  return days;
}

export interface GroceryLine {
  key: string;
  id: string;
  name: string;
  group: string;
  status: string;
  amounts: string;
  recipes: string[];
}

/** Aggregates every planned recipe's ingredients, scaled to the household size. */
export function buildGroceryList(plan: MealPlan, householdSize: number): GroceryLine[] {
  const acc = new Map<string, { qty: Map<Unit, number>; recipes: Set<string>; optionalOnly: boolean }>();
  for (const day of plan.days) {
    for (const meal of MEALS) {
      const id = day[meal];
      const r = id ? RECIPE_BY_ID.get(id) : undefined;
      if (!r) continue;
      const factor = Math.max(1, householdSize) / r.servings;
      for (const ing of r.ingredients) {
        const e = acc.get(ing.id) ?? { qty: new Map(), recipes: new Set(), optionalOnly: true };
        e.qty.set(ing.unit, (e.qty.get(ing.unit) ?? 0) + ing.qty * factor);
        e.recipes.add(r.title);
        if (!ing.optional) e.optionalOnly = false;
        acc.set(ing.id, e);
      }
    }
  }
  const lines: GroceryLine[] = [];
  for (const [id, e] of acc) {
    const f = mustResolve(id);
    const amounts = [...e.qty.entries()]
      .map(([u, q]) => formatAmount(u === 'g' || u === 'ml' ? Math.ceil(q / 5) * 5 : Math.ceil(q * 4) / 4, u))
      .join(' + ');
    lines.push({
      key: id,
      id,
      name: f.name + (e.optionalOnly ? ' (optional)' : ''),
      group: f.group,
      status: f.status,
      amounts,
      recipes: [...e.recipes].sort(),
    });
  }
  return lines.sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));
}

export function planRecipeCount(plan: MealPlan): number {
  return plan.days.reduce((n, d) => n + MEALS.filter((m) => d[m]).length, 0);
}

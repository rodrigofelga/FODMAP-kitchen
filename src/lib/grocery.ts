import { FOOD_BY_ID, FOODS, type FoodCategory } from '../data/foods';
import { PANTRY, PANTRY_BY_ID } from '../data/pantry';
import { RECIPE_BY_ID } from '../data/recipes';
import { MEALS } from '../data/types';
import { formatNumber, getLang } from '../i18n/core';
import { FOOD_NAMES_PT, PANTRY_PT } from '../i18n/data/foods.pt-BR';
import { ingredientName, messages } from '../i18n/content';
import { formatQty } from './ingredients';
import { hasIngredient } from './matcher';
import type { MealPlan } from './planner';
import { customItemId, liveItems, normName, SHOP_CATEGORIES, type Amount, type ListDoc, type ListItem, type ListUnit, type ShopCategory } from './listModel';

/**
 * The guide lists a few foods twice (duplicate PDF lines). On a shopping list
 * they are the same product, so they are merged under one id.
 */
const CANONICAL: Record<string, string> = {
  potatoes: 'potatoes-white',
  'air-fried-fries': 'potatoes-white',
  evoo: 'olive-oil',
  'vinegar-plain': 'vinegar',
  'tortilla-wraps-corn': 'corn-tortilla-wraps',
};

export function canonicalId(id: string): string {
  return CANONICAL[id] ?? id;
}

// ---------- Supermarket categories ----------

const BY_FOOD_CATEGORY: Record<FoodCategory, ShopCategory> = {
  vegetables: 'produce',
  fruit: 'produce',
  starches: 'grains',
  meat: 'meat',
  seafood: 'meat',
  protein: 'meat',
  dairy: 'dairy',
  legumes: 'other',
  seasonings: 'seasonings',
  sauces: 'seasonings',
  snacks: 'other',
  drinks: 'other',
  prepared: 'other',
};

const OVERRIDES: Record<string, ShopCategory> = {
  // Fresh herbs, citrus and potatoes are sold with fruit and vegetables.
  lemon: 'produce',
  lime: 'produce',
  parsley: 'produce',
  rosemary: 'produce',
  thyme: 'produce',
  cilantro: 'produce',
  dill: 'produce',
  ginger: 'produce',
  'hot-pepper': 'produce',
  malagueta: 'produce',
  potatoes: 'produce',
  'air-fried-fries': 'produce',
  basil: 'produce',
  mint: 'produce',
  // Bakery.
  'broa-de-fuba': 'bakery',
  'gluten-free-bread': 'bakery',
  'homemade-bread-white': 'bakery',
  'pao-de-queijo': 'bakery',
  sourdough: 'bakery',
  'corn-tortilla-wraps': 'bakery',
  'tortilla-wraps-corn': 'bakery',
  'regular-bread-buns': 'bakery',
  'rye-bread': 'bakery',
  'toast-wheat': 'bakery',
  'wheat-bread-white': 'bakery',
  'brown-bread-wheat': 'bakery',
  // Dairy aisle.
  butter: 'dairy',
  margarine: 'dairy',
  // Canned and jarred.
  'canned-sardines': 'canned',
  'canned-tuna-oil': 'canned',
  'chickpeas-canned': 'canned',
  'kidney-beans-canned': 'canned',
  'lentils-canned': 'canned',
  'baked-beans': 'canned',
  olives: 'canned',
  'tomato-paste': 'canned',
  'tomato-sauce-plain': 'canned',
  // Dry grains and flours.
  'black-beans-regular': 'grains',
  'kidney-beans-regular': 'grains',
  'lima-beans-regular': 'grains',
  'butter-beans-regular': 'grains',
  'mung-beans-regular': 'grains',
  'split-peas-regular': 'grains',
  'rice-flour': 'grains',
  'tapioca-starch': 'grains',
  cornstarch: 'grains',
  'flocao-milho': 'grains',
  // Spices.
  cinnamon: 'seasonings',
  cloves: 'seasonings',
  'bay-leaf': 'seasonings',
  cumin: 'seasonings',
  'vanilla-extract': 'seasonings',
  'maple-syrup': 'other',
  'french-fries-air-fried': 'other',
};

export function shopCategory(id: string): ShopCategory {
  if (OVERRIDES[id]) return OVERRIDES[id];
  const f = FOOD_BY_ID.get(id);
  return f ? BY_FOOD_CATEGORY[f.category] : 'other';
}

export const SHOP_CATEGORY_ORDER: readonly ShopCategory[] = SHOP_CATEGORIES;

// ---------- Units ----------

/** Spoon and cup measures convert exactly (1 tbsp = 3 tsp, 1 cup = 16 tbsp). Weight, volume and counts never convert into each other. */
const TSP: Partial<Record<ListUnit, number>> = { tsp: 1, tbsp: 3, cup: 48 };

/** Merges amounts with compatible units: same unit, or spoon/cup measures. */
export function combineAmounts(list: Amount[]): Amount[] {
  const out = new Map<string, Amount>();
  let tsp = 0;
  let hasSpoons = false;
  for (const a of list) {
    if (TSP[a.unit]) {
      tsp += a.qty * TSP[a.unit]!;
      hasSpoons = true;
      continue;
    }
    const prev = out.get(a.unit);
    out.set(a.unit, { unit: a.unit, qty: (prev?.qty ?? 0) + a.qty });
  }
  const res = [...out.values()];
  if (hasSpoons) res.push({ unit: 'tsp', qty: tsp });
  const order = (u: ListUnit) => ['g', 'ml', 'unit', 'cup', 'tbsp', 'tsp'].indexOf(u) + 1 || 99;
  return res.sort((a, b) => order(a.unit) - order(b.unit));
}

const ceilTo = (x: number, step: number) => Math.ceil(x / step - 1e-9) * step;

/** Picks the clearest unit for display and rounds up (never down) for shopping. */
export function displayAmount(a: Amount): { qty: number; unit: ListUnit | 'kg' | 'l' } {
  if (a.unit === 'g' || a.unit === 'ml') {
    const q = ceilTo(a.qty, 5);
    if (q >= 1000) return { qty: ceilTo(q / 1000, 0.05), unit: a.unit === 'g' ? 'kg' : 'l' };
    return { qty: q, unit: a.unit };
  }
  if (TSP[a.unit]) {
    const tsp = a.qty * TSP[a.unit]!;
    if (tsp >= 48) return { qty: ceilTo(tsp / 48, 0.25), unit: 'cup' };
    if (tsp >= 3) return { qty: ceilTo(tsp / 3, 0.25), unit: 'tbsp' };
    return { qty: ceilTo(tsp, 0.25), unit: 'tsp' };
  }
  return { qty: ceilTo(a.qty, 0.25), unit: a.unit };
}

export function formatListAmount(a: Amount): string {
  const units = messages().units;
  if (a.unit === 'to taste') return units['to taste'][0];
  const d = displayAmount(a);
  if (d.unit === 'kg' || d.unit === 'l') return `${formatNumber(Math.round(d.qty * 100) / 100, 2)} ${d.unit === 'kg' ? 'kg' : 'L'}`;
  const [one, many] = units[d.unit];
  const q = formatQty(d.qty);
  const label = d.qty > 1 ? many : one;
  return label ? `${q} ${label}` : q;
}

/** Quantity shown for an item: what a person typed, else the calculated amounts. */
export function itemQuantity(item: ListItem): string {
  if (item.qtyText) return item.qtyText;
  return item.amounts.map(formatListAmount).join(' + ');
}

export function itemName(item: ListItem): string {
  if (item.name) return item.name;
  return item.ingredientId ? ingredientName(item.ingredientId) : '';
}

// ---------- Generation ----------

/** Identifies the planned meals, so a list can tell when the week has changed. */
export function planSignature(plan: MealPlan): string {
  return plan.days.map((d) => MEALS.map((m) => d[m] ?? '-').join(',')).join('|');
}

/**
 * Consolidates every planned recipe's ingredients: one entry per product,
 * quantities scaled to `people` and summed where units are compatible.
 * Ingredients with no quantity ("to taste") stay without a number.
 */
export function generateList(plan: MealPlan, people: number, now = Date.now()): ListDoc {
  const p = Math.max(1, Math.round(people));
  const acc = new Map<string, { amounts: Amount[]; recipes: Set<string>; optionalOnly: boolean }>();
  for (const day of plan.days) {
    for (const meal of MEALS) {
      const rid = day[meal];
      const r = rid ? RECIPE_BY_ID.get(rid) : undefined;
      if (!r) continue;
      const factor = p / r.servings;
      for (const ing of r.ingredients) {
        const id = canonicalId(ing.id);
        const e = acc.get(id) ?? { amounts: [], recipes: new Set<string>(), optionalOnly: true };
        e.amounts.push({ unit: ing.unit, qty: ing.unit === 'to taste' ? 0 : ing.qty * factor });
        e.recipes.add(r.id);
        if (!ing.optional) e.optionalOnly = false;
        acc.set(id, e);
      }
    }
  }
  const items: ListItem[] = [];
  for (const [id, e] of acc) {
    const item: ListItem = {
      id: `ing:${id}`,
      ingredientId: id,
      amounts: combineAmounts(e.amounts),
      category: shopCategory(id),
      checked: plan.checked.includes(id),
      recipes: [...e.recipes],
      updatedAt: now,
    };
    if (e.optionalOnly) item.optional = true;
    items.push(item);
  }
  return { title: plan.name, weekOf: plan.createdAt, people: p, items, generatedAt: now, source: planSignature(plan) };
}

// ---------- Manual items ----------

const stripParens = (s: string) => s.replace(/\s*\(.*?\)\s*/g, ' ').trim();

let nameIndex: Map<string, string> | null = null;
/**
 * Every English and Portuguese name and alias of a guide or pantry item → its id.
 * Full names and aliases win over shortened names ("Arroz (basmati)" → "arroz"); ambiguous names are left out.
 */
function getNameIndex(): Map<string, string> {
  if (nameIndex) return nameIndex;
  const exact = new Map<string, Set<string>>();
  const short = new Map<string, Set<string>>();
  const put = (m: Map<string, Set<string>>, n: string, id: string) => {
    if (!n) return;
    const s = m.get(n) ?? new Set<string>();
    s.add(canonicalId(id));
    m.set(n, s);
  };
  const add = (name: string, id: string) => {
    put(exact, normName(name), id);
    put(short, normName(stripParens(name)), id);
  };
  for (const f of FOODS) {
    add(f.name, f.id);
    if (FOOD_NAMES_PT[f.id]) add(FOOD_NAMES_PT[f.id], f.id);
    for (const a of f.aliases ?? []) add(a, f.id);
  }
  for (const p of PANTRY) {
    add(p.name, p.id);
    if (PANTRY_PT[p.id]) add(PANTRY_PT[p.id].name, p.id);
    for (const a of p.aliases ?? []) add(a, p.id);
  }
  const unique = (m: Map<string, Set<string>>) => [...m].filter(([, ids]) => ids.size === 1).map(([n, ids]) => [n, [...ids][0]] as [string, string]);
  nameIndex = new Map(unique(short).filter(([n]) => !exact.has(n)));
  for (const [n, id] of unique(exact)) nameIndex.set(n, id);
  return nameIndex;
}

/** Recognises a typed product ("arroz", "Rice", "Tomate") as a guide/pantry ingredient, in either language. */
export function recogniseIngredient(text: string): string | undefined {
  const n = normName(text);
  if (!n) return undefined;
  return getNameIndex().get(n);
}

/** Builds a manual item; recognised ingredients use the shared id so they never duplicate a calculated one. */
export function manualItem(name: string, qtyText: string, category: ShopCategory | undefined, now = Date.now()): ListItem {
  const ing = recogniseIngredient(name);
  const item: ListItem = ing
    ? { id: `ing:${ing}`, ingredientId: ing, amounts: [], category: category ?? shopCategory(ing), checked: false, manual: true, updatedAt: now }
    : { id: customItemId(name), name: name.trim(), amounts: [], category: category ?? 'other', checked: false, manual: true, updatedAt: now };
  if (qtyText.trim()) item.qtyText = qtyText.trim();
  return item;
}

/** True when an item is already in the user's kitchen (Ingredient Matcher selection). */
export function inPantry(item: ListItem, pantrySelection: string[]): boolean {
  if (!item.ingredientId) return false;
  const sel = new Set(pantrySelection);
  return hasIngredient(item.ingredientId, sel) || Object.entries(CANONICAL).some(([dup, c]) => c === item.ingredientId && sel.has(dup));
}

export function knownIngredient(id: string): boolean {
  return FOOD_BY_ID.has(id) || PANTRY_BY_ID.has(id);
}

// ---------- Text export ----------

export function weekLabel(doc: ListDoc): string {
  const d = new Date(doc.weekOf);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(getLang() === 'pt-BR' ? 'pt-BR' : undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Items grouped by supermarket category in display order, names sorted in the current language. */
export function groupItems(items: ListItem[]): [ShopCategory, ListItem[]][] {
  const coll = new Intl.Collator(getLang() === 'pt-BR' ? 'pt-BR' : 'en', { sensitivity: 'base' });
  return SHOP_CATEGORY_ORDER.map((c) => [c, items.filter((i) => i.category === c).sort((a, b) => coll.compare(itemName(a), itemName(b)))] as [ShopCategory, ListItem[]]).filter(
    ([, l]) => l.length > 0,
  );
}

/** Plain-text list for messages, e-mail and the clipboard. */
export function listAsText(doc: ListDoc): string {
  const t = messages().shopping;
  const head = [t.listTitle, doc.title, t.people(doc.people)].filter(Boolean).join(' · ');
  const body = groupItems(liveItems(doc)).map(
    ([c, items]) => `${t.categories[c]}\n${items.map((i) => `${i.checked ? '☑' : '☐'} ${itemName(i)}${itemQuantity(i) ? ` — ${itemQuantity(i)}` : ''}`).join('\n')}`,
  );
  return [head, ...body].join('\n\n');
}

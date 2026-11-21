/**
 * Shopping-list document model, shared by the app and the Cloudflare Worker
 * (worker/index.ts). Pure functions only — no browser or Worker APIs — so the
 * exact same rules apply to a local list, to optimistic updates on a device
 * and to the authoritative copy of a shared list on the server.
 */

export const SHOP_CATEGORIES = ['produce', 'meat', 'dairy', 'grains', 'bakery', 'seasonings', 'canned', 'other'] as const;
export type ShopCategory = (typeof SHOP_CATEGORIES)[number];

export const LIST_UNITS = ['g', 'ml', 'unit', 'tbsp', 'tsp', 'cup', 'pinch', 'slice', 'sprig', 'leaf', 'sheet', 'to taste'] as const;
export type ListUnit = (typeof LIST_UNITS)[number];

export interface Amount {
  unit: ListUnit;
  /** Unrounded total; rounded up only for display. */
  qty: number;
}

export interface ListItem {
  /** `ing:<food id>` for guide/pantry ingredients, `c:<normalised name>` for custom products. */
  id: string;
  /** Food-guide or pantry id; its name is shown in the reader's language. */
  ingredientId?: string;
  /** Name typed or edited by a person (shown exactly as typed). */
  name?: string;
  /** Quantities calculated from the plan. */
  amounts: Amount[];
  /** Quantity typed or edited by a person; replaces `amounts` when set. */
  qtyText?: string;
  category: ShopCategory;
  checked: boolean;
  /** Only needed by optional recipe ingredients. */
  optional?: boolean;
  /** Recipe ids that use it. */
  recipes?: string[];
  /** Added by hand (kept when the list is regenerated). */
  manual?: boolean;
  /** Tombstone so a concurrent edit cannot bring a deleted item back. */
  deleted?: boolean;
  updatedAt: number;
}

export interface ListDoc {
  /** Plan name, e.g. "Week of 21 Nov". */
  title: string;
  /** ISO date the plan was created (the week the list is for). */
  weekOf: string;
  people: number;
  items: ListItem[];
  generatedAt: number;
  /** Signature of the planned meals the list was generated from. */
  source?: string;
}

export type ListOp = { opId: string } & (
  | { type: 'add'; item: ListItem }
  | { type: 'update'; id: string; patch: Partial<Pick<ListItem, 'name' | 'qtyText' | 'checked' | 'category'>> }
  | { type: 'delete'; id: string }
  | { type: 'setPeople'; people: number }
  | { type: 'regenerate'; doc: ListDoc }
  | { type: 'uncheckAll' }
);

export const LIMITS = { items: 400, text: 120, title: 80, people: 24 } as const;

const clip = (s: unknown, n: number) => (typeof s === 'string' ? s.slice(0, n) : undefined);

/** Lowercase, accent-free form used to recognise the same product typed in either language. */
export function normName(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function customItemId(name: string): string {
  return `c:${normName(name).replace(/[^a-z0-9 ]/g, '').replace(/ /g, '-').slice(0, 60) || 'item'}`;
}

/** Visible (not deleted) items. */
export function liveItems(doc: ListDoc): ListItem[] {
  return doc.items.filter((i) => !i.deleted);
}

export function progress(doc: ListDoc): { done: number; total: number } {
  const live = liveItems(doc);
  return { done: live.filter((i) => i.checked).length, total: live.length };
}

function scaleAmounts(a: Amount[], f: number): Amount[] {
  return a.map((x) => ({ unit: x.unit, qty: x.qty * f }));
}

/**
 * Applies one operation. Order is decided by the caller (the server for a
 * shared list), so concurrent edits resolve as last-writer-wins per field;
 * deletes are kept as tombstones and adds of an existing id are ignored,
 * which makes every operation safe to retry.
 */
export function applyOp(doc: ListDoc, op: ListOp, now: number): ListDoc {
  switch (op.type) {
    case 'add': {
      const existing = doc.items.find((i) => i.id === op.item.id);
      if (existing && !existing.deleted) return doc;
      if (!existing && liveItems(doc).length >= LIMITS.items) return doc;
      const item = { ...op.item, deleted: false, updatedAt: now };
      return { ...doc, items: existing ? doc.items.map((i) => (i.id === item.id ? item : i)) : [...doc.items, item] };
    }
    case 'update':
      return {
        ...doc,
        items: doc.items.map((i) => {
          if (i.id !== op.id || i.deleted) return i;
          const next = { ...i, ...op.patch, updatedAt: now };
          if (op.patch.qtyText !== undefined && !op.patch.qtyText.trim()) delete next.qtyText;
          if (op.patch.name !== undefined && !op.patch.name.trim()) delete next.name;
          return next;
        }),
      };
    case 'delete':
      return { ...doc, items: doc.items.map((i) => (i.id === op.id ? { ...i, deleted: true, checked: false, updatedAt: now } : i)) };
    case 'setPeople': {
      const people = Math.min(LIMITS.people, Math.max(1, Math.round(op.people)));
      if (people === doc.people) return doc;
      const f = people / doc.people;
      return { ...doc, people, items: doc.items.map((i) => (i.amounts.length ? { ...i, amounts: scaleAmounts(i.amounts, f) } : i)) };
    }
    case 'regenerate':
      return mergeRegenerated(doc, op.doc, now);
    case 'uncheckAll':
      return { ...doc, items: doc.items.map((i) => (i.checked ? { ...i, checked: false, updatedAt: now } : i)) };
  }
}

/**
 * Replaces the calculated part of a list with a fresh calculation while
 * keeping what people did: ticks and renamed items survive, products added by
 * hand stay, calculated items no longer needed are removed.
 */
export function mergeRegenerated(prev: ListDoc, fresh: ListDoc, now: number): ListDoc {
  const before = new Map(prev.items.map((i) => [i.id, i]));
  const freshIds = new Set(fresh.items.map((i) => i.id));
  const items: ListItem[] = fresh.items.map((f) => {
    const p = before.get(f.id);
    if (!p || p.deleted) return { ...f, updatedAt: now };
    return { ...f, checked: p.checked, ...(p.name ? { name: p.name } : {}), category: p.manual ? p.category : f.category, updatedAt: now };
  });
  for (const p of prev.items) {
    if (freshIds.has(p.id)) continue;
    if (p.manual && !p.deleted) items.push(p);
    else if (!p.deleted) items.push({ ...p, deleted: true, checked: false, updatedAt: now });
    else items.push(p);
  }
  return { ...fresh, title: prev.title || fresh.title, items };
}

/** Validates untrusted input (a shared list arriving at the server, or an import). Returns null if unusable. */
export function sanitizeItem(raw: unknown): ListItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = clip(r.id, 80);
  if (!id || !/^(ing|c):[\w-]+$/.test(id)) return null;
  const category = SHOP_CATEGORIES.includes(r.category as ShopCategory) ? (r.category as ShopCategory) : 'other';
  const amounts = (Array.isArray(r.amounts) ? r.amounts : [])
    .filter((a): a is Amount => !!a && LIST_UNITS.includes((a as Amount).unit) && Number.isFinite((a as Amount).qty) && (a as Amount).qty >= 0 && (a as Amount).qty < 1e6)
    .slice(0, LIST_UNITS.length)
    .map((a) => ({ unit: a.unit, qty: a.qty }));
  const item: ListItem = { id, amounts, category, checked: r.checked === true, updatedAt: Number(r.updatedAt) || 0 };
  const ingredientId = clip(r.ingredientId, 60);
  if (ingredientId && /^[\w-]+$/.test(ingredientId)) item.ingredientId = ingredientId;
  const name = clip(r.name, LIMITS.text)?.trim();
  if (name) item.name = name;
  const qtyText = clip(r.qtyText, 40)?.trim();
  if (qtyText) item.qtyText = qtyText;
  if (r.optional === true) item.optional = true;
  if (r.manual === true) item.manual = true;
  if (r.deleted === true) item.deleted = true;
  if (Array.isArray(r.recipes)) item.recipes = r.recipes.filter((x): x is string => typeof x === 'string' && /^[\w-]{1,60}$/.test(x)).slice(0, 40);
  if (!item.ingredientId && !item.name) return null;
  return item;
}

export function sanitizeDoc(raw: unknown): ListDoc | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const items = (Array.isArray(r.items) ? r.items : []).map(sanitizeItem).filter((x): x is ListItem => !!x);
  const seen = new Set<string>();
  const unique = items.filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true))).slice(0, LIMITS.items * 2);
  const people = Math.min(LIMITS.people, Math.max(1, Math.round(Number(r.people) || 1)));
  return {
    title: clip(r.title, LIMITS.title) ?? '',
    weekOf: clip(r.weekOf, 40) ?? '',
    people,
    items: unique,
    generatedAt: Number(r.generatedAt) || 0,
    ...(typeof r.source === 'string' ? { source: r.source.slice(0, 2000) } : {}),
  };
}

export function sanitizeOp(raw: unknown): ListOp | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const opId = clip(r.opId, 64);
  if (!opId) return null;
  switch (r.type) {
    case 'add': {
      const item = sanitizeItem(r.item);
      return item ? { opId, type: 'add', item } : null;
    }
    case 'update': {
      const id = clip(r.id, 80);
      const p = (r.patch ?? {}) as Record<string, unknown>;
      if (!id) return null;
      const patch: Extract<ListOp, { type: 'update' }>['patch'] = {};
      if (typeof p.name === 'string') patch.name = p.name.slice(0, LIMITS.text);
      if (typeof p.qtyText === 'string') patch.qtyText = p.qtyText.slice(0, 40);
      if (typeof p.checked === 'boolean') patch.checked = p.checked;
      if (SHOP_CATEGORIES.includes(p.category as ShopCategory)) patch.category = p.category as ShopCategory;
      return { opId, type: 'update', id, patch };
    }
    case 'delete': {
      const id = clip(r.id, 80);
      return id ? { opId, type: 'delete', id } : null;
    }
    case 'setPeople':
      return Number.isFinite(Number(r.people)) ? { opId, type: 'setPeople', people: Number(r.people) } : null;
    case 'regenerate': {
      const doc = sanitizeDoc(r.doc);
      return doc ? { opId, type: 'regenerate', doc } : null;
    }
    case 'uncheckAll':
      return { opId, type: 'uncheckAll' };
    default:
      return null;
  }
}

/** Random id for operations (crypto.randomUUID exists in browsers, Node and Workers). */
export function newOpId(): string {
  return crypto.randomUUID();
}

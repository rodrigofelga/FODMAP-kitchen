import { afterEach, describe, expect, it } from 'vitest';
import { RECIPES } from '../../src/data/recipes';
import { MEALS } from '../../src/data/types';
import { setLang } from '../../src/i18n/core';
import {
  canonicalId,
  combineAmounts,
  formatListAmount,
  generateList,
  inPantry,
  itemName,
  itemQuantity,
  listAsText,
  manualItem,
  planSignature,
  recogniseIngredient,
  shopCategory,
} from '../../src/lib/grocery';
import { applyOp, liveItems, mergeRegenerated, progress, sanitizeDoc, sanitizeItem, sanitizeOp, type ListDoc, type ListOp } from '../../src/lib/listModel';
import { buildListPdf, listSubtitle, pdfContent } from '../../src/lib/pdf';
import { newPlan, type MealPlan } from '../../src/lib/planner';
import { defaultData, normalizeData } from '../../src/lib/appData';
import { effectiveDoc, inviteUrl, parseInvite } from '../../src/lib/sync';

afterEach(() => setLang('en'));

/** A plan with the given recipes in its first slots. */
function planWith(ids: string[]): MealPlan {
  const p = newPlan('Test week');
  ids.forEach((id, i) => {
    const day = Math.floor(i / MEALS.length);
    const meal = MEALS[i % MEALS.length];
    p.days[day] = { ...p.days[day], [meal]: id };
  });
  return p;
}

let n = 0;
const op = (o: Record<string, unknown>) => ({ ...o, opId: `op-${++n}` }) as ListOp;

/** An ingredient used in grams by at least three recipes, and those recipes. */
function sharedGramIngredient() {
  const uses = new Map<string, { recipe: string; qty: number; servings: number }[]>();
  for (const r of RECIPES)
    for (const ing of r.ingredients)
      if (ing.unit === 'g') {
        const id = canonicalId(ing.id);
        const list = uses.get(id) ?? [];
        if (!list.some((u) => u.recipe === r.id)) list.push({ recipe: r.id, qty: ing.qty, servings: r.servings });
        uses.set(id, list);
      }
  const [id, list] = [...uses].find(([, l]) => l.length >= 3)!;
  return { id, uses: list.slice(0, 3) };
}

describe('grocery list generation', () => {
  it('combines one ingredient used by three recipes into one entry with the summed total', () => {
    const { id, uses } = sharedGramIngredient();
    const plan = planWith(uses.map((u) => u.recipe));
    const doc = generateList(plan, 2, 1);
    const items = doc.items.filter((i) => i.ingredientId === id);
    expect(items).toHaveLength(1);
    const expected = uses.reduce((s, u) => s + (u.qty * 2) / u.servings, 0);
    // Sums every use of the ingredient in those recipes (a recipe may list it twice).
    const all = uses.reduce((s, u) => {
      const r = RECIPES.find((x) => x.id === u.recipe)!;
      return s + r.ingredients.filter((i) => canonicalId(i.id) === id && i.unit === 'g').reduce((a, i) => a + (i.qty * 2) / r.servings, 0);
    }, 0);
    expect(all).toBeGreaterThanOrEqual(expected - 1e-9);
    expect(items[0].amounts.find((a) => a.unit === 'g')!.qty).toBeCloseTo(all, 6);
    expect(new Set(items[0].recipes)).toEqual(new Set(uses.map((u) => u.recipe)));
  });

  it('keeps one entry per product with no duplicate ids', () => {
    const plan = planWith(RECIPES.slice(0, 28).map((r) => r.id));
    const doc = generateList(plan, 4);
    const ids = doc.items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(doc.people).toBe(4);
    expect(doc.source).toBe(planSignature(plan));
  });

  it('merges duplicate guide entries (olive oil, potatoes) into one product', () => {
    expect(canonicalId('evoo')).toBe('olive-oil');
    expect(canonicalId('potatoes')).toBe('potatoes-white');
    expect(canonicalId('rice-white')).toBe('rice-white');
  });

  it('scales amounts linearly with the number of people', () => {
    const plan = planWith(RECIPES.slice(0, 6).map((r) => r.id));
    const two = generateList(plan, 2);
    const six = generateList(plan, 6);
    for (const item of two.items) {
      const other = six.items.find((i) => i.id === item.id)!;
      item.amounts.forEach((a, k) => expect(other.amounts[k].qty).toBeCloseTo(a.qty * 3, 6));
    }
  });

  it('does not invent amounts for "to taste" ingredients', () => {
    expect(combineAmounts([{ unit: 'to taste', qty: 0 }, { unit: 'to taste', qty: 0 }])).toEqual([{ unit: 'to taste', qty: 0 }]);
    expect(formatListAmount({ unit: 'to taste', qty: 0 })).toBe('to taste');
    const doc = generateList(planWith(RECIPES.slice(0, 28).map((r) => r.id)), 2);
    for (const item of doc.items) expect(itemQuantity(item)).not.toMatch(/NaN|undefined|Infinity/);
  });

  it('assigns supermarket categories', () => {
    expect(shopCategory('rice-white')).toBe('grains');
    expect(shopCategory('carrots')).toBe('produce');
    expect(shopCategory('eggs')).toBe('meat');
  });

  it('presets ticks from the earlier grocery list', () => {
    const { id, uses } = sharedGramIngredient();
    const plan = { ...planWith([uses[0].recipe]), checked: [id] };
    expect(generateList(plan, 2).items.find((i) => i.ingredientId === id)!.checked).toBe(true);
  });
});

describe('units', () => {
  it('converts spoons and cups exactly', () => {
    const [a] = combineAmounts([
      { unit: 'tsp', qty: 1 },
      { unit: 'tbsp', qty: 1 },
      { unit: 'cup', qty: 0.25 },
    ]);
    expect(a).toEqual({ unit: 'tsp', qty: 1 + 3 + 12 });
    expect(formatListAmount(a)).toBe('5½ tbsp');
    expect(formatListAmount({ unit: 'tsp', qty: 48 })).toBe('1 cup');
  });

  it('never mixes grams, millilitres and counts', () => {
    const res = combineAmounts([
      { unit: 'g', qty: 100 },
      { unit: 'unit', qty: 2 },
      { unit: 'ml', qty: 50 },
      { unit: 'g', qty: 50 },
    ]);
    expect(res).toEqual([
      { unit: 'g', qty: 150 },
      { unit: 'ml', qty: 50 },
      { unit: 'unit', qty: 2 },
    ]);
  });

  it('rounds up for shopping and shows kg/L for large amounts', () => {
    expect(formatListAmount({ unit: 'g', qty: 121 })).toBe('125 g');
    expect(formatListAmount({ unit: 'g', qty: 1200 })).toBe('1.2 kg');
    expect(formatListAmount({ unit: 'ml', qty: 1500 })).toBe('1.5 L');
    setLang('pt-BR');
    expect(formatListAmount({ unit: 'g', qty: 1200 })).toBe('1,2 kg');
  });
});

describe('list operations (checklist, add, edit, delete)', () => {
  const base = (): ListDoc => generateList(planWith(RECIPES.slice(0, 4).map((r) => r.id)), 2, 1);

  it('ticks, unticks and counts progress', () => {
    let d = base();
    const id = d.items[0].id;
    d = applyOp(d, op({ type: 'update', id, patch: { checked: true } }), 2);
    expect(progress(d)).toEqual({ done: 1, total: d.items.length });
    d = applyOp(d, op({ type: 'uncheckAll' }), 3);
    expect(progress(d).done).toBe(0);
  });

  it('adds manual items without duplicating an ingredient already on the list (PT or EN name)', () => {
    let d = base();
    const existing = d.items[0];
    const ptName = (() => {
      setLang('pt-BR');
      const s = itemName(existing);
      setLang('en');
      return s;
    })();
    const before = d.items.length;
    d = applyOp(d, op({ type: 'add', item: manualItem(ptName, '', undefined) }), 2);
    expect(d.items.length).toBe(before);
    d = applyOp(d, op({ type: 'add', item: manualItem('Paper towels', '2', undefined) }), 3);
    expect(d.items.length).toBe(before + 1);
    expect(d.items.at(-1)).toMatchObject({ id: 'c:paper-towels', name: 'Paper towels', qtyText: '2', category: 'other', manual: true });
  });

  it('recognises products typed in either language', () => {
    expect(recogniseIngredient('arroz branco')).toBe('rice-white');
    expect(recogniseIngredient('Rice (white)')).toBe('rice-white');
    expect(recogniseIngredient('ARROZ')).toBe('rice-white');
    expect(recogniseIngredient('xyz unknown')).toBeUndefined();
    expect(sanitizeItem(manualItem('Pão de queijo', '', 'bakery'))).not.toBeNull();
  });

  it('edits name, quantity and category; empty values restore the calculated ones', () => {
    let d = base();
    const id = d.items[0].id;
    d = applyOp(d, op({ type: 'update', id, patch: { name: 'Special', qtyText: '3 packs', category: 'other' } }), 2);
    expect(d.items[0]).toMatchObject({ name: 'Special', qtyText: '3 packs', category: 'other' });
    d = applyOp(d, op({ type: 'update', id, patch: { name: '', qtyText: '' } }), 3);
    expect(d.items[0].name).toBeUndefined();
    expect(d.items[0].qtyText).toBeUndefined();
  });

  it('deletes with a tombstone so a late edit cannot bring the item back', () => {
    let d = base();
    const id = d.items[0].id;
    d = applyOp(d, op({ type: 'delete', id }), 2);
    d = applyOp(d, op({ type: 'update', id, patch: { checked: true } }), 3);
    expect(liveItems(d).some((i) => i.id === id)).toBe(false);
    expect(progress(d).done).toBe(0);
  });

  it('changes the number of people by scaling calculated amounts only', () => {
    let d = base();
    d = applyOp(d, op({ type: 'add', item: manualItem('Napkins', '1', 'other') }), 2);
    const g = d.items.find((i) => i.amounts.length)!;
    const q = g.amounts[0].qty;
    d = applyOp(d, op({ type: 'setPeople', people: 4 }), 3);
    expect(d.people).toBe(4);
    expect(d.items.find((i) => i.id === g.id)!.amounts[0].qty).toBeCloseTo(q * 2, 6);
    expect(d.items.find((i) => i.id === 'c:napkins')!.qtyText).toBe('1');
  });

  it('regenerating keeps ticks, renames and manual items and drops products no longer needed', () => {
    const plan = planWith(RECIPES.slice(0, 4).map((r) => r.id));
    let d = generateList(plan, 2, 1);
    const kept = d.items[0];
    d = applyOp(d, op({ type: 'update', id: kept.id, patch: { checked: true, name: 'Mine' } }), 2);
    d = applyOp(d, op({ type: 'add', item: manualItem('Coffee filters', '', 'other') }), 3);
    const changed = { ...plan, days: plan.days.map((day, i) => (i === 0 ? { ...day, [MEALS[3]]: null } : day)) };
    const fresh = generateList(changed, 2, 4);
    const merged = mergeRegenerated(d, fresh, 5);
    const k = merged.items.find((i) => i.id === kept.id);
    if (fresh.items.some((i) => i.id === kept.id)) expect(k).toMatchObject({ checked: true, name: 'Mine' });
    expect(liveItems(merged).some((i) => i.id === 'c:coffee-filters')).toBe(true);
    for (const i of liveItems(merged)) expect(fresh.items.some((f) => f.id === i.id) || i.manual).toBe(true);
  });

  it('applies concurrent operations from two people consistently (server order, idempotent adds)', () => {
    const d0 = base();
    const a = op({ type: 'update', id: d0.items[0].id, patch: { checked: true } });
    const b = op({ type: 'update', id: d0.items[1].id, patch: { checked: true } });
    const c = op({ type: 'add', item: manualItem('Ice', '', 'other') });
    const server = [a, b, c, c].reduce((d, o) => applyOp(d, o, 9), d0);
    expect(progress(server).done).toBe(2);
    expect(server.items.filter((i) => i.id === 'c:ice')).toHaveLength(1);
  });
});

describe('validation of shared data', () => {
  it('rejects malformed items, docs and operations', () => {
    expect(sanitizeItem({ id: 'x', name: 'a' })).toBeNull();
    expect(sanitizeItem({ id: 'c:a', amounts: [{ unit: 'kg', qty: 1 }], name: 'a' })!.amounts).toEqual([]);
    expect(sanitizeDoc(null)).toBeNull();
    expect(sanitizeDoc({ people: 999, items: 'nope' })).toMatchObject({ people: 24, items: [] });
    expect(sanitizeOp({ type: 'drop table' , opId: '1' })).toBeNull();
    expect(sanitizeOp({ type: 'update', id: 'ing:x', opId: '1', patch: { checked: true, evil: 1 } })).toEqual({ type: 'update', id: 'ing:x', opId: '1', patch: { checked: true } });
  });

  it('long text is clipped', () => {
    const item = sanitizeItem({ id: 'c:a', name: 'x'.repeat(500), amounts: [] })!;
    expect(item.name!.length).toBe(120);
  });
});

describe('export', () => {
  const doc = () => {
    let d = generateList(planWith(RECIPES.slice(0, 8).map((r) => r.id)), 2, 1);
    d = applyOp(d, op({ type: 'update', id: d.items[0].id, patch: { checked: true } }), 2);
    return d;
  };

  it('formats a plain-text list grouped by category, in English and Portuguese', () => {
    const d = doc();
    const en = listAsText(d);
    expect(en.startsWith('Grocery list')).toBe(true);
    expect(en).toContain('☑');
    expect(en).toContain('☐');
    expect(en).toContain('Produce');
    setLang('pt-BR');
    const pt = listAsText(d);
    expect(pt.startsWith('Lista de compras')).toBe(true);
    expect(pt).toContain('Hortifruti');
    expect(pt).toContain('2 pessoas');
  });

  it('builds PDF content with every live item and a translated heading', () => {
    const d = doc();
    const c = pdfContent(d);
    expect(c.title).toBe('Grocery list');
    expect(c.blocks.reduce((s, b) => s + b.lines.length, 0)).toBe(liveItems(d).length);
    expect(c.blocks.flatMap((b) => b.lines).filter((l) => l.checked)).toHaveLength(1);
    setLang('pt-BR');
    expect(pdfContent(d).title).toBe('Lista de compras');
    expect(pdfContent(d).blocks.map((b) => b.title)).toContain('Hortifruti');
  });

  it('does not repeat the week when the plan has its automatic name', () => {
    const d = { ...doc(), title: 'Week of Nov 21', weekOf: '2026-11-21T12:00:00.000Z' };
    expect(listSubtitle(d)).not.toContain('Week of Nov 21');
    expect(listSubtitle({ ...d, title: 'Holiday menu' })).toContain('Holiday menu');
  });

  it('generates a valid PDF on A4 and Letter, in both languages', async () => {
    const d = doc();
    for (const lang of ['en', 'pt-BR'] as const) {
      setLang(lang);
      for (const paper of ['a4', 'letter'] as const) {
        const bytes = await buildListPdf(d, paper);
        expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');
        expect(bytes.length).toBeGreaterThan(1000);
      }
    }
  });

  it('fits a full week on few pages', async () => {
    const d = generateList(planWith(RECIPES.slice(0, 28).map((r) => r.id)), 4);
    const bytes = await buildListPdf(d, 'a4');
    const { PDFDocument } = await import('pdf-lib');
    const pages = (await PDFDocument.load(bytes)).getPageCount();
    expect(pages).toBeGreaterThanOrEqual(1);
    expect(pages).toBeLessThanOrEqual(3);
  });
});

describe('pantry and storage', () => {
  it('marks items already in the kitchen', () => {
    const item = manualItem('arroz branco', '', undefined);
    expect(inPantry(item, ['rice-white'])).toBe(true);
    expect(inPantry(item, [])).toBe(false);
    expect(inPantry(manualItem('Paper towels', '', undefined), ['rice-white'])).toBe(false);
  });

  it('keeps the grocery list and shared lists when saved data is loaded again', () => {
    const data = defaultData();
    const plan = planWith([RECIPES[0].id]);
    plan.grocery = generateList(plan, 2, 1);
    plan.sharedListId = 'A'.repeat(22);
    const ref = {
      listId: 'A'.repeat(22),
      token: 'secret-token',
      memberId: 'm1',
      role: 'owner' as const,
      doc: plan.grocery,
      version: 3,
      pending: [op({ type: 'uncheckAll' })],
      status: 'active' as const,
      invite: 'abcdefghijklmnop1234',
    };
    data.profiles[0] = { ...data.profiles[0], plans: [plan], activePlanId: plan.id, sharedLists: [ref] };
    const back = normalizeData(JSON.parse(JSON.stringify(data)));
    expect(back.profiles[0].plans[0].grocery).toEqual(plan.grocery);
    expect(back.profiles[0].plans[0].sharedListId).toBe(plan.sharedListId);
    expect(back.profiles[0].sharedLists[0]).toEqual(ref);
    expect(normalizeData({}).profiles[0].sharedLists).toEqual([]);
  });

  it('shows queued offline changes on top of the last server copy', () => {
    const doc = generateList(planWith([RECIPES[0].id]), 2, 1);
    const ref = {
      listId: 'A'.repeat(22),
      token: 't',
      memberId: 'm',
      role: 'member' as const,
      doc,
      version: 1,
      pending: [op({ type: 'update', id: doc.items[0].id, patch: { checked: true } })],
      status: 'active' as const,
    };
    expect(progress(effectiveDoc(ref)).done).toBe(1);
    expect(progress(ref.doc).done).toBe(0);
  });

  it('keeps the invite secret in the link fragment only', () => {
    const url = inviteUrl('A'.repeat(22), 'b'.repeat(24), 'https://example.test');
    expect(url).toBe(`https://example.test/join#${'A'.repeat(22)}.${'b'.repeat(24)}`);
    const u = new URL(url);
    expect(u.pathname + u.search).toBe('/join');
    expect(parseInvite(u.hash)).toEqual({ listId: 'A'.repeat(22), invite: 'b'.repeat(24) });
    expect(parseInvite('#garbage')).toBeNull();
  });
});

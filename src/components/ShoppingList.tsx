import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { FOODS } from '../data/foods';
import { PANTRY } from '../data/pantry';
import { RECIPE_BY_ID } from '../data/recipes';
import { useI18n } from '../i18n/context';
import { ingredientName, recipeTitle } from '../i18n/content';
import { groupItems, inPantry, itemName, itemQuantity, listAsText, manualItem, SHOP_CATEGORY_ORDER } from '../lib/grocery';
import { LIMITS, liveItems, newOpId, progress, SHOP_CATEGORIES, type ListDoc, type ListItem, type ListOp, type ShopCategory } from '../lib/listModel';
import { listSubtitle } from '../lib/pdf';
import { canShareNatively, copyText, downloadPdf, mailtoUrl, shareList, whatsappUrl } from '../lib/share';
import { IconChevron, IconPlus, IconShare, IconTrash } from './Icons';

/** A list operation before it gets its id. */
type OpInput = ListOp extends infer T ? (T extends ListOp ? Omit<T, 'opId'> : never) : never;

const COLLAPSED_KEY = 'fodmap-kitchen:shop-collapsed';
const GROUP_KEY = 'fodmap-kitchen:shop-group-bought';

/** Per-device display conveniences (not list data). */
function readPref<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writePref(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    // Storage blocked: the setting lasts for this visit only.
  }
}

interface Props {
  doc: ListDoc;
  onOp: (op: ListOp) => void;
  pantrySelection: string[];
  /** Shown when the planned meals changed after the list was made. */
  stale?: boolean;
  onUpdateFromPlan?: () => void;
  /** Sync status etc., shown under the title. */
  status?: ReactNode;
}

export function ShoppingList({ doc, onOp, pantrySelection, stale, onUpdateFromPlan, status }: Props) {
  const { m } = useI18n();
  const t = m.shopping;
  const [collapsed, setCollapsed] = useState<string[]>(() => readPref(COLLAPSED_KEY, []));
  const [groupBought, setGroupBought] = useState<boolean>(() => readPref(GROUP_KEY, false));
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState<ShopCategory | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const live = liveItems(doc);
  const { done, total } = progress(doc);
  const shown = groupBought ? live.filter((i) => !i.checked) : live;
  const groups = groupItems(shown);
  const bought = groupItems(live.filter((i) => i.checked)).flatMap(([, l]) => l);

  const toggleCollapsed = (key: string) => {
    const next = collapsed.includes(key) ? collapsed.filter((k) => k !== key) : [...collapsed, key];
    setCollapsed(next);
    writePref(COLLAPSED_KEY, next);
  };

  const op = (o: OpInput) => onOp({ ...o, opId: newOpId() } as ListOp);

  const add = (name: string, qty: string, category: ShopCategory) => {
    const item = manualItem(name, qty, category);
    const existing = doc.items.find((i) => i.id === item.id && !i.deleted);
    if (existing) {
      setNotice(t.already(itemName(existing)));
      if (existing.checked) op({ type: 'update', id: existing.id, patch: { checked: false } });
      return false;
    }
    setNotice(null);
    op({ type: 'add', item });
    return true;
  };

  return (
    <div className="card grocery shop">
      <div className="section-head">
        <h2>{t.listTitle}</h2>
        {status}
      </div>
      <p className="small muted" style={{ margin: '0 0 10px' }}>
        {listSubtitle(doc)}
      </p>

      <div className="shop-progress" aria-live="polite">
        <span className="small">
          <strong>{t.progress(done, total)}</strong>
        </span>
        <div className="bar" role="progressbar" aria-label={t.progress(done, total)} aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
          <span style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
        </div>
      </div>

      <div className="row no-print shop-controls">
        <div className="stepper" role="group" aria-label={t.peopleLabel}>
          <button type="button" aria-label={t.fewerPeople} disabled={doc.people <= 1} onClick={() => op({ type: 'setPeople', people: doc.people - 1 })}>
            −
          </button>
          <output aria-live="polite">{t.people(doc.people)}</output>
          <button type="button" aria-label={t.morePeople} disabled={doc.people >= LIMITS.people} onClick={() => op({ type: 'setPeople', people: doc.people + 1 })}>
            +
          </button>
        </div>
        <button
          type="button"
          className="btn small ghost"
          aria-pressed={groupBought}
          onClick={() => {
            setGroupBought(!groupBought);
            writePref(GROUP_KEY, !groupBought);
          }}
        >
          {t.groupBought}
        </button>
        {done > 0 && (
          <button type="button" className="btn small ghost" onClick={() => op({ type: 'uncheckAll' })}>
            {t.uncheckAll}
          </button>
        )}
      </div>

      {stale && onUpdateFromPlan && (
        <div className="notice warn no-print" style={{ margin: '10px 0' }}>
          {t.stale}{' '}
          <button type="button" className="btn small" onClick={onUpdateFromPlan}>
            {t.update}
          </button>
        </div>
      )}
      {notice && (
        <div className="notice info" role="status" style={{ margin: '10px 0' }}>
          {notice}
        </div>
      )}

      {!live.length && <p className="muted">{m.grocery.empty}</p>}

      {groups.map(([cat, items]) => {
        const open = !collapsed.includes(cat);
        const left = items.filter((i) => !i.checked).length;
        return (
          <section key={cat} className="shop-cat" data-cat={cat}>
            <h3>
              <button type="button" className="cat-head" aria-expanded={open} onClick={() => toggleCollapsed(cat)} aria-label={t.toggleCategory(t.categories[cat])}>
                <IconChevron className="chev" width={16} height={16} />
                <span className="cat-name">{t.categories[cat]}</span>
                <span className="cat-count">{left}</span>
              </button>
            </h3>
            {open && (
              <ul>
                {items.map((i) => (
                  <ItemRow key={i.id} item={i} editing={editing === i.id} setEditing={setEditing} onOp={op} pantry={inPantry(i, pantrySelection)} />
                ))}
                <li className="add-row no-print">
                  {adding === cat ? (
                    <AddForm category={cat} onAdd={add} onDone={() => setAdding(null)} />
                  ) : (
                    <button type="button" className="add-btn" onClick={() => setAdding(cat)} aria-label={t.addTo(t.categories[cat])}>
                      <IconPlus width={18} height={18} /> {t.addItem}
                    </button>
                  )}
                </li>
              </ul>
            )}
          </section>
        );
      })}

      {groupBought && bought.length > 0 && (
        <section className="shop-cat bought">
          <h3>
            <button type="button" className="cat-head" aria-expanded={!collapsed.includes('bought')} onClick={() => toggleCollapsed('bought')}>
              <IconChevron className="chev" width={16} height={16} />
              <span className="cat-name">{t.bought(bought.length)}</span>
            </button>
          </h3>
          {!collapsed.includes('bought') && (
            <ul>
              {bought.map((i) => (
                <ItemRow key={i.id} item={i} editing={editing === i.id} setEditing={setEditing} onOp={op} pantry={false} />
              ))}
            </ul>
          )}
        </section>
      )}

      <div className="no-print" style={{ marginTop: 14 }}>
        <GlobalAdd onAdd={add} />
      </div>
    </div>
  );
}

function ItemRow({ item, editing, setEditing, onOp, pantry }: { item: ListItem; editing: boolean; setEditing: (id: string | null) => void; onOp: (o: OpInput) => void; pantry: boolean }) {
  const { m } = useI18n();
  const t = m.shopping;
  const name = itemName(item);
  const qty = itemQuantity(item);
  const recipes = (item.recipes ?? []).map((id) => RECIPE_BY_ID.get(id)).filter((r) => !!r);
  if (editing) {
    return (
      <li className="editing">
        <EditForm
          item={item}
          onSave={(patch) => {
            if (Object.keys(patch).length) onOp({ type: 'update', id: item.id, patch });
            setEditing(null);
          }}
          onDelete={() => {
            onOp({ type: 'delete', id: item.id });
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
        />
      </li>
    );
  }
  return (
    <li className={item.checked ? 'done' : ''} data-item={item.id}>
      <input type="checkbox" className="round" checked={item.checked} aria-label={name} onChange={() => onOp({ type: 'update', id: item.id, patch: { checked: !item.checked } })} />
      <button type="button" className="item-main" onClick={() => setEditing(item.id)} aria-label={`${t.edit(name)}${qty ? ` — ${qty}` : ''}`}>
        <span className="gname">{name}</span>
        {qty && <span className="qty">{qty}</span>}
        {(pantry || item.optional) && (
          <span className="tags">
            {pantry && <span className="badge eat">{t.inPantry}</span>}
            {item.optional && <span className="badge neutral">{t.optional}</span>}
          </span>
        )}
        {recipes.length > 0 && <span className="small muted for">{t.forRecipes(recipes.map((r) => recipeTitle(r)).join(', '))}</span>}
      </button>
      <button type="button" className="icon-btn no-print" aria-label={t.deleteItem(name)} onClick={() => onOp({ type: 'delete', id: item.id })}>
        <IconTrash width={18} height={18} />
      </button>
    </li>
  );
}

function EditForm({ item, onSave, onDelete, onCancel }: { item: ListItem; onSave: (p: Extract<ListOp, { type: 'update' }>['patch']) => void; onDelete: () => void; onCancel: () => void }) {
  const { m } = useI18n();
  const t = m.shopping;
  const shownName = itemName(item);
  const shownQty = itemQuantity(item);
  const [name, setName] = useState(shownName);
  const [qty, setQty] = useState(shownQty);
  const [category, setCategory] = useState(item.category);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const patch: Extract<ListOp, { type: 'update' }>['patch'] = {};
    // Unchanged names stay linked to the ingredient, so they keep following the app language.
    if (name.trim() && name.trim() !== shownName) patch.name = name.trim();
    if (qty.trim() !== shownQty) patch.qtyText = qty.trim();
    if (category !== item.category) patch.category = category;
    onSave(patch);
  };
  return (
    <form className="edit-form" onSubmit={submit}>
      <label>
        <span>{t.nameLabel}</span>
        <input type="text" value={name} maxLength={LIMITS.text} onChange={(e) => setName(e.target.value)} autoFocus />
      </label>
      <label>
        <span>{t.qtyLabel}</span>
        <input type="text" value={qty} maxLength={40} onChange={(e) => setQty(e.target.value)} />
      </label>
      <label>
        <span>{t.categoryLabel}</span>
        <select value={category} onChange={(e) => setCategory(e.target.value as ShopCategory)}>
          {SHOP_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {t.categories[c]}
            </option>
          ))}
        </select>
      </label>
      <div className="row">
        <button type="submit" className="btn small primary">
          {t.save}
        </button>
        <button type="button" className="btn small" onClick={onCancel}>
          {t.cancel}
        </button>
        <button type="button" className="btn small danger" onClick={onDelete}>
          {t.deleteItem(shownName)}
        </button>
      </div>
    </form>
  );
}

function useProductNames(): string[] {
  const { lang } = useI18n();
  return useMemo(() => {
    void lang;
    return [...new Set([...FOODS.map((f) => ingredientName(f.id)), ...PANTRY.map((p) => ingredientName(p.id))])];
  }, [lang]);
}

function AddForm({ category, onAdd, onDone }: { category: ShopCategory; onAdd: (name: string, qty: string, c: ShopCategory) => boolean; onDone: () => void }) {
  const { m } = useI18n();
  const t = m.shopping;
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const names = useProductNames();
  const listId = `products-${category}`;
  return (
    <form
      className="add-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return onDone();
        if (onAdd(name, qty, category)) {
          setName('');
          setQty('');
        }
      }}
    >
      <input type="text" list={listId} value={name} maxLength={LIMITS.text} placeholder={t.newItem} aria-label={t.nameLabel} onChange={(e) => setName(e.target.value)} autoFocus />
      <datalist id={listId}>
        {names.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      <input type="text" value={qty} maxLength={40} placeholder={t.qtyPlaceholder} aria-label={t.qtyLabel} onChange={(e) => setQty(e.target.value)} className="qty-in" />
      <button type="submit" className="btn small primary">
        {t.addItem}
      </button>
      <button type="button" className="btn small ghost" onClick={onDone}>
        {t.cancel}
      </button>
    </form>
  );
}

/** "Add item" with a category picker, for categories that are not on the list yet. */
function GlobalAdd({ onAdd }: { onAdd: (name: string, qty: string, c: ShopCategory) => boolean }) {
  const { m } = useI18n();
  const t = m.shopping;
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<ShopCategory>('other');
  if (!open) {
    return (
      <button type="button" className="btn small" onClick={() => setOpen(true)}>
        <IconPlus width={16} height={16} /> {t.addItem}
      </button>
    );
  }
  return (
    <div className="global-add">
      <label className="small">
        {t.categoryLabel}{' '}
        <select value={category} onChange={(e) => setCategory(e.target.value as ShopCategory)}>
          {SHOP_CATEGORY_ORDER.map((c) => (
            <option key={c} value={c}>
              {t.categories[c]}
            </option>
          ))}
        </select>
      </label>
      <AddForm category={category} onAdd={onAdd} onDone={() => setOpen(false)} />
    </div>
  );
}

/** Share, copy, PDF and print. */
export function ExportBar({ doc }: { doc: ListDoc }) {
  const { m } = useI18n();
  const t = m.shopping;
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const native = canShareNatively();
  const text = listAsText(doc);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="card section no-print export-bar" aria-labelledby="export-h">
      <h2 id="export-h" style={{ fontSize: '1.1rem' }}>
        {t.exportTitle}
      </h2>
      <div className="row">
        {native && (
          <button
            type="button"
            className="btn primary"
            disabled={busy}
            onClick={() =>
              run(async () => {
                const r = await shareList(doc);
                if (r === 'failed') setMsg(t.shareFailed);
              })
            }
          >
            <IconShare width={18} height={18} /> {t.share}
          </button>
        )}
        <button type="button" className="btn" disabled={busy} onClick={() => run(async () => setMsg((await copyText(text)) ? t.copied : t.shareFailed))}>
          {t.copy}
        </button>
        <button type="button" className="btn" disabled={busy} onClick={() => run(() => downloadPdf(doc))}>
          {t.downloadPdf}
        </button>
        <button type="button" className="btn" onClick={() => window.print()}>
          {t.print}
        </button>
        {!native && (
          <>
            <a className="btn" href={whatsappUrl(text)} target="_blank" rel="noopener noreferrer">
              {t.whatsapp}
            </a>
            <a className="btn" href={mailtoUrl(`${t.listTitle} — ${doc.title}`, text)}>
              {t.email}
            </a>
          </>
        )}
      </div>
      {msg && (
        <p className="small" role="status" style={{ margin: '8px 0 0' }}>
          {msg}
        </p>
      )}
    </section>
  );
}

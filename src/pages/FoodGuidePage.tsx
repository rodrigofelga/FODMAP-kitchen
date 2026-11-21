import { useMemo, useState } from 'react';
import { CATEGORY_ORDER, FOODS, type FoodCategory, type FoodStatus } from '../data/foods';
import { RECIPES } from '../data/recipes';
import { foodMatches } from '../lib/search';
import { useStore } from '../lib/store';
import { IconSearch } from '../components/Icons';
import { useI18n } from '../i18n/context';
import { categoryLabel, ingredientName } from '../i18n/content';

const STATUSES: FoodStatus[] = ['eat', 'limit', 'avoid'];
const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });

const usage = new Map<string, number>();
for (const r of RECIPES) for (const i of r.ingredients) usage.set(i.id, (usage.get(i.id) ?? 0) + 1);

export function FoodGuidePage() {
  const { profile } = useStore();
  const { m } = useI18n();
  const g = m.guide;
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<FoodStatus | 'all'>('all');
  const [cat, setCat] = useState<FoodCategory | 'all'>('all');
  const excluded = new Set(profile.prefs.excluded);
  const tolerated = new Set(profile.prefs.tolerated);

  const filtered = useMemo(
    () => FOODS.filter((f) => (status === 'all' || f.status === status) && (cat === 'all' || f.category === cat) && foodMatches(f, q)),
    [q, status, cat],
  );

  const counts = useMemo(() => Object.fromEntries(STATUSES.map((s) => [s, FOODS.filter((f) => f.status === s).length])), []);

  return (
    <>
      <div className="page-head">
        <h1>{g.title}</h1>
        <p>{g.intro(FOODS.length, counts.eat, counts.limit, counts.avoid)}</p>
      </div>

      <div className="notice info" style={{ marginBottom: 12 }}>
        <strong>{g.howTitle}</strong> {g.footer} <strong>{m.status.eat}</strong>
        {g.howEat} <strong>{m.status.limit}</strong>
        {g.howLimit} <strong>{m.status.avoid}</strong>
        {g.howAvoid}
      </div>

      <label className="search">
        <IconSearch />
        <span className="sr-only">{g.searchLabel}</span>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={g.searchPlaceholder} />
      </label>

      <div className="chips" role="group" aria-label={g.filterStatus} style={{ marginTop: 12 }}>
        <button className="chip" aria-pressed={status === 'all'} onClick={() => setStatus('all')}>
          {g.all}
        </button>
        {STATUSES.map((s) => (
          <button key={s} className="chip" aria-pressed={status === s} onClick={() => setStatus(s)}>
            {m.status[s]} ({counts[s]})
          </button>
        ))}
      </div>
      <div className="chips" role="group" aria-label={g.filterCategory}>
        <button className="chip" aria-pressed={cat === 'all'} onClick={() => setCat('all')}>
          {g.allCategories}
        </button>
        {CATEGORY_ORDER.map((c) => (
          <button key={c} className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>
            {categoryLabel(c)}
          </button>
        ))}
      </div>

      <p className="small muted" aria-live="polite">
        {g.showing(filtered.length, FOODS.length)}
      </p>

      {CATEGORY_ORDER.map((c) => {
        const inCat = filtered.filter((f) => f.category === c);
        if (!inCat.length) return null;
        return (
          <section key={c} className="food-group" aria-labelledby={`cat-${c}`}>
            <h2 id={`cat-${c}`}>{categoryLabel(c)}</h2>
            <div className="food-cols">
              {STATUSES.map((s) => {
                const list = inCat.filter((f) => f.status === s).sort((a, b) => collator.compare(ingredientName(a.id), ingredientName(b.id)));
                if (!list.length) return null;
                return (
                  <div key={s} className={`food-col ${s}`}>
                    <header>{m.status[s]}</header>
                    <ul>
                      {list.map((f) => (
                        <li key={f.id} data-food={f.id}>
                          {ingredientName(f.id)}
                          {f.sourceTruncated && <small>{g.truncated}</small>}
                          {excluded.has(f.id) && <small>{g.youExcluded}</small>}
                          {tolerated.has(f.id) && <small>{g.youTolerate}</small>}
                          {(usage.get(f.id) ?? 0) > 0 && (
                            <small>{g.usedIn(usage.get(f.id)!)}</small>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {!filtered.length && <p className="empty">{g.noMatch(q)}</p>}

      <section className="section card">
        <h2>{g.ideasTitle}</h2>
        <p className="small muted">{g.ideasSource}</p>
        <table className="meta">
          <tbody>
            {g.ideas.map(([slot, text]) => (
              <tr key={slot}>
                <td>{slot}</td>
                <td>{text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

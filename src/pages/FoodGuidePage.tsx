import { useMemo, useState } from 'react';
import { CATEGORY_LABELS, CATEGORY_ORDER, FOODS, GUIDE_FOOTER, GUIDE_MEAL_IDEAS, STATUS_LABELS, type FoodCategory, type FoodStatus } from '../data/foods';
import { RECIPES } from '../data/recipes';
import { foodMatches } from '../lib/search';
import { useStore } from '../lib/store';
import { IconSearch } from '../components/Icons';

const STATUSES: FoodStatus[] = ['eat', 'limit', 'avoid'];
const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });

const usage = new Map<string, number>();
for (const r of RECIPES) for (const i of r.ingredients) usage.set(i.id, (usage.get(i.id) ?? 0) + 1);

export function FoodGuidePage() {
  const { profile } = useStore();
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
        <h1>Food Guide</h1>
        <p>
          All {FOODS.length} foods from your IBS low-FODMAP guide: {counts.eat} EAT, {counts.limit} LIMIT / CHECK and {counts.avoid} AVOID FOR NOW.
        </p>
      </div>

      <div className="notice info" style={{ marginBottom: 12 }}>
        <strong>How to read this guide.</strong> {GUIDE_FOOTER} <strong>EAT</strong> foods are generally well tolerated in normal portions.{' '}
        <strong>LIMIT / CHECK</strong> foods depend on portion size or ingredients — read labels and keep portions small.{' '}
        <strong>AVOID FOR NOW</strong> foods should be left out during the elimination phase. Regular black coffee is listed as EAT if you tolerate it.
      </div>

      <label className="search">
        <IconSearch />
        <span className="sr-only">Search foods</span>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search in English or Portuguese, e.g. alho, feijão" />
      </label>

      <div className="chips" role="group" aria-label="Filter by classification" style={{ marginTop: 12 }}>
        <button className="chip" aria-pressed={status === 'all'} onClick={() => setStatus('all')}>
          All
        </button>
        {STATUSES.map((s) => (
          <button key={s} className="chip" aria-pressed={status === s} onClick={() => setStatus(s)}>
            {STATUS_LABELS[s]} ({counts[s]})
          </button>
        ))}
      </div>
      <div className="chips" role="group" aria-label="Filter by category">
        <button className="chip" aria-pressed={cat === 'all'} onClick={() => setCat('all')}>
          All categories
        </button>
        {CATEGORY_ORDER.map((c) => (
          <button key={c} className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      <p className="small muted" aria-live="polite">
        Showing {filtered.length} of {FOODS.length} foods
      </p>

      {CATEGORY_ORDER.map((c) => {
        const inCat = filtered.filter((f) => f.category === c);
        if (!inCat.length) return null;
        return (
          <section key={c} className="food-group" aria-labelledby={`cat-${c}`}>
            <h2 id={`cat-${c}`}>{CATEGORY_LABELS[c]}</h2>
            <div className="food-cols">
              {STATUSES.map((s) => {
                const list = inCat.filter((f) => f.status === s).sort((a, b) => collator.compare(a.name, b.name));
                if (!list.length) return null;
                return (
                  <div key={s} className={`food-col ${s}`}>
                    <header>{STATUS_LABELS[s]}</header>
                    <ul>
                      {list.map((f) => (
                        <li key={f.id} data-food={f.id}>
                          {f.name}
                          {f.sourceTruncated && <small>Text is cut off in the source PDF; shown exactly as printed.</small>}
                          {excluded.has(f.id) && <small>You excluded this food in Settings.</small>}
                          {tolerated.has(f.id) && <small>You marked this as tolerated.</small>}
                          {(usage.get(f.id) ?? 0) > 0 && (
                            <small>
                              Used in {usage.get(f.id)} recipe{usage.get(f.id)! > 1 ? 's' : ''}
                            </small>
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

      {!filtered.length && <p className="empty">No foods match “{q}”. Try another spelling or the Portuguese name.</p>}

      <section className="section card">
        <h2>Simple Brazilian-style meal ideas</h2>
        <p className="small muted">From page 1 of the guide.</p>
        <table className="meta">
          <tbody>
            {GUIDE_MEAL_IDEAS.map((m) => (
              <tr key={m.slot}>
                <td>{m.slot}</td>
                <td>{m.text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RECIPES, RECIPE_BY_ID } from '../data/recipes';
import { MEALS, MEAL_LABELS, type Meal } from '../data/types';
import { evaluateRecipe } from '../lib/analysis';
import { buildGroceryList, DAY_NAMES, emptyDay, generateWeek, newPlan, planRecipeCount, type MealPlan } from '../lib/planner';
import { useStore } from '../lib/store';
import { StatusBadge, VerdictBadge } from '../components/RecipeBits';

type Tab = 'week' | 'grocery' | 'saved';

export function PlannerPage() {
  const { profile, updateProfile } = useStore();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'week';
  const setTab = (t: Tab) => setParams(t === 'week' ? {} : { tab: t }, { replace: true });
  const plan = profile.plans.find((p) => p.id === profile.activePlanId) ?? null;
  const prefs = profile.prefs;

  const savePlan = (next: MealPlan) =>
    updateProfile((p) => ({ ...p, plans: p.plans.some((x) => x.id === next.id) ? p.plans.map((x) => (x.id === next.id ? next : x)) : [...p.plans, next], activePlanId: next.id }));

  const create = (generate: boolean) => {
    const n = newPlan(`Week of ${new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`);
    if (generate) n.days = generateWeek(RECIPES, prefs, profile.favourites);
    savePlan(n);
  };

  const options = useMemo(() => {
    const out = {} as Record<Meal, { id: string; title: string; excluded: boolean }[]>;
    for (const m of MEALS)
      out[m] = RECIPES.filter((r) => r.meal === m)
        .map((r) => ({ id: r.id, title: r.title, excluded: evaluateRecipe(r, prefs).verdict === 'excluded' }))
        .sort((a, b) => a.title.localeCompare(b.title));
    return out;
  }, [prefs]);

  return (
    <>
      <div className="page-head">
        <h1>Meal Planner</h1>
        <p>Plan seven days of breakfast, lunch, dinner and snacks. Your plans are saved on this device.</p>
      </div>

      <div className="seg no-print" role="group" aria-label="Planner sections" style={{ marginBottom: 16 }}>
        <button aria-pressed={tab === 'week'} onClick={() => setTab('week')}>
          Week
        </button>
        <button aria-pressed={tab === 'grocery'} onClick={() => setTab('grocery')}>
          Grocery list
        </button>
        <button aria-pressed={tab === 'saved'} onClick={() => setTab('saved')}>
          Saved plans ({profile.plans.length})
        </button>
      </div>

      {!plan && tab !== 'saved' ? (
        <div className="card">
          <h2>No meal plan yet</h2>
          <p className="muted">Generate a week from recipes that fit your settings (favourites first), or start empty and choose each meal.</p>
          <div className="row">
            <button className="btn primary" onClick={() => create(true)}>
              Generate a week
            </button>
            <button className="btn" onClick={() => create(false)}>
              Start an empty week
            </button>
          </div>
        </div>
      ) : null}

      {plan && tab === 'week' && (
        <>
          <div className="card no-print" style={{ marginBottom: 16 }}>
            <div className="field" style={{ marginBottom: 10 }}>
              <label htmlFor="plan-name">Plan name</label>
              <input id="plan-name" type="text" value={plan.name} maxLength={60} onChange={(e) => savePlan({ ...plan, name: e.target.value })} />
            </div>
            <div className="row">
              <button className="btn primary" onClick={() => savePlan({ ...plan, days: generateWeek(RECIPES, prefs, profile.favourites, Date.now(), plan.days) })}>
                Fill empty slots
              </button>
              <button className="btn" onClick={() => savePlan({ ...plan, days: generateWeek(RECIPES, prefs, profile.favourites) })}>
                Regenerate all
              </button>
              <button className="btn ghost" onClick={() => savePlan({ ...plan, days: DAY_NAMES.map(emptyDay) })}>
                Clear week
              </button>
            </div>
            <p className="small muted" style={{ margin: '8px 0 0' }}>
              {planRecipeCount(plan)} of 28 meals planned. Generated plans skip recipes excluded by your settings.
            </p>
          </div>
          <div className="week">
            {plan.days.map((day, di) => (
              <section key={di} className="card day" aria-labelledby={`day-${di}`}>
                <h3 id={`day-${di}`}>{DAY_NAMES[di]}</h3>
                {MEALS.map((m) => {
                  const rid = day[m];
                  const r = rid ? RECIPE_BY_ID.get(rid) : undefined;
                  const ev = r ? evaluateRecipe(r, prefs) : null;
                  return (
                    <div key={m} className="slot">
                      <span className="label">{MEAL_LABELS[m]}</span>
                      <div style={{ minWidth: 0 }}>
                        <label className="sr-only" htmlFor={`s-${di}-${m}`}>
                          {DAY_NAMES[di]} {MEAL_LABELS[m]}
                        </label>
                        <select
                          id={`s-${di}-${m}`}
                          value={rid ?? ''}
                          onChange={(e) => {
                            const days = plan.days.map((d, i) => (i === di ? { ...d, [m]: e.target.value || null } : d));
                            savePlan({ ...plan, days });
                          }}
                        >
                          <option value="">— Not planned —</option>
                          {options[m].map((o) => (
                            <option key={o.id} value={o.id} disabled={o.excluded && o.id !== rid}>
                              {o.title}
                              {o.excluded ? ' (not for you now)' : ''}
                            </option>
                          ))}
                        </select>
                        {r && ev && (
                          <div className="row small" style={{ marginTop: 4 }}>
                            <Link to={`/recipes/${r.id}`}>View recipe</Link>
                            {ev.verdict !== 'suitable' && <VerdictBadge verdict={ev.verdict} />}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </section>
            ))}
          </div>
        </>
      )}

      {plan && tab === 'grocery' && <GroceryList plan={plan} onChange={savePlan} householdSize={prefs.householdSize} />}

      {tab === 'saved' && (
        <div className="card">
          {profile.plans.length === 0 && <p className="muted">No saved plans yet.</p>}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {profile.plans.map((p) => (
              <li key={p.id} className="slot" style={{ gridTemplateColumns: '1fr auto' }}>
                <div style={{ minWidth: 0 }}>
                  <strong>{p.name}</strong>
                  {p.id === profile.activePlanId && <span className="badge eat" style={{ marginLeft: 6 }}>Active</span>}
                  <div className="small muted">
                    {planRecipeCount(p)} meals · created {new Date(p.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="row">
                  {p.id !== profile.activePlanId && (
                    <button className="btn small" onClick={() => updateProfile((pr) => ({ ...pr, activePlanId: p.id }))}>
                      Open
                    </button>
                  )}
                  <button className="btn small" onClick={() => savePlan({ ...structuredClone(p), ...newPlanIdentity(`${p.name} (copy)`) })}>
                    Duplicate
                  </button>
                  <button
                    className="btn small danger"
                    onClick={() => {
                      if (!confirm(`Delete “${p.name}”? This cannot be undone.`)) return;
                      updateProfile((pr) => {
                        const plans = pr.plans.filter((x) => x.id !== p.id);
                        return { ...pr, plans, activePlanId: pr.activePlanId === p.id ? (plans[0]?.id ?? null) : pr.activePlanId };
                      });
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn primary" onClick={() => create(true)}>
              New generated week
            </button>
            <button className="btn" onClick={() => create(false)}>
              New empty week
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function newPlanIdentity(name: string) {
  const n = newPlan(name);
  return { id: n.id, name: n.name, createdAt: n.createdAt, checked: [] as string[] };
}

function GroceryList({ plan, onChange, householdSize }: { plan: MealPlan; onChange: (p: MealPlan) => void; householdSize: number }) {
  const lines = useMemo(() => buildGroceryList(plan, householdSize), [plan, householdSize]);
  const checked = new Set(plan.checked);
  const groups = [...new Set(lines.map((l) => l.group))];
  const [copied, setCopied] = useState(false);
  if (!lines.length) return <p className="empty">Add meals to your week to build a grocery list.</p>;
  const toggle = (k: string) => onChange({ ...plan, checked: checked.has(k) ? plan.checked.filter((x) => x !== k) : [...plan.checked, k] });
  const text = groups.map((g) => `${g}\n${lines.filter((l) => l.group === g).map((l) => `- ${l.name}: ${l.amounts}`).join('\n')}`).join('\n\n');
  return (
    <div className="card grocery">
      <div className="section-head">
        <h2>Grocery list</h2>
        <span className="small muted">
          {lines.length - lines.filter((l) => checked.has(l.key)).length} of {lines.length} left
        </span>
      </div>
      <p className="small muted">
        Amounts are scaled to {householdSize} {householdSize === 1 ? 'person' : 'people'} per meal (change in Settings) and rounded up.
      </p>
      <div className="row no-print" style={{ marginBottom: 8 }}>
        <button className="btn small" onClick={() => window.print()}>
          Print
        </button>
        <button
          className="btn small"
          onClick={() =>
            navigator.clipboard?.writeText(`${plan.name}\n\n${text}`).then(
              () => setCopied(true),
              () => setCopied(false),
            )
          }
        >
          {copied ? 'Copied!' : 'Copy as text'}
        </button>
        {plan.checked.length > 0 && (
          <button className="btn small ghost" onClick={() => onChange({ ...plan, checked: [] })}>
            Untick all
          </button>
        )}
      </div>
      {groups.map((g) => (
        <section key={g} style={{ marginTop: 12 }}>
          <h3>{g}</h3>
          <ul>
            {lines
              .filter((l) => l.group === g)
              .map((l) => (
                <li key={l.key} className={checked.has(l.key) ? 'done' : ''}>
                  <input type="checkbox" id={`g-${l.key}`} checked={checked.has(l.key)} onChange={() => toggle(l.key)} />
                  <label htmlFor={`g-${l.key}`} style={{ minWidth: 0, flex: 1 }}>
                    <span className="gname">{l.name}</span> — {l.amounts} {l.status !== 'eat' && <StatusBadge status={l.status as 'limit'} />}
                    <span className="small muted" style={{ display: 'block' }}>
                      For: {l.recipes.join(', ')}
                    </span>
                  </label>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

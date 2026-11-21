import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RECIPES, RECIPE_BY_ID } from '../data/recipes';
import { MEALS, type Meal } from '../data/types';
import { evaluateRecipe } from '../lib/analysis';
import { buildGroceryList, DAY_NAMES, emptyDay, generateWeek, newPlan, planRecipeCount, type MealPlan } from '../lib/planner';
import { useStore } from '../lib/store';
import { StatusBadge, VerdictBadge } from '../components/RecipeBits';
import { useI18n } from '../i18n/context';
import { compareText, type Lang } from '../i18n/core';
import { recipeTitle } from '../i18n/content';

/** English keeps the browser's own date format (as before); Portuguese uses Brazilian dates. */
const dateLocale = (lang: Lang) => (lang === 'en' ? undefined : 'pt-BR');

type Tab = 'week' | 'grocery' | 'saved';

export function PlannerPage() {
  const { profile, updateProfile } = useStore();
  const { lang, m: msg } = useI18n();
  const t = msg.planner;
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'week';
  const setTab = (t: Tab) => setParams(t === 'week' ? {} : { tab: t }, { replace: true });
  const plan = profile.plans.find((p) => p.id === profile.activePlanId) ?? null;
  const prefs = profile.prefs;

  const savePlan = (next: MealPlan) =>
    updateProfile((p) => ({ ...p, plans: p.plans.some((x) => x.id === next.id) ? p.plans.map((x) => (x.id === next.id ? next : x)) : [...p.plans, next], activePlanId: next.id }));

  const create = (generate: boolean) => {
    const n = newPlan(t.weekOf(new Date().toLocaleDateString(dateLocale(lang), { day: 'numeric', month: 'short' })));
    if (generate) n.days = generateWeek(RECIPES, prefs, profile.favourites);
    savePlan(n);
  };

  const options = useMemo(() => {
    const out = {} as Record<Meal, { id: string; title: string; excluded: boolean }[]>;
    for (const m of MEALS)
      out[m] = RECIPES.filter((r) => r.meal === m)
        .map((r) => ({ id: r.id, title: recipeTitle(r), excluded: evaluateRecipe(r, prefs).verdict === 'excluded' }))
        .sort((a, b) => compareText(a.title, b.title));
    return out;
  }, [prefs]);

  return (
    <>
      <div className="page-head">
        <h1>{t.title}</h1>
        <p>{t.intro}</p>
      </div>

      <div className="seg no-print" role="group" aria-label={t.sections} style={{ marginBottom: 16 }}>
        <button aria-pressed={tab === 'week'} onClick={() => setTab('week')}>
          {t.week}
        </button>
        <button aria-pressed={tab === 'grocery'} onClick={() => setTab('grocery')}>
          {t.grocery}
        </button>
        <button aria-pressed={tab === 'saved'} onClick={() => setTab('saved')}>
          {t.saved(profile.plans.length)}
        </button>
      </div>

      {!plan && tab !== 'saved' ? (
        <div className="card">
          <h2>{t.noPlanTitle}</h2>
          <p className="muted">{t.noPlanBody}</p>
          <div className="row">
            <button className="btn primary" onClick={() => create(true)}>
              {t.generate}
            </button>
            <button className="btn" onClick={() => create(false)}>
              {t.startEmpty}
            </button>
          </div>
        </div>
      ) : null}

      {plan && tab === 'week' && (
        <>
          <div className="card no-print" style={{ marginBottom: 16 }}>
            <div className="field" style={{ marginBottom: 10 }}>
              <label htmlFor="plan-name">{t.planName}</label>
              <input id="plan-name" type="text" value={plan.name} maxLength={60} onChange={(e) => savePlan({ ...plan, name: e.target.value })} />
            </div>
            <div className="row">
              <button className="btn primary" onClick={() => savePlan({ ...plan, days: generateWeek(RECIPES, prefs, profile.favourites, Date.now(), plan.days) })}>
                {t.fillEmpty}
              </button>
              <button className="btn" onClick={() => savePlan({ ...plan, days: generateWeek(RECIPES, prefs, profile.favourites) })}>
                {t.regenerate}
              </button>
              <button className="btn ghost" onClick={() => savePlan({ ...plan, days: DAY_NAMES.map(emptyDay) })}>
                {t.clearWeek}
              </button>
            </div>
            <p className="small muted" style={{ margin: '8px 0 0' }}>
              {t.plannedCount(planRecipeCount(plan))}
            </p>
          </div>
          <div className="week">
            {plan.days.map((day, di) => (
              <section key={di} className="card day" aria-labelledby={`day-${di}`}>
                <h3 id={`day-${di}`}>{msg.days[di]}</h3>
                {MEALS.map((m) => {
                  const rid = day[m];
                  const r = rid ? RECIPE_BY_ID.get(rid) : undefined;
                  const ev = r ? evaluateRecipe(r, prefs) : null;
                  return (
                    <div key={m} className="slot">
                      <span className="label">{msg.meals[m]}</span>
                      <div style={{ minWidth: 0 }}>
                        <label className="sr-only" htmlFor={`s-${di}-${m}`}>
                          {msg.days[di]} {msg.meals[m]}
                        </label>
                        <select
                          id={`s-${di}-${m}`}
                          value={rid ?? ''}
                          onChange={(e) => {
                            const days = plan.days.map((d, i) => (i === di ? { ...d, [m]: e.target.value || null } : d));
                            savePlan({ ...plan, days });
                          }}
                        >
                          <option value="">{t.notPlanned}</option>
                          {options[m].map((o) => (
                            <option key={o.id} value={o.id} disabled={o.excluded && o.id !== rid}>
                              {o.title}
                              {o.excluded ? t.notForYou : ''}
                            </option>
                          ))}
                        </select>
                        {r && ev && (
                          <div className="row small" style={{ marginTop: 4 }}>
                            <Link to={`/recipes/${r.id}`}>{t.viewRecipe}</Link>
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
          {profile.plans.length === 0 && <p className="muted">{t.noSaved}</p>}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {profile.plans.map((p) => (
              <li key={p.id} className="slot" style={{ gridTemplateColumns: '1fr auto' }}>
                <div style={{ minWidth: 0 }}>
                  <strong>{p.name}</strong>
                  {p.id === profile.activePlanId && <span className="badge eat" style={{ marginLeft: 6 }}>{t.active}</span>}
                  <div className="small muted">
                    {t.planMeta(planRecipeCount(p), new Date(p.createdAt).toLocaleDateString(dateLocale(lang)))}
                  </div>
                </div>
                <div className="row">
                  {p.id !== profile.activePlanId && (
                    <button className="btn small" onClick={() => updateProfile((pr) => ({ ...pr, activePlanId: p.id }))}>
                      {t.open}
                    </button>
                  )}
                  <button className="btn small" onClick={() => savePlan({ ...structuredClone(p), ...newPlanIdentity(t.copyName(p.name)) })}>
                    {t.duplicate}
                  </button>
                  <button
                    className="btn small danger"
                    onClick={() => {
                      if (!confirm(t.confirmDelete(p.name))) return;
                      updateProfile((pr) => {
                        const plans = pr.plans.filter((x) => x.id !== p.id);
                        return { ...pr, plans, activePlanId: pr.activePlanId === p.id ? (plans[0]?.id ?? null) : pr.activePlanId };
                      });
                    }}
                  >
                    {t.delete}
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn primary" onClick={() => create(true)}>
              {t.newGenerated}
            </button>
            <button className="btn" onClick={() => create(false)}>
              {t.newEmpty}
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
  const { m: msg } = useI18n();
  const t = msg.grocery;
  if (!lines.length) return <p className="empty">{t.empty}</p>;
  const toggle = (k: string) => onChange({ ...plan, checked: checked.has(k) ? plan.checked.filter((x) => x !== k) : [...plan.checked, k] });
  const text = groups.map((g) => `${g}\n${lines.filter((l) => l.group === g).map((l) => `- ${l.name}: ${l.amounts}`).join('\n')}`).join('\n\n');
  return (
    <div className="card grocery">
      <div className="section-head">
        <h2>{t.title}</h2>
        <span className="small muted">
          {t.left(lines.length - lines.filter((l) => checked.has(l.key)).length, lines.length)}
        </span>
      </div>
      <p className="small muted">
        {t.scaled(householdSize)}
      </p>
      <div className="row no-print" style={{ marginBottom: 8 }}>
        <button className="btn small" onClick={() => window.print()}>
          {t.print}
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
          {copied ? t.copied : t.copy}
        </button>
        {plan.checked.length > 0 && (
          <button className="btn small ghost" onClick={() => onChange({ ...plan, checked: [] })}>
            {t.untick}
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
                      {t.for(l.recipes.join(', '))}
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

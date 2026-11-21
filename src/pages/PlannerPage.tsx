import { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RECIPES, RECIPE_BY_ID } from '../data/recipes';
import { MEALS, type Meal } from '../data/types';
import { evaluateRecipe } from '../lib/analysis';
import { DAY_NAMES, emptyDay, generateWeek, newPlan, planRecipeCount, type MealPlan } from '../lib/planner';
import { useStore } from '../lib/store';
import { VerdictBadge } from '../components/RecipeBits';
import { ExportBar, ShoppingList } from '../components/ShoppingList';
import { SharePanel, StartSharing, SyncBadge } from '../components/SharePanel';
import { generateList, planSignature } from '../lib/grocery';
import { applyOp, liveItems, mergeRegenerated, newOpId, progress, type ListOp } from '../lib/listModel';
import { useSharedList } from '../lib/useSharedList';
import { effectiveDoc } from '../lib/sync';
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

  /** Makes (or refreshes) the week's grocery list and opens it. */
  const generateGrocery = () => {
    if (!plan) return;
    const shared = plan.sharedListId ? profile.sharedLists.find((r) => r.listId === plan.sharedListId && r.status === 'active') : undefined;
    if (shared) {
      const doc = generateList(plan, effectiveDoc(shared).people);
      updateProfile((p) => ({ ...p, sharedLists: p.sharedLists.map((r) => (r.listId === shared.listId ? { ...r, pending: [...r.pending, { type: 'regenerate', opId: newOpId(), doc }] } : r)) }));
    } else {
      updateProfile((p) => ({ ...p, plans: p.plans.map((x) => (x.id === plan.id ? { ...x, grocery: regeneratePlanList(x, prefs.householdSize) } : x)) }));
    }
    setTab('grocery');
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
            <div className="row" style={{ marginTop: 10 }}>
              <button className="btn primary" disabled={!planRecipeCount(plan)} onClick={generateGrocery}>
                {msg.shopping.generate}
              </button>
            </div>
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

      {plan && tab === 'grocery' && <GroceryTab plan={plan} />}
      {tab === 'grocery' && <SharedWithMe />}

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

/** Builds or refreshes a plan's grocery list, keeping ticks, renames and items added by hand. */
function regeneratePlanList(plan: MealPlan, people: number, now = Date.now()) {
  const fresh = generateList(plan, plan.grocery?.people ?? people, now);
  return plan.grocery ? mergeRegenerated(plan.grocery, fresh, now) : fresh;
}

function GroceryTab({ plan }: { plan: MealPlan }) {
  const { profile } = useStore();
  const ref = plan.sharedListId ? profile.sharedLists.find((r) => r.listId === plan.sharedListId) : undefined;
  if (ref) return <SharedGrocery plan={plan} listId={ref.listId} />;
  return <LocalGrocery plan={plan} />;
}

function LocalGrocery({ plan }: { plan: MealPlan }) {
  const { profile, updateProfile } = useStore();
  const people = profile.prefs.householdSize;
  const fallback = useMemo(() => generateList(plan, people), [plan, people]);
  const needsFresh = !plan.grocery || (!liveItems(plan.grocery).length && plan.grocery.source !== planSignature(plan));
  const doc = needsFresh ? fallback : plan.grocery!;

  // The first visit (or an empty list after the week changed) makes the list automatically.
  useEffect(() => {
    if (!needsFresh) return;
    updateProfile((p) => ({ ...p, plans: p.plans.map((x) => (x.id === plan.id ? { ...x, grocery: generateList(x, x.grocery?.people ?? people) } : x)) }));
  }, [needsFresh, plan.id, people, updateProfile]);

  const onOp = (op: ListOp) =>
    updateProfile((p) => ({
      ...p,
      plans: p.plans.map((x) => (x.id === plan.id ? { ...x, grocery: applyOp(x.grocery ?? generateList(x, people), op, Date.now()) } : x)),
    }));
  const update = () => updateProfile((p) => ({ ...p, plans: p.plans.map((x) => (x.id === plan.id ? { ...x, grocery: regeneratePlanList(x, people) } : x)) }));

  return (
    <>
      <ShoppingList doc={doc} onOp={onOp} pantrySelection={profile.pantrySelection} stale={!!doc.source && doc.source !== planSignature(plan)} onUpdateFromPlan={update} />
      <ExportBar doc={doc} />
      <StartSharing plan={plan} doc={doc} />
    </>
  );
}

function SharedGrocery({ plan, listId }: { plan: MealPlan; listId: string }) {
  const { profile } = useStore();
  const s = useSharedList(listId);
  if (!s.ref || !s.doc) return null;
  const doc = s.doc;
  return (
    <>
      {s.ref.status !== 'active' && <SharePanel sharedRef={s.ref} members={s.members} invite={s.invite} setInvite={s.setInvite} setMembers={s.setMembers} />}
      <ShoppingList
        doc={doc}
        onOp={s.dispatch}
        pantrySelection={profile.pantrySelection}
        stale={s.ref.status === 'active' && !!doc.source && doc.source !== planSignature(plan)}
        onUpdateFromPlan={() => s.dispatch({ type: 'regenerate', opId: newOpId(), doc: generateList(plan, doc.people) })}
        status={s.ref.status === 'active' ? <SyncBadge status={s.status} /> : undefined}
      />
      <ExportBar doc={doc} />
      {s.ref.status === 'active' && <SharePanel sharedRef={s.ref} members={s.members} invite={s.invite} setInvite={s.setInvite} setMembers={s.setMembers} />}
    </>
  );
}

/** Lists other people shared with this device. */
function SharedWithMe() {
  const { profile } = useStore();
  const { m } = useI18n();
  const t = m.shopping;
  const joined = profile.sharedLists.filter((r) => r.role === 'member');
  if (!joined.length) return null;
  return (
    <section className="card section no-print" aria-labelledby="shared-with-me">
      <h2 id="shared-with-me" style={{ fontSize: '1.1rem' }}>
        {t.sharedWithMe}
      </h2>
      <ul className="members">
        {joined.map((r) => {
          const d = effectiveDoc(r);
          const { done, total } = progress(d);
          return (
            <li key={r.listId}>
              <span style={{ minWidth: 0 }}>
                <strong>{d.title || t.listTitle}</strong>
                <span className="small muted" style={{ display: 'block' }}>
                  {r.status === 'active' ? t.progress(done, total) : r.status === 'revoked' ? t.revoked : t.gone}
                </span>
              </span>
              <Link className="btn small" to={`/lists/${r.listId}`}>
                {t.open}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RECIPES, RECIPE_BY_ID } from '../data/recipes';
import { MEALS, type Meal, type Recipe } from '../data/types';
import { evaluateRecipe } from '../lib/analysis';
import { buildGroceryList, mulberry32, planRecipeCount } from '../lib/planner';
import { useStore } from '../lib/store';
import { IconSearch } from '../components/Icons';
import { RecipeCard, RecipeImage } from '../components/RecipeBits';
import { useI18n } from '../i18n/context';
import { recipeTitle } from '../i18n/content';

/** Default profile names (every language) are not used in the greeting. */
const DEFAULT_NAMES = new Set(['Me', 'Eu']);

function todayIndex(): number {
  return (new Date().getDay() + 6) % 7; // Monday = 0
}

export function HomePage() {
  const { profile } = useStore();
  const navigate = useNavigate();
  const { m } = useI18n();
  const h = m.home;
  const [q, setQ] = useState('');
  const prefs = profile.prefs;
  const plan = profile.plans.find((p) => p.id === profile.activePlanId) ?? null;

  const eligible = useMemo(() => RECIPES.filter((r) => evaluateRecipe(r, prefs).verdict !== 'excluded'), [prefs]);

  const today = useMemo(() => {
    const day = plan?.days[todayIndex()];
    const d = new Date();
    const rand = mulberry32(d.getFullYear() * 1000 + d.getMonth() * 40 + d.getDate());
    return MEALS.map((meal): { meal: Meal; recipe: Recipe | undefined; planned: boolean } => {
      const planned = day?.[meal] ? RECIPE_BY_ID.get(day[meal]!) : undefined;
      if (planned) return { meal, recipe: planned, planned: true };
      const pool = eligible.filter((r) => r.meal === meal);
      return { meal, recipe: pool.length ? pool[Math.floor(rand() * pool.length)] : undefined, planned: false };
    });
  }, [plan, eligible]);

  const quick = useMemo(
    () =>
      eligible
        .filter((r) => r.brazilian && r.prepMinutes + r.cookMinutes <= 30)
        .sort((a, b) => a.prepMinutes + a.cookMinutes - (b.prepMinutes + b.cookMinutes))
        .slice(0, 10),
    [eligible],
  );

  const favourites = profile.favourites.map((id) => RECIPE_BY_ID.get(id)).filter((r): r is Recipe => !!r);

  const summary = useMemo(() => {
    if (!plan) return null;
    const count = planRecipeCount(plan);
    const unique = new Set(plan.days.flatMap((d) => MEALS.map((m) => d[m]).filter(Boolean))).size;
    const grocery = buildGroceryList(plan, prefs.householdSize);
    const checks = plan.days
      .flatMap((d) => MEALS.map((m) => d[m]))
      .filter((id): id is string => !!id)
      .filter((id) => evaluateRecipe(RECIPE_BY_ID.get(id)!, prefs).verdict === 'check').length;
    return { count, unique, items: grocery.length, left: grocery.filter((g) => !plan.checked.includes(g.key)).length, checks };
  }, [plan, prefs]);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate(`/recipes?q=${encodeURIComponent(q)}`);
  };

  return (
    <>
      <section className="hero">
        <span className="small muted">
          {m.days[todayIndex()]} · {prefs.phase === 'elimination' ? h.elimination : h.reintroduction}
        </span>
        <h1>{h.greeting(profile.name && !DEFAULT_NAMES.has(profile.name) ? profile.name : null)}</h1>
        <p className="muted" style={{ margin: 0 }}>
          {h.intro}
        </p>
      </section>

      <form className="section" role="search" onSubmit={onSearch}>
        <label className="search">
          <IconSearch />
          <span className="sr-only">{h.searchLabel}</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={h.searchPlaceholder} enterKeyHint="search" />
        </label>
      </form>

      <section className="section" aria-labelledby="today-h">
        <div className="section-head">
          <h2 id="today-h">{h.todayTitle}</h2>
          <Link to="/planner" className="small">
            {plan ? h.openPlanner : h.planWeek}
          </Link>
        </div>
        <div className="today-list">
          {today.map(({ meal, recipe, planned }) =>
            recipe ? (
              <Link key={meal} to={`/recipes/${recipe.id}`} className="today-item">
                <RecipeImage recipe={recipe} sizes="88px" />
                <div className="t">
                  <div className="lbl">
                    {m.meals[meal]} {planned ? h.planned : h.suggestion}
                  </div>
                  <div className="nm">{recipeTitle(recipe)}</div>
                  <div className="small muted">{m.common.minutes(recipe.prepMinutes + recipe.cookMinutes)}</div>
                </div>
              </Link>
            ) : (
              <div key={meal} className="card small muted">
                {h.noMealRecipes(meal)}
              </div>
            ),
          )}
        </div>
      </section>

      <section className="section card" aria-labelledby="matcher-h">
        <h2 id="matcher-h">{h.matcherTitle}</h2>
        <p className="muted">{h.matcherBody}</p>
        <Link to="/matcher" className="btn primary">
          {h.matcherButton}
        </Link>
      </section>

      <section className="section" aria-labelledby="quick-h">
        <div className="section-head">
          <h2 id="quick-h">{h.quickTitle}</h2>
          <Link to="/recipes?brazilian=1" className="small">
            {m.common.seeAll}
          </Link>
        </div>
        {quick.length ? (
          <div className="hscroll">
            {quick.map((r) => (
              <RecipeCard key={r.id} recipe={r} verdict={evaluateRecipe(r, prefs).verdict} />
            ))}
          </div>
        ) : (
          <p className="muted">{h.noQuick}</p>
        )}
      </section>

      <section className="section" aria-labelledby="fav-h">
        <div className="section-head">
          <h2 id="fav-h">{h.favTitle}</h2>
          {favourites.length > 0 && (
            <Link to="/recipes?fav=1" className="small">
              {m.common.seeAll}
            </Link>
          )}
        </div>
        {favourites.length ? (
          <div className="hscroll">
            {favourites.map((r) => (
              <RecipeCard key={r.id} recipe={r} verdict={evaluateRecipe(r, prefs).verdict} />
            ))}
          </div>
        ) : (
          <p className="muted">{h.noFav}</p>
        )}
      </section>

      <section className="section" aria-labelledby="week-h">
        <div className="section-head">
          <h2 id="week-h">{h.weekTitle}</h2>
        </div>
        {summary ? (
          <div className="card">
            <p style={{ fontWeight: 600 }}>{plan!.name}</p>
            <div className="stats">
              <div className="stat">
                <strong>{summary.count}/28</strong>
                <span>{h.mealsPlanned}</span>
              </div>
              <div className="stat">
                <strong>{summary.unique}</strong>
                <span>{h.differentRecipes}</span>
              </div>
              <div className="stat">
                <strong>{summary.left}</strong>
                <span>{h.groceryLeft(summary.items)}</span>
              </div>
              <div className="stat">
                <strong>{summary.checks}</strong>
                <span>{h.portionMeals}</span>
              </div>
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              <Link to="/planner" className="btn">
                {h.viewWeek}
              </Link>
              <Link to="/planner?tab=grocery" className="btn">
                {h.groceryList}
              </Link>
            </div>
          </div>
        ) : (
          <div className="card">
            <p className="muted">{h.noPlan}</p>
            <Link to="/planner" className="btn primary">
              {h.planMyWeek}
            </Link>
          </div>
        )}
      </section>

      <p className="small muted">
        {h.disclaimerBefore}
        <Link to="/settings#disclaimer">{h.disclaimerLink}</Link>
        {h.disclaimerAfter}
      </p>
    </>
  );
}

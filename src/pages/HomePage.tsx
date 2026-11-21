import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RECIPES, RECIPE_BY_ID } from '../data/recipes';
import { MEALS, MEAL_LABELS, type Meal, type Recipe } from '../data/types';
import { evaluateRecipe } from '../lib/analysis';
import { buildGroceryList, DAY_NAMES, mulberry32, planRecipeCount } from '../lib/planner';
import { useStore } from '../lib/store';
import { IconSearch } from '../components/Icons';
import { RecipeCard, RecipeImage } from '../components/RecipeBits';

function todayIndex(): number {
  return (new Date().getDay() + 6) % 7; // Monday = 0
}

export function HomePage() {
  const { profile } = useStore();
  const navigate = useNavigate();
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
          {DAY_NAMES[todayIndex()]} · {prefs.phase === 'elimination' ? 'Elimination phase' : 'Reintroduction phase'}
        </span>
        <h1>Olá{profile.name && profile.name !== 'Me' ? `, ${profile.name}` : ''}! What’s cooking today?</h1>
        <p className="muted" style={{ margin: 0 }}>
          Low-FODMAP, Brazilian-style recipes checked against your food guide.
        </p>
      </section>

      <form className="section" role="search" onSubmit={onSearch}>
        <label className="search">
          <IconSearch />
          <span className="sr-only">Search recipes</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search recipes, e.g. frango, tapioca, salmon" enterKeyHint="search" />
        </label>
      </form>

      <section className="section" aria-labelledby="today-h">
        <div className="section-head">
          <h2 id="today-h">Today’s suggested meals</h2>
          <Link to="/planner" className="small">
            {plan ? 'Open planner' : 'Plan your week'}
          </Link>
        </div>
        <div className="today-list">
          {today.map(({ meal, recipe, planned }) =>
            recipe ? (
              <Link key={meal} to={`/recipes/${recipe.id}`} className="today-item">
                <RecipeImage recipe={recipe} sizes="88px" />
                <div className="t">
                  <div className="lbl">
                    {MEAL_LABELS[meal]} {planned ? '· planned' : '· suggestion'}
                  </div>
                  <div className="nm">{recipe.title}</div>
                  <div className="small muted">{recipe.prepMinutes + recipe.cookMinutes} min</div>
                </div>
              </Link>
            ) : (
              <div key={meal} className="card small muted">
                No {MEAL_LABELS[meal].toLowerCase()} recipes match your current settings.
              </div>
            ),
          )}
        </div>
      </section>

      <section className="section card" aria-labelledby="matcher-h">
        <h2 id="matcher-h">What can I cook with what I have?</h2>
        <p className="muted">Tick the ingredients in your kitchen and get recipes that fit your guide — with any missing items listed.</p>
        <Link to="/matcher" className="btn primary">
          Open the Ingredient Matcher
        </Link>
      </section>

      <section className="section" aria-labelledby="quick-h">
        <div className="section-head">
          <h2 id="quick-h">Quick Brazilian favourites</h2>
          <Link to="/recipes?brazilian=1" className="small">
            See all
          </Link>
        </div>
        {quick.length ? (
          <div className="hscroll">
            {quick.map((r) => (
              <RecipeCard key={r.id} recipe={r} verdict={evaluateRecipe(r, prefs).verdict} />
            ))}
          </div>
        ) : (
          <p className="muted">No quick recipes match your settings.</p>
        )}
      </section>

      <section className="section" aria-labelledby="fav-h">
        <div className="section-head">
          <h2 id="fav-h">Favourite recipes</h2>
          {favourites.length > 0 && (
            <Link to="/recipes?fav=1" className="small">
              See all
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
          <p className="muted">Tap the heart on any recipe to save it here.</p>
        )}
      </section>

      <section className="section" aria-labelledby="week-h">
        <div className="section-head">
          <h2 id="week-h">This week</h2>
        </div>
        {summary ? (
          <div className="card">
            <p style={{ fontWeight: 600 }}>{plan!.name}</p>
            <div className="stats">
              <div className="stat">
                <strong>{summary.count}/28</strong>
                <span>meals planned</span>
              </div>
              <div className="stat">
                <strong>{summary.unique}</strong>
                <span>different recipes</span>
              </div>
              <div className="stat">
                <strong>{summary.left}</strong>
                <span>grocery items left of {summary.items}</span>
              </div>
              <div className="stat">
                <strong>{summary.checks}</strong>
                <span>meals with portion checks</span>
              </div>
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              <Link to="/planner" className="btn">
                View week
              </Link>
              <Link to="/planner?tab=grocery" className="btn">
                Grocery list
              </Link>
            </div>
          </div>
        ) : (
          <div className="card">
            <p className="muted">You haven’t planned a week yet. Generate one in seconds — it only uses recipes that fit your settings.</p>
            <Link to="/planner" className="btn primary">
              Plan my week
            </Link>
          </div>
        )}
      </section>

      <p className="small muted">
        This app supports — but does not replace — advice from your doctor or dietitian. See <Link to="/settings#disclaimer">the dietary disclaimer</Link>.
      </p>
    </>
  );
}

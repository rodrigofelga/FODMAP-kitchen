import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RECIPES } from '../data/recipes';
import { MEALS, MEAL_LABELS, type Meal } from '../data/types';
import { evaluateRecipe } from '../lib/analysis';
import { searchRecipes } from '../lib/search';
import { useStore } from '../lib/store';
import { IconSearch } from '../components/Icons';
import { RecipeCard } from '../components/RecipeBits';

export function RecipesPage() {
  const { profile } = useStore();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const meal = (params.get('meal') as Meal | null) ?? null;
  const brazilian = params.get('brazilian') === '1';
  const favOnly = params.get('fav') === '1';
  const showExcluded = params.get('all') === '1';

  const set = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v === null || v === '') next.delete(k);
    else next.set(k, v);
    setParams(next, { replace: true });
  };

  const { visible, hidden } = useMemo(() => {
    const favs = new Set(profile.favourites);
    const base = searchRecipes(RECIPES, q).filter((r) => (!meal || r.meal === meal) && (!brazilian || r.brazilian) && (!favOnly || favs.has(r.id)));
    const withEval = base.map((r) => ({ r, e: evaluateRecipe(r, profile.prefs) }));
    const hidden = withEval.filter((x) => x.e.verdict === 'excluded');
    const visible = (showExcluded ? withEval : withEval.filter((x) => x.e.verdict !== 'excluded')).sort((a, b) => a.r.title.localeCompare(b.r.title));
    return { visible, hidden };
  }, [q, meal, brazilian, favOnly, showExcluded, profile]);

  return (
    <>
      <div className="page-head">
        <h1>Recipes</h1>
        <p>
          {RECIPES.length} low-FODMAP recipes, mostly Brazilian-style. <Link to="/matcher">Find recipes from ingredients you have →</Link>
        </p>
      </div>

      <label className="search">
        <IconSearch />
        <span className="sr-only">Search recipes</span>
        <input type="search" value={q} onChange={(e) => set('q', e.target.value)} placeholder="Search by name or ingredient" />
      </label>

      <div className="chips" role="group" aria-label="Meal type" style={{ marginTop: 12 }}>
        <button className="chip" aria-pressed={!meal} onClick={() => set('meal', null)}>
          All meals
        </button>
        {MEALS.map((m) => (
          <button key={m} className="chip" aria-pressed={meal === m} onClick={() => set('meal', m)}>
            {MEAL_LABELS[m]}
          </button>
        ))}
      </div>
      <div className="chips" role="group" aria-label="More filters">
        <button className="chip" aria-pressed={brazilian} onClick={() => set('brazilian', brazilian ? null : '1')}>
          Brazilian only
        </button>
        <button className="chip" aria-pressed={favOnly} onClick={() => set('fav', favOnly ? null : '1')}>
          Favourites only
        </button>
        <button className="chip" aria-pressed={showExcluded} onClick={() => set('all', showExcluded ? null : '1')}>
          Show recipes hidden by settings
        </button>
      </div>

      <p className="small muted" aria-live="polite">
        {visible.length} recipe{visible.length === 1 ? '' : 's'}
        {!showExcluded && hidden.length > 0 && ` · ${hidden.length} hidden by your settings`}
      </p>

      {visible.length ? (
        <div className="grid">
          {visible.map(({ r, e }) => (
            <RecipeCard key={r.id} recipe={r} verdict={e.verdict} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <p>No recipes match these filters.</p>
          <button className="btn" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
            Clear filters
          </button>
        </div>
      )}
    </>
  );
}

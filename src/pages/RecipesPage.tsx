import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RECIPES } from '../data/recipes';
import { MEALS, type Meal } from '../data/types';
import { evaluateRecipe } from '../lib/analysis';
import { searchRecipes } from '../lib/search';
import { useStore } from '../lib/store';
import { IconSearch } from '../components/Icons';
import { RecipeCard } from '../components/RecipeBits';
import { useI18n } from '../i18n/context';
import { recipeTitle } from '../i18n/content';
import { compareText } from '../i18n/core';

export function RecipesPage() {
  const { profile } = useStore();
  const { m: msg } = useI18n();
  const t = msg.recipes;
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const meal = (params.get('meal') as Meal | null) ?? null;
  const brazilian = params.get('brazilian') === '1';
  const favOnly = params.get('fav') === '1';
  const showExcluded = params.get('all') === '1';
  /** Only recipes rated EAT for these settings (no AVOID foods, no LIMIT checks). */
  const eliminationOnly = params.get('elim') === '1';

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
    const shown = eliminationOnly ? withEval.filter((x) => x.e.verdict === 'suitable') : showExcluded ? withEval : withEval.filter((x) => x.e.verdict !== 'excluded');
    const visible = shown.sort((a, b) => compareText(recipeTitle(a.r), recipeTitle(b.r)));
    return { visible, hidden };
  }, [q, meal, brazilian, favOnly, showExcluded, eliminationOnly, profile]);

  return (
    <>
      <div className="page-head">
        <h1>{t.title}</h1>
        <p>
          {t.intro(RECIPES.length)}
          <Link to="/matcher">{t.matcherLink}</Link>
        </p>
      </div>

      <label className="search">
        <IconSearch />
        <span className="sr-only">{t.searchLabel}</span>
        <input type="search" value={q} onChange={(e) => set('q', e.target.value)} placeholder={t.searchPlaceholder} />
      </label>

      <div className="chips" role="group" aria-label={t.mealType} style={{ marginTop: 12 }}>
        <button className="chip" aria-pressed={!meal} onClick={() => set('meal', null)}>
          {t.allMeals}
        </button>
        {MEALS.map((m) => (
          <button key={m} className="chip" aria-pressed={meal === m} onClick={() => set('meal', m)}>
            {msg.meals[m]}
          </button>
        ))}
        <button className="chip" aria-pressed={eliminationOnly} onClick={() => set('elim', eliminationOnly ? null : '1')}>
          {t.eliminationOnly}
        </button>
      </div>
      <div className="chips" role="group" aria-label={t.moreFilters}>
        <button className="chip" aria-pressed={brazilian} onClick={() => set('brazilian', brazilian ? null : '1')}>
          {t.brazilianOnly}
        </button>
        <button className="chip" aria-pressed={favOnly} onClick={() => set('fav', favOnly ? null : '1')}>
          {t.favouritesOnly}
        </button>
        <button className="chip" aria-pressed={showExcluded} onClick={() => set('all', showExcluded ? null : '1')}>
          {t.showHidden}
        </button>
      </div>

      <p className="small muted" aria-live="polite">
        {t.count(visible.length)}
        {!showExcluded && !eliminationOnly && hidden.length > 0 && t.hiddenCount(hidden.length)}
      </p>

      {visible.length ? (
        <div className="grid">
          {visible.map(({ r, e }) => (
            <RecipeCard key={r.id} recipe={r} verdict={e.verdict} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <p>{t.none}</p>
          <button className="btn" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
            {t.clearFilters}
          </button>
        </div>
      )}
    </>
  );
}

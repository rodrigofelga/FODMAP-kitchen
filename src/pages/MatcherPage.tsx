import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RECIPES } from '../data/recipes';
import { MEAL_LABELS } from '../data/types';
import { mustResolve, type ResolvedIngredient } from '../lib/ingredients';
import { matchRecipes, PANTRY_BASICS, type MatchResult } from '../lib/matcher';
import { norm } from '../lib/search';
import { useStore } from '../lib/store';
import { IconSearch } from '../components/Icons';
import { RecipeImage, VerdictBadge } from '../components/RecipeBits';
import { FOODS } from '../data/foods';

/** Every ingredient used by at least one recipe, grouped for the picker. */
const PICKABLE: ResolvedIngredient[] = (() => {
  const ids = new Set(RECIPES.flatMap((r) => r.ingredients.map((i) => i.id)));
  return [...ids].map(mustResolve).sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));
})();
const ALIASES = new Map(FOODS.map((f) => [f.id, (f.aliases ?? []).join(' ')]));

function ResultCard({ m }: { m: MatchResult }) {
  const { recipe, evaluation: ev } = m;
  return (
    <article className="card" style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '112px 1fr', gap: 12, alignItems: 'start' }}>
        <Link to={`/recipes/${recipe.id}`} style={{ borderRadius: 10, overflow: 'hidden' }}>
          <RecipeImage recipe={recipe} sizes="112px" />
        </Link>
        <div style={{ minWidth: 0 }}>
          <span className="small muted">{MEAL_LABELS[recipe.meal]}</span>
          <h3 style={{ margin: '2px 0 6px' }}>
            <Link to={`/recipes/${recipe.id}`} style={{ color: 'inherit' }}>
              {recipe.title}
            </Link>
          </h3>
          <div className="row">
            <VerdictBadge verdict={ev.verdict} />
            <span className="small muted">
              {m.missing.length === 0 ? 'You have everything' : `Missing ${m.missing.length}`} · {Math.round(m.coverage * 100)}% match
            </span>
          </div>
        </div>
      </div>
      {m.missing.length > 0 && (
        <p className="small" style={{ margin: 0 }}>
          <strong>Missing:</strong> {m.missing.join(', ')}
        </p>
      )}
      <details>
        <summary className="small" style={{ cursor: 'pointer', fontWeight: 600 }}>
          {ev.verdict === 'excluded' ? 'Why it is excluded' : 'Why it qualifies'}
        </summary>
        <ul className="small" style={{ margin: '6px 0 0', paddingLeft: '1.2em' }}>
          {[...ev.reasons, ...ev.qualifies, ...ev.checks].map((t) => (
            <li key={t}>{t}</li>
          ))}
          {ev.omit.length > 0 && <li>Leave out: {ev.omit.join(', ')}.</li>}
        </ul>
      </details>
    </article>
  );
}

export function MatcherPage() {
  const { profile, updateProfile } = useStore();
  const [q, setQ] = useState('');
  const [assumeBasics, setAssumeBasics] = useState(true);
  const selected = useMemo(() => new Set(profile.pantrySelection), [profile.pantrySelection]);

  const toggle = (id: string) =>
    updateProfile((p) => ({ ...p, pantrySelection: p.pantrySelection.includes(id) ? p.pantrySelection.filter((x) => x !== id) : [...p.pantrySelection, id] }));

  const shown = PICKABLE.filter((f) => !q || norm(`${f.name} ${ALIASES.get(f.id) ?? ''}`).includes(norm(q)));
  const groups = [...new Set(shown.map((f) => f.group))];
  const { recommended, excluded } = useMemo(() => matchRecipes(RECIPES, selected, profile.prefs, assumeBasics), [selected, profile.prefs, assumeBasics]);
  const ready = recommended.filter((m) => m.missing.length === 0);
  const almost = recommended.filter((m) => m.missing.length > 0 && m.missing.length <= 3);

  return (
    <>
      <div className="page-head">
        <h1>Ingredient Matcher</h1>
        <p>Select what you have at home. Recipes with AVOID FOR NOW foods (during elimination) or ingredients you excluded are never recommended.</p>
      </div>

      <section className="card" aria-labelledby="have-h">
        <div className="section-head">
          <h2 id="have-h" style={{ fontSize: '1.1rem' }}>
            In my kitchen ({selected.size})
          </h2>
          {selected.size > 0 && (
            <button className="btn small ghost" onClick={() => updateProfile((p) => ({ ...p, pantrySelection: [] }))}>
              Clear
            </button>
          )}
        </div>
        <label className="search" style={{ boxShadow: 'none' }}>
          <IconSearch />
          <span className="sr-only">Filter ingredients</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter ingredients (e.g. frango, rice)" />
        </label>
        <label className="toggle" style={{ borderTop: 0 }}>
          <input type="checkbox" checked={assumeBasics} onChange={(e) => setAssumeBasics(e.target.checked)} />
          <span>
            Assume I have the basics
            <small>Salt, black pepper, water and cooking oil ({PANTRY_BASICS.length} items).</small>
          </span>
        </label>
        <div style={{ maxHeight: 360, overflowY: 'auto', paddingRight: 4 }}>
          {groups.map((g) => (
            <div key={g} style={{ marginBottom: 10 }}>
              <div className="small muted" style={{ fontWeight: 700, margin: '6px 0' }}>
                {g}
              </div>
              <div className="pickgrid">
                {shown
                  .filter((f) => f.group === g)
                  .map((f) => (
                    <button key={f.id} type="button" className="pick" aria-pressed={selected.has(f.id)} onClick={() => toggle(f.id)} title={f.status === 'limit' ? 'LIMIT / CHECK — portion matters' : undefined}>
                      <span className={`dot ${f.status}`} aria-hidden="true" />
                      {f.name}
                      {f.status === 'limit' && <span className="sr-only"> (LIMIT / CHECK)</span>}
                      {f.status === 'unlisted' && <span className="sr-only"> (not in guide)</span>}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
        <p className="small muted" style={{ margin: '8px 0 0' }}>
          <span className="dot eat" style={{ display: 'inline-block' }} /> EAT · <span className="dot limit" style={{ display: 'inline-block' }} /> LIMIT / CHECK — never treated as automatically safe ·{' '}
          <span className="dot unlisted" style={{ display: 'inline-block' }} /> not in guide
        </p>
      </section>

      {selected.size === 0 ? (
        <p className="empty">Pick a few ingredients to see matching recipes.</p>
      ) : (
        <>
          <section className="section" aria-labelledby="ready-h">
            <h2 id="ready-h">Ready to cook ({ready.length})</h2>
            {ready.length ? (
              <div className="grid">{ready.map((m) => <ResultCard key={m.recipe.id} m={m} />)}</div>
            ) : (
              <p className="muted">Nothing complete yet — see the near matches below.</p>
            )}
          </section>
          <section className="section" aria-labelledby="almost-h">
            <h2 id="almost-h">Missing 1–3 ingredients ({almost.length})</h2>
            {almost.length ? <div className="grid">{almost.slice(0, 24).map((m) => <ResultCard key={m.recipe.id} m={m} />)}</div> : <p className="muted">No near matches.</p>}
          </section>
          {excluded.length > 0 && (
            <details className="card section">
              <summary>Not recommended for you ({excluded.length})</summary>
              <p className="small muted">These match your ingredients but conflict with your settings or the elimination rules.</p>
              <div className="grid">{excluded.map((m) => <ResultCard key={m.recipe.id} m={m} />)}</div>
            </details>
          )}
        </>
      )}
    </>
  );
}

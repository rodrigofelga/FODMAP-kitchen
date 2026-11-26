import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RECIPES } from '../data/recipes';
import { mustResolve, type ResolvedIngredient } from '../lib/ingredients';
import { matchRecipes, PANTRY_BASICS, type MatchResult } from '../lib/matcher';
import { norm } from '../lib/search';
import { useStore } from '../lib/store';
import { IconSearch } from '../components/Icons';
import { RecipeImage, VerdictBadge } from '../components/RecipeBits';
import { FOODS } from '../data/foods';
import { useI18n } from '../i18n/context';
import { compareText, getLang, type Lang } from '../i18n/core';
import { ingredientName, recipeTitle } from '../i18n/content';

/** Every ingredient used by at least one recipe, grouped and sorted for the picker in each language. */
const PICKABLE_IDS = [...new Set(RECIPES.flatMap((r) => r.ingredients.map((i) => i.id)))];
const pickableCache = new Map<Lang, ResolvedIngredient[]>();
function pickable(): ResolvedIngredient[] {
  const lang = getLang();
  let list = pickableCache.get(lang);
  if (!list) {
    list = PICKABLE_IDS.map(mustResolve).sort((a, b) => compareText(a.group, b.group) || compareText(a.name, b.name));
    pickableCache.set(lang, list);
  }
  return list;
}
const ALIASES = new Map(FOODS.map((f) => [f.id, (f.aliases ?? []).join(' ')]));

function ResultCard({ m }: { m: MatchResult }) {
  const { recipe, evaluation: ev } = m;
  const { m: msg } = useI18n();
  const t = msg.matcher;
  return (
    <article className="card" style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '112px 1fr', gap: 12, alignItems: 'start' }}>
        <Link to={`/recipes/${recipe.id}`} style={{ borderRadius: 10, overflow: 'hidden' }}>
          <RecipeImage recipe={recipe} sizes="112px" />
        </Link>
        <div style={{ minWidth: 0 }}>
          <span className="small muted">{msg.meals[recipe.meal]}</span>
          <h3 style={{ margin: '2px 0 6px' }}>
            <Link to={`/recipes/${recipe.id}`} style={{ color: 'inherit' }}>
              {recipeTitle(recipe)}
            </Link>
          </h3>
          <div className="row">
            <VerdictBadge verdict={ev.verdict} />
            <span className="small muted">
              {m.missing.length === 0 ? t.haveAll : t.missingCount(m.missing.length)} · {t.match(Math.round(m.coverage * 100))}
            </span>
          </div>
        </div>
      </div>
      {m.missing.length > 0 && (
        <p className="small" style={{ margin: 0 }}>
          <strong>{t.missing}</strong> {m.missing.join(', ')}
        </p>
      )}
      <details>
        <summary className="small" style={{ cursor: 'pointer', fontWeight: 600 }}>
          {ev.verdict === 'excluded' ? t.whyExcluded : t.whyQualifies}
        </summary>
        <ul className="small" style={{ margin: '6px 0 0', paddingLeft: '1.2em' }}>
          {[...ev.reasons, ...ev.qualifies, ...ev.checks, ...ev.conditional].map((t) => (
            <li key={t}>{t}</li>
          ))}
          {ev.omit.length > 0 && <li>{t.leaveOut(ev.omit.join(', '))}</li>}
        </ul>
      </details>
    </article>
  );
}

export function MatcherPage() {
  const { profile, updateProfile } = useStore();
  const { lang, m: msg } = useI18n();
  const t = msg.matcher;
  const [q, setQ] = useState('');
  const [assumeBasics, setAssumeBasics] = useState(true);
  const selected = useMemo(() => new Set(profile.pantrySelection), [profile.pantrySelection]);

  const toggle = (id: string) =>
    updateProfile((p) => ({ ...p, pantrySelection: p.pantrySelection.includes(id) ? p.pantrySelection.filter((x) => x !== id) : [...p.pantrySelection, id] }));

  // In Portuguese the English name is searchable too.
  const shown = pickable().filter((f) => !q || norm(`${f.name} ${ALIASES.get(f.id) ?? ''} ${lang === 'en' ? '' : ingredientName(f.id, 'en')}`).includes(norm(q)));
  const groups = [...new Set(shown.map((f) => f.group))];
  const { recommended, excluded } = useMemo(() => matchRecipes(RECIPES, selected, profile.prefs, assumeBasics), [selected, profile.prefs, assumeBasics]);
  const ready = recommended.filter((m) => m.missing.length === 0);
  const almost = recommended.filter((m) => m.missing.length > 0 && m.missing.length <= 3);

  return (
    <>
      <div className="page-head">
        <h1>{t.title}</h1>
        <p>{t.intro}</p>
      </div>

      <section className="card" aria-labelledby="have-h">
        <div className="section-head">
          <h2 id="have-h" style={{ fontSize: '1.1rem' }}>
            {t.inKitchen(selected.size)}
          </h2>
          {selected.size > 0 && (
            <button className="btn small ghost" onClick={() => updateProfile((p) => ({ ...p, pantrySelection: [] }))}>
              {msg.common.clear}
            </button>
          )}
        </div>
        <label className="search" style={{ boxShadow: 'none' }}>
          <IconSearch />
          <span className="sr-only">{t.filterLabel}</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.filterPlaceholder} />
        </label>
        <label className="toggle" style={{ borderTop: 0 }}>
          <input type="checkbox" checked={assumeBasics} onChange={(e) => setAssumeBasics(e.target.checked)} />
          <span>
            {t.basics}
            <small>{t.basicsHint(PANTRY_BASICS.length)}</small>
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
                    <button key={f.id} type="button" className="pick" aria-pressed={selected.has(f.id)} onClick={() => toggle(f.id)} title={f.status === 'limit' ? t.limitTitle : undefined}>
                      <span className={`dot ${f.status}`} aria-hidden="true" />
                      {f.name}
                      {f.status === 'limit' && <span className="sr-only">{t.srLimit}</span>}
                      {f.status === 'unlisted' && <span className="sr-only">{t.srUnlisted}</span>}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
        <p className="small muted" style={{ margin: '8px 0 0' }}>
          <span className="dot eat" style={{ display: 'inline-block' }} />
          {t.legendEat}
          <span className="dot limit" style={{ display: 'inline-block' }} />
          {t.legendLimit}
          <span className="dot unlisted" style={{ display: 'inline-block' }} />
          {t.legendUnlisted}
        </p>
      </section>

      {selected.size === 0 ? (
        <p className="empty">{t.pickPrompt}</p>
      ) : (
        <>
          <section className="section" aria-labelledby="ready-h">
            <h2 id="ready-h">{t.ready(ready.length)}</h2>
            {ready.length ? (
              <div className="grid">{ready.map((m) => <ResultCard key={m.recipe.id} m={m} />)}</div>
            ) : (
              <p className="muted">{t.noneReady}</p>
            )}
          </section>
          <section className="section" aria-labelledby="almost-h">
            <h2 id="almost-h">{t.almost(almost.length)}</h2>
            {almost.length ? <div className="grid">{almost.slice(0, 24).map((m) => <ResultCard key={m.recipe.id} m={m} />)}</div> : <p className="muted">{t.noAlmost}</p>}
          </section>
          {excluded.length > 0 && (
            <details className="card section">
              <summary>{t.notRecommended(excluded.length)}</summary>
              <p className="small muted">{t.notRecommendedBody}</p>
              <div className="grid">{excluded.map((m) => <ResultCard key={m.recipe.id} m={m} />)}</div>
            </details>
          )}
        </>
      )}
    </>
  );
}

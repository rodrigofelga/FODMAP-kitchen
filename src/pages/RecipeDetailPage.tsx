import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { RECIPE_BY_ID } from '../data/recipes';
import { analyzeRecipe, dietLabels, evaluateRecipe } from '../lib/analysis';
import { formatAmount } from '../lib/ingredients';
import { imageFor } from '../lib/images';
import { useStore } from '../lib/store';
import { FavButton, RecipeImage, StatusBadge, VerdictBadge } from '../components/RecipeBits';
import { NotFoundPage } from './NotFoundPage';
import { useI18n } from '../i18n/context';
import { ingredientNote, recipeDescription, recipeSteps, recipeSubstitutions, recipeTips, recipeTitle } from '../i18n/content';

export function RecipeDetailPage() {
  const { id } = useParams();
  const recipe = id ? RECIPE_BY_ID.get(id) : undefined;
  const { profile } = useStore();
  const { m } = useI18n();
  const d = m.detail;
  const [servings, setServings] = useState(recipe?.servings ?? 1);
  if (!recipe) return <NotFoundPage />;

  const analysis = analyzeRecipe(recipe);
  const ev = evaluateRecipe(recipe, profile.prefs);
  const factor = servings / recipe.servings;
  const img = imageFor(recipe.id);
  const diets = dietLabels(recipe);
  const excluded = new Set(profile.prefs.excluded);
  const title = recipeTitle(recipe);
  const tips = recipeTips(recipe);

  return (
    <article>
      <p className="small no-print">
        <Link to="/recipes">{d.allRecipes}</Link>
      </p>
      <div className="detail-grid">
        <div>
          <div className="detail-hero" style={{ position: 'relative' }}>
            <RecipeImage recipe={recipe} sizes="(min-width: 900px) 520px, 100vw" eager />
            <FavButton id={recipe.id} title={title} />
          </div>
          {img.match !== 'placeholder' && img.source === 'Owner-supplied' ? (
            <p className="small muted" style={{ marginTop: 6 }}>
              {img.match === 'exact' ? d.photoExact : d.photoRepresentative}. {d.ownerSupplied}
            </p>
          ) : img.match !== 'placeholder' ? (
            <p className="small muted" style={{ marginTop: 6 }}>
              {img.match === 'exact' ? d.photoExact : d.photoRepresentative}
              {img.aiGenerated ? d.aiGenerated : ''}. {d.source}{' '}
              <a href={img.photoPage} target="_blank" rel="noopener noreferrer">
                Foodiesfeed
              </a>
              {img.author && !img.aiGenerated ? ` · ${img.author}` : ''} ·{' '}
              <a href={img.licenseUrl} target="_blank" rel="noopener noreferrer">
                {d.licence}
              </a>
            </p>
          ) : (
            <p className="small muted" style={{ marginTop: 6 }}>
              {d.noPhoto}
            </p>
          )}
        </div>

        <div>
          <span className="small muted">
            {m.meals[recipe.meal]}
            {recipe.brazilian ? d.brazilianStyle : ''}
          </span>
          <h1>{title}</h1>
          <p>{recipeDescription(recipe)}</p>
          <div className="row">
            <VerdictBadge verdict={ev.verdict} />
            {diets.map((d) => (
              <span key={d} className="badge neutral">
                {d}
              </span>
            ))}
          </div>
          <div className="facts">
            <div className="fact">
              <strong>{m.common.minutes(recipe.prepMinutes)}</strong>
              <span>{d.prep}</span>
            </div>
            <div className="fact">
              <strong>{m.common.minutes(recipe.cookMinutes)}</strong>
              <span>{d.cook}</span>
            </div>
            <div className="fact">
              <strong>{recipe.servings}</strong>
              <span>{d.servings}</span>
            </div>
          </div>

          <section className="card" aria-labelledby="suit-h">
            <h2 id="suit-h" style={{ fontSize: '1.1rem' }}>
              {d.suitability}
            </h2>
            {ev.verdict === 'excluded' && (
              <div className="notice danger" style={{ marginBottom: 8 }}>
                <strong>{d.notRecommended}</strong>
                <ul style={{ margin: '4px 0 0', paddingLeft: '1.2em' }}>
                  {ev.reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
            {ev.qualifies.length > 0 && (
              <ul style={{ margin: '0 0 8px', paddingLeft: '1.2em' }}>
                {ev.qualifies.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
            {ev.checks.length > 0 && (
              <div className="notice warn">
                <strong>{d.checksTitle}</strong>
                <ul style={{ margin: '4px 0 0', paddingLeft: '1.2em' }}>
                  {ev.checks.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                <p className="small" style={{ margin: '6px 0 0' }}>
                  {d.checksNote}
                </p>
              </div>
            )}
            {ev.omit.length > 0 && <p className="small">{d.leaveOut(ev.omit.join(', '))}</p>}
          </section>
        </div>
      </div>

      <div className="detail-grid section">
        <section className="card" aria-labelledby="ing-h">
          <div className="section-head">
            <h2 id="ing-h">{d.ingredients}</h2>
            <div className="stepper" aria-label={d.servingsLabel}>
              <button type="button" aria-label={d.fewer} onClick={() => setServings((s) => Math.max(1, s - 1))}>
                −
              </button>
              <output aria-live="polite">{servings}</output>
              <button type="button" aria-label={d.more} onClick={() => setServings((s) => Math.min(24, s + 1))}>
                +
              </button>
            </div>
          </div>
          <ul className="ing-list">
            {analysis.items.map(({ ing, food, perServing }) => (
              <li key={ing.id + ing.note}>
                <span className="amt">{formatAmount(ing.qty * factor, ing.unit)}</span>
                <span className="nm">
                  {food.name}
                  {ing.optional && <span className="muted">{d.optionalTag}</span>}{' '}
                  <StatusBadge status={food.status} />
                  {ing.note && <small>{ingredientNote(recipe, ing)}</small>}
                  {food.status === 'limit' && <small>{d.perServing(perServing)}</small>}
                  {excluded.has(ing.id) && <small style={{ color: 'var(--avoid)' }}>{d.youExcluded}</small>}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div>
          <section className="card" aria-labelledby="steps-h">
            <h2 id="steps-h">{d.method}</h2>
            <ol className="steps">
              {recipeSteps(recipe).map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </section>
          <section className="card section" aria-labelledby="sub-h">
            <h2 id="sub-h">{d.substitutions}</h2>
            <ul style={{ margin: 0, paddingLeft: '1.2em' }}>
              {recipeSubstitutions(recipe).map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            {tips && tips.length > 0 && (
              <>
                <h3 style={{ marginTop: 12 }}>{d.tips}</h3>
                <ul style={{ margin: 0, paddingLeft: '1.2em' }}>
                  {tips.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </>
            )}
            <p className="small muted" style={{ marginTop: 10 }}>
              {d.subsNote}
            </p>
          </section>
        </div>
      </div>
    </article>
  );
}

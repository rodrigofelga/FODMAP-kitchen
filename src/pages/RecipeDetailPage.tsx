import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { RECIPE_BY_ID } from '../data/recipes';
import { MEAL_LABELS } from '../data/types';
import { analyzeRecipe, dietLabels, evaluateRecipe } from '../lib/analysis';
import { formatAmount } from '../lib/ingredients';
import { imageFor } from '../lib/images';
import { useStore } from '../lib/store';
import { FavButton, RecipeImage, StatusBadge, VerdictBadge } from '../components/RecipeBits';
import { NotFoundPage } from './NotFoundPage';

export function RecipeDetailPage() {
  const { id } = useParams();
  const recipe = id ? RECIPE_BY_ID.get(id) : undefined;
  const { profile } = useStore();
  const [servings, setServings] = useState(recipe?.servings ?? 1);
  if (!recipe) return <NotFoundPage />;

  const analysis = analyzeRecipe(recipe);
  const ev = evaluateRecipe(recipe, profile.prefs);
  const factor = servings / recipe.servings;
  const img = imageFor(recipe.id);
  const diets = dietLabels(recipe);
  const excluded = new Set(profile.prefs.excluded);

  return (
    <article>
      <p className="small no-print">
        <Link to="/recipes">← All recipes</Link>
      </p>
      <div className="detail-grid">
        <div>
          <div className="detail-hero" style={{ position: 'relative' }}>
            <RecipeImage recipe={recipe} sizes="(min-width: 900px) 520px, 100vw" eager />
            <FavButton id={recipe.id} title={recipe.title} />
          </div>
          {img.match !== 'placeholder' && img.source === 'Owner-supplied' ? (
            <p className="small muted" style={{ marginTop: 6 }}>
              {img.match === 'exact' ? 'Photo of this dish' : 'Representative photo — a similar dish, not this exact recipe'}. Supplied by the app owner.
            </p>
          ) : img.match !== 'placeholder' ? (
            <p className="small muted" style={{ marginTop: 6 }}>
              {img.match === 'exact' ? 'Photo of this dish' : 'Representative photo — a similar dish, not this exact recipe'}
              {img.aiGenerated ? ' (AI-generated image)' : ''}. Source:{' '}
              <a href={img.photoPage} target="_blank" rel="noopener noreferrer">
                Foodiesfeed
              </a>
              {img.author && !img.aiGenerated ? ` · ${img.author}` : ''} ·{' '}
              <a href={img.licenseUrl} target="_blank" rel="noopener noreferrer">
                licence
              </a>
            </p>
          ) : (
            <p className="small muted" style={{ marginTop: 6 }}>
              No accurately matching licensed photo was found, so a placeholder is shown.
            </p>
          )}
        </div>

        <div>
          <span className="small muted">
            {MEAL_LABELS[recipe.meal]}
            {recipe.brazilian ? ' · Brazilian-style' : ''}
          </span>
          <h1>{recipe.title}</h1>
          {recipe.titlePt && (
            <p className="muted" lang="pt-BR" style={{ fontStyle: 'italic' }}>
              {recipe.titlePt}
            </p>
          )}
          <p>{recipe.description}</p>
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
              <strong>{recipe.prepMinutes} min</strong>
              <span>prep</span>
            </div>
            <div className="fact">
              <strong>{recipe.cookMinutes} min</strong>
              <span>cook</span>
            </div>
            <div className="fact">
              <strong>{recipe.servings}</strong>
              <span>servings</span>
            </div>
          </div>

          <section className="card" aria-labelledby="suit-h">
            <h2 id="suit-h" style={{ fontSize: '1.1rem' }}>
              Dietary suitability
            </h2>
            {ev.verdict === 'excluded' && (
              <div className="notice danger" style={{ marginBottom: 8 }}>
                <strong>Not recommended with your current settings:</strong>
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
                <strong>Portion &amp; label checks (per serving):</strong>
                <ul style={{ margin: '4px 0 0', paddingLeft: '1.2em' }}>
                  {ev.checks.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                <p className="small" style={{ margin: '6px 0 0' }}>
                  Eat one serving only. Increasing servings increases the amount of each LIMIT food you eat.
                </p>
              </div>
            )}
            {ev.omit.length > 0 && <p className="small">Leave out: {ev.omit.join(', ')}.</p>}
          </section>
        </div>
      </div>

      <div className="detail-grid section">
        <section className="card" aria-labelledby="ing-h">
          <div className="section-head">
            <h2 id="ing-h">Ingredients</h2>
            <div className="stepper" aria-label="Servings">
              <button type="button" aria-label="Fewer servings" onClick={() => setServings((s) => Math.max(1, s - 1))}>
                −
              </button>
              <output aria-live="polite">{servings}</output>
              <button type="button" aria-label="More servings" onClick={() => setServings((s) => Math.min(24, s + 1))}>
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
                  {ing.optional && <span className="muted"> (optional)</span>}{' '}
                  <StatusBadge status={food.status} />
                  {ing.note && <small>{ing.note}</small>}
                  {food.status === 'limit' && <small>Per serving: {perServing}</small>}
                  {excluded.has(ing.id) && <small style={{ color: 'var(--avoid)' }}>You excluded this ingredient.</small>}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div>
          <section className="card" aria-labelledby="steps-h">
            <h2 id="steps-h">Method</h2>
            <ol className="steps">
              {recipe.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </section>
          <section className="card section" aria-labelledby="sub-h">
            <h2 id="sub-h">Substitutions</h2>
            <ul style={{ margin: 0, paddingLeft: '1.2em' }}>
              {recipe.substitutions.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            {recipe.tips && recipe.tips.length > 0 && (
              <>
                <h3 style={{ marginTop: 12 }}>Tips</h3>
                <ul style={{ margin: 0, paddingLeft: '1.2em' }}>
                  {recipe.tips.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </>
            )}
            <p className="small muted" style={{ marginTop: 10 }}>
              Substitutions should also follow your food guide — check each swap’s classification in the Food Guide.
            </p>
          </section>
        </div>
      </div>
    </article>
  );
}

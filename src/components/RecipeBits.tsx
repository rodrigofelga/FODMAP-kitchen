import { Link } from 'react-router-dom';
import type { Recipe } from '../data/types';
import type { Verdict } from '../lib/analysis';
import type { IngredientStatus } from '../lib/ingredients';
import { imageFor } from '../lib/images';
import { useStore } from '../lib/store';
import { useI18n } from '../i18n/context';
import { photoAlt, recipeSubtitle, recipeTitle } from '../i18n/content';
import { IconClock, IconHeart, IconPlate } from './Icons';

export function StatusBadge({ status }: { status: IngredientStatus }) {
  const { m } = useI18n();
  return <span className={`badge ${status}`}>{m.status[status]}</span>;
}

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const { m } = useI18n();
  return <span className={`badge ${verdict}`}>{m.verdict[verdict]}</span>;
}

export function RecipeImage({ recipe, sizes, eager }: { recipe: Recipe; sizes: string; eager?: boolean }) {
  const { m } = useI18n();
  const img = imageFor(recipe.id);
  if (img.match === 'placeholder') {
    return (
      <div className="rimg">
        <div className="placeholder-art" role="img" aria-label={m.recipe.placeholderAria(recipeTitle(recipe))}>
          <IconPlate />
          <span>{m.recipe.photoNotAvailable}</span>
        </div>
      </div>
    );
  }
  return (
    <div className="rimg">
      <img
        src={img.src480}
        srcSet={`${img.src480} 480w, ${img.src960} 960w`}
        sizes={sizes}
        width={480}
        height={360}
        alt={photoAlt(recipe, img.alt)}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
      {img.match === 'representative' && <span className="photo-tag">{m.recipe.representativeTag}</span>}
    </div>
  );
}

export function FavButton({ id, title }: { id: string; title: string }) {
  const { profile, toggleFavourite } = useStore();
  const { m } = useI18n();
  const on = profile.favourites.includes(id);
  return (
    <button
      type="button"
      className="fav"
      aria-pressed={on}
      aria-label={on ? m.recipe.favRemove(title) : m.recipe.favAdd(title)}
      onClick={() => toggleFavourite(id)}
    >
      <IconHeart filled={on} />
    </button>
  );
}

export function RecipeCard({ recipe, verdict, note }: { recipe: Recipe; verdict?: Verdict; note?: string }) {
  const { m } = useI18n();
  const title = recipeTitle(recipe);
  const subtitle = recipeSubtitle(recipe);
  return (
    <article className="rcard">
      <Link to={`/recipes/${recipe.id}`} className="cover">
        <RecipeImage recipe={recipe} sizes="(min-width: 900px) 260px, (min-width: 600px) 45vw, 92vw" />
        <div className="rbody">
          <h3>{title}</h3>
          {subtitle && <span className="pt" lang="pt-BR">{subtitle}</span>}
          {note && <span className="small muted">{note}</span>}
          <div className="rmeta">
            <span className="row" style={{ gap: 4 }}>
              <IconClock width={14} height={14} /> {m.common.minutes(recipe.prepMinutes + recipe.cookMinutes)}
            </span>
            <span>{m.common.servings(recipe.servings)}</span>
            {verdict && <VerdictBadge verdict={verdict} />}
          </div>
        </div>
      </Link>
      <FavButton id={recipe.id} title={title} />
    </article>
  );
}

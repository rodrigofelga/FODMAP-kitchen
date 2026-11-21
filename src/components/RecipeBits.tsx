import { Link } from 'react-router-dom';
import type { Recipe } from '../data/types';
import type { Verdict } from '../lib/analysis';
import type { IngredientStatus } from '../lib/ingredients';
import { imageFor } from '../lib/images';
import { useStore } from '../lib/store';
import { IconClock, IconHeart, IconPlate } from './Icons';

const STATUS_TEXT: Record<IngredientStatus, string> = {
  eat: 'EAT',
  limit: 'LIMIT / CHECK',
  avoid: 'AVOID FOR NOW',
  unlisted: 'Not in guide',
};

export function StatusBadge({ status }: { status: IngredientStatus }) {
  return <span className={`badge ${status}`}>{STATUS_TEXT[status]}</span>;
}

const VERDICT_TEXT: Record<Verdict, string> = {
  suitable: 'Elimination-friendly',
  check: 'Portion check',
  excluded: 'Not for you now',
};

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return <span className={`badge ${verdict}`}>{VERDICT_TEXT[verdict]}</span>;
}

export function RecipeImage({ recipe, sizes, eager }: { recipe: Recipe; sizes: string; eager?: boolean }) {
  const img = imageFor(recipe.id);
  if (img.match === 'placeholder') {
    return (
      <div className="rimg">
        <div className="placeholder-art" role="img" aria-label={`Illustration placeholder for ${recipe.title}; no matching photograph available`}>
          <IconPlate />
          <span>Photo not available</span>
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
        alt={img.alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
      {img.match === 'representative' && <span className="photo-tag">Representative photo</span>}
    </div>
  );
}

export function FavButton({ id, title }: { id: string; title: string }) {
  const { profile, toggleFavourite } = useStore();
  const on = profile.favourites.includes(id);
  return (
    <button
      type="button"
      className="fav"
      aria-pressed={on}
      aria-label={on ? `Remove ${title} from favourites` : `Add ${title} to favourites`}
      onClick={() => toggleFavourite(id)}
    >
      <IconHeart filled={on} />
    </button>
  );
}

export function RecipeCard({ recipe, verdict, note }: { recipe: Recipe; verdict?: Verdict; note?: string }) {
  return (
    <article className="rcard">
      <Link to={`/recipes/${recipe.id}`} className="cover">
        <RecipeImage recipe={recipe} sizes="(min-width: 900px) 260px, (min-width: 600px) 45vw, 92vw" />
        <div className="rbody">
          <h3>{recipe.title}</h3>
          {recipe.titlePt && <span className="pt" lang="pt-BR">{recipe.titlePt}</span>}
          {note && <span className="small muted">{note}</span>}
          <div className="rmeta">
            <span className="row" style={{ gap: 4 }}>
              <IconClock width={14} height={14} /> {recipe.prepMinutes + recipe.cookMinutes} min
            </span>
            <span>
              {recipe.servings} serving{recipe.servings > 1 ? 's' : ''}
            </span>
            {verdict && <VerdictBadge verdict={verdict} />}
          </div>
        </div>
      </Link>
      <FavButton id={recipe.id} title={recipe.title} />
    </article>
  );
}

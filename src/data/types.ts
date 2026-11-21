export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export const MEALS: Meal[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export const MEAL_LABELS: Record<Meal, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export type Unit =
  | 'g'
  | 'ml'
  | 'unit'
  | 'tbsp'
  | 'tsp'
  | 'cup'
  | 'pinch'
  | 'slice'
  | 'sprig'
  | 'leaf'
  | 'sheet'
  | 'to taste';

export interface RecipeIngredient {
  /** A food-guide id (src/data/foods.ts) or a pantry id (src/data/pantry.ts). */
  id: string;
  qty: number;
  unit: Unit;
  /** Preparation note, e.g. "diced". */
  note?: string;
  /** Recipe still works without it; the matcher treats it as non-essential. */
  optional?: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  /** Original Brazilian Portuguese name, when the dish is Brazilian. */
  titlePt?: string;
  meal: Meal;
  description: string;
  servings: number;
  prepMinutes: number;
  cookMinutes: number;
  brazilian: boolean;
  ingredients: RecipeIngredient[];
  steps: string[];
  substitutions: string[];
  tips?: string[];
}

export function ing(id: string, qty: number, unit: Unit, note?: string, optional?: boolean): RecipeIngredient {
  const r: RecipeIngredient = { id, qty, unit };
  if (note) r.note = note;
  if (optional) r.optional = true;
  return r;
}

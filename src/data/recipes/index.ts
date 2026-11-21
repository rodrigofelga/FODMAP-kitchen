import type { Recipe } from '../types';
import { BREAKFAST } from './breakfast';
import { LUNCH } from './lunch';
import { DINNER } from './dinner';
import { SNACK } from './snack';

export const RECIPES: Recipe[] = [...BREAKFAST, ...LUNCH, ...DINNER, ...SNACK];

export const RECIPE_BY_ID: Map<string, Recipe> = new Map(RECIPES.map((r) => [r.id, r]));

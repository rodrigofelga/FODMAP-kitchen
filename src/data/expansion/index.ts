import type { Food } from '../foods';
import { DAIRY, EGGS } from './dairy';
import { DRINKS } from './drinks';
import { GRAINS, LEGUMES } from './grains';
import { PREPARED, SAUCES, SEASONINGS, SNACKS } from './condiments';
import { FRUIT, VEGETABLES } from './plants';
import { MEAT } from './meat';
import { SEAFOOD } from './seafood';
export { PT as EXPANSION_PT } from './helper';

/** Food Guide expansion (Nov 2026): records not in the original guide. */
export const EXPANSION: Food[] = [
  ...VEGETABLES,
  ...FRUIT,
  ...GRAINS,
  ...MEAT,
  ...SEAFOOD,
  ...EGGS,
  ...DAIRY,
  ...LEGUMES,
  ...SEASONINGS,
  ...SAUCES,
  ...SNACKS,
  ...DRINKS,
  ...PREPARED,
];

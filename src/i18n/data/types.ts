/**
 * Translated text for one recipe. The recipe record itself (ingredients,
 * quantities, units, servings, times, meal, flags) is shared by every
 * language and lives only in src/data/recipes — nothing here can change it.
 *
 * `steps`, `substitutions` and `tips` must have the same number of entries as
 * the English recipe, and `notes` must cover every ingredient that has a note
 * (keyed by ingredient id). tests/unit/i18n.test.ts enforces this.
 */
export interface RecipeText {
  title: string;
  description: string;
  steps: string[];
  substitutions: string[];
  tips?: string[];
  /** Ingredient preparation notes, keyed by ingredient id. */
  notes?: Record<string, string>;
  /** Alt text for the recipe photo. */
  alt: string;
}

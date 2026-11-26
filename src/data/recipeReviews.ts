/**
 * Recipe-level portion reviews from the Nov 2026 dietary accuracy audit.
 *
 * A listed recipe keeps its ingredients, quantities and steps unchanged, but it
 * cannot be shown as EAT until the listed ingredient's serving
 * has been verified against a published low-FODMAP serve. The value is the
 * ingredient id whose per-serving amount is unverified.
 *
 * smoothie-morango: 140 g strawberries per serving. Monash's 2026 sheet gives the
 * low serve as "5 medium" strawberries, with no gram weight, so the two cannot
 * be compared without inventing a conversion.
 */
export const UNVERIFIED_SERVINGS: Record<string, string> = {
  'smoothie-morango': 'strawberries',
};

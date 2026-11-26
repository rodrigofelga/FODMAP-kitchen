import type { FoodTag } from './foods';

/**
 * Pantry staples used by recipes that the source PDF does NOT classify.
 * They are shown with an "Not in guide" badge — the app never presents them
 * as EAT / LIMIT / AVOID, and users can exclude any of them in Settings.
 */
export interface PantryItem {
  id: string;
  name: string;
  aliases?: string[];
  tags?: FoodTag[];
  /** Neutral, factual description (what the item is), no dietary claim. */
  description: string;
}

export const PANTRY: PantryItem[] = [
  { id: 'baking-powder', name: 'Baking powder', aliases: ['fermento químico', 'fermento em pó'], description: 'Chemical leavening agent.' },
  { id: 'vanilla-extract', name: 'Vanilla extract', aliases: ['essência de baunilha', 'baunilha'], description: 'Pure vanilla extract.' },
  { id: 'nori', name: 'Nori seaweed sheets', aliases: ['alga nori'], description: 'Dried seaweed sheets for sushi.' },
];

export const PANTRY_BY_ID: Map<string, PantryItem> = new Map(PANTRY.map((p) => [p.id, p]));

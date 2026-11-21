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
  { id: 'sugar', name: 'Sugar (white or brown)', aliases: ['açúcar', 'acucar'], description: 'Table sugar. The guide lists sugar cane as LIMIT (small amount); check your own tolerance.' },
  { id: 'rice-flour', name: 'Rice flour', aliases: ['farinha de arroz'], description: 'Finely milled rice.' },
  { id: 'tapioca-starch', name: 'Tapioca starch / polvilho / goma de tapioca', aliases: ['polvilho', 'polvilho doce', 'polvilho azedo', 'goma de tapioca', 'tapioca'], description: 'Starch extracted from cassava. Used for tapioca crepes and pão de queijo.' },
  { id: 'cornstarch', name: 'Cornstarch (amido de milho)', aliases: ['amido de milho', 'maisena'], description: 'Starch extracted from corn.' },
  { id: 'flocao-milho', name: 'Flocão de milho (corn flakes for cuscuz)', aliases: ['flocão', 'flocao', 'farinha de milho flocada'], description: 'Pre-cooked flaked corn used for cuscuz nordestino. Polenta (plain) is EAT in the guide; check flocão labels for added ingredients.' },
  { id: 'baking-powder', name: 'Baking powder', aliases: ['fermento químico', 'fermento em pó'], description: 'Chemical leavening agent.' },
  { id: 'cinnamon', name: 'Cinnamon', aliases: ['canela'], description: 'Ground or stick cinnamon.' },
  { id: 'cloves', name: 'Cloves', aliases: ['cravo', 'cravo-da-índia'], description: 'Whole dried clove buds.' },
  { id: 'vanilla-extract', name: 'Vanilla extract', aliases: ['essência de baunilha', 'baunilha'], description: 'Pure vanilla extract.' },
  { id: 'bay-leaf', name: 'Bay leaf', aliases: ['louro', 'folha de louro'], description: 'Dried bay leaves.' },
  { id: 'cumin', name: 'Ground cumin', aliases: ['cominho'], description: 'Ground cumin seed.' },
  { id: 'basil', name: 'Fresh basil', aliases: ['manjericão', 'manjericao'], description: 'Fresh basil leaves.' },
  { id: 'mint', name: 'Fresh mint', aliases: ['hortelã', 'hortela'], description: 'Fresh mint leaves.' },
  { id: 'nori', name: 'Nori seaweed sheets', aliases: ['alga nori'], description: 'Dried seaweed sheets for sushi.' },
  { id: 'sesame-seeds', name: 'Sesame seeds', aliases: ['gergelim'], description: 'Hulled sesame seeds.' },
];

export const PANTRY_BY_ID: Map<string, PantryItem> = new Map(PANTRY.map((p) => [p.id, p]));

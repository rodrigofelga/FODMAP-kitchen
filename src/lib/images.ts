import raw from '../data/images.json';

interface PhotoBase {
  match: 'exact' | 'representative';
  alt: string;
  src480: string;
  src960: string;
  license: string;
}

export interface FoodiesfeedPhoto extends PhotoBase {
  source: 'Foodiesfeed';
  photoPage: string;
  assetUrl: string;
  title: string | null;
  author: string | null;
  aiGenerated: boolean;
  licenseUrl: string;
  retrieved: string;
}

/** A photo supplied by the app owner (source file in assets/owner-photos/). */
export interface OwnerPhoto extends PhotoBase {
  source: 'Owner-supplied';
}

export type PhotoMeta = FoodiesfeedPhoto | OwnerPhoto;

export interface PlaceholderMeta {
  match: 'placeholder';
  reason: string;
}

export type ImageMeta = PhotoMeta | PlaceholderMeta;

export const IMAGES = raw as Record<string, ImageMeta>;

export function imageFor(recipeId: string): ImageMeta {
  return IMAGES[recipeId] ?? { match: 'placeholder', reason: 'No photograph assigned.' };
}

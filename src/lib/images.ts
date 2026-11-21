import raw from '../data/images.json';

export interface PhotoMeta {
  match: 'exact' | 'representative';
  alt: string;
  src480: string;
  src960: string;
  source: string;
  photoPage: string;
  assetUrl: string;
  title: string | null;
  author: string | null;
  aiGenerated: boolean;
  license: string;
  licenseUrl: string;
  retrieved: string;
}

export interface PlaceholderMeta {
  match: 'placeholder';
  reason: string;
}

export type ImageMeta = PhotoMeta | PlaceholderMeta;

export const IMAGES = raw as Record<string, ImageMeta>;

export function imageFor(recipeId: string): ImageMeta {
  return IMAGES[recipeId] ?? { match: 'placeholder', reason: 'No photograph assigned.' };
}

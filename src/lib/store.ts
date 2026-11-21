import { createContext, useContext } from 'react';
import type { AppData, Profile } from './appData';

export interface Store {
  loaded: boolean;
  storage: 'indexeddb' | 'memory' | 'unknown';
  data: AppData;
  profile: Profile;
  /** Immutable update of the active profile. */
  updateProfile: (fn: (p: Profile) => Profile) => void;
  /** Immutable update of everything (profiles, active profile). */
  updateData: (fn: (d: AppData) => AppData) => void;
  toggleFavourite: (recipeId: string) => void;
}

export const StoreContext = createContext<Store | null>(null);

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error('useStore must be used inside <AppProvider>');
  return s;
}

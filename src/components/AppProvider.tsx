import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { StoreContext, type Store } from '../lib/store';
import { defaultData, normalizeData, type AppData, type Profile } from '../lib/appData';
import { idbGet, idbSet, storageAvailable } from '../lib/db';

const KEY = 'app-data';
const JOURNAL = 'fodmap-kitchen:journal';

interface Saved {
  savedAt: number;
  data: AppData;
}

function isSaved(v: unknown): v is Saved {
  return !!v && typeof v === 'object' && typeof (v as Saved).savedAt === 'number' && 'data' in (v as object);
}

function readJournal(): Saved | null {
  try {
    const raw = localStorage.getItem(JOURNAL);
    const v = raw ? JSON.parse(raw) : null;
    return isSaved(v) ? v : null;
  } catch {
    return null;
  }
}

/**
 * Persists app data. IndexedDB is the primary store; every change is also
 * written synchronously to a small localStorage journal so that a change made
 * right before the tab closes (when an async IndexedDB write could be aborted)
 * is never lost. On load, whichever copy is newer wins.
 */
function persist(data: AppData) {
  const saved: Saved = { savedAt: Date.now(), data };
  try {
    localStorage.setItem(JOURNAL, JSON.stringify(saved));
  } catch {
    // Storage full or blocked — IndexedDB below is still attempted.
  }
  idbSet(KEY, saved).catch((e) => console.warn('Could not save data', e));
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(defaultData);
  const [loaded, setLoaded] = useState(false);
  const [storage, setStorage] = useState<Store['storage']>('unknown');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const kind = await storageAvailable();
      let fromDb: unknown;
      try {
        fromDb = await idbGet(KEY);
      } catch {
        fromDb = undefined;
      }
      if (cancelled) return;
      const journal = readJournal();
      const db = isSaved(fromDb) ? fromDb : null;
      const newest = journal && (!db || journal.savedAt > db.savedAt) ? journal : db;
      setStorage(kind);
      if (newest) {
        const normalized = normalizeData(newest.data);
        setData(normalized);
        // Re-sync IndexedDB if the journal was ahead of it.
        if (newest === journal && db?.savedAt !== journal.savedAt) idbSet(KEY, { savedAt: journal.savedAt, data: normalized }).catch(() => undefined);
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateData = useCallback((fn: (d: AppData) => AppData) => {
    setData((prev) => {
      const next = fn(prev);
      if (next !== prev) persist(next);
      return next;
    });
  }, []);

  const updateProfile = useCallback(
    (fn: (p: Profile) => Profile) =>
      updateData((d) => ({ ...d, profiles: d.profiles.map((p) => (p.id === d.activeProfileId ? fn(p) : p)) })),
    [updateData],
  );

  const toggleFavourite = useCallback(
    (id: string) =>
      updateProfile((p) => ({ ...p, favourites: p.favourites.includes(id) ? p.favourites.filter((f) => f !== id) : [...p.favourites, id] })),
    [updateProfile],
  );

  const profile = data.profiles.find((p) => p.id === data.activeProfileId) ?? data.profiles[0];

  const value = useMemo<Store>(
    () => ({ loaded, storage, data, profile, updateData, updateProfile, toggleFavourite }),
    [loaded, storage, data, profile, updateData, updateProfile, toggleFavourite],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

import { DEFAULT_PREFERENCES, type Preferences } from './analysis';
import { DAY_NAMES, emptyDay, type MealPlan } from './planner';
import { RECIPE_BY_ID } from '../data/recipes';
import { MEALS } from '../data/types';
import { messages } from '../i18n/content';

export const DATA_VERSION = 1;

export interface Profile {
  id: string;
  name: string;
  prefs: Preferences;
  favourites: string[];
  plans: MealPlan[];
  activePlanId: string | null;
  pantrySelection: string[];
}

export interface AppData {
  version: number;
  activeProfileId: string;
  profiles: Profile[];
}

export function newProfile(name: string): Profile {
  return {
    id: `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    prefs: structuredClone(DEFAULT_PREFERENCES),
    favourites: [],
    plans: [],
    activePlanId: null,
    pantrySelection: [],
  };
}

export function defaultData(): AppData {
  const p = newProfile(messages().settings.defaultProfileName);
  return { version: DATA_VERSION, activeProfileId: p.id, profiles: [p] };
}

const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

function normalizePlan(raw: unknown): MealPlan | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Partial<MealPlan>;
  if (typeof p.id !== 'string') return null;
  const days = DAY_NAMES.map((_, i) => {
    const d = { ...emptyDay() };
    const src = Array.isArray(p.days) ? (p.days[i] as Record<string, unknown> | undefined) : undefined;
    for (const m of MEALS) {
      const v = src?.[m];
      d[m] = typeof v === 'string' && RECIPE_BY_ID.has(v) ? v : null;
    }
    return d;
  });
  return { id: p.id, name: typeof p.name === 'string' ? p.name : messages().planner.defaultPlanName, createdAt: typeof p.createdAt === 'string' ? p.createdAt : new Date().toISOString(), days, checked: arr(p.checked) };
}

/**
 * Accepts stored or imported data of any earlier shape and returns a valid
 * AppData, filling new fields with defaults and never discarding user data
 * that is still meaningful. Unknown recipe ids (e.g. a removed recipe) are dropped.
 */
export function normalizeData(raw: unknown): AppData {
  if (!raw || typeof raw !== 'object') return defaultData();
  const r = raw as Partial<AppData>;
  const profiles = (Array.isArray(r.profiles) ? r.profiles : [])
    .map((pr): Profile | null => {
      if (!pr || typeof pr !== 'object' || typeof pr.id !== 'string') return null;
      const prefsIn = (pr.prefs ?? {}) as Partial<Preferences>;
      const prefs: Preferences = {
        ...DEFAULT_PREFERENCES,
        ...prefsIn,
        phase: prefsIn.phase === 'reintroduction' ? 'reintroduction' : 'elimination',
        limitHandling: prefsIn.limitHandling === 'exclude' ? 'exclude' : 'warn',
        tolerated: arr(prefsIn.tolerated),
        excluded: arr(prefsIn.excluded),
        diet: { ...DEFAULT_PREFERENCES.diet, ...(prefsIn.diet ?? {}) },
        householdSize: Math.min(12, Math.max(1, Number(prefsIn.householdSize) || DEFAULT_PREFERENCES.householdSize)),
      };
      const plans = (Array.isArray(pr.plans) ? pr.plans : []).map(normalizePlan).filter((x): x is MealPlan => !!x);
      return {
        id: pr.id,
        name: typeof pr.name === 'string' && pr.name.trim() ? pr.name : messages().settings.defaultProfileName,
        prefs,
        favourites: arr(pr.favourites).filter((id) => RECIPE_BY_ID.has(id)),
        plans,
        activePlanId: plans.some((p) => p.id === pr.activePlanId) ? pr.activePlanId! : (plans[0]?.id ?? null),
        pantrySelection: arr(pr.pantrySelection),
      };
    })
    .filter((x): x is Profile => !!x);
  if (!profiles.length) return defaultData();
  const activeProfileId = profiles.some((p) => p.id === r.activeProfileId) ? r.activeProfileId! : profiles[0].id;
  return { version: DATA_VERSION, activeProfileId, profiles };
}

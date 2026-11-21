/**
 * Minimal, dependency-free localization core.
 *
 * The current language is a module-level value so that plain functions in
 * src/lib (analysis, planner, search…) can produce text in the right language
 * without threading a parameter through every call. React components read it
 * through <LanguageProvider>/useI18n(), which re-renders the app on change.
 *
 * The preference is stored per device in localStorage — separate from the
 * user's profiles, favourites and plans, which are never touched by a
 * language switch.
 */
export type Lang = 'en' | 'pt-BR';

export const LANGS: Lang[] = ['en', 'pt-BR'];
export const DEFAULT_LANG: Lang = 'en';
export const LANG_STORAGE_KEY = 'fodmap-kitchen:lang';

let current: Lang = DEFAULT_LANG;
const listeners = new Set<(l: Lang) => void>();

export function isLang(v: unknown): v is Lang {
  return v === 'en' || v === 'pt-BR';
}

export function getLang(): Lang {
  return current;
}

/** Sets the language for all text produced from now on (does not persist it). */
export function setLang(l: Lang): void {
  if (l === current) return;
  current = l;
  for (const fn of listeners) fn(l);
}

export function onLangChange(fn: (l: Lang) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Reads the saved preference; English for anyone who never chose a language. */
export function loadSavedLang(): Lang {
  try {
    const v = localStorage.getItem(LANG_STORAGE_KEY);
    return isLang(v) ? v : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

export function saveLang(l: Lang): void {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, l);
  } catch {
    // Storage blocked: the choice still applies for this session.
  }
}

/** BCP 47 tag for Intl APIs. */
export function locale(l: Lang = current): string {
  return l === 'pt-BR' ? 'pt-BR' : 'en-GB';
}

/** Plural helper: English and Brazilian Portuguese both use singular only for exactly 1 here ("0 receitas"). */
export function plural(n: number, one: string, other: string): string {
  return n === 1 ? one : other;
}

/** Locale-aware number formatting (decimal comma in pt-BR). */
export function formatNumber(n: number, maxFractionDigits = 1, l: Lang = current): string {
  return new Intl.NumberFormat(locale(l), { maximumFractionDigits: maxFractionDigits }).format(n);
}

const ptCollator = new Intl.Collator('pt-BR', { sensitivity: 'base' });
/**
 * Alphabetical comparison for the current language. English keeps the exact
 * ordering the app always used (String#localeCompare); Portuguese uses a
 * pt-BR collator so accented names sort where Brazilians expect them.
 */
export function compareText(a: string, b: string): number {
  return current === 'pt-BR' ? ptCollator.compare(a, b) : a.localeCompare(b);
}

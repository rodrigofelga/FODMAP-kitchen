import { createContext, useContext } from 'react';
import { DEFAULT_LANG, type Lang } from './core';
import { en, type Messages } from './en';

export interface I18nValue {
  lang: Lang;
  /** Interface strings for the current language. */
  m: Messages;
  /** Switches language immediately (no reload) and remembers it on this device. */
  setLanguage: (l: Lang) => void;
}

export const I18nContext = createContext<I18nValue>({ lang: DEFAULT_LANG, m: en, setLanguage: () => undefined });

export function useI18n(): I18nValue {
  return useContext(I18nContext);
}

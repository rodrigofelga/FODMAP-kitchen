import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loadSavedLang, saveLang, setLang, type Lang } from './core';
import { messages } from './content';
import { I18nContext } from './context';

function initialLang(): Lang {
  const l = loadSavedLang();
  // Set before the first render so every lib function produces text in this language.
  setLang(l);
  return l;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLanguage = useCallback((l: Lang) => {
    setLang(l);
    saveLang(l);
    setLangState(l);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', messages(lang).common.metaDescription);
  }, [lang]);

  const value = useMemo(() => ({ lang, m: messages(lang), setLanguage }), [lang, setLanguage]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

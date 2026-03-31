import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LANG, normalizeLang, translate } from "./index";

const STORAGE_KEY = "decentralizedbid_lang";

const I18nContext = createContext({
  lang: DEFAULT_LANG,
  setLang: () => {},
  t: (key, vars) => translate(key, vars, DEFAULT_LANG),
});

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(DEFAULT_LANG);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) setLang(normalizeLang(stored));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, normalizeLang(lang));
  }, [lang]);

  const value = useMemo(
    () => ({
      lang,
      setLang: (nextLang) => setLang(normalizeLang(nextLang)),
      t: (key, vars = {}) => translate(key, vars, lang),
    }),
    [lang]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

import { messages } from "./messages";

export const SUPPORTED_LANGS = ["es", "en"];
export const DEFAULT_LANG =
  SUPPORTED_LANGS.includes(process.env.NEXT_PUBLIC_APP_LANG) ? process.env.NEXT_PUBLIC_APP_LANG : "es";

function getByPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc && key in acc ? acc[key] : undefined), obj);
}

export function normalizeLang(lang) {
  return SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
}

export function translate(key, vars = {}, lang = DEFAULT_LANG) {
  const normalized = normalizeLang(lang);
  const langPack = messages[normalized] || messages.es;
  const fallback = messages.es;
  let text = getByPath(langPack, key) ?? getByPath(fallback, key) ?? key;

  for (const [k, v] of Object.entries(vars)) {
    text = text.replaceAll(`{${k}}`, String(v));
  }

  return text;
}

export function t(key, vars = {}, lang = DEFAULT_LANG) {
  return translate(key, vars, lang);
}

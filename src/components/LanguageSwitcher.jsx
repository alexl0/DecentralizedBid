import { useI18n } from "@/i18n/provider";

export default function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();

  return (
    <div className="btn-group btn-group-sm" role="group" aria-label="language switcher">
      <button
        type="button"
        className={`btn ${lang === "es" ? "btn-dark" : "btn-outline-dark"}`}
        onClick={() => setLang("es")}
      >
        {t("ui.langEs")}
      </button>
      <button
        type="button"
        className={`btn ${lang === "en" ? "btn-dark" : "btn-outline-dark"}`}
        onClick={() => setLang("en")}
      >
        {t("ui.langEn")}
      </button>
    </div>
  );
}
